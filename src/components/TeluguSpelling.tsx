import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Volume2, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { spellingExercises, type SpellingExercise } from '../data/spellingExercises';
// Remove dependency on complex speech utility - use direct approach instead

interface UploadedVarnamalaExercise {
  _id: string;
  teluguWord: string;
  englishMeaning: string;
  difficulty: string;
  letters: {
    original: string[];
    jumbled: string[];
    correctOrder: number[];
    randomLetters: string[];
  };
  isActive: boolean;
  createdAt: string;
}

export default function TeluguSpelling() {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [uploadedExercises, setUploadedExercises] = useState<UploadedVarnamalaExercise[]>([]);
  const [isLoadingUploaded, setIsLoadingUploaded] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Convert uploaded exercises to SpellingExercise format
  const convertUploadedToSpellingExercises = (uploaded: UploadedVarnamalaExercise[]): SpellingExercise[] => {
    return uploaded.map(exercise => ({
      id: exercise._id,
      teluguWord: exercise.teluguWord,
      englishMeaning: exercise.englishMeaning,
      difficulty: exercise.difficulty as 'easy' | 'medium' | 'hard',
      letters: exercise.letters.original,
      correctOrder: exercise.letters.correctOrder,
      explanation: `Form the word "${exercise.teluguWord}" (${exercise.englishMeaning}) by selecting the correct letters in order.`,
      isUploaded: true
    }));
  };

  // Combine hardcoded and uploaded exercises
  const allExercises = [...spellingExercises, ...convertUploadedToSpellingExercises(uploadedExercises)];

  // Filter exercises based on difficulty
  const filteredExercises = selectedDifficulty === 'all' 
    ? allExercises 
    : allExercises.filter(ex => ex.difficulty === selectedDifficulty);

  // Get current exercise
  const currentExercise = filteredExercises[currentExerciseIndex];

  // Fetch uploaded Varnamala exercises
  const fetchUploadedExercises = async () => {
    try {
      setIsLoadingUploaded(true);
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/csv-upload/exercises/varnamala?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUploadedExercises(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching uploaded exercises:', error);
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
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.spelling) {
          const progress = data.data.spelling;
          setCurrentExerciseIndex(progress.currentIndex || 0);
          setScore({
            correct: progress.totalScore || 0,
            total: progress.totalAttempts || 0
          });
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async (exerciseId: number, isCorrect: boolean, hintsUsed: number = 0, timeSpent: number = 0) => {
    if (!user) return;
    
    try {
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/learning-progress/spelling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        },
        body: JSON.stringify({
          exerciseId,
          score: isCorrect ? 100 : 0,
          attempts: 1,
          hintsUsed,
          timeSpent
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local score
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

  const resetProgress = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/learning-progress/reset/spelling', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentExerciseIndex(0);
          setScore({ correct: 0, total: 0 });
          toast({
            title: "Progress Reset",
            description: "Your progress has been reset successfully!",
          });
        }
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/learning-progress/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.data);
          setShowAnalytics(true);
        }
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDifficultyChange = (difficulty: 'all' | 'easy' | 'medium' | 'hard') => {
    setSelectedDifficulty(difficulty);
    setCurrentExerciseIndex(0);
    setSelectedLetters([]);
    setAvailableLetters([]);
    setIsCorrect(null);
    setShowHint(false);
    setShowExplanation(false);
    setShowAnswer(false);
    setIsPlaying(false);
  };

  // Load progress and uploaded exercises on component mount
  useEffect(() => {
    loadProgress();
    fetchUploadedExercises();
  }, [user]);

  // Initialize speech synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Ensure voices are loaded
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('🎤 Voices loaded:', voices.length);
        console.log('🎤 Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      };
      
      // Load voices immediately if available
      loadVoices();
      
      // Also listen for voice loading
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  useEffect(() => {
    resetExercise();
  }, [currentExerciseIndex]);

  const resetExercise = () => {
    setSelectedLetters([]);
    setAvailableLetters([...currentExercise.letters]);
    setIsCorrect(null);
    setShowHint(false);
    setShowExplanation(false);
    setShowAnswer(false);
    setIsPlaying(false);
    // Stop any ongoing speech using direct approach
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const playAudio = () => {
    console.log('🎤 Attempting to play audio:', currentExercise.audio);
    
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Not Supported",
        description: "Speech synthesis is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }
    
    setIsPlaying(true);
    
    // Use the same direct approach that works
    const utterance = new SpeechSynthesisUtterance(currentExercise.audio);
    utterance.lang = 'hi-IN'; // Use Hindi language code for Telugu
    utterance.rate = 0.6;
    utterance.pitch = 1.0;
    
    // Find Hindi voice
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.startsWith('hi'));
    
    if (hindiVoice) {
      utterance.voice = hindiVoice;
      console.log('✅ Using Hindi voice for Telugu:', hindiVoice.name);
    }
    
    utterance.onstart = () => {
      console.log('✅ Telugu speech synthesis started');
    };
    
    utterance.onend = () => {
      console.log('✅ Telugu speech synthesis ended');
      setIsPlaying(false);
    };
    
    utterance.onerror = (error) => {
      console.error('❌ Telugu speech synthesis error:', error);
      setIsPlaying(false);
      toast({
        title: "Audio Error",
        description: "Failed to play Telugu audio.",
        variant: "destructive"
      });
    };
    
    // Stop any current speech first
    window.speechSynthesis.cancel();
    
    // Speak immediately
    console.log('🎤 Speaking Telugu word:', currentExercise.audio);
    window.speechSynthesis.speak(utterance);
  };

  const selectLetter = (letterIndex: number) => {
    if (isCorrect !== null) return; // Don't allow changes after submission
    
    // Find the letter in available letters
    const letterToSelect = currentExercise.letters[letterIndex];
    const availableIndex = availableLetters.findIndex(letter => letter === letterToSelect);
    
    if (availableIndex !== -1) {
      setSelectedLetters(prev => [...prev, letterIndex]);
      setAvailableLetters(prev => prev.filter((_, index) => index !== availableIndex));
    }
  };

  const deselectLetter = (letterIndex: number) => {
    if (isCorrect !== null) return; // Don't allow changes after submission
    
    const letterToRemove = currentExercise.letters[letterIndex];
    setSelectedLetters(prev => prev.filter(index => index !== letterIndex));
    setAvailableLetters(prev => [...prev, letterToRemove]);
  };

  // Helper function to get correct spelling in component format
  const getCorrectSpellingComponents = () => {
    return currentExercise.correctOrder.map(index => currentExercise.letters[index]);
  };

  // Helper function to convert correct spelling components to proper conjunct form
  const getCorrectSpellingFormed = () => {
    const components = getCorrectSpellingComponents();
    
    // Use the same conjunct logic as getFormedWord
    let formedWord = '';
    let i = 0;
    
    while (i < components.length) {
      const currentChar = components[i];
      const nextChar = i + 1 < components.length ? components[i + 1] : null;
      const nextNextChar = i + 2 < components.length ? components[i + 2] : null;
      
      // Check for various conjunct combinations
      let foundConjunct = false;
      
      // ద + ్య = ద్య (separated by vowel)
      if (currentChar === 'ద' && nextNextChar === '్య') {
        formedWord += 'ద్య';
        i += 3; // Skip ద, vowel, ్య
        foundConjunct = true;
      }
      // ర + ్థ = ర్థ (separated by vowel)
      else if (currentChar === 'ర' && nextNextChar === '్థ') {
        formedWord += 'ర్థ';
        i += 3; // Skip ర, vowel, ్థ
        foundConjunct = true;
      }
      // క + ్ + ష = క్ష
      else if (currentChar === 'క' && nextChar === '్' && nextNextChar === 'ష') {
        formedWord += 'క్ష';
        i += 3; // Skip క, ్, ష
        foundConjunct = true;
      }
      // త + ్ + ర = త్ర
      else if (currentChar === 'త' && nextChar === '్' && nextNextChar === 'ర') {
        formedWord += 'త్ర';
        i += 3; // Skip త, ్, ర
        foundConjunct = true;
      }
      // ద + ్ + వ = ద్వ
      else if (currentChar === 'ద' && nextChar === '్' && nextNextChar === 'వ') {
        formedWord += 'ద్వ';
        i += 3; // Skip ద, ్, వ
        foundConjunct = true;
      }
      // గ + ్ + య = గ్య
      else if (currentChar === 'గ' && nextChar === '్' && nextNextChar === 'య') {
        formedWord += 'గ్య';
        i += 3; // Skip గ, ్, య
        foundConjunct = true;
      }
      // శ + ్ + ర = శ్ర
      else if (currentChar === 'శ' && nextChar === '్' && nextNextChar === 'ర') {
        formedWord += 'శ్ర';
        i += 3; // Skip శ, ్, ర
        foundConjunct = true;
      }
      // హ + ్ + మ = హ్మ
      else if (currentChar === 'హ' && nextChar === '్' && nextNextChar === 'మ') {
        formedWord += 'హ్మ';
        i += 3; // Skip హ, ్, మ
        foundConjunct = true;
      }
      
      // Regular character
      if (!foundConjunct) {
        formedWord += currentChar;
        i++;
      }
    }
    
    return formedWord;
  };

  // Helper function to convert selected components to proper conjunct form
  const getFormedWord = () => {
    const components = selectedLetters.map(index => currentExercise.letters[index]);
    
    console.log('🔍 getFormedWord Debug:', {
      selectedLetters,
      components,
      exerciseId: currentExercise.id,
      componentsLength: components.length,
      fullComponents: components.map((c, i) => `${i}:${c}`).join(', ')
    });
    
    // Universal conjunct consonant handling for all exercises
    let formedWord = '';
    let i = 0;
    
    while (i < components.length) {
      const currentChar = components[i];
      const nextChar = i + 1 < components.length ? components[i + 1] : null;
      const nextNextChar = i + 2 < components.length ? components[i + 2] : null;
      
      console.log(`🔍 Processing index ${i}: "${currentChar}" (next: "${nextChar}", next+1: "${nextNextChar}")`);
      
      // Check for various conjunct combinations
      let foundConjunct = false;
      
      // ద + ్య = ద్య (separated by vowel)
      if (currentChar === 'ద' && nextNextChar === '్య') {
        formedWord += 'ద్య';
        console.log('🔍 Found ద + ్య (separated), adding ద్య, skipping to index', i + 3);
        i += 3; // Skip ద, vowel, ్య
        foundConjunct = true;
      }
      // ర + ్థ = ర్థ (separated by vowel)
      else if (currentChar === 'ర' && nextNextChar === '్థ') {
        formedWord += 'ర్థ';
        console.log('🔍 Found ర + ్థ (separated), adding ర్థ, skipping to index', i + 3);
        i += 3; // Skip ర, vowel, ్థ
        foundConjunct = true;
      }
      // క + ్ + ష = క్ష
      else if (currentChar === 'క' && nextChar === '్' && nextNextChar === 'ష') {
        formedWord += 'క్ష';
        console.log('🔍 Found క + ్ + ష, adding క్ష, skipping to index', i + 3);
        i += 3; // Skip క, ్, ష
        foundConjunct = true;
      }
      // త + ్ + ర = త్ర
      else if (currentChar === 'త' && nextChar === '్' && nextNextChar === 'ర') {
        formedWord += 'త్ర';
        console.log('🔍 Found త + ్ + ర, adding త్ర, skipping to index', i + 3);
        i += 3; // Skip త, ్, ర
        foundConjunct = true;
      }
      // ద + ్ + వ = ద్వ
      else if (currentChar === 'ద' && nextChar === '్' && nextNextChar === 'వ') {
        formedWord += 'ద్వ';
        console.log('🔍 Found ద + ్ + వ, adding ద్వ, skipping to index', i + 3);
        i += 3; // Skip ద, ్, వ
        foundConjunct = true;
      }
      // గ + ్ + య = గ్య
      else if (currentChar === 'గ' && nextChar === '్' && nextNextChar === 'య') {
        formedWord += 'గ్య';
        console.log('🔍 Found గ + ్ + య, adding గ్య, skipping to index', i + 3);
        i += 3; // Skip గ, ్, య
        foundConjunct = true;
      }
      // శ + ్ + ర = శ్ర
      else if (currentChar === 'శ' && nextChar === '్' && nextNextChar === 'ర') {
        formedWord += 'శ్ర';
        console.log('🔍 Found శ + ్ + ర, adding శ్ర, skipping to index', i + 3);
        i += 3; // Skip శ, ్, ర
        foundConjunct = true;
      }
      // హ + ్ + మ = హ్మ
      else if (currentChar === 'హ' && nextChar === '్' && nextNextChar === 'మ') {
        formedWord += 'హ్మ';
        console.log('🔍 Found హ + ్ + మ, adding హ్మ, skipping to index', i + 3);
        i += 3; // Skip హ, ్, మ
        foundConjunct = true;
      }
      
      // Regular character
      if (!foundConjunct) {
        formedWord += currentChar;
        console.log(`🔍 Adding regular character: "${currentChar}", moving to index`, i + 1);
        i++;
      }
      
      console.log(`🔍 Current formed word: "${formedWord}", next index: ${i}`);
    }
    
    console.log('🔍 Final formed word:', formedWord);
    return formedWord;
  };

  const checkAnswer = async () => {
    // Check if the final word formed matches the correct word
    const userWord = getFormedWord();
    const isAnswerCorrect = userWord === currentExercise.teluguWord;
    
    // Debug logging
    console.log('🔍 Spelling Check Debug:');
    console.log('Selected letters indices:', selectedLetters);
    console.log('Selected letters:', selectedLetters.map(index => currentExercise.letters[index]));
    console.log('User word:', userWord);
    console.log('Correct word:', currentExercise.teluguWord);
    console.log('Is correct:', isAnswerCorrect);
    
    setIsCorrect(isAnswerCorrect);
    
    // Save progress to backend
    await saveProgress(
      currentExercise.id,
      isAnswerCorrect,
      showHint ? 1 : 0, // hintsUsed
      0 // timeSpent - you can add time tracking if needed
    );
    
    if (isAnswerCorrect) {
      toast({
        title: "Perfect! 🎉",
        description: "Great job! You spelled the word correctly.",
      });
      setShowExplanation(true);
    } else {
      toast({
        title: "Try Again",
        description: "Check the letter order and try again.",
        variant: "destructive"
      });
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < filteredExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      toast({
        title: "Exercise Complete! 🎉",
        description: `You got ${score.correct} out of ${score.total} correct!`,
      });
    }
  };

  const resetAll = async () => {
    await resetProgress();
    resetExercise();
  };

  const shuffleLetters = () => {
    if (isCorrect !== null) return; // Don't allow shuffling after submission
    
    const shuffled = [...currentExercise.letters].sort(() => Math.random() - 0.5);
    setAvailableLetters(shuffled);
    setSelectedLetters([]);
  };

  // Auto-shuffle on exercise load
  useEffect(() => {
    if (currentExercise) {
      const shuffled = [...currentExercise.letters].sort(() => Math.random() - 0.5);
      setAvailableLetters(shuffled);
    }
  }, [currentExerciseIndex]);

  // Initialize speech synthesis on component mount
  useEffect(() => {
    // Component cleanup
    return () => {
      // Stop any ongoing speech when component unmounts
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
      case 'easy': return 'సులభం (Easy)';
      case 'medium': return 'మధ్యస్థం (Medium)';
      case 'hard': return 'కష్టం (Hard)';
      default: return difficulty;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-800">తెలుగు వర్ణమాల</h2>
        <p className="text-xl text-gray-600">
          Listen to the word and spell it using Telugu letters
        </p>
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* Difficulty Selector */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-purple-700">Select Difficulty Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 justify-center">
            <Button
              variant={selectedDifficulty === 'all' ? 'default' : 'outline'}
              onClick={() => handleDifficultyChange('all')}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">All Levels</span>
              <span className="sm:hidden">All</span>
            </Button>
            <Button
              variant={selectedDifficulty === 'easy' ? 'default' : 'outline'}
              onClick={() => handleDifficultyChange('easy')}
              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">సులభం (Easy)</span>
              <span className="sm:hidden">సులభం</span>
            </Button>
            <Button
              variant={selectedDifficulty === 'medium' ? 'default' : 'outline'}
              onClick={() => handleDifficultyChange('medium')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">మధ్యస్థం (Medium)</span>
              <span className="sm:hidden">మధ్యస్థం</span>
            </Button>
            <Button
              variant={selectedDifficulty === 'hard' ? 'default' : 'outline'}
              onClick={() => handleDifficultyChange('hard')}
              className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">కష్టం (Hard)</span>
              <span className="sm:hidden">కష్టం</span>
            </Button>
          </div>
          <div className="mt-3 text-center text-xs sm:text-sm text-gray-600">
            {filteredExercises.length} exercises available in {selectedDifficulty === 'all' ? 'all levels' : selectedDifficulty} level
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
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
                     <Progress value={(currentExerciseIndex / Math.max(filteredExercises.length - 1, 1)) * 100} className="h-3" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Score: {score.correct} / {score.total}</span>
            <span>{Math.round((score.correct / Math.max(score.total, 1)) * 100)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Exercise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Word Display */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 text-base sm:text-lg">
              <span>Listen and Spell</span>
              {(currentExercise as any)?.isUploaded && (
                <Badge variant="secondary" className="text-xs">
                  Uploaded
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
                                     <div className="text-center space-y-2">
              <p className="text-xs sm:text-sm text-gray-500">Listen to the Telugu pronunciation</p>
            </div>
            
            {/* Audio Button */}
            <div className="text-center space-y-2">
              <Button
                onClick={playAudio}
                disabled={isPlaying}
                className="flex items-center gap-2 mx-auto"
                size="lg"
              >
                <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
                {isPlaying ? 'Playing...' : 'Listen to Word'}
              </Button>
              

            </div>
            
            {/* Your Spelling Display - Always Visible */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
              <p className="text-sm text-gray-600 mb-2">Your spelling:</p>
              <div className="min-h-[60px] p-4 border-2 border-dashed border-gray-300 rounded-lg bg-blue-50">
                {selectedLetters.length === 0 ? (
                  <p className="text-gray-400 text-center">Click letters below to spell the word</p>
                ) : (
                  <div className="space-y-3">
                    {/* Individual Letter Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {selectedLetters.map((letterIndex, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => deselectLetter(letterIndex)}
                          className="text-lg"
                          disabled={isCorrect !== null}
                        >
                          {currentExercise.letters[letterIndex]}
                        </Button>
                      ))}
                    </div>
                    {/* Combined Word Display */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Combined word:</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {getFormedWord()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="flex items-center gap-2"
                >
                  {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </Button>
              </div>
              
                                           {showAnswer && (
                <div className="mt-4 space-y-3">
                  {/* Correct Answer */}
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-800 mb-2">Correct spelling:</p>
                    <p className="text-lg font-bold text-yellow-700">{getCorrectSpellingFormed()}</p>
                  </div>
                   
                   {/* Comparison */}
                   {selectedLetters.length > 0 && (
                     <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                       <p className="text-sm font-medium text-gray-800 mb-2">Comparison:</p>
                       <div className="flex items-center gap-4">
                         <div className="text-center">
                           <p className="text-xs text-gray-600">Your Answer</p>
                           <p className={`text-lg font-bold ${
                             getFormedWord() === currentExercise.teluguWord
                               ? 'text-green-600' 
                               : 'text-red-600'
                           }`}>
                             {getFormedWord()}
                           </p>
                         </div>
                         <div className="text-gray-400">vs</div>
                         <div className="text-center">
                           <p className="text-xs text-gray-600">Correct Answer</p>
                           <p className="text-lg font-bold text-green-600">
                             {currentExercise.teluguWord}
                           </p>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               )}
            </div>
          </CardContent>
        </Card>

        {/* Letter Selection */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <span>Available Letters</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Available Letters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Click letters to select:</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shuffleLetters}
                    className="flex items-center gap-2"
                    disabled={isCorrect !== null}
                  >
                    🔀 Shuffle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAnalytics}
                    className="flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </Button>
                </div>
              </div>
              
                             <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2">
                 {availableLetters.map((letter, index) => (
                   <Button
                     key={`${letter}-${index}`}
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       // Find the letter in the original letters array
                       const letterIndex = currentExercise.letters.indexOf(letter);
                       if (letterIndex !== -1) {
                         selectLetter(letterIndex);
                       }
                     }}
                     className="text-base sm:text-lg p-2 sm:p-4"
                     disabled={isCorrect !== null}
                   >
                     {letter}
                   </Button>
                 ))}
               </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                             <Button
                 onClick={checkAnswer}
                 disabled={selectedLetters.length === 0 || isCorrect !== null}
                 className="w-full"
                 size="lg"
               >
                 Check Answer
               </Button>
              
              <Button
                variant="outline"
                onClick={resetExercise}
                className="w-full"
                disabled={isCorrect !== null}
              >
                Reset Letters
              </Button>
            </div>

            {/* Result Display */}
            {isCorrect !== null && (
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-center gap-3 mb-3">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <span className="text-green-700 font-semibold text-lg">Perfect! 🎉</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-500" />
                      <span className="text-red-700 font-semibold text-lg">Try Again</span>
                    </>
                  )}
                </div>
                
                {!isCorrect && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Correct spelling:</p>
                    <p className="text-lg font-bold text-blue-700">
                      {getCorrectSpellingFormed()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Hint */}
            <Button
              variant="outline"
              onClick={() => setShowHint(!showHint)}
              className="w-full"
            >
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
            
            {showHint && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 mb-2">💡 Hint:</p>
                <p className="text-yellow-700">{currentExercise.hint}</p>
              </div>
            )}

            {/* Explanation */}
            {showExplanation && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">📚 Explanation:</p>
                <p className="text-blue-700">{currentExercise.explanation}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-2">
                             <Button
                 onClick={nextExercise}
                 disabled={currentExerciseIndex >= spellingExercises.length - 1}
                 className="flex-1"
               >
                <ArrowRight className="w-4 h-4 mr-2" />
                Next Exercise
              </Button>
              
              <Button
                variant="outline"
                onClick={resetAll}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Display */}
      {showAnalytics && analytics && (
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-indigo-700">
              <span>Your Progress Analytics</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalytics(false)}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-indigo-600">{analytics.totalExercises}</p>
              <p className="text-sm text-gray-600">Total Exercises</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-green-600">{analytics.correctAnswers}</p>
              <p className="text-sm text-gray-600">Correct Answers</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-red-600">{analytics.wrongAnswers}</p>
              <p className="text-sm text-gray-600">Wrong Answers</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-2xl font-bold text-blue-600">{analytics.accuracy}%</p>
              <p className="text-sm text-gray-600">Accuracy</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            How to Practice
          </CardTitle>
        </CardHeader>
                 <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <p className="font-semibold text-purple-700 mb-2">Step 1: Read English Word</p>
             <p>Look at the English word displayed on screen</p>
           </div>
           <div>
             <p className="font-semibold text-purple-700 mb-2">Step 2: Listen to Telugu</p>
             <p>Click the audio button to hear the Telugu pronunciation</p>
           </div>
           <div>
             <p className="font-semibold text-purple-700 mb-2">Step 3: Select Letters</p>
             <p>Click Telugu letters in the correct order to spell the word</p>
           </div>
           <div>
             <p className="font-semibold text-purple-700 mb-2">Step 4: Check Answer</p>
             <p>Learn Telugu letter combinations and word formation</p>
           </div>
         </CardContent>
      </Card>
    </div>
  );
}
