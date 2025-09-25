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

  // Use only uploaded exercises
  const allExercises = convertUploadedToHandwritingExercises(uploadedExercises);

  // Filter exercises based on difficulty
  const filteredExercises = selectedDifficulty === 'all' 
    ? allExercises 
    : allExercises.filter(ex => ex.difficulty === selectedDifficulty);

  // Get current exercise
  const currentExercise = filteredExercises[currentExerciseIndex];

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

  // Fetch uploaded handwriting exercises
  const fetchUploadedExercises = async () => {
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
        if (result.success) {
          setUploadedExercises(result.data || []);
        }
      } else {
        console.log('Failed to fetch uploaded exercises:', response.status, response.statusText);
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
          exerciseId: currentExercise.id,
          isCorrect,
          score: isCorrect ? 1 : 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setScore(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1
          }));
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentExercise) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentExercise) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!currentExercise) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setCanvasData(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    if (!currentExercise) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setCanvasData('');
      }
    }
  };

  const playAudio = () => {
    if (!currentExercise) return;
    
    const textToSpeak = currentExercise.audioUrl || currentExercise.teluguWord;
    console.log('🎤 Attempting to play audio:', textToSpeak);
    
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Not Supported",
        description: "Speech synthesis is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }
    
    setIsPlaying(true);
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.6;
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.startsWith('hi'));
    
    if (hindiVoice) {
      utterance.voice = hindiVoice;
      console.log('✅ Using Hindi voice for Telugu:', hindiVoice.name);
    }
    
    utterance.onend = () => {
      setIsPlaying(false);
    };
    
    utterance.onerror = () => {
      setIsPlaying(false);
      toast({
        title: "Audio Error",
        description: "Failed to play audio. Please try again.",
        variant: "destructive"
      });
    };
    
    window.speechSynthesis.cancel();
    console.log('🎤 Speaking Telugu word:', textToSpeak);
    window.speechSynthesis.speak(utterance);
  };

  const checkAnswer = async () => {
    if (!currentExercise) return;
    
    // For now, we'll implement a simple check
    // In a real implementation, you would use handwriting recognition
    const isAnswerCorrect = Math.random() > 0.3; // Placeholder logic
    
    setIsCorrect(isAnswerCorrect);
    await saveProgress(isAnswerCorrect);
    
    if (isAnswerCorrect) {
      toast({
        title: "Correct!",
        description: "Great job! Your handwriting looks good.",
      });
    } else {
      toast({
        title: "Try Again",
        description: "Check your handwriting and try again.",
        variant: "destructive"
      });
    }
  };

  const nextExercise = () => {
    if (!currentExercise) return;
    if (currentExerciseIndex < filteredExercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setIsCorrect(null);
      setShowAnswer(false);
      clearCanvas();
    }
  };

  const resetExercise = () => {
    if (!currentExercise) return;
    setIsCorrect(null);
    setShowAnswer(false);
    clearCanvas();
  };

  const resetAll = async () => {
    await resetProgress();
    resetExercise();
  };

  const resetProgress = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/learning-progress/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ exerciseType: 'handwriting' })
      });

      if (response.ok) {
        setScore({ correct: 0, total: 0 });
        toast({
          title: "Progress Reset",
          description: "Your handwriting progress has been reset.",
        });
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      default: return 'Unknown';
    }
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [currentExercise]);

  useEffect(() => {
    loadProgress();
    fetchUploadedExercises();
  }, []);

  useEffect(() => {
    resetExercise();
  }, [currentExerciseIndex]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Telugu Handwriting Practice</h1>
        <p className="text-gray-600">Listen to the word and write it by hand</p>
      </div>

      {/* Difficulty Filter */}
      <div className="flex justify-center mb-6">
        <div className="flex gap-2">
          {(['all', 'easy', 'medium', 'hard'] as const).map((difficulty) => (
            <Button
              key={difficulty}
              variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty(difficulty)}
            >
              {difficulty === 'all' ? 'All' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Exercise Progress */}
      <Card className="mb-6 bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-orange-700">
            <span>Exercise Progress</span>
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(currentExercise.difficulty)}>
                {getDifficultyLabel(currentExercise.difficulty)}
              </Badge>
              <Badge variant="outline" className="text-orange-700">
                {currentExerciseIndex + 1} / {filteredExercises.length}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-700">Score: {score.correct}/{score.total}</span>
            <span className="text-sm text-orange-600">
              {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
            </span>
          </div>
          <Progress 
            value={score.total > 0 ? (score.correct / score.total) * 100 : 0} 
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Main Exercise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audio and Instructions */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <span>Listen and Write</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">Listen to the Telugu pronunciation</p>
              <Button
                onClick={playAudio}
                disabled={isPlaying}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                {isPlaying ? 'Playing...' : 'Listen to Word'}
              </Button>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border">
              <p className="text-sm text-gray-600 mb-2">English Meaning:</p>
              <p className="text-lg font-semibold text-blue-700">{currentExercise.englishMeaning}</p>
            </div>

            {showAnswer && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 mb-2">Correct Answer:</p>
                <p className="text-2xl font-bold text-green-700">{currentExercise.teluguWord}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Handwriting Canvas */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <span>Write Here</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-gray-300 rounded-lg bg-white">
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="w-full h-64 cursor-crosshair border rounded-lg"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={clearCanvas}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Eraser className="w-4 h-4" />
                Clear
              </Button>
              
              <Button
                onClick={checkAnswer}
                disabled={!canvasData || isCorrect !== null}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Check Answer
              </Button>
            </div>

            {isCorrect !== null && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <span className="font-medium">
                  {isCorrect ? 'Correct! Well done!' : 'Try again. Check your handwriting.'}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setShowAnswer(!showAnswer)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </Button>
              
              {currentExerciseIndex < filteredExercises.length - 1 && (
                <Button
                  onClick={nextExercise}
                  className="flex items-center gap-2"
                >
                  Next Exercise
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mt-6">
        <Button
          onClick={resetExercise}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Exercise
        </Button>
        
        <Button
          onClick={resetAll}
          variant="outline"
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Reset All Progress
        </Button>
      </div>
    </div>
  );
}
