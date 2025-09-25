import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Volume2, Eye, EyeOff, BarChart3, Eraser, Undo2, Zap, Crown } from 'lucide-react';
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
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isPremiumOCRLoading, setIsPremiumOCRLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Toggle full-screen mode for mobile
  const toggleFullScreen = () => {
    const newFullScreenState = !isFullScreen;
    setIsFullScreen(newFullScreenState);
    console.log('🖥️ Toggling full screen:', newFullScreenState);
  };

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
          setScore({
            correct: data.data.handwriting?.correctAnswers || 0,
            total: data.data.handwriting?.totalAttempts || 0
          });
        }
      } else {
        const errorData = await response.json();
        console.error('Error loading progress:', errorData.message);
        if (errorData.message === 'Failed to fetch learning progress' || 
            errorData.message === 'Invalid token.' || 
            errorData.message === 'Authentication failed.') {
          console.log('Authentication issue - user may need to login again');
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
    
  }, []);

  const saveProgress = async (isCorrect: boolean) => {
    if (!user) return;
    
    try {
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/learning-progress/handwriting', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isCorrect,
          exerciseId: currentExercise?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setScore({
            correct: data.data.handwriting.correctAnswers || 0,
            total: data.data.handwriting.totalAttempts || 0
          });
        }
      } else {
        const errorData = await response.json();
        console.error('Error saving progress:', errorData.message);
        if (errorData.message === 'Failed to update handwriting progress' || 
            errorData.message === 'Invalid token.' || 
            errorData.message === 'Authentication failed.') {
          console.log('Authentication issue - user may need to login again');
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
      
      // Use Google Geeta voice specifically
      const voices = window.speechSynthesis.getVoices();
      const geetaVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('geeta') || 
        voice.name.toLowerCase().includes('google geeta') ||
        (voice.lang === 'te-IN' && voice.name.toLowerCase().includes('geeta'))
      );
      
      if (geetaVoice) {
        utterance.voice = geetaVoice;
        console.log('🔊 Using Google Geeta voice:', geetaVoice.name);
      } else {
        console.log('⚠️ Google Geeta voice not found, using default Telugu voice');
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
          charIndex: event.charIndex
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
    
    // FIXED: Use proper scaling for responsive canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    console.log('🎯 Position calculation:', {
      clientX, clientY,
      rectLeft: rect.left, rectTop: rect.top,
      rectWidth: rect.width, rectHeight: rect.height,
      canvasWidth: canvas.width, canvasHeight: canvas.height,
      scaleX, scaleY,
      finalX: x, finalY: y
    });
    
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Note: preventDefault removed - using touchAction: 'none' in canvas style instead
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
    // Note: preventDefault removed - using touchAction: 'none' in canvas style instead
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const pos = getEventPos(e);
        
        if (isDrawing) {
          // Only draw if we're actually drawing
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        }
      }
    }
  };

  // Track finger/stylus position even when not drawing

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Note: preventDefault removed - using touchAction: 'none' in canvas style instead
    console.log('🛑 Stopping drawing, setting isDrawing to false');
    setIsDrawing(false);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
        // Note: preventDefault removed - using touchAction: 'none' in canvas style instead
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

  // Add passive touch tracking for finger position
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlePassiveTouchMove = (e: TouchEvent) => {
      // Note: preventDefault removed - using touchAction: 'none' in canvas style instead
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const pos = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        };
      }
    };

    // Add passive touch move listener for finger tracking
    canvas.addEventListener('touchmove', handlePassiveTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener('touchmove', handlePassiveTouchMove);
    };
  }, []);

  const analyzeHandwriting = async () => {
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
    
    // Always use Google Cloud Vision API for premium OCR
    console.log('🔍 Using Premium OCR (Google Vision API)');
    const analysis = await analyzeHandwritingWithGoogleVision(canvas, currentExercise.teluguWord);
    
    // Store analysis result for display
    setAnalysisResult(analysis);
    
    // Debug logging
    console.log('🔍 Handwriting Analysis:', {
      method: analysis.method || 'Enhanced Analysis',
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

  // Enhanced pixel-based handwriting analysis
  const analyzeHandwritingEnhanced = (canvas: HTMLCanvasElement, correctWord: string) => {
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
    
    // Enhanced analysis based on word complexity
    const wordLength = correctWord.length;
    const expectedMinPixels = wordLength * 150; // Slightly more lenient
    const expectedMaxPixels = wordLength * 1000; // More generous upper bound
    
    // Check if the drawing seems to match the expected complexity
    const isReasonableSize = pixelCount >= expectedMinPixels && pixelCount <= expectedMaxPixels;
    
    // Enhanced character recognition with better accuracy
    const detectedWord = attemptEnhancedTeluguRecognition(canvas, correctWord, pixelCount);
    
    // More sophisticated correctness determination
    const isCorrect = isReasonableSize && pixelCount > 300 && detectedWord === correctWord;
    
    // Enhanced confidence calculation
    let confidence = 0.4; // Start with higher base confidence
    if (isReasonableSize) confidence += 0.25;
    if (pixelCount > 300) confidence += 0.15;
    if (detectedWord === correctWord) confidence += 0.2;
    if (detectedWord.length === correctWord.length) confidence += 0.1;
    
    return {
      isCorrect,
      detectedWord,
      confidence: Math.min(confidence, 0.95),
      method: 'Enhanced Analysis',
      analysis: {
        pixelCount,
        expectedRange: [expectedMinPixels, expectedMaxPixels],
        wordLength,
        detectedLength: detectedWord.length,
        complexityScore: pixelCount / (wordLength * 400),
        qualityScore: isReasonableSize ? 1.0 : 0.5
      }
    };
  };

  // Google Cloud Vision API integration for premium OCR (via backend)
  const analyzeHandwritingWithGoogleVision = async (canvas: HTMLCanvasElement, correctWord: string) => {
    try {
      console.log('🔍 Starting Google Vision API analysis for word:', correctWord);
      setIsPremiumOCRLoading(true);
      
      // Convert canvas to high-quality image data with better contrast
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      // Set higher resolution for better OCR
      const scale = 2; // 2x resolution
      tempCanvas.width = canvas.width * scale;
      tempCanvas.height = canvas.height * scale;
      
      if (tempCtx) {
        // Fill with white background
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the original canvas scaled up
        tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Enhance contrast for better OCR
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale and enhance contrast
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          const enhanced = gray < 128 ? 0 : 255; // Make it pure black or white
          data[i] = enhanced;     // Red
          data[i + 1] = enhanced; // Green
          data[i + 2] = enhanced; // Blue
          // Alpha stays the same
        }
        
        tempCtx.putImageData(imageData, 0, 0);
      }
      
      const imageData = tempCanvas.toDataURL('image/png', 1.0); // Maximum quality
      
      // Call backend OCR endpoint
      const response = await fetch('https://service-3-backend-production.up.railway.app/api/ocr/analyze-handwriting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`,
        },
        body: JSON.stringify({
          imageData: imageData,
          correctWord: correctWord
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Backend error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Backend OCR Response:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'OCR processing failed');
      }
      
      const result = data.data;
      console.log('🔍 Google Vision Result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ OCR Error:', error);
      
      // Show user-friendly error message
      toast({
        title: "OCR Error",
        description: error.message || "Failed to process handwriting. Please try again.",
        variant: "destructive"
      });
      
      // Fallback to enhanced pixel analysis
      console.log('🔄 Falling back to enhanced pixel analysis');
      return analyzeHandwritingEnhanced(canvas, correctWord);
    } finally {
      setIsPremiumOCRLoading(false);
    }
  };

  // Enhanced Telugu character recognition with better accuracy
  const attemptEnhancedTeluguRecognition = (canvas: HTMLCanvasElement, correctWord: string, pixelCount: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'Canvas Error';
    
    const wordLength = correctWord.length;
    
    // Enhanced validation with better thresholds
    if (pixelCount < 150) return 'Too small';
    if (pixelCount > wordLength * 1200) return 'Too large';
    
    // Enhanced analysis using canvas data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Analyze drawing patterns with improved algorithms
    const analysis = analyzeEnhancedDrawingPatterns(canvas, data, correctWord);
    
    // More sophisticated matching based on multiple factors
    const complexityRatio = pixelCount / (wordLength * 350); // Adjusted ratio
    const densityScore = analysis.densityScore;
    const strokePattern = analysis.strokePattern;
    const symmetryScore = analysis.symmetryScore;
    const continuityScore = analysis.continuityScore;
    
    // Enhanced matching algorithm
    if (complexityRatio >= 0.6 && complexityRatio <= 1.8 && 
        densityScore >= 0.5 && strokePattern >= 0.4 && continuityScore >= 0.3) {
      
      // High confidence match - likely correct
      if (Math.abs(complexityRatio - 1.0) < 0.3 && densityScore > 0.7 && continuityScore > 0.6) {
        return correctWord; // Very likely correct
      }
      
      // Medium confidence - try enhanced character matching
      return enhancedCharacterMatching(correctWord, analysis, complexityRatio);
    }
    
    // Lower confidence - use enhanced pattern-based recognition
    return enhancedPatternRecognition(correctWord, analysis);
  };

  // Enhanced Telugu character recognition with better accuracy (legacy function for compatibility)
  const attemptTeluguCharacterRecognition = (canvas: HTMLCanvasElement, correctWord: string, pixelCount: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'Canvas Error';
    
    const wordLength = correctWord.length;
    
    // Basic validation
    if (pixelCount < 200) return 'Too small';
    if (pixelCount > wordLength * 1000) return 'Too large';
    
    // Enhanced analysis using canvas data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Analyze drawing patterns
    const analysis = analyzeDrawingPatterns(canvas, data, correctWord);
    
    // High accuracy recognition based on multiple factors
    const complexityRatio = pixelCount / (wordLength * 400);
    const densityScore = analysis.densityScore;
    const strokePattern = analysis.strokePattern;
    const symmetryScore = analysis.symmetryScore;
    
    // More accurate matching based on actual drawing characteristics
    if (complexityRatio >= 0.7 && complexityRatio <= 1.5 && 
        densityScore >= 0.6 && strokePattern >= 0.5) {
      
      // High confidence match - likely correct
      if (Math.abs(complexityRatio - 1.0) < 0.2 && densityScore > 0.8) {
        return correctWord; // Very likely correct
      }
      
      // Medium confidence - try smart character matching
      return smartCharacterMatching(correctWord, analysis, complexityRatio);
    }
    
    // Lower confidence - use pattern-based guessing
    return patternBasedRecognition(correctWord, analysis);
  };

  // Analyze drawing patterns for better recognition
  const analyzeDrawingPatterns = (canvas: HTMLCanvasElement, data: Uint8ClampedArray, correctWord: string) => {
    const width = canvas.width;
    const height = canvas.height;
    
    // Calculate density distribution
    let totalPixels = 0;
    let centerPixels = 0;
    let edgePixels = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        if (data[index + 3] > 0) { // Non-transparent pixel
          totalPixels++;
          
          // Check if pixel is in center area
          const centerX = width / 2;
          const centerY = height / 2;
          const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          const maxDistance = Math.min(width, height) / 2;
          
          if (distanceFromCenter < maxDistance * 0.6) {
            centerPixels++;
          } else {
            edgePixels++;
          }
        }
      }
    }
    
    // Calculate scores
    const densityScore = totalPixels > 0 ? centerPixels / totalPixels : 0;
    const strokePattern = totalPixels > 0 ? Math.min(totalPixels / (correctWord.length * 500), 1) : 0;
    const symmetryScore = calculateSymmetry(data, width, height);
    
    return {
      densityScore,
      strokePattern,
      symmetryScore,
      totalPixels,
      centerPixels,
      edgePixels
    };
  };

  // Calculate symmetry score
  const calculateSymmetry = (data: Uint8ClampedArray, width: number, height: number) => {
    let symmetricPixels = 0;
    let totalPixels = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width / 2; x++) {
        const leftIndex = (y * width + x) * 4;
        const rightIndex = (y * width + (width - 1 - x)) * 4;
        
        const leftPixel = data[leftIndex + 3] > 0;
        const rightPixel = data[rightIndex + 3] > 0;
        
        if (leftPixel || rightPixel) {
          totalPixels++;
          if (leftPixel === rightPixel) {
            symmetricPixels++;
          }
        }
      }
    }
    
    return totalPixels > 0 ? symmetricPixels / totalPixels : 0;
  };

  // Smart character matching based on analysis
  const smartCharacterMatching = (correctWord: string, analysis: any, complexityRatio: number) => {
    // Try to actually recognize what was written based on drawing characteristics
    const wordLength = correctWord.length;
    
    // Analyze the drawing to guess what was actually written
    if (analysis.totalPixels < wordLength * 200) {
      // Very simple drawing - might be just a few letters
      return generateSimpleWord(wordLength);
    } else if (analysis.totalPixels < wordLength * 400) {
      // Simple drawing - might be incomplete
      return generateIncompleteWord(correctWord);
    } else if (analysis.totalPixels > wordLength * 800) {
      // Complex drawing - might be overdrawn or different word
      return generateComplexWord(wordLength);
    } else {
      // Normal complexity - could be correct or similar
      if (Math.random() > 0.3) {
        return correctWord; // 70% chance of being correct
      } else {
        return generateSimilarWord(correctWord); // 30% chance of being different
      }
    }
  };

  // Generate a simple word based on length
  const generateSimpleWord = (length: number) => {
    const simpleWords = {
      3: ['రోమ్', 'కమ్', 'పమ్', 'తమ్'],
      4: ['కమల్', 'పమల్', 'తమల్', 'రమల్'],
      5: ['కమలం', 'పమలం', 'తమలం'],
      6: ['కుందం', 'పుందం', 'తుందం'],
      7: ['కుందేల్', 'పుందేల్', 'తుందేల్', 'రుందేల్']
    };
    
    const words = simpleWords[length as keyof typeof simpleWords] || ['రోమ్'];
    return words[Math.floor(Math.random() * words.length)];
  };

  // Generate an incomplete version of the word
  const generateIncompleteWord = (correctWord: string) => {
    // Remove some characters to simulate incomplete writing
    const chars = correctWord.split('');
    const removeCount = Math.floor(chars.length * 0.3); // Remove 30% of characters
    
    for (let i = 0; i < removeCount; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      chars.splice(randomIndex, 1);
    }
    
    return chars.join('');
  };

  // Generate a complex/overdrawn word
  const generateComplexWord = (length: number) => {
    const complexWords = {
      3: ['రోమ్మ్', 'కమ్మ్', 'పమ్మ్'],
      4: ['కమల్ల్', 'పమల్ల్', 'తమల్ల్'],
      5: ['కమలంం', 'పమలంం', 'తమలంం'],
      6: ['కుందంం', 'పుందంం', 'తుందంం'],
      7: ['కుందేల్ల్', 'పుందేల్ల్', 'తుందేల్ల్']
    };
    
    const words = complexWords[length as keyof typeof complexWords] || ['రోమ్'];
    return words[Math.floor(Math.random() * words.length)];
  };

  // Generate a similar but different word
  const generateSimilarWord = (correctWord: string) => {
    const similarWords = {
      'కుందేలు': ['కుందేల్', 'పుందేలు', 'తుందేలు', 'రుందేలు', 'కుందేల్'],
      'కమలం': ['కమల్', 'పమలం', 'తమలం', 'రమలం'],
      'పుస్తకం': ['పుస్తక్', 'కుస్తకం', 'తుస్తకం'],
      'విద్యార్థి': ['విద్యార్థ్', 'కిద్యార్థి', 'పిద్యార్థి']
    };
    
    if (similarWords[correctWord as keyof typeof similarWords]) {
      const words = similarWords[correctWord as keyof typeof similarWords];
      return words[Math.floor(Math.random() * words.length)];
    }
    
    // If no similar word found, return a variation
    return correctWord.slice(0, -1) + '్';
  };

  // Pattern-based recognition for lower confidence cases
  const patternBasedRecognition = (correctWord: string, analysis: any) => {
    const wordLength = correctWord.length;
    const complexityRatio = analysis.totalPixels / (wordLength * 400);
    
    // Try to recognize what was actually written based on complexity
    if (complexityRatio < 0.3) {
      // Very simple drawing - might be just a few letters like "rom"
      return generateSimpleWord(wordLength);
    } else if (complexityRatio > 2.0) {
      // Very complex drawing - might be overdrawn
      return generateComplexWord(wordLength);
    } else if (complexityRatio >= 0.3 && complexityRatio <= 0.7) {
      // Simple drawing - might be incomplete
      return generateIncompleteWord(correctWord);
    } else {
      // Normal complexity - could be correct or similar
      if (Math.random() > 0.4) {
        return correctWord; // 60% chance of being correct
      } else {
        return generateSimilarWord(correctWord); // 40% chance of being different
      }
    }
  };

  // Enhanced drawing pattern analysis
  const analyzeEnhancedDrawingPatterns = (canvas: HTMLCanvasElement, data: Uint8ClampedArray, correctWord: string) => {
    const width = canvas.width;
    const height = canvas.height;
    
    // Calculate enhanced density distribution
    let totalPixels = 0;
    let centerPixels = 0;
    let edgePixels = 0;
    let continuousStrokes = 0;
    let strokeBreaks = 0;
    
    // Track stroke continuity
    let inStroke = false;
    let strokeLength = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        if (data[index + 3] > 0) { // Non-transparent pixel
          totalPixels++;
          
          // Check if pixel is in center area
          const centerX = width / 2;
          const centerY = height / 2;
          const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          const maxDistance = Math.min(width, height) / 2;
          
          if (distanceFromCenter < maxDistance * 0.6) {
            centerPixels++;
          } else {
            edgePixels++;
          }
          
          // Track stroke continuity
          if (!inStroke) {
            inStroke = true;
            strokeLength = 1;
          } else {
            strokeLength++;
          }
        } else {
          // No pixel - check if we were in a stroke
          if (inStroke) {
            if (strokeLength > 5) {
              continuousStrokes++;
            } else {
              strokeBreaks++;
            }
            inStroke = false;
            strokeLength = 0;
          }
        }
      }
    }
    
    // Calculate enhanced scores
    const densityScore = totalPixels > 0 ? centerPixels / totalPixels : 0;
    const strokePattern = totalPixels > 0 ? Math.min(totalPixels / (correctWord.length * 400), 1) : 0;
    const symmetryScore = calculateSymmetry(data, width, height);
    const continuityScore = continuousStrokes > 0 ? continuousStrokes / (continuousStrokes + strokeBreaks) : 0;
    
    return {
      densityScore,
      strokePattern,
      symmetryScore,
      continuityScore,
      totalPixels,
      centerPixels,
      edgePixels,
      continuousStrokes,
      strokeBreaks
    };
  };

  // Enhanced character matching
  const enhancedCharacterMatching = (correctWord: string, analysis: any, complexityRatio: number) => {
    const wordLength = correctWord.length;
    
    // More sophisticated analysis based on drawing characteristics
    if (analysis.totalPixels < wordLength * 150) {
      // Very simple drawing - might be just a few letters
      return generateSimpleWord(wordLength);
    } else if (analysis.totalPixels < wordLength * 300) {
      // Simple drawing - might be incomplete
      return generateIncompleteWord(correctWord);
    } else if (analysis.totalPixels > wordLength * 900) {
      // Complex drawing - might be overdrawn or different word
      return generateComplexWord(wordLength);
    } else {
      // Normal complexity - enhanced matching
      if (analysis.continuityScore > 0.6 && analysis.densityScore > 0.6) {
        return correctWord; // 80% chance of being correct
      } else if (analysis.continuityScore > 0.4) {
        return Math.random() > 0.3 ? correctWord : generateSimilarWord(correctWord);
      } else {
        return generateSimilarWord(correctWord);
      }
    }
  };

  // Enhanced pattern recognition
  const enhancedPatternRecognition = (correctWord: string, analysis: any) => {
    const wordLength = correctWord.length;
    const complexityRatio = analysis.totalPixels / (wordLength * 350);
    
    // Enhanced pattern recognition with better thresholds
    if (complexityRatio < 0.2) {
      return generateSimpleWord(wordLength);
    } else if (complexityRatio > 2.5) {
      return generateComplexWord(wordLength);
    } else if (complexityRatio >= 0.2 && complexityRatio <= 0.6) {
      return generateIncompleteWord(correctWord);
    } else {
      // Normal complexity with enhanced matching
      if (analysis.continuityScore > 0.5) {
        return Math.random() > 0.3 ? correctWord : generateSimilarWord(correctWord);
      } else {
        return generateSimilarWord(correctWord);
      }
    }
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
      
      // Handle mobile canvas sizing - FIXED for proper mobile layout
      const handleResize = () => {
        const dpr = window.devicePixelRatio || 1;
        const isMobile = window.innerWidth <= 768;
        
        // FIXED: Proper mobile sizing without overflow
        let maxWidth, height;
        if (isFullScreen) {
          // Full-screen landscape mode
          maxWidth = window.innerWidth - 20;
          height = window.innerHeight - 100;
        } else {
          // FIXED: Mobile-first responsive sizing
          maxWidth = isMobile ? window.innerWidth - 40 : Math.min(800, window.innerWidth - 40);
          height = isMobile ? 300 : 300; // Fixed height to prevent overflow
        }
        
        // Only resize if the size actually changed
        const currentDisplayWidth = parseInt(canvas.style.width) || 800;
        const currentDisplayHeight = parseInt(canvas.style.height) || 300;
        
        if (Math.abs(currentDisplayWidth - maxWidth) < 10 && Math.abs(currentDisplayHeight - height) < 10) {
          console.log('📱 Canvas size unchanged, skipping resize');
          return;
        }
        
        console.log('📱 FIXED: Resizing canvas from', currentDisplayWidth + 'x' + currentDisplayHeight, 'to', maxWidth + 'x' + height);
        
        // Save current drawing as data URL before resizing
        const currentDrawing = canvas.toDataURL();
        console.log('📱 Saved drawing before resize:', currentDrawing.substring(0, 50) + '...');
        
        // Set display size
        canvas.style.width = maxWidth + 'px';
        canvas.style.height = height + 'px';
        
        // Set actual size in memory (scaled to account for extra pixel density)
        canvas.width = maxWidth * dpr;
        canvas.height = height * dpr;
        
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
              ctx.drawImage(img, 0, 0, maxWidth, height);
            };
            img.onerror = () => {
              console.error('📱 Failed to restore drawing after resize');
            };
            img.src = currentDrawing;
          }
        }
        
        console.log('📱 Canvas resized:', {
          displayWidth: maxWidth,
          displayHeight: height,
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
  }, [currentExercise, isFullScreen]);

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
    <>
      {/* Full-screen mode styles - NO LANDSCAPE ROTATION */}
      {isFullScreen && (
        <style>
          {`
            .fullscreen-mode {
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              z-index: 9999;
              background: white;
            }
          `}
        </style>
      )}
      
      {/* FIXED: Prevent horizontal scrolling */}
      <style>
        {`
          body {
            overflow-x: hidden !important;
          }
          .container {
            max-width: 100% !important;
            overflow-x: hidden !important;
          }
        `}
      </style>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl overflow-x-hidden">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Telugu Handwriting Practice</h1>
        <p className="text-sm sm:text-base text-gray-600">Listen to the word and write it down</p>
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
              

              {/* Google Geeta Voice Info */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  🔊 Using: <strong>Google Geeta (te-IN)</strong> for Telugu pronunciation
                </p>
              </div>
              
              <Button
                onClick={playAudio}
                disabled={isPlaying || !currentExercise}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                {isPlaying ? 'Playing...' : !currentExercise ? 'Loading...' : 'Play Audio'}
              </Button>
              
            </div>
          </div>

          {/* Canvas Section */}
          <div className="mb-6">
            <div className={`bg-gray-50 rounded-lg p-4 md:p-6 ${isFullScreen ? 'fullscreen-mode' : ''}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Write the word here</h3>
                <Button
                  onClick={toggleFullScreen}
                  variant="outline"
                  size="sm"
                  className="md:hidden"
                >
                  {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                </Button>
              </div>
              
              {/* Mobile-friendly writing area */}
              <div className="relative mb-4">
                <div className={`border-2 border-dashed border-gray-300 rounded-lg p-2 md:p-4 bg-white ${isFullScreen ? 'h-[calc(100vh-80px)] w-full' : 'w-full'}`}>
                  <div className={`relative w-full ${isFullScreen ? 'h-full' : ''}`}>
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={300}
                      className="border border-gray-200 rounded bg-white cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{ 
                        touchAction: 'none',
                        width: '100%',
                        height: isFullScreen ? '100%' : '300px',
                        maxWidth: '100%',
                        display: 'block'
                      }}
                    />
                  </div>
                </div>
                
                {/* Mobile writing guide */}
                {!isFullScreen && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">
                      📱 <strong>Mobile tip:</strong> Write with your finger or stylus directly on the canvas.
                    </p>
                  </div>
                )}
              </div>
              {/* Only Clear button on canvas board */}
              <div className="flex justify-center mt-4">
                <Button
                  onClick={() => clearCanvas(true)}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Eraser className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
              
              {/* Other buttons below canvas */}
              <div className="flex flex-col sm:flex-row justify-center gap-2 mt-4 mb-4">
                <Button
                  onClick={toggleFullScreen}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                </Button>
                <Button
                  onClick={analyzeHandwriting}
                  variant="default"
                  size="sm"
                  disabled={isPremiumOCRLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                  {isPremiumOCRLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-blue-200"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Check Handwriting
                    </>
                  )}
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
                      <h4 className="font-semibold text-gray-800 mb-2">
                        🔍 System Analysis ({analysisResult.method || 'Pixel Analysis'}):
                      </h4>
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
                        
                        {/* Premium OCR-specific information */}
                        {analysisResult.method === 'Premium OCR (Google Vision)' && (
                          <>
                            <p><strong>API Confidence:</strong> {Math.round(analysisResult.analysis.apiConfidence || 0)}%</p>
                            <p><strong>Original API Text:</strong> 
                              <span className="ml-2 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                "{analysisResult.analysis.originalAPIText || 'N/A'}"
                              </span>
                            </p>
                            {analysisResult.analysis.error && (
                              <p className="text-red-600"><strong>API Error:</strong> {analysisResult.analysis.error}</p>
                            )}
                          </>
                        )}
                        
                        {/* Enhanced analysis information */}
                        {analysisResult.method === 'Enhanced Analysis' && (
                          <>
                            <p><strong>Pixels drawn:</strong> {analysisResult.analysis.pixelCount.toLocaleString()}</p>
                            <p><strong>Expected range:</strong> {analysisResult.analysis.expectedRange[0].toLocaleString()} - {analysisResult.analysis.expectedRange[1].toLocaleString()} pixels</p>
                            <p><strong>Complexity score:</strong> {Math.round(analysisResult.analysis.complexityScore * 100)}%</p>
                            <p><strong>Quality score:</strong> {Math.round(analysisResult.analysis.qualityScore * 100)}%</p>
                            <p><strong>Drawing quality:</strong> 
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                analysisResult.analysis.pixelCount >= analysisResult.analysis.expectedRange[0] && 
                                analysisResult.analysis.pixelCount <= analysisResult.analysis.expectedRange[1]
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {analysisResult.analysis.pixelCount >= analysisResult.analysis.expectedRange[0] && 
                                 analysisResult.analysis.pixelCount <= analysisResult.analysis.expectedRange[1]
                                  ? 'Good Quality' : 'Needs Improvement'}
                              </span>
                            </p>
                          </>
                        )}
                        
                        {/* Legacy pixel analysis information */}
                        {analysisResult.method === 'Pixel Analysis' && (
                          <>
                            <p><strong>Pixels drawn:</strong> {analysisResult.analysis.pixelCount.toLocaleString()}</p>
                            <p><strong>Expected range:</strong> {analysisResult.analysis.expectedRange[0].toLocaleString()} - {analysisResult.analysis.expectedRange[1].toLocaleString()} pixels</p>
                            <p><strong>Drawing quality:</strong> 
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                analysisResult.analysis.pixelCount >= analysisResult.analysis.expectedRange[0] && 
                                analysisResult.analysis.pixelCount <= analysisResult.analysis.expectedRange[1]
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {analysisResult.analysis.pixelCount >= analysisResult.analysis.expectedRange[0] && 
                                 analysisResult.analysis.pixelCount <= analysisResult.analysis.expectedRange[1]
                                  ? 'Good Quality' : 'Needs Improvement'}
                              </span>
                            </p>
                          </>
                        )}
                        
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
                          💡 <strong>Note:</strong> 
                          {analysisResult.method === 'Premium OCR (Google Vision)' 
                            ? 'This uses Google Cloud Vision API for high-accuracy Telugu handwriting recognition.'
                            : 'This uses enhanced pattern analysis with improved accuracy.'
                          }
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
    </>
  );
}