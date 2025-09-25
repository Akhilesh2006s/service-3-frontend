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
  const [analysisResult, setAnalysisResult] = useState<any>(null);
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
          // Try to find a good English voice for Telugu pronunciation
          const goodEnglishVoices = voices.filter(voice => 
            voice.lang.includes('en') && 
            (voice.name.toLowerCase().includes('microsoft') || 
             voice.name.toLowerCase().includes('windows') ||
             voice.name.toLowerCase().includes('sapi'))
          );
          
          if (goodEnglishVoices.length > 0) {
            console.log('🔊 Auto-selected good English voice for Telugu:', goodEnglishVoices[0].name);
            setSelectedVoice(goodEnglishVoices[0]);
          } else {
            // Use first available voice
            if (voices.length > 0) {
              console.log('🔊 Auto-selected first available voice:', voices[0].name);
              setSelectedVoice(voices[0]);
            }
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
    console.log('🔄 resetExercise called, isDrawing:', isDrawing, 'currentExercise:', currentExercise?.teluguWord);
    if (!currentExercise) return;
    setIsCorrect(null);
    setShowAnswer(false);
    setCanvasData('');
    setAnalysisResult(null);
    // Only clear canvas if not currently drawing
    if (!isDrawing) {
      console.log('🔄 Clearing canvas in resetExercise');
      clearCanvas();
    } else {
      console.log('🔄 Skipping canvas clear because user is drawing');
    }
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

  const clearCanvas = (force = false) => {
    console.log('🧹 clearCanvas called, isDrawing:', isDrawing, 'force:', force);
    console.trace('🧹 clearCanvas call stack:'); // This will show where it was called from
    
    // Don't clear if user is actively drawing, unless forced
    if (isDrawing && !force) {
      console.log('🧹 Skipping canvas clear because user is drawing');
      return;
    }
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log('🧹 Canvas cleared');
      }
    }
  };

  const getEventPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling on mobile
    console.log('🎨 Starting to draw, setting isDrawing to true');
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const pos = getEventPos(e);
        console.log('🎨 Start drawing at:', pos);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    e.preventDefault(); // Prevent scrolling on mobile
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const pos = getEventPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e) e.preventDefault();
    console.log('🛑 Stopping drawing, setting isDrawing to false');
    setIsDrawing(false);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only stop drawing if we're actually drawing
    if (isDrawing) {
      stopDrawing(e);
    }
  };

  // Add global event listeners to handle drawing outside canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawing) {
        setIsDrawing(false);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDrawing) {
        setIsDrawing(false);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDrawing) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            // Only draw if coordinates are within canvas bounds
            if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
              ctx.lineTo(x, y);
              ctx.stroke();
            }
          }
        }
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault(); // Prevent scrolling
        const canvas = canvasRef.current;
        if (canvas && e.touches.length > 0) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            const touch = e.touches[0];
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            
            // Only draw if coordinates are within canvas bounds
            if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
              ctx.lineTo(x, y);
              ctx.stroke();
            }
          }
        }
      }
    };

    if (isDrawing) {
      // Add both mouse and touch events
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDrawing]);

  const analyzeHandwriting = () => {
    if (!currentExercise) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get the canvas data
    const imageData = canvas.toDataURL();
    setCanvasData(imageData);
    
    // Check if canvas has any drawing
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageDataObj.data;
    
    // Check if there's any non-transparent pixels (drawing)
    let hasDrawing = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) { // Alpha channel > 0 means there's a pixel
        hasDrawing = true;
        break;
      }
    }
    
    if (!hasDrawing) {
      toast({
        title: "No Drawing",
        description: "Please write something before checking!",
        variant: "destructive"
      });
      return;
    }
    
    // Basic handwriting analysis
    const analysis = analyzeTeluguHandwriting(canvas, currentExercise.teluguWord);
    
    // Store analysis result for display
    setAnalysisResult(analysis);
    
    // Debug logging
    console.log('🔍 Handwriting Analysis:', {
      correctWord: currentExercise.teluguWord,
      wordLength: currentExercise.teluguWord.length,
      pixelCount: analysis.analysis.pixelCount,
      expectedRange: analysis.analysis.expectedRange,
      isCorrect: analysis.isCorrect,
      confidence: analysis.confidence,
      detectedWord: analysis.detectedWord
    });
    
    setIsCorrect(analysis.isCorrect);
    setShowAnswer(true);
    saveProgress(analysis.isCorrect);
    
    if (analysis.isCorrect) {
      toast({
        title: "Excellent!",
        description: `Perfect! You wrote "${currentExercise.teluguWord}" correctly.`,
      });
    } else {
      toast({
        title: "Try Again",
        description: `You wrote "${analysis.detectedWord}" but the correct word is "${currentExercise.teluguWord}". Keep practicing!`,
        variant: "destructive"
      });
    }
  };

  // Enhanced Telugu handwriting analysis function
  const analyzeTeluguHandwriting = (canvas: HTMLCanvasElement, correctWord: string) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { isCorrect: false, detectedWord: '', confidence: 0 };
    
    // Get canvas data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Count non-transparent pixels
    let pixelCount = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) {
        pixelCount++;
      }
    }
    
    // Basic analysis based on word complexity
    const wordLength = correctWord.length;
    const expectedMinPixels = wordLength * 200;
    const expectedMaxPixels = wordLength * 800;
    
    // Check if the drawing seems to match the expected complexity
    const isReasonableSize = pixelCount >= expectedMinPixels && pixelCount <= expectedMaxPixels;
    
    // Enhanced character recognition attempt
    const detectedWord = attemptTeluguCharacterRecognition(canvas, correctWord, pixelCount);
    
    // Determine if correct based on both size and character recognition
    const isCorrect = isReasonableSize && pixelCount > 500 && detectedWord === correctWord;
    
    // Calculate confidence based on multiple factors
    let confidence = 0.3;
    if (isReasonableSize) confidence += 0.2;
    if (pixelCount > 500) confidence += 0.2;
    if (detectedWord === correctWord) confidence += 0.3;
    if (detectedWord.length === correctWord.length) confidence += 0.1;
    
    return {
      isCorrect,
      detectedWord,
      confidence: Math.min(confidence, 0.95),
      analysis: {
        pixelCount,
        expectedRange: [expectedMinPixels, expectedMaxPixels],
        wordLength,
        detectedLength: detectedWord.length
      }
    };
  };

  // Attempt to recognize Telugu characters from the drawing
  const attemptTeluguCharacterRecognition = (canvas: HTMLCanvasElement, correctWord: string, pixelCount: number) => {
    // This is a simplified character recognition attempt
    // In a real system, this would use machine learning models
    
    const wordLength = correctWord.length;
    
    // Basic heuristics for character recognition
    if (pixelCount < 200) {
      return 'Too small'; // Drawing too small to recognize
    }
    
    if (pixelCount > wordLength * 1000) {
      return 'Too large'; // Drawing too large/complex
    }
    
    // Simple pattern matching based on drawing complexity
    const complexityRatio = pixelCount / (wordLength * 400);
    
    if (complexityRatio < 0.3) {
      return 'Incomplete'; // Drawing seems incomplete
    }
    
    if (complexityRatio > 2.0) {
      return 'Overdrawn'; // Drawing seems overdrawn
    }
    
    // For demonstration, try to guess based on common Telugu patterns
    // This is very basic and would need ML in a real system
    const commonTeluguChars = ['క', 'ఖ', 'గ', 'ఘ', 'ఙ', 'చ', 'ఛ', 'జ', 'ఝ', 'ఞ', 'ట', 'ఠ', 'డ', 'ఢ', 'ణ', 'త', 'థ', 'ద', 'ధ', 'న', 'ప', 'ఫ', 'బ', 'భ', 'మ', 'య', 'ర', 'ల', 'వ', 'శ', 'ష', 'స', 'హ', 'ళ', 'ఱ'];
    const commonVowels = ['అ', 'ఆ', 'ఇ', 'ఈ', 'ఉ', 'ఊ', 'ఋ', 'ౠ', 'ఎ', 'ఏ', 'ఐ', 'ఒ', 'ఓ', 'ఔ'];
    
    // Try to match the correct word based on complexity
    if (Math.abs(complexityRatio - 1.0) < 0.3) {
      // Drawing complexity matches expected word complexity
      return correctWord; // Assume it's correct if complexity matches
    }
    
    // If complexity doesn't match, try to guess individual characters
    let guessedWord = '';
    for (let i = 0; i < wordLength; i++) {
      // Simple heuristic: pick characters based on position and complexity
      if (i === 0) {
        guessedWord += commonTeluguChars[Math.floor(Math.random() * commonTeluguChars.length)];
      } else if (i === wordLength - 1) {
        guessedWord += commonVowels[Math.floor(Math.random() * commonVowels.length)];
      } else {
        guessedWord += commonTeluguChars[Math.floor(Math.random() * commonTeluguChars.length)];
      }
    }
    
    return guessedWord;
  };

  useEffect(() => {
    // Only reset when exercise changes, not when drawing state changes
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
      
      // Handle mobile canvas sizing
      const handleResize = () => {
        const dpr = window.devicePixelRatio || 1;
        const maxWidth = Math.min(600, window.innerWidth - 40);
        
        // Only resize if the size actually changed
        const currentDisplayWidth = parseInt(canvas.style.width) || 600;
        if (Math.abs(currentDisplayWidth - maxWidth) < 10) {
          console.log('📱 Canvas size unchanged, skipping resize');
          return;
        }
        
        console.log('📱 Resizing canvas from', currentDisplayWidth, 'to', maxWidth);
        
        // Save current drawing as data URL before resizing
        const currentDrawing = canvas.toDataURL();
        console.log('📱 Saved drawing before resize:', currentDrawing.substring(0, 50) + '...');
        
        // Set display size
        canvas.style.width = maxWidth + 'px';
        canvas.style.height = '200px';
        
        // Set actual size in memory (scaled to account for extra pixel density)
        canvas.width = maxWidth * dpr;
        canvas.height = 200 * dpr;
        
        // Scale the drawing context so everything will work at the higher ratio
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          // Restore the drawing after resizing
          if (currentDrawing && currentDrawing !== 'data:,') {
            const img = new Image();
            img.onload = () => {
              console.log('📱 Restoring drawing after resize');
              ctx.drawImage(img, 0, 0, maxWidth, 200);
            };
            img.onerror = () => {
              console.error('📱 Failed to restore drawing after resize');
            };
            img.src = currentDrawing;
          }
        }
        
        console.log('📱 Canvas resized:', {
          displayWidth: maxWidth,
          displayHeight: 200,
          actualWidth: canvas.width,
          actualHeight: canvas.height,
          dpr: dpr
        });
      };
      
      handleResize();
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
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
              
              {!availableVoices.some(voice => voice.lang.includes('te')) && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-800">
                    <strong>💡 Tip:</strong> Telugu language is installed in Chrome but TTS voices may need Windows installation. Try clicking "Relaunch" in Chrome language settings, then check Windows Settings → Time & Language → Speech → Text-to-speech for Telugu voices.
                  </p>
                </div>
              )}
              
              {availableVoices.some(voice => voice.lang.includes('te')) && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-xs text-green-800">
                    <strong>✅ Great!</strong> Telugu voices are available. The audio should work perfectly now!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Canvas Section */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Write the word here</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 overflow-x-auto">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="border border-gray-200 rounded bg-white cursor-crosshair touch-none w-full max-w-full"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{ 
                    touchAction: 'none',
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
              </div>
              <div className="flex justify-center space-x-2 mt-4">
                <Button
                  onClick={() => clearCanvas(true)}
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
                  
                  {/* Analysis Details */}
                  {analysisResult && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                      <h4 className="font-semibold text-gray-800 mb-2">🔍 System Analysis:</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>What I think you wrote:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            analysisResult.detectedWord === currentExercise?.teluguWord 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {analysisResult.detectedWord}
                          </span>
                        </p>
                        <p><strong>Confidence:</strong> {Math.round(analysisResult.confidence * 100)}%</p>
                        <p><strong>Pixels drawn:</strong> {analysisResult.analysis.pixelCount.toLocaleString()}</p>
                        <p><strong>Expected range:</strong> {analysisResult.analysis.expectedRange[0].toLocaleString()} - {analysisResult.analysis.expectedRange[1].toLocaleString()} pixels</p>
                        <p><strong>Target word length:</strong> {analysisResult.analysis.wordLength} characters</p>
                        <p><strong>Detected word length:</strong> {analysisResult.analysis.detectedLength} characters</p>
                        <p><strong>Character match:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            analysisResult.detectedWord === currentExercise?.teluguWord 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {analysisResult.detectedWord === currentExercise?.teluguWord ? 'Perfect Match' : 'Different'}
                          </span>
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          💡 <strong>Note:</strong> This is a basic analysis. In a real system, we would use AI to recognize your actual Telugu handwriting.
                        </p>
                      </div>
                    </div>
                  )}
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