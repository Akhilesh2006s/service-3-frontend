import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mic, 
  MicOff,
  Volume2,
  CheckCircle,
  XCircle,
  RotateCcw,
  BookOpen,
  Target,
  ArrowRight,
  Play,
  Users,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { speakText, stopSpeech } from "@/utils/speechUtils";

// TypeScript declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Word {
  word: string;
  meaning: string;
  pronunciation: string;
}

interface DictationExercise {
  _id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard' | 'expert';
  words: Word[];
  totalWords: number;
  isPublished: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

const CustomDictation = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<DictationExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<DictationExercise | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [isListening, setIsListening] = useState(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [spokenWord, setSpokenWord] = useState<string>('');
  const [result, setResult] = useState<'correct' | 'incorrect' | 'pending'>('pending');
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [wordStartTime, setWordStartTime] = useState<number>(0);
  const [isProcessingResult, setIsProcessingResult] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showExerciseList, setShowExerciseList] = useState(true);

  // Load exercises on component mount
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/dictation-exercises', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setExercises(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast({
        title: "Error",
        description: "Failed to load dictation exercises",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    if (selectedDifficulty === 'all') return true;
    return exercise.difficulty === selectedDifficulty;
  });

  const startExercise = (exercise: DictationExercise) => {
    setSelectedExercise(exercise);
    setCurrentWordIndex(0);
    setCurrentWord(exercise.words[0]?.word || '');
    setResult('pending');
    setSpokenWord('');
    setScore({ correct: 0, total: 0 });
    setShowExerciseList(false);
    setWordStartTime(Date.now() + 200);
    setIsProcessingResult(false);
  };

  const comparePronunciation = (spoken: string, expected: string): number => {
    const normalize = (str: string) => str.toLowerCase()
      .replace(/[^\u0C00-\u0C7F\w]/g, '')
      .trim();
    
    const spokenNorm = normalize(spoken);
    const expectedNorm = normalize(expected);
    
    console.log('🔍 Comparing:', { spoken: spokenNorm, expected: expectedNorm });
    
    // Exact match (highest priority)
    if (spokenNorm === expectedNorm) {
      console.log('✅ Exact match!');
      return 1.0;
    }
    
    // Check for similar length words first (more accurate)
    const lengthDiff = Math.abs(spokenNorm.length - expectedNorm.length);
    
    // Much more lenient for Telugu - allow more length differences
    if (lengthDiff > 4) {
      // Only allow high similarity for words with significant length difference
      if (spokenNorm.includes(expectedNorm) || expectedNorm.includes(spokenNorm)) {
        // But penalize if one is much longer than the other
        const longerLength = Math.max(spokenNorm.length, expectedNorm.length);
        const shorterLength = Math.min(spokenNorm.length, expectedNorm.length);
        const lengthRatio = shorterLength / longerLength;
        
        // More lenient ratio for Telugu
        if (lengthRatio < 0.6) {
          console.log('❌ Length ratio too low:', lengthRatio);
          return 0.2; // Low similarity for very different lengths
        }
        console.log('✅ Good length ratio:', lengthRatio);
        return 0.7; // Moderate similarity for reasonable length differences
      }
      console.log('❌ No substring match for different lengths');
      return 0.0; // No match for very different lengths
    }
    
    // For similar length words, use more lenient matching
    if (spokenNorm.includes(expectedNorm) || expectedNorm.includes(spokenNorm)) {
      console.log('✅ Substring match found');
      return 0.8;
    }
    
    // Check for partial matches at the beginning or end (more lenient)
    if (lengthDiff <= 3) {
      if (spokenNorm.startsWith(expectedNorm) || expectedNorm.startsWith(spokenNorm)) {
        console.log('✅ Starts with match');
        return 0.7;
      }
      
      if (spokenNorm.endsWith(expectedNorm) || expectedNorm.endsWith(spokenNorm)) {
        console.log('✅ Ends with match');
        return 0.7;
      }
    }
    
    // Count matching characters
    let matchingChars = 0;
    const minLength = Math.min(spokenNorm.length, expectedNorm.length);
    const maxLength = Math.max(spokenNorm.length, expectedNorm.length);
    
    for (let i = 0; i < minLength; i++) {
      if (spokenNorm[i] === expectedNorm[i]) {
        matchingChars++;
      }
    }
    
    const charSimilarity = matchingChars / maxLength;
    console.log('📊 Character similarity:', charSimilarity, 'matching:', matchingChars, 'max length:', maxLength);
    
    // Much higher tolerance for Telugu pronunciation
    if (lengthDiff <= 3 && charSimilarity > 0.4) {
      console.log('✅ Good character similarity for similar lengths');
      return charSimilarity;
    }
    
    // Check for similar length words with moderate character similarity
    if (lengthDiff <= 2 && charSimilarity > 0.3) {
      console.log('✅ Moderate character similarity');
      return charSimilarity + 0.1;
    }
    
    console.log('❌ No match found');
    return 0.0;
  };

  const startListening = () => {
    if (!currentWord || !selectedExercise) return;

    // Stop any existing recognition first
    if (recognitionInstance) {
      recognitionInstance.stop();
      setRecognitionInstance(null);
    }

    setIsListening(true);
    setResult('pending');
    setSpokenWord('');
    setWordStartTime(Date.now() + 200);

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      setRecognitionInstance(recognition);

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'te-IN';
      recognition.maxAlternatives = 3;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const transcript = finalTranscript || interimTranscript;
        if (!transcript) return;
        
        // Only process transcripts that came after the current word started
        const currentTime = Date.now();
        if (currentTime < wordStartTime) {
          console.log('⏰ Ignoring old transcript:', transcript);
          return;
        }
        
        console.log('Spoken:', transcript);
        console.log('Expected:', currentWord);
        
        setSpokenWord(transcript);
        
        const similarity = comparePronunciation(transcript, currentWord);
        console.log('Similarity:', similarity);
        
        // Much lower threshold for better Telugu recognition
        if (similarity > 0.2 && !isProcessingResult) {
          console.log('✅ Correct pronunciation detected!');
          
          setIsProcessingResult(true);
          setResult('correct');
          setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
          
          toast({
            title: "Correct! 🎉",
            description: "Great pronunciation! Click 'Next Word' to continue.",
          });
          
          setIsProcessingResult(false);
          
        } else if (finalTranscript && similarity <= 0.2) {
          setResult('incorrect');
          
          toast({
            title: "Try Again",
            description: "Pronunciation needs improvement. Listen and try again.",
            variant: "destructive"
          });
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error !== 'aborted') {
          toast({
            title: "Error",
            description: "Speech recognition error. Please try again.",
            variant: "destructive"
          });
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        if (!isListening) {
          setRecognitionInstance(null);
        } else {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.error('Error restarting recognition:', error);
              setIsListening(false);
              setRecognitionInstance(null);
            }
          }, 500);
        }
      };

      recognition.start();
    } else {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
    }
  };

  const nextWord = () => {
    if (!selectedExercise) return;
    
    const nextIndex = currentWordIndex + 1;
    
    if (nextIndex < selectedExercise.words.length) {
      setCurrentWordIndex(nextIndex);
      setCurrentWord(selectedExercise.words[nextIndex].word);
      setResult('pending');
      setSpokenWord('');
      setIsProcessingResult(false);
      
      const newWordStartTime = Date.now() + 200;
      setWordStartTime(newWordStartTime);
    } else {
      // Exercise complete
      if (recognitionInstance) {
        recognitionInstance.stop();
        setRecognitionInstance(null);
      }
      setIsListening(false);
      setIsProcessingResult(false);
      
      toast({
        title: "Exercise Complete! 🎉",
        description: `You got ${score.correct} out of ${score.total} words correct!`,
      });
    }
  };

  const resetExercise = () => {
    if (!selectedExercise) return;
    
    setCurrentWordIndex(0);
    setCurrentWord(selectedExercise.words[0]?.word || '');
    setResult('pending');
    setSpokenWord('');
    setScore({ correct: 0, total: 0 });
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionInstance) {
      recognitionInstance.stop();
      setRecognitionInstance(null);
    }
  };

  const speakWord = (word: string) => {
    speakText(word, {
      lang: 'te-IN',
      rate: 0.75,
      pitch: 1.1
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'very_hard': return 'bg-red-100 text-red-800';
      case 'expert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      case 'very_hard': return 'Very Hard';
      case 'expert': return 'Expert';
      default: return difficulty;
    }
  };

  if (showExerciseList) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-gray-800">Custom Dictation Exercises</h2>
          <p className="text-xl text-gray-600">
            Practice with custom dictation exercises created by trainers
          </p>
        </div>

        {/* Difficulty Filter */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="text-purple-700">Filter by Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="very_hard">Very Hard</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-2 text-sm text-gray-600">
              {filteredExercises.length} exercises available
            </p>
          </CardContent>
        </Card>

        {/* Exercises List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading exercises...</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">No Exercises Available</h4>
              <p className="text-gray-600">
                {selectedDifficulty === 'all' 
                  ? 'No dictation exercises are available yet. Check back later!'
                  : `No ${getDifficultyLabel(selectedDifficulty)} exercises available.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredExercises.map((exercise) => (
              <Card key={exercise._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => startExercise(exercise)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold">{exercise.title}</h4>
                        <Badge className={getDifficultyColor(exercise.difficulty)}>
                          {getDifficultyLabel(exercise.difficulty)}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{exercise.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {exercise.totalWords} words
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          By {exercise.createdBy.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(exercise.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Preview of first few words */}
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-1">Sample words:</p>
                        <div className="flex flex-wrap gap-2">
                          {exercise.words.slice(0, 5).map((word, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {word.word}
                            </Badge>
                          ))}
                          {exercise.words.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{exercise.words.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Start Exercise
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!selectedExercise) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setShowExerciseList(true)}>
            ← Back to Exercises
          </Button>
          <h2 className="text-3xl font-bold text-gray-800">{selectedExercise.title}</h2>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
        <p className="text-xl text-gray-600">{selectedExercise.description}</p>
        <div className="flex items-center justify-center gap-4">
          <Badge className={getDifficultyColor(selectedExercise.difficulty)}>
            {getDifficultyLabel(selectedExercise.difficulty)}
          </Badge>
          <Badge variant="outline">
            {currentWordIndex + 1} of {selectedExercise.totalWords} words
          </Badge>
        </div>
      </div>

      {/* Main Practice Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Word Display */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <BookOpen className="w-5 h-5" />
              Current Word
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
              <div className="text-center mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Word {currentWordIndex + 1} of {selectedExercise.totalWords}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-2">Current word:</p>
              <p className="text-4xl font-bold text-orange-700 mb-4">{currentWord}</p>
              
              {/* Word details */}
              {selectedExercise.words[currentWordIndex]?.meaning && (
                <p className="text-sm text-gray-600 mb-2">
                  Meaning: {selectedExercise.words[currentWordIndex].meaning}
                </p>
              )}
              {selectedExercise.words[currentWordIndex]?.pronunciation && (
                <p className="text-sm text-gray-600">
                  Pronunciation: {selectedExercise.words[currentWordIndex].pronunciation}
                </p>
              )}
            </div>

            {/* Listen Button */}
            <Button
              onClick={() => speakWord(currentWord)}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Volume2 className="w-4 h-4" />
              Listen to Word
            </Button>
          </CardContent>
        </Card>

        {/* Pronunciation Practice */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Mic className="w-5 h-5" />
              Pronunciation Practice
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-green-600 font-medium">
              Click "Start Listening" and pronounce the word clearly
            </p>
            
            {/* Main Control Button */}
            <div className="flex items-center justify-center">
              <Button
                size="lg"
                onClick={isListening ? stopListening : startListening}
                className={`flex items-center gap-3 px-8 py-4 text-lg ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-6 h-6" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" />
                    Start Listening
                  </>
                )}
              </Button>
            </div>
            
            {/* Listening Status */}
            {isListening && (
              <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Listening for pronunciation...</span>
              </div>
            )}

            {/* Recognition Result */}
            {spokenWord && (
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <p className="text-sm font-medium text-gray-600 mb-2">You said:</p>
                <p className="text-2xl font-semibold text-gray-800 mb-4">{spokenWord}</p>
                
                <div className="flex items-center justify-center gap-3">
                  {result === 'correct' && (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <span className="text-green-700 font-semibold text-lg">
                        Correct! 🎉
                      </span>
                    </>
                  )}
                  {result === 'incorrect' && (
                    <>
                      <XCircle className="w-6 h-6 text-red-500" />
                      <span className="text-red-700 font-semibold text-lg">Try Again</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={nextWord}
                disabled={currentWordIndex >= selectedExercise.totalWords - 1}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Next Word
              </Button>
              <Button
                variant="outline"
                onClick={resetExercise}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Exercise
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-blue-700">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border text-center">
              <h4 className="font-semibold text-blue-700 mb-2">Current Score</h4>
              <p className="text-2xl font-bold text-blue-600">{score.correct}/{score.total}</p>
              <p className="text-sm text-gray-600">
                {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}% accuracy
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border text-center">
              <h4 className="font-semibold text-green-700 mb-2">Progress</h4>
              <p className="text-2xl font-bold text-green-600">{currentWordIndex + 1}/{selectedExercise.totalWords}</p>
              <p className="text-sm text-gray-600">
                {Math.round(((currentWordIndex + 1) / selectedExercise.totalWords) * 100)}% complete
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border text-center">
              <h4 className="font-semibold text-purple-700 mb-2">Exercise Info</h4>
              <p className="text-lg font-bold text-purple-600">{selectedExercise.title}</p>
              <p className="text-sm text-gray-600">
                By {selectedExercise.createdBy.name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomDictation;
