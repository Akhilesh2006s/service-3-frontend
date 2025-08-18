import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  Volume2, 
  BookOpen, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileText,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TeluguUnitManager from "@/components/TeluguUnitManager";
// Remove dependency on complex speech utility - use direct approach instead

// TypeScript declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface TeluguStory {
  _id?: string;
  id?: string;
  title: string;
  teluguTitle: string;
  content: string;
  teluguContent: string;
  category: "historical" | "virtuous" | "educational" | "cultural" | "moral";
  difficulty: "easy" | "medium" | "hard";
  milestone: number;
  wordCount: number;
  photos: Array<{
    url: string;
    caption: string;
    teluguCaption: string;
    order: number;
  }>;
  paragraphs: Array<{
    content: string;
    teluguContent: string;
    order: number;
    hasAudio: boolean;
    audioUrl?: string;
  }>;
  audioUrl?: string;
  tags: string[];
  readingTime: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TeluguReadingProps {
  currentMilestone: number;
}

const TeluguReading = ({ currentMilestone }: TeluguReadingProps) => {
  const { toast } = useToast();
  const [currentStory, setCurrentStory] = useState<TeluguStory | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const [teluguStories, setTeluguStories] = useState<TeluguStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<string>('');
  
  // Speech recognition states for pronunciation practice
  const [isListening, setIsListening] = useState(false);
  const [pronunciationResults, setPronunciationResults] = useState<{[key: number]: 'correct' | 'incorrect' | 'pending'}>({});
  const [currentPracticeWord, setCurrentPracticeWord] = useState<string>('');
  const [recognition, setRecognition] = useState<any>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [allWords, setAllWords] = useState<string[]>([]);
  const [wordTimeout, setWordTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isProcessingWord, setIsProcessingWord] = useState<boolean>(false);

  useEffect(() => {
    fetchStories();
  }, [currentMilestone]);

  // Initialize speech synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Load voices if they're not already loaded
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        
        // Find Telugu or Indian voices with better fallback logic
        let teluguVoice = voices.find(voice => 
          voice.lang === 'te-IN' || 
          voice.name.toLowerCase().includes('telugu')
        );
        
        // If no Telugu voice, try Hindi or other Indian languages
        if (!teluguVoice) {
          teluguVoice = voices.find(voice => 
            voice.lang === 'hi-IN' || 
            voice.lang === 'en-IN' ||
            voice.name.toLowerCase().includes('indian') ||
            voice.name.toLowerCase().includes('hindi')
          );
        }
        
        // If still no Indian voice, use any available voice
        if (!teluguVoice && voices.length > 0) {
          teluguVoice = voices[0];
        }
        
        if (teluguVoice) {
          console.log('Found voice for Telugu:', teluguVoice.name, `(${teluguVoice.lang})`);
          setCurrentVoice(teluguVoice.name);
        } else {
          console.log('No suitable voice found, speech synthesis may not work properly');
          setCurrentVoice('Default voice');
        }
      };

      // Load voices immediately if available
      loadVoices();
      
      // Also listen for voices to be loaded
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Initialize speech recognition for pronunciation practice
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'te-IN'; // Telugu language
      recognitionInstance.maxAlternatives = 3; // Get multiple recognition alternatives
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        console.log('Speech recognition started');
      };
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript && allWords.length > 0 && currentWordIndex < allWords.length) {
          // Prevent multiple simultaneous word processing
          if (isProcessingWord) {
            console.log('⏳ Already processing a word, skipping...');
            return;
          }
          
          const spokenWords = finalTranscript.toLowerCase().split(/\s+/).filter(word => word.trim().length > 0);
          const expectedWord = allWords[currentWordIndex].toLowerCase();
          
          console.log('🎤 Spoken words:', spokenWords);
          console.log('📝 Expected word:', expectedWord);
          console.log('📍 Current index:', currentWordIndex, 'of', allWords.length);
          console.log('🔤 All words:', allWords);
          
          // Check if any spoken word matches the current expected word
          let foundMatch = false;
          let bestSimilarity = 0;
          console.log('🔍 Checking word matches...');
          for (const spokenWord of spokenWords) {
            const similarity = comparePronunciation(spokenWord, expectedWord);
            console.log(`  "${spokenWord}" vs "${expectedWord}" = ${similarity}`);
            if (similarity > 0.7) { // Higher threshold for better accuracy
              foundMatch = true;
              bestSimilarity = Math.max(bestSimilarity, similarity);
              console.log(`✅ Match found! Similarity: ${similarity}`);
              break;
            }
          }
          
          if (!foundMatch) {
            console.log('❌ No match found for current word');
          }
          
          if (foundMatch) {
            console.log('✅ Word matched! Moving to next word...');
            setIsProcessingWord(true); // Prevent multiple processing
            
            // Clear current timeout
            if (wordTimeout) {
              clearTimeout(wordTimeout);
              setWordTimeout(null);
            }
            
            // Mark current word as correct
            setPronunciationResults(prev => ({
              ...prev,
              [currentWordIndex]: 'correct'
            }));
            
            // Move to next word
            const nextIndex = currentWordIndex + 1;
            setCurrentWordIndex(nextIndex);
            
            if (nextIndex < allWords.length) {
              setCurrentPracticeWord(allWords[nextIndex]);
              console.log('✅ Correct! Moving to:', allWords[nextIndex]);
              
              // Set timeout for next word
              const timeout = setTimeout(handleWordTimeout, 5000);
              setWordTimeout(timeout);
              
              // Reset processing state after a short delay
              setTimeout(() => {
                setIsProcessingWord(false);
              }, 500);
            } else {
              // All words completed
              setCurrentPracticeWord('');
              setIsProcessingWord(false);
              console.log('🎉 All words completed!');
              toast({
                title: "Excellent! 🎉",
                description: "You've successfully pronounced all words in the paragraph!",
              });
            }
          } else {
            // STRICT SEQUENTIAL MODE: Only allow current word, no skipping ahead
            console.log('❌ No match found for current word:', expectedWord);
            console.log('📝 User must pronounce words in order - no skipping allowed');
            
            // Don't mark as incorrect immediately - let timeout handle it
            // User must pronounce the current word correctly to proceed
          }
        }
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
          toast({
            title: "Speech Recognition Error",
            description: `Error: ${event.error}. Please check your microphone and try again.`,
            variant: "destructive"
          });
        }
      };
      
      recognitionInstance.onnomatch = () => {
        console.log('No speech was recognized');
        toast({
          title: "No Speech Detected",
          description: "Please speak clearly and try again.",
          variant: "destructive"
        });
      };
      
      recognitionInstance.onend = () => {
        console.log('🔄 Speech recognition ended - attempting restart...');
        // Only restart if we're still supposed to be listening and not processing a word
        if (isListening && !isProcessingWord) {
          console.log('🔄 Restarting recognition...');
          setTimeout(() => {
            try {
              recognitionInstance.start();
              console.log('✅ Recognition restarted successfully');
            } catch (error) {
              console.error('❌ Error restarting recognition:', error);
              // Try again after a longer delay if first attempt fails
              setTimeout(() => {
                if (isListening && !isProcessingWord) {
                  try {
                    recognitionInstance.start();
                    console.log('✅ Recognition restarted on retry');
                  } catch (retryError) {
                    console.error('❌ Error on retry restart:', retryError);
                    // Final attempt
                    setTimeout(() => {
                      if (isListening && !isProcessingWord) {
                        try {
                          recognitionInstance.start();
                          console.log('✅ Recognition restarted on final attempt');
                        } catch (finalError) {
                          console.error('❌ Final restart attempt failed:', finalError);
                        }
                      }
                    }, 2000);
                  }
                }
              }, 1000);
            }
          }, 100); // Very short delay for better responsiveness
        } else {
          console.log('🛑 Not restarting - listening stopped by user or processing word');
        }
      };
      
      setRecognition(recognitionInstance);
    } else {
      console.log('Speech recognition not supported');
    }
  }, [currentStory]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (wordTimeout) {
        clearTimeout(wordTimeout);
      }
    };
  }, [wordTimeout]);

  // Periodic check to ensure recognition is still running
  useEffect(() => {
    if (isListening && recognition) {
      const checkInterval = setInterval(() => {
        if (isListening && recognition) {
          try {
            // Try to restart if it seems stuck
            recognition.start();
            console.log('🔄 Periodic recognition restart');
          } catch (error) {
            console.log('🔄 Recognition already running (expected)');
          }
        }
      }, 10000); // Check every 10 seconds

      return () => clearInterval(checkInterval);
    }
  }, [isListening, recognition]);

  useEffect(() => {
    // Set the first story as default
    if (teluguStories.length > 0) {
      setCurrentStory(teluguStories[0]);
    }
  }, [teluguStories]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://service-3-backend-production.up.railway.app/api/telugu-stories?milestone=${currentMilestone}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeluguStories(data.stories);
      } else {
        throw new Error('Failed to fetch stories');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load stories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);



  const playAudio = (audioUrl?: string) => {
    if (!audioUrl) {
      toast({
        title: "No Audio Available",
        description: "This story doesn't have audio content yet.",
        variant: "destructive"
      });
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.play();
    setIsPlaying(true);
    
    audio.onended = () => {
      setIsPlaying(false);
    };
  };

  // Add state to track speech attempts
  const [speechAttempts, setSpeechAttempts] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Helper: split long Telugu text into speakable chunks and preserve sentence boundaries when possible
  const splitTextIntoChunks = (fullText: string, maxLength: number = 260): string[] => {
    const chunks: string[] = [];
    let remaining = (fullText || '').trim();
    
    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }
      
      const slice = remaining.substring(0, maxLength);
      // Prefer Telugu danda, then punctuation, then whitespace
      const breakCandidates = [
        slice.lastIndexOf('।'),
        slice.lastIndexOf('.'),
        slice.lastIndexOf('!'),
        slice.lastIndexOf('?'),
        slice.lastIndexOf('\n'),
        slice.lastIndexOf(' ')
      ];
      const breakPos = Math.max(...breakCandidates);
      
      if (breakPos > Math.floor(maxLength * 0.6)) {
        chunks.push(remaining.substring(0, breakPos + 1).trim());
        remaining = remaining.substring(breakPos + 1).trim();
      } else {
        // Hard split if no good breakpoint found
        chunks.push(slice.trim());
        remaining = remaining.substring(slice.length).trim();
      }
    }
    
    return chunks.filter(c => c.length > 0);
  };

  const speakTelugu = (text: string) => {
    console.log('🎤 Speaking Telugu text:', text);
    
    // Prevent multiple simultaneous speech requests
    if (isSpeaking) {
      console.log('⚠️ Already speaking, ignoring request');
      return;
    }
    
    // Check browser support first
    if (!('speechSynthesis' in window)) {
      console.error('❌ Speech synthesis not supported');
      toast({
        title: "Not Supported",
        description: "Speech synthesis is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if voices are available
    const voices = window.speechSynthesis.getVoices();
    console.log('🎤 Available voices:', voices.length);
    
    if (voices.length === 0) {
      console.warn('⚠️ No voices available, trying to load...');
      // Try to trigger voice loading
      window.speechSynthesis.getVoices();
      
      // Wait a bit and try again
      setTimeout(() => {
        const voicesAfterDelay = window.speechSynthesis.getVoices();
        if (voicesAfterDelay.length > 0) {
          console.log('✅ Voices loaded after delay:', voicesAfterDelay.length);
          speakTelugu(text); // Retry
        } else {
          console.error('❌ Still no voices available');
          toast({
            title: "No Voices",
            description: "No speech voices available. Please try again.",
            variant: "destructive"
          });
        }
      }, 1000);
      return;
    }
    
    setIsPlaying(true);
    setIsSpeaking(true);
    
    try {
      // Prepare chunk queue
      const chunks = splitTextIntoChunks(text, 260);
      console.log(`🧩 Prepared ${chunks.length} chunk(s) for speech`);
      
      // Pre-select a voice once
      let selectedVoice = voices.find(v => v.lang === 'te-IN')
        || voices.find(v => v.lang.startsWith('hi'))
        || voices.find(v => v.lang === 'en-IN')
        || voices[0];
      
      // Stop any current speech first
      window.speechSynthesis.cancel();
      
      const speakChunkAt = (index: number) => {
        if (index >= chunks.length) {
          setIsPlaying(false);
          setIsSpeaking(false);
          console.log('✅ Finished speaking all chunks');
          return;
        }
        
        const part = chunks[index];
        const utterance = new SpeechSynthesisUtterance(part);
        
        if (selectedVoice) {
          utterance.voice = selectedVoice as SpeechSynthesisVoice;
          utterance.lang = selectedVoice.lang;
        } else {
          utterance.lang = 'hi-IN';
        }
        
        utterance.rate = 0.7;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
          if (index === 0) {
            console.log('✅ Telugu speech synthesis started');
            setSpeechAttempts(0);
          }
          console.log(`🗣️ Speaking chunk ${index + 1}/${chunks.length} (${part.length} chars)`);
        };
        
        utterance.onend = () => {
          // Queue next chunk
          speakChunkAt(index + 1);
        };
        
        utterance.onerror = (event) => {
          console.error('❌ Speech synthesis error on chunk', index + 1, event);
          const attempts = speechAttempts + 1;
          setSpeechAttempts(attempts);
          if (attempts < 3) {
            setTimeout(() => speakChunkAt(index), 500 * attempts);
          } else {
            setIsPlaying(false);
            setIsSpeaking(false);
            toast({
              title: "Speech Error",
              description: `Could not read the text aloud. Error: ${event.error}`,
              variant: "destructive"
            });
          }
        };
        
        window.speechSynthesis.speak(utterance);
      };
      
      // Start after a short delay to ensure clean state
      setTimeout(() => speakChunkAt(0), 120);
      
    } catch (error) {
      console.error('❌ Error creating speech utterance:', error);
      setIsPlaying(false);
      setIsSpeaking(false);
      toast({
        title: "Speech Error",
        description: "Failed to create speech utterance. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopSpeaking = () => {
    // Use direct approach to stop speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  // Compare pronunciation with expected word
  const comparePronunciation = (spoken: string, expected: string): number => {
    // Normalize both strings for comparison
    const normalizeText = (text: string) => {
      return text.toLowerCase()
        .replace(/[^\u0C00-\u0C7F\w\s]/g, '') // Remove non-Telugu and non-alphanumeric chars
        .trim();
    };
    
    const normalizedSpoken = normalizeText(spoken);
    const normalizedExpected = normalizeText(expected);
    
    console.log('Comparing:', { spoken: normalizedSpoken, expected: normalizedExpected });
    
    // Exact match (highest priority)
    if (normalizedSpoken === normalizedExpected) {
      console.log('✅ Exact match found!');
      return 1.0;
    }
    
    // Check for similar length words first (more accurate)
    const lengthDiff = Math.abs(normalizedSpoken.length - normalizedExpected.length);
    
    // If lengths are very different, be more strict
    if (lengthDiff > 3) {
      // Only allow high similarity for words with significant length difference
      if (normalizedSpoken.includes(normalizedExpected) || normalizedExpected.includes(normalizedSpoken)) {
        // But penalize if one is much longer than the other
        const longerLength = Math.max(normalizedSpoken.length, normalizedExpected.length);
        const shorterLength = Math.min(normalizedSpoken.length, normalizedExpected.length);
        const lengthRatio = shorterLength / longerLength;
        
        // If the shorter word is less than 70% of the longer word, reduce similarity
        if (lengthRatio < 0.7) {
          console.log('⚠️ Length mismatch - low similarity');
          return 0.3; // Low similarity for very different lengths
        }
        console.log('✅ Substring match found (length-constrained)!');
        return 0.8; // Moderate similarity for reasonable length differences
      }
      console.log('❌ No match - length difference too large');
      return 0.0; // No match for very different lengths
    }
    
    // For similar length words, use more lenient matching
    if (normalizedSpoken.includes(normalizedExpected) || normalizedExpected.includes(normalizedSpoken)) {
      console.log('✅ Substring match found!');
      return 0.9;
    }
    
    // Calculate similarity (simple character-based)
    const similarity = calculateSimilarity(normalizedSpoken, normalizedExpected);
    console.log('Similarity score:', similarity);
    
    return similarity;
  };

  // Calculate similarity between two strings
  const calculateSimilarity = (str1: string, str2: string): number => {
    if (str1 === str2) return 1.0;
    if (str1.length === 0) return 0.0;
    if (str2.length === 0) return 0.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    return (longer.length - editDistance(longer, shorter)) / longer.length;
  };

  // Calculate edit distance (Levenshtein distance)
  const editDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Start continuous pronunciation practice for entire paragraph
  const startContinuousPronunciationPractice = () => {
    if (!recognition) {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
      return;
    }
    
    // Reset all pronunciation results and word index
    setPronunciationResults({});
    setCurrentWordIndex(0);
    
    // Extract all words from the current story and paragraphs - preserve Telugu characters better
    const words: string[] = [];
    
    // Add words from main story content
    if (currentStory?.teluguContent) {
      const storyWords = currentStory.teluguContent
        .split(/[\s\n\r]+/) // Split by whitespace, newlines, carriage returns
        .filter(word => word.trim().length > 0)
        .map(word => word.trim())
        .filter(word => word.length > 0 && /[\u0C00-\u0C7F]/.test(word)); // Only keep words with Telugu characters
      words.push(...storyWords);
    }
    
    // Add words from paragraphs
    currentStory?.paragraphs.forEach(paragraph => {
      if (paragraph.teluguContent) {
        const paragraphWords = paragraph.teluguContent
          .split(/[\s\n\r]+/) // Split by whitespace, newlines, carriage returns
          .filter(word => word.trim().length > 0)
          .map(word => word.trim())
          .filter(word => word.length > 0 && /[\u0C00-\u0C7F]/.test(word)); // Only keep words with Telugu characters
        words.push(...paragraphWords);
      }
    });
    
    console.log('🔤 Extracted words:', words);
    
    setAllWords(words);
    setCurrentPracticeWord(words[0] || '');
    
    // Configure recognition for continuous listening
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Start listening
    recognition.start();
    setIsListening(true);
    
    // Set timeout for first word
    if (words.length > 0) {
      const timeout = setTimeout(handleWordTimeout, 5000); // 5 seconds timeout
      setWordTimeout(timeout);
    }
    
    toast({
      title: "Start Reading",
      description: `Begin reading the paragraph aloud. Starting with: "${words[0] || 'No words found'}"`,
    });
  };

  // Handle word timeout - mark current word as incorrect and move to next
  const handleWordTimeout = () => {
    if (currentWordIndex < allWords.length) {
      setPronunciationResults(prev => ({
        ...prev,
        [currentWordIndex]: 'incorrect'
      }));
      
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      
      if (nextIndex < allWords.length) {
        setCurrentPracticeWord(allWords[nextIndex]);
        // Set timeout for next word
        const timeout = setTimeout(handleWordTimeout, 5000); // 5 seconds timeout
        setWordTimeout(timeout);
      } else {
        setCurrentPracticeWord('');
        toast({
          title: "Practice Complete",
          description: "All words have been processed. Some were marked as incorrect due to timeouts.",
        });
      }
    }
  };

  // Reset pronunciation practice
  const resetPronunciationPractice = () => {
    // Clear any existing timeout
    if (wordTimeout) {
      clearTimeout(wordTimeout);
      setWordTimeout(null);
    }
    
    setPronunciationResults({});
    setCurrentPracticeWord('');
    setCurrentWordIndex(0);
    setAllWords([]);
    setIsListening(false);
    setIsProcessingWord(false);
    recognition?.stop();
    
    toast({
      title: "Practice Reset",
      description: "Pronunciation practice has been reset. Click 'Practice Reading' to start again.",
    });
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      toast({
        title: "Reading Resumed",
        description: "You can continue reading the story."
      });
    } else {
      toast({
        title: "Reading Paused",
        description: "You can resume reading when ready."
      });
    }
  };

  const nextStory = () => {
    const currentIndex = teluguStories.findIndex(story => story._id === currentStory?._id);
    if (currentIndex < teluguStories.length - 1) {
      setCurrentStory(teluguStories[currentIndex + 1]);
      setCurrentWordIndex(0);
      setIsPaused(false);
    }
  };

  const previousStory = () => {
    const currentIndex = teluguStories.findIndex(story => story._id === currentStory?._id);
    if (currentIndex > 0) {
      setCurrentStory(teluguStories[currentIndex - 1]);
      setCurrentWordIndex(0);
      setIsPaused(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Learn Tab (Story Banners)
  const renderLearnTab = () => {
    if (loading) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading stories...</p>
          </CardContent>
        </Card>
      );
    }

    if (teluguStories.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Stories Available</h3>
            <p className="text-muted-foreground">
              No Telugu stories have been added for Milestone {currentMilestone} yet.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Story Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teluguStories.map((story) => (
            <div
              key={story._id}
              className="relative group cursor-pointer"
              onClick={() => setCurrentStory(story)}
            >
              {/* Story Banner */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {story.difficulty}
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{story.teluguTitle}</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-100">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Click to Read</span>
                  </div>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors duration-300"></div>
            </div>
          ))}
        </div>

        {/* Selected Story Display */}
        {currentStory && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{currentStory.teluguTitle}</h2>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allContent = [
                      currentStory.teluguContent,
                      ...(currentStory.paragraphs?.map(p => p.teluguContent) || [])
                    ].filter(Boolean).join(' ');
                    speakTelugu(allContent);
                  }}
                  className="flex items-center gap-2 bg-green-50 border-green-200 hover:bg-green-100"
                >
                  <Volume2 className="w-4 h-4" />
                  Read Aloud
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStory(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* Content */}
            <div className="bg-gray-50 p-6 rounded-lg">
              {/* Main content */}
              {currentStory.teluguContent && (
                <p className="text-lg leading-relaxed text-gray-800 mb-6">
                  {currentStory.teluguContent}
                </p>
              )}
              
              {/* Paragraphs */}
              {currentStory.paragraphs && currentStory.paragraphs.length > 0 && (
                <div className="space-y-4">
                  {currentStory.paragraphs.map((paragraph, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-lg leading-relaxed text-gray-800">
                        {paragraph.teluguContent}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Units Tab (For trainers to add lessons with pronunciation practice)
  const renderUnitsTab = () => {
    return <TeluguUnitManager currentMilestone={currentMilestone} isStudentView={true} />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "historical": return "bg-blue-100 text-blue-800";
      case "virtuous": return "bg-green-100 text-green-800";
      case "educational": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Render text with pronunciation highlighting - only highlight current word and completed words
  const renderTextWithPronunciation = (text: string) => {
    const words = text.split(/\s+/);
    
    return words.map((word, index) => {
      const result = pronunciationResults[index];
      let className = 'inline-block px-1 rounded transition-all duration-200';
      
      // Only highlight if this word has been processed AND it's the current word or a completed word
      if (result === 'correct' && index <= currentWordIndex) {
        className += ' bg-green-200 text-green-800 font-semibold';
      } else if (result === 'incorrect' && index <= currentWordIndex) {
        className += ' bg-red-200 text-red-800 font-semibold';
      } else if (index === currentWordIndex && isListening) {
        // Highlight current word being practiced
        className += ' bg-yellow-200 text-yellow-800 font-semibold animate-pulse';
      }
      
      return (
        <span
          key={index}
          className={className}
          title={
            index === currentWordIndex && isListening ? 'Current word to pronounce' :
            result === 'correct' && index <= currentWordIndex ? 'Correctly pronounced! 🎉' : 
            result === 'incorrect' && index <= currentWordIndex ? 'Incorrect pronunciation. Try again!' : 
            'Not yet pronounced'
          }
        >
          {word}
        </span>
      );
    });
  };

  return (
    <div className="space-y-8">
      {/* Clean Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-800">తెలుగు చదవడం</h2>
        <p className="text-xl text-gray-600">
          Learn Telugu through stories and units
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Milestone {currentMilestone}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {teluguStories.length} stories
          </Badge>
        </div>
      </div>

      {/* Tabs for Learn and Units */}
      <Tabs defaultValue="learn" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-primary/10 border border-primary/20">
          <TabsTrigger value="learn" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BookOpen className="w-4 h-4" />
            Learn
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="w-4 h-4" />
            Units
          </TabsTrigger>
        </TabsList>

        {/* Learn Tab */}
        <TabsContent value="learn" className="space-y-6">
          {renderLearnTab()}
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-6">
          {renderUnitsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeluguReading;
