import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Volume2, Mic, MicOff } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { speakText, stopSpeech } from '../utils/speechUtils';

interface FillBlanksExercise {
  id: number;
  word: string;
  meaning: string;
  partial: string;
  answer: string;
  hint: string;
  explanation: string;
  type: 'vowel_length' | 'sunnā' | 'consonant_combination';
}

const exercises: FillBlanksExercise[] = [
  {
    id: 1,
    word: 'వారం',
    meaning: 'week',
    partial: 'వా__రా__',
    answer: 'రం',
    hint: 'Add సున్నా (sunnā) to make రా → రం',
    explanation: 'వా + రం = వారం (vaaram) - week',
    type: 'sunnā'
  },
  {
    id: 2,
    word: 'పుస్తకం',
    meaning: 'book',
    partial: 'పు__స్త__కా__',
    answer: 'కం',
    hint: 'Add సున్నా to make కా → కం',
    explanation: 'పు + స్త + కం = పుస్తకం (pustakam) - book',
    type: 'sunnā'
  },
  {
    id: 3,
    word: 'అమ్మా',
    meaning: 'mother',
    partial: 'అ__మ్మా',
    answer: 'మ్మా',
    hint: 'Add దీర్ఘం (long vowel) to మ → మా',
    explanation: 'అ + మ్మా = అమ్మా (ammaa) - mother',
    type: 'vowel_length'
  },
  {
    id: 4,
    word: 'నాన్న',
    meaning: 'father',
    partial: 'నా__న్న',
    answer: 'న్న',
    hint: 'Add consonant combination న + న',
    explanation: 'నా + న్న = నాన్న (naanna) - father',
    type: 'consonant_combination'
  },
  {
    id: 5,
    word: 'చదువు',
    meaning: 'study/read',
    partial: 'చ__దు__వు',
    answer: 'దువు',
    hint: 'Add దీర్ఘం to ద → దు',
    explanation: 'చ + దువు = చదువు (chaduvu) - study',
    type: 'vowel_length'
  },
  {
    id: 6,
    word: 'బడి',
    meaning: 'school',
    partial: 'బ__డి',
    answer: 'డి',
    hint: 'Add vowel marker ి to డ → డి',
    explanation: 'బ + డి = బడి (badi) - school',
    type: 'vowel_length'
  },
  {
    id: 7,
    word: 'మంచం',
    meaning: 'bed',
    partial: 'మ__చా__',
    answer: 'చం',
    hint: 'Add సున్నా to చా → చం',
    explanation: 'మ + చం = మంచం (mancham) - bed',
    type: 'sunnā'
  },
  {
    id: 8,
    word: 'గది',
    meaning: 'room',
    partial: 'గ__ది',
    answer: 'ది',
    hint: 'Add vowel marker ి to ద → ది',
    explanation: 'గ + ది = గది (gadi) - room',
    type: 'vowel_length'
  }
];

export default function TeluguFillBlanks() {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isListening, setIsListening] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<SpeechRecognition | null>(null);
  const { toast } = useToast();

  const currentExercise = exercises[currentExerciseIndex];

  const speakWord = (word: string) => {
    speakText(word, {
      lang: 'te-IN',
      rate: 0.75,
      pitch: 1.1
    });
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'te-IN';

      recognition.onstart = () => {
        setIsListening(true);
        console.log('🎤 Started listening for answer...');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Heard:', transcript);
        setUserAnswer(transcript);
        checkAnswer(transcript);
      };

      recognition.onerror = (event) => {
        console.error('🎤 Recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Speech Recognition Error",
          description: "Please try again or type your answer.",
          variant: "destructive"
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognitionInstance(recognition);
      recognition.start();
    } else {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Please type your answer instead.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
      setRecognitionInstance(null);
    }
    setIsListening(false);
  };

  const checkAnswer = (answer: string) => {
    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedCorrect = currentExercise.answer.toLowerCase().trim();
    
    const isAnswerCorrect = normalizedAnswer === normalizedCorrect;
    setIsCorrect(isAnswerCorrect);
    
    if (isAnswerCorrect) {
      setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      toast({
        title: "Correct! 🎉",
        description: "Great job! You completed the word correctly.",
      });
      setShowExplanation(true);
    } else {
      setScore(prev => ({ total: prev.total + 1 }));
      toast({
        title: "Try Again",
        description: `The correct answer is: ${currentExercise.answer}`,
        variant: "destructive"
      });
    }
  };

  const handleSubmit = () => {
    if (userAnswer.trim()) {
      checkAnswer(userAnswer);
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setUserAnswer('');
      setIsCorrect(null);
      setShowHint(false);
      setShowExplanation(false);
    } else {
      toast({
        title: "Exercise Complete! 🎉",
        description: `You got ${score.correct} out of ${score.total} correct!`,
      });
    }
  };

  const resetExercise = () => {
    setCurrentExerciseIndex(0);
    setUserAnswer('');
    setIsCorrect(null);
    setShowHint(false);
    setShowExplanation(false);
    setScore({ correct: 0, total: 0 });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vowel_length': return 'bg-blue-100 text-blue-800';
      case 'sunnā': return 'bg-green-100 text-green-800';
      case 'consonant_combination': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vowel_length': return 'దీర్ఘం (Vowel Length)';
      case 'sunnā': return 'సున్నా (Sunnā)';
      case 'consonant_combination': return 'వ్యంజన సంయుక్తం (Consonant Combination)';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-800">తెలుగు పద నిర్మాణం</h2>
        <p className="text-xl text-gray-600">
          Fill in the blanks to complete Telugu words and learn script rules
        </p>
      </div>

      {/* Progress */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-orange-700">
            <span>Exercise Progress</span>
            <Badge variant="outline" className="text-orange-700">
              {currentExerciseIndex + 1} / {exercises.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={(currentExerciseIndex / exercises.length) * 100} className="h-3" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Score: {score.correct} / {score.total}</span>
            <span>{Math.round((score.correct / Math.max(score.total, 1)) * 100)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Exercise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Word Display */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <span>Complete the Word</span>
              <Badge className={getTypeColor(currentExercise.type)}>
                {getTypeLabel(currentExercise.type)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Word meaning:</p>
              <p className="text-2xl font-bold text-blue-800">{currentExercise.meaning}</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
              <p className="text-sm text-gray-600 mb-2">Fill in the blanks:</p>
              <p className="text-4xl font-bold text-orange-700 mb-4">
                {currentExercise.partial.replace('__', '_____')}
              </p>
              <Button
                variant="outline"
                onClick={() => speakWord(currentExercise.word)}
                className="flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                Listen to Complete Word
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Answer Section */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <span>Your Answer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Input
                placeholder="Type or speak your answer..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="text-lg text-center"
                disabled={isCorrect !== null}
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={isListening ? stopListening : startListening}
                  className={`flex-1 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                  disabled={isCorrect !== null}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Speak Answer
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={!userAnswer.trim() || isCorrect !== null}
                  className="flex-1"
                >
                  Submit
                </Button>
              </div>
            </div>

            {/* Result Display */}
            {isCorrect !== null && (
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-center gap-3 mb-3">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <span className="text-green-700 font-semibold text-lg">Correct! 🎉</span>
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
                    <p className="text-sm text-gray-600">Correct answer:</p>
                    <p className="text-xl font-bold text-blue-700">{currentExercise.answer}</p>
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
                disabled={currentExerciseIndex >= exercises.length - 1}
                className="flex-1"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Next Exercise
              </Button>
              
              <Button
                variant="outline"
                onClick={resetExercise}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            How to Practice
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-purple-700 mb-2">Step 1: Understand the Word</p>
            <p>Look at the meaning and listen to the complete word pronunciation</p>
          </div>
          <div>
            <p className="font-semibold text-purple-700 mb-2">Step 2: Fill the Blanks</p>
            <p>Type or speak the missing part to complete the word</p>
          </div>
          <div>
            <p className="font-semibold text-purple-700 mb-2">Step 3: Learn the Rules</p>
            <p>Understand vowel lengths, sunnā, and consonant combinations</p>
          </div>
          <div>
            <p className="font-semibold text-purple-700 mb-2">Step 4: Practice More</p>
            <p>Continue with more exercises to master Telugu script rules</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
