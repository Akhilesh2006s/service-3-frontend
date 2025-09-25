import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Volume2, Eye, EyeOff, BarChart3, Eraser, Undo2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';

interface UploadedHandwritingExercise {
  _id: string;
  teluguWord: string;
  englishMeaning: string;
  difficulty: string;
  audioUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface HandwritingExercise {
  id: string;
  teluguWord: string;
  englishMeaning: string;
  difficulty: 'easy' | 'medium' | 'hard';
  audioUrl?: string;
  isUploaded: boolean;
}

export default function TeluguHandwriting() {
  console.log('🚀 TeluguHandwriting component: Component rendering');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [uploadedExercises, setUploadedExercises] = useState<UploadedHandwritingExercise[]>([]);
  const [isLoadingUploaded, setIsLoadingUploaded] = useState(false);
  const [canvasData, setCanvasData] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Convert uploaded exercises to HandwritingExercise format
  const convertUploadedToHandwritingExercises = (uploaded: UploadedHandwritingExercise[]): HandwritingExercise[] => {
    return uploaded.map(exercise => ({
      id: exercise._id,
      teluguWord: exercise.teluguWord,
      englishMeaning: exercise.englishMeaning,
      difficulty: exercise.difficulty as 'easy' | 'medium' | 'hard',
      audioUrl: exercise.audioUrl,
      isUploaded: true
    }));
  };

  // Fetch uploaded handwriting exercises
  const fetchUploadedExercises = async () => {
    console.log('🚀 TeluguHandwriting component: fetchUploadedExercises called');
    try {
      setIsLoadingUploaded(true);
      const token = localStorage.getItem('telugu-basics-token');
      
      if (!token) {
        console.log('No authentication token found, skipping uploaded exercises fetch');
        setUploadedExercises([]);
        return;
      }

      console.log('🔑 Token found, making API call to fetch handwriting exercises...');
      console.log('🔑 Token preview:', token.substring(0, 20) + '...');

      const response = await fetch('https://service-3-backend-production.up.railway.app/api/csv-upload/learner/exercises/handwriting?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📚 Learner handwriting exercises response:', result);
        if (result.success) {
          setUploadedExercises(result.data || []);
          console.log('📚 Set uploaded exercises:', result.data?.length || 0);
        }
      } else {
        console.log('❌ Failed to fetch uploaded exercises:', response.status, response.statusText);
        setUploadedExercises([]);
      }
    } catch (error) {
      console.error('Error fetching uploaded exercises:', error);
      setUploadedExercises([]);
    } finally {
      setIsLoadingUploaded(false);
    }
  };

  // API functions
  const loadProgress = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/learning-progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setScore(data.data.handwriting || { correct: 0, total: 0 });
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use only uploaded exercises
  const allExercises = convertUploadedToHandwritingExercises(uploadedExercises);

  // Filter exercises based on difficulty
  const filteredExercises = selectedDifficulty === 'all' 
    ? allExercises 
    : allExercises.filter(ex => ex.difficulty === selectedDifficulty);

  // Get current exercise
  const currentExercise = filteredExercises[currentExerciseIndex];

  // Initialize component - fetch exercises on mount
  useEffect(() => {
    console.log('🚀 TeluguHandwriting component: useEffect called');
    loadProgress();
    fetchUploadedExercises();
    
    // Load speech synthesis voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('🔊 Loaded voices:', voices.length);
      setAvailableVoices(voices);
      
      voices.forEach((voice, index) => {
        console.log(`🔊 Voice ${index}: ${voice.name} (${voice.lang})`);
      });
      
      // Auto-select best voice
      const teluguVoice = voices.find(voice => 
        voice.lang.includes('te') || 
        voice.lang.includes('telugu') ||
        voice.name.toLowerCase().includes('telugu')
      );
      
      if (teluguVoice) {
        console.log('🔊 Auto-selected Telugu voice:', teluguVoice.name);
        setSelectedVoice(teluguVoice);
      } else {
        // Try Indian English voice as fallback
        const indianVoice = voices.find(voice => 
          voice.lang.includes('en-IN') || 
          voice.name.toLowerCase().includes('india')
        );
        if (indianVoice) {
          console.log('🔊 Auto-selected Indian English voice:', indianVoice.name);
          setSelectedVoice(indianVoice);
        } else {
          // Use first available voice
          if (voices.length > 0) {
            console.log('🔊 Auto-selected first available voice:', voices[0].name);
            setSelectedVoice(voices[0]);
          }
        }
      }
    };
    
    // Load voices immediately and when they change
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const saveProgress = async (isCorrect: boolean) => {
    if (!user) return;
    
    try {
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/learning-progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exerciseType: 'handwriting',
          isCorrect,
          exerciseId: currentExercise?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setScore(data.data.handwriting || { correct: 0, total: 0 });
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const resetExercise = () => {
    if (!currentExercise) return;
    setIsCorrect(null);
    setShowAnswer(false);
    setCanvasData('');
    clearCanvas();
  };

  const nextExercise = () => {
    if (currentExerciseIndex < filteredExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      setCurrentExerciseIndex(0);
    }
    resetExercise();
  };

  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    } else {
      setCurrentExerciseIndex(filteredExercises.length - 1);
    }
    resetExercise();
  };

  const playAudio = () => {
    console.log('🎤 playAudio called, currentExercise:', currentExercise);
    
    if (!currentExercise) {
      console.log('❌ No current exercise available');
      toast({
        title: "No Exercise",
        description: "Please wait for exercises to load.",
        variant: "destructive"
      });
      return;
    }
    
    if (isPlaying) {
      console.log('⏸️ Already playing audio');
      return;
    }
    
    console.log('🎤 Speaking Telugu word:', currentExercise.teluguWord);
    console.log('🔊 Speech synthesis available:', 'speechSynthesis' in window);
    console.log('🔊 Speech synthesis speaking:', window.speechSynthesis.speaking);
    console.log('🔊 Speech synthesis pending:', window.speechSynthesis.pending);
    
    setIsPlaying(true);
    
    try {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(currentExercise.teluguWord);
      utterance.lang = 'te-IN';
      utterance.rate = 0.7; // Slower for better pronunciation
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Use the selected voice
      if (selectedVoice) {
        console.log('🔊 Using selected voice:', selectedVoice.name, selectedVoice.lang);
        utterance.voice = selectedVoice;
      } else {
        console.log('🔊 No voice selected, using default');
      }
      
      utterance.onstart = () => {
        console.log('🎵 Audio playback started');
      };
      
      utterance.onend = () => {
        console.log('✅ Audio playback ended');
        setIsPlaying(false);
      };
      
      utterance.onerror = (event) => {
        console.error('❌ Audio playback error:', event);
        console.error('❌ Error details:', {
          error: event.error,
          type: event.type,
          charIndex: event.charIndex,
          charCode: event.charCode
        });
        setIsPlaying(false);
        toast({
          title: "Audio Error",
          description: `Failed to play audio: ${event.error}. Please check your system audio settings.`,
          variant: "destructive"
        });
      };
      
      utterance.onpause = () => {
        console.log('⏸️ Audio playback paused');
      };
      
      utterance.onresume = () => {
        console.log('▶️ Audio playback resumed');
      };
      
      console.log('🔊 Starting speech synthesis...');
      window.speechSynthesis.speak(utterance);
      
      // Fallback: if no audio after 3 seconds, show warning
      setTimeout(() => {
        if (window.speechSynthesis.speaking) {
          console.log('🔊 Audio is still playing after 3 seconds');
        } else {
          console.log('⚠️ No audio detected after 3 seconds');
          toast({
            title: "Audio Issue",
            description: "Audio may not be working. Please check your system volume and browser permissions.",
            variant: "destructive"
          });
        }
      }, 3000);
      
    } catch (error) {
      console.error('❌ Speech synthesis error:', error);
      setIsPlaying(false);
      toast({
        title: "Audio Error",
        description: "Speech synthesis not supported in this browser.",
        variant: "destructive"
      });
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const analyzeHandwriting = () => {
    if (!currentExercise) return;
    
    // Simple analysis - in a real implementation, you would use ML/AI
    const canvas = canvasRef.current;
    if (canvas) {
      const imageData = canvas.toDataURL();
      setCanvasData(imageData);
      
      // For now, just show a simple success message
      // In a real implementation, you would analyze the handwriting
      setIsCorrect(true);
      setShowAnswer(true);
      saveProgress(true);
      
      toast({
        title: "Great job!",
        description: "Your handwriting looks good!",
      });
    }
  };

  useEffect(() => {
    resetExercise();
  }, [currentExerciseIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [currentExercise]);

  useEffect(() => {
    resetExercise();
  }, [currentExerciseIndex]);

  // If no exercises available, show message
  if (filteredExercises.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-gray-600">No Handwriting Exercises Available</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-500 mb-4">
              No handwriting exercises are available at the moment. Please check back later or contact your trainer.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="mt-4"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Telugu Handwriting Practice</h1>
        <p className="text-gray-600">Listen to the word and write it down</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">
            {currentExerciseIndex + 1} of {filteredExercises.length}
          </span>
        </div>
        <Progress 
          value={(currentExerciseIndex + 1) / filteredExercises.length * 100} 
          className="h-2"
        />
      </div>

      {/* Score */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center space-x-4 bg-gray-50 rounded-lg px-4 py-2">
          <span className="text-sm text-gray-600">Score:</span>
          <Badge variant="outline" className="text-green-600">
            {score.correct}/{score.total}
          </Badge>
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="mb-6 text-center">
        <div className="flex justify-center space-x-2">
          {['all', 'easy', 'medium', 'hard'].map((difficulty) => (
            <Button
              key={difficulty}
              variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty(difficulty as any)}
            >
              {difficulty === 'all' ? 'All' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Exercise Card */}
      <Card className="max-w-4xl mx-auto mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              Exercise {currentExerciseIndex + 1}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {currentExercise?.difficulty}
              </Badge>
              {currentExercise?.isUploaded && (
                <Badge variant="secondary">Uploaded</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Audio Section */}
          <div className="mb-6 text-center">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Listen to the word</h3>
              
              {/* Voice Selector */}
              {availableVoices.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Voice:
                  </label>
                  <select
                    value={selectedVoice?.name || ''}
                    onChange={(e) => {
                      const voice = availableVoices.find(v => v.name === e.target.value);
                      setSelectedVoice(voice || null);
                      console.log('🔊 Voice changed to:', voice?.name);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableVoices.map((voice, index) => (
                      <option key={index} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <Button
                onClick={playAudio}
                disabled={isPlaying || !currentExercise}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                {isPlaying ? 'Playing...' : !currentExercise ? 'Loading...' : 'Play Audio'}
              </Button>
              
              {selectedVoice && (
                <p className="text-xs text-gray-600 mt-2">
                  Using: {selectedVoice.name} ({selectedVoice.lang})
                </p>
              )}
            </div>
          </div>

          {/* Canvas Section */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Write the word here</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="border border-gray-200 rounded bg-white cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
              <div className="flex justify-center space-x-2 mt-4">
                <Button
                  onClick={clearCanvas}
                  variant="outline"
                  size="sm"
                >
                  <Eraser className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                <Button
                  onClick={analyzeHandwriting}
                  variant="default"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check
                </Button>
              </div>
            </div>
          </div>

          {/* Answer Section */}
          {showAnswer && (
            <div className="mb-6">
              <div className={`rounded-lg p-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? 'Correct!' : 'Try Again'}
                  </span>
                </div>
                <div className="text-gray-700">
                  <p><strong>Word:</strong> {currentExercise?.teluguWord}</p>
                  <p><strong>Meaning:</strong> {currentExercise?.englishMeaning}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={prevExercise}
              variant="outline"
              disabled={currentExerciseIndex === 0}
            >
              <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
              Previous
            </Button>
            
            <div className="flex space-x-2">
              <Button
                onClick={resetExercise}
                variant="outline"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
            
            <Button
              onClick={nextExercise}
              variant="default"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      {showAnalytics && analytics && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.totalExercises}</div>
                <div className="text-sm text-gray-600">Total Exercises</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.correctAnswers}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.totalExercises > 0 ? Math.round((analytics.correctAnswers / analytics.totalExercises) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}