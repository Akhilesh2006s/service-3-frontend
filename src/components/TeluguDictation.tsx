import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Save,
  BarChart3
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

// Telugu words by length
const TELUGU_WORDS = {
  2: ["అమ", "అప", "అక", "అన", "అత", "అయ", "అవ", "అల", "అర", "అస", "ఇమ", "ఇప", "ఇక", "ఇన", "ఇత", "ఇయ", "ఇవ", "ఇల", "ఇర", "ఇస"],
  3: ["అమ్మ", "అప్ప", "అక్క", "అన్న", "అత్త", "అయ్య", "అవ్వ", "అల్ల", "అర్ర", "అస్స", "ఇమ్మ", "ఇప్ప", "ఇక్క", "ఇన్న", "ఇత్త", "ఇయ్య", "ఇవ్వ", "ఇల్ల", "ఇర్ర", "ఇస్స", "ఉమ్మ", "ఉప్ప", "ఉక్క", "ఉన్న", "ఉత్త", "ఉయ్య", "ఉవ్వ", "ఉల్ల", "ఉర్ర", "ఉస్స"],
  4: ["అమ్మా", "అప్పా", "అక్కా", "అన్నా", "అత్తా", "అయ్యా", "అవ్వా", "అల్లా", "అర్రా", "అస్సా", "ఇమ్మా", "ఇప్పా", "ఇక్కా", "ఇన్నా", "ఇత్తా", "ఇయ్యా", "ఇవ్వా", "ఇల్లా", "ఇర్రా", "ఇస్సా", "ఉమ్మా", "ఉప్పా", "ఉక్కా", "ఉన్నా", "ఉత్తా", "ఉయ్యా", "ఉవ్వా", "ఉల్లా", "ఉర్రా", "ఉస్సా", "ఎమ్మా", "ఎప్పా", "ఎక్కా", "ఎన్నా", "ఎత్తా", "ఎయ్యా", "ఎవ్వా", "ఎల్లా", "ఎర్రా", "ఎస్సా"],
  5: ["అమ్మాయి", "అప్పాయి", "అక్కాయి", "అన్నాయి", "అత్తాయి", "అయ్యాయి", "అవ్వాయి", "అల్లాయి", "అర్రాయి", "అస్సాయి", "ఇమ్మాయి", "ఇప్పాయి", "ఇక్కాయి", "ఇన్నాయి", "ఇత్తాయి", "ఇయ్యాయి", "ఇవ్వాయి", "ఇల్లాయి", "ఇర్రాయి", "ఇస్సాయి", "ఉమ్మాయి", "ఉప్పాయి", "ఉక్కాయి", "ఉన్నాయి", "ఉత్తాయి", "ఉయ్యాయి", "ఉవ్వాయి", "ఉల్లాయి", "ఉర్రాయి", "ఉస్సాయి", "ఎమ్మాయి", "ఎప్పాయి", "ఎక్కాయి", "ఎన్నాయి", "ఎత్తాయి", "ఎయ్యాయి", "ఎవ్వాయి", "ఎల్లాయి", "ఎర్రాయి", "ఎస్సాయి", "ఒమ్మాయి", "ఒప్పాయి", "ఒక్కాయి", "ఒన్నాయి", "ఒత్తాయి", "ఒయ్యాయి", "ఒవ్వాయి", "ఒల్లాయి", "ఒర్రాయి", "ఒస్సాయి"],
  6: ["అమ్మాయికి", "అప్పాయికి", "అక్కాయికి", "అన్నాయికి", "అత్తాయికి", "అయ్యాయికి", "అవ్వాయికి", "అల్లాయికి", "అర్రాయికి", "అస్సాయికి", "ఇమ్మాయికి", "ఇప్పాయికి", "ఇక్కాయికి", "ఇన్నాయికి", "ఇత్తాయికి", "ఇయ్యాయికి", "ఇవ్వాయికి", "ఇల్లాయికి", "ఇర్రాయికి", "ఇస్సాయికి", "ఉమ్మాయికి", "ఉప్పాయికి", "ఉక్కాయికి", "ఉన్నాయికి", "ఉత్తాయికి", "ఉయ్యాయికి", "ఉవ్వాయికి", "ఉల్లాయికి", "ఉర్రాయికి", "ఉస్సాయికి", "ఎమ్మాయికి", "ఎప్పాయికి", "ఎక్కాయికి", "ఎన్నాయికి", "ఎత్తాయికి", "ఎయ్యాయికి", "ఎవ్వాయికి", "ఎల్లాయికి", "ఎర్రాయికి", "ఎస్సాయికి", "ఒమ్మాయికి", "ఒప్పాయికి", "ఒక్కాయికి", "ఒన్నాయికి", "ఒత్తాయికి", "ఒయ్యాయికి", "ఒవ్వాయికి", "ఒల్లాయికి", "ఒర్రాయికి", "ఒస్సాయికి", "అమ్మాయిలో", "అప్పాయిలో", "అక్కాయిలో", "అన్నాయిలో", "అత్తాయిలో", "అయ్యాయిలో", "అవ్వాయిలో", "అల్లాయిలో", "అర్రాయిలో", "అస్సాయిలో"]
};

interface TeluguDictationProps {
  currentMilestone?: number;
}

const TeluguDictation = ({ currentMilestone = 1 }: TeluguDictationProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedLength, setSelectedLength] = useState<number>(3);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [isListening, setIsListening] = useState(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [spokenWord, setSpokenWord] = useState<string>('');
  const [result, setResult] = useState<'correct' | 'incorrect' | 'pending'>('pending');
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [wordStartTime, setWordStartTime] = useState<number>(0);
  const [isMovingToNext, setIsMovingToNext] = useState<boolean>(false);
  const [isProcessingResult, setIsProcessingResult] = useState<boolean>(false);
  
  // Progress tracking state
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  const words = TELUGU_WORDS[selectedLength as keyof typeof TELUGU_WORDS] || [];

  // API functions for progress tracking
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
        if (data.success && data.data.dictation) {
          // Set the current word index to continue from where user left off
          const dictationProgress = data.data.dictation;
          if (dictationProgress.currentIndex > 0) {
            setCurrentWordIndex(dictationProgress.currentIndex);
            setScore({
              correct: dictationProgress.totalScore,
              total: dictationProgress.totalAttempts
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async (exerciseId: number, score: number, attempts: number = 1) => {
    if (!user) return;
    
    try {
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/learning-progress/dictation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        },
        body: JSON.stringify({
          exerciseId,
          score,
          attempts
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Progress saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error);
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

  // Load progress when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadProgress();
    }
  }, [user]);

  useEffect(() => {
    if (words.length > 0) {
      // Only reset if we're changing word length categories
      // Don't reset if we're just continuing with the same category
      setCurrentWord(words[0]);
      setCurrentWordIndex(0);
      setResult('pending');
      setSpokenWord('');
      setScore({ correct: 0, total: 0 });
      setWordStartTime(Date.now() + 200);
      setIsProcessingResult(false);
      setIsMovingToNext(false);
    }
  }, [selectedLength]);

  useEffect(() => {
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [recognitionInstance]);

  const speakWord = (word: string) => {
    speakText(word, {
      lang: 'te-IN',
      rate: 0.75,
      pitch: 1.1
    });
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
    if (!currentWord) return;

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

      recognition.continuous = true; // Keep it continuous
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
         console.log('Word start time:', wordStartTime, 'Current time:', currentTime);
         
         setSpokenWord(transcript);
         
         const similarity = comparePronunciation(transcript, currentWord);
         console.log('Similarity:', similarity);
         
         // Much lower threshold for better Telugu recognition
         if (similarity > 0.2 && !isProcessingResult) {
           console.log('✅ Correct pronunciation detected! Moving to next word...');
           console.log('🔍 Current state - Processing:', isProcessingResult, 'Moving:', isMovingToNext);
           
           setIsProcessingResult(true);
           setResult('correct');
           setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
           
           // Save progress to backend
           saveProgress(currentWordIndex, 100, 1);
           
           toast({
              title: "Correct! 🎉",
              description: "Great pronunciation! Click 'Next Word' to continue.",
            });
           
           // Don't auto-progress - let user click Next Word manually
           console.log('✅ Word completed - waiting for manual next');
           setIsMovingToNext(false);
           setIsProcessingResult(false);
           
         } else if (finalTranscript && similarity <= 0.2) {
           // Only mark as incorrect if we have a final result and similarity is low
           setResult('incorrect');
           // Don't increment total score for incorrect attempts - only count when they get it right
           
           toast({
             title: "Try Again",
             description: "Pronunciation needs improvement. Listen and try again.",
             variant: "destructive"
           });
           
           // Don't stop listening - keep it continuous for retry
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
        // Only stop if user manually stopped it
        if (!isListening) {
          setRecognitionInstance(null);
        } else {
          // Restart recognition if it ended unexpectedly but user still wants to listen
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
    const nextIndex = currentWordIndex + 1;
    console.log('🔄 nextWord called - Current index:', currentWordIndex, 'Next index:', nextIndex, 'Total words:', words.length);
    
    if (nextIndex < words.length) {
      console.log('📝 Moving to word:', words[nextIndex]);
      setCurrentWordIndex(nextIndex);
      setCurrentWord(words[nextIndex]);
      setResult('pending');
      setSpokenWord('');
      setIsProcessingResult(false); // Reset processing state
      
      // Set the word start time to now + a small delay
      const newWordStartTime = Date.now() + 200; // 200ms delay to ensure we don't process old transcripts
      setWordStartTime(newWordStartTime);
      console.log('⏰ Set word start time to:', newWordStartTime);
      
      // Don't auto-play - let user focus on pronunciation
      console.log('📝 Word set to:', words[nextIndex]);
    } else {
      console.log('🎉 Practice complete!');
      // Stop recognition when practice is complete
      if (recognitionInstance) {
        recognitionInstance.stop();
        setRecognitionInstance(null);
      }
      setIsListening(false);
      setIsProcessingResult(false);
      
      toast({
        title: "Practice Complete! 🎉",
        description: `You got ${score.correct} out of ${score.total} words correct!`,
      });
    }
  };

  const resetPractice = () => {
    setCurrentWordIndex(0);
    setCurrentWord(words[0]);
    setResult('pending');
    setSpokenWord('');
    setScore({ correct: 0, total: 0 });
  };

  const handleDifficultyChange = (length: number) => {
    setSelectedLength(length);
    setCurrentWordIndex(0);
    setCurrentWord(TELUGU_WORDS[length as keyof typeof TELUGU_WORDS]?.[0] || '');
    setResult('pending');
    setSpokenWord('');
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionInstance) {
      recognitionInstance.stop();
      setRecognitionInstance(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-800">తెలుగు డిక్టేషన్</h2>
        <p className="text-xl text-gray-600">
          Practice Telugu pronunciation with word-by-word dictation
        </p>
      </div>

      {/* Difficulty Selection */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-purple-700">Select Difficulty Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant={selectedLength === 2 ? 'default' : 'outline'}
              onClick={() => handleDifficultyChange(2)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              సులభం (Easy) - 2 Letters
            </Button>
            <Button
              variant={selectedLength === 3 ? 'default' : 'outline'}
              onClick={() => handleDifficultyChange(3)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              మధ్యస్థం (Medium) - 3 Letters
            </Button>
            <Button
              variant={selectedLength === 4 ? 'default' : 'outline'}
              onClick={() => handleDifficultyChange(4)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              కష్టం (Hard) - 4 Letters
            </Button>
            <Button
              variant={selectedLength === 5 ? 'default' : 'outline'}
              onClick={() => handleDifficultyChange(5)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              చాలా కష్టం (Very Hard) - 5 Letters
            </Button>
            <Button
              variant={selectedLength === 6 ? 'default' : 'outline'}
              onClick={() => handleDifficultyChange(6)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              అత్యంత కష్టం (Expert) - 6 Letters
            </Button>
          </div>
          <div className="mt-3 text-center text-sm text-gray-600">
            {words.length} words available in {selectedLength}-letter difficulty level
          </div>
        </CardContent>
      </Card>

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
                  Word {currentWordIndex + 1} of {words.length}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-2">Current word:</p>
              <p className="text-4xl font-bold text-orange-700 mb-4">{currentWord}</p>
            </div>
            

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
                
                {/* Debug Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Debug Info:</p>
                  <p className="text-xs text-gray-700">Expected: <span className="font-mono">{currentWord}</span></p>
                  <p className="text-xs text-gray-700">Spoken: <span className="font-mono">{spokenWord}</span></p>
                  <p className="text-xs text-gray-700">Result: <span className="font-mono">{result}</span></p>
                  <p className="text-xs text-gray-700">Processing: <span className="font-mono">{isProcessingResult ? 'Yes' : 'No'}</span></p>
                  <p className="text-xs text-gray-700">Moving: <span className="font-mono">{isMovingToNext ? 'Yes' : 'No'}</span></p>
                  <p className="text-xs text-gray-700">Score: <span className="font-mono">{score.correct}/{score.total}</span></p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={nextWord}
                disabled={currentWordIndex >= words.length - 1}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Next Word
              </Button>
              <Button
                variant="outline"
                onClick={resetPractice}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Practice
              </Button>
            </div>
            
            {/* Debug Controls */}
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-700 mb-2">Debug Controls:</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔧 Manual next word triggered');
                    setIsProcessingResult(false);
                    setIsMovingToNext(false);
                    nextWord();
                  }}
                  className="text-xs"
                >
                  Force Next Word
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔧 Reset processing state');
                    setIsProcessingResult(false);
                    setIsMovingToNext(false);
                  }}
                  className="text-xs"
                >
                  Reset State
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Analytics */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-blue-700">
            <span>Progress Analytics</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAnalytics}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                {isLoading ? 'Loading...' : 'View Analytics'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAnalytics && analytics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-blue-700 mb-2">Dictation Progress</h4>
                  <p className="text-sm text-gray-600">Completed: {analytics.dictation.completed}</p>
                  <p className="text-sm text-gray-600">Average Score: {Math.round(analytics.dictation.averageScore)}%</p>
                  <p className="text-sm text-gray-600">Total Attempts: {analytics.dictation.totalAttempts}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-green-700 mb-2">Overall Progress</h4>
                  <p className="text-sm text-gray-600">Total Exercises: {analytics.overall.totalExercisesCompleted}</p>
                  <p className="text-sm text-gray-600">Average Score: {Math.round(analytics.overall.averageScore)}%</p>
                  <p className="text-sm text-gray-600">Time Spent: {analytics.overall.totalTimeSpent} min</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-purple-700 mb-2">Current Session</h4>
                  <p className="text-sm text-gray-600">Score: {score.correct}/{score.total}</p>
                  <p className="text-sm text-gray-600">Word: {currentWordIndex + 1}/{words.length}</p>
                  <p className="text-sm text-gray-600">Length: {selectedLength} letters</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">Click "View Analytics" to see your detailed progress</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-purple-700">How to Practice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-purple-700 mb-2">Step 1: Select Word Length</p>
              <p>Choose from 3, 4, 5, or 6 letter words using the tabs above</p>
            </div>
            <div>
              <p className="font-semibold text-purple-700 mb-2">Step 2: Listen to the Word</p>
              <p>Click "Listen Again" to hear the word pronounced clearly</p>
            </div>
            <div>
              <p className="font-semibold text-purple-700 mb-2">Step 3: Start Practice</p>
              <p>Click "Start Listening" to turn on the microphone</p>
            </div>
            <div>
              <p className="font-semibold text-purple-700 mb-2">Step 4: Pronounce Clearly</p>
              <p>Speak the word clearly and wait for feedback</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeluguDictation;
