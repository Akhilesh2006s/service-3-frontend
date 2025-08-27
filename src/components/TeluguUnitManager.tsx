import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Volume2, 
  Mic, 
  MicOff,
  BookOpen,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// TypeScript declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface TeluguUnit {
  _id?: string;
  lessonName: string;
  teluguLessonName: string;
  paragraphs: Array<{
    content: string;
    teluguContent: string;
    order: number;
  }>;
  milestone: number;
  createdBy?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TeluguUnitManagerProps {
  currentMilestone: number;
  isStudentView?: boolean;
}

const TeluguUnitManager = ({ currentMilestone, isStudentView = false }: TeluguUnitManagerProps) => {
  const { toast } = useToast();
  const [units, setUnits] = useState<TeluguUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUnit, setEditingUnit] = useState<TeluguUnit | null>(null);
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<TeluguUnit | null>(null);
  const [isListening, setIsListening] = useState(false);

  const [pronunciationResults, setPronunciationResults] = useState<{[key: number]: 'correct' | 'incorrect' | 'pending'}>({});
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [allWords, setAllWords] = useState<string[]>([]);
  const [currentPracticeWord, setCurrentPracticeWord] = useState<string>('');
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  // Removed wordTimeout and isProcessingWord for continuous flow
  const [currentLanguage, setCurrentLanguage] = useState<string>('te-IN');

  // Telugu language codes for speech recognition - optimized for Telugu
  const teluguLanguageCodes = ['te-IN', 'te', 'hi-IN', 'en-IN', 'ta-IN', 'ml-IN'];

  // Form state for new/editing unit
  const [formData, setFormData] = useState({
    lessonName: '',
    teluguLessonName: '',
    paragraphs: [{ content: '', teluguContent: '', order: 0 }]
  });

  useEffect(() => {
    fetchUnits();
  }, [currentMilestone]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [recognitionInstance]);

  // Periodic check to ensure recognition is still running
  useEffect(() => {
    if (isListening && recognitionInstance) {
      const checkInterval = setInterval(() => {
        if (isListening && recognitionInstance) {
          try {
            // Try to restart if it seems stuck
            recognitionInstance.start();
            console.log('🔄 Periodic recognition restart');
          } catch (error) {
            console.log('🔄 Recognition already running (expected)');
          }
        }
      }, 10000); // Check every 10 seconds

      return () => clearInterval(checkInterval);
    }
  }, [isListening, recognitionInstance]);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://service-3-backend-production.up.railway.app/api/telugu-units`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnits(data.units || []);
      } else {
        console.error('Failed to fetch units');
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParagraph = () => {
    setFormData(prev => ({
      ...prev,
      paragraphs: [...prev.paragraphs, { content: '', teluguContent: '', order: prev.paragraphs.length }]
    }));
  };

  const handleRemoveParagraph = (index: number) => {
    setFormData(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.filter((_, i) => i !== index).map((p, i) => ({ ...p, order: i }))
    }));
  };

  const handleParagraphChange = (index: number, field: 'content' | 'teluguContent', value: string) => {
    setFormData(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.lessonName.trim() || !formData.teluguLessonName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both lesson names.",
        variant: "destructive"
      });
      return;
    }

    if (formData.paragraphs.some(p => !p.content.trim() || !p.teluguContent.trim())) {
      toast({
        title: "Validation Error",
        description: "Please fill in all paragraph content.",
        variant: "destructive"
      });
      return;
    }

    try {
      const url = editingUnit 
        ? `https://service-3-backend-production.up.railway.app/api/telugu-units/${editingUnit._id}`
        : 'https://service-3-backend-production.up.railway.app/api/telugu-units';
      
      const method = editingUnit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        },
        body: JSON.stringify({
          ...formData,
          milestone: 1
        })
      });

      if (response.ok) {
        toast({
          title: editingUnit ? "Unit Updated" : "Unit Created",
          description: editingUnit ? "Unit has been updated successfully." : "Unit has been created successfully.",
        });
        
        resetForm();
        fetchUnits();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to save unit.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving unit:', error);
      toast({
        title: "Error",
        description: "Failed to save unit. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;

    try {
      const response = await fetch(`https://service-3-backend-production.up.railway.app/api/telugu-units/${unitId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telugu-basics-token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Unit Deleted",
          description: "Unit has been deleted successfully.",
        });
        fetchUnits();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete unit.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast({
        title: "Error",
        description: "Failed to delete unit. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (unit: TeluguUnit) => {
    setEditingUnit(unit);
    setFormData({
      lessonName: unit.lessonName,
      teluguLessonName: unit.teluguLessonName,
      paragraphs: unit.paragraphs.map(p => ({ ...p }))
    });
    setIsAddingUnit(true);
  };

  const resetForm = () => {
    setFormData({
      lessonName: '',
      teluguLessonName: '',
      paragraphs: [{ content: '', teluguContent: '', order: 0 }]
    });
    setEditingUnit(null);
    setIsAddingUnit(false);
  };

  const speakTelugu = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'te-IN';
      utterance.rate = 0.75;
      utterance.pitch = 1.1;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const startPronunciationPractice = (unit: TeluguUnit) => {
    setCurrentUnit(unit);
    setPronunciationResults({});
    setCurrentWordIndex(0);
    
    // Extract all words from paragraphs - preserve Telugu characters better
    const words: string[] = [];
    unit.paragraphs.forEach(paragraph => {
      const paragraphWords = paragraph.teluguContent
        .split(/[\s\n\r]+/)
        .filter(word => word.trim().length > 0)
        .map(word => word.trim())
        .filter(word => word.length > 0 && /[\u0C00-\u0C7F]/.test(word)); // Only keep words with Telugu characters
      words.push(...paragraphWords);
    });
    
    console.log('🔤 Extracted words:', words);
    setAllWords(words);
    setCurrentPracticeWord(words[0] || '');
    setIsListening(true);
    
    // No initial timeout - let user read naturally
    // System will flow continuously through words
    
    // Initialize speech recognition with enhanced configuration
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      setRecognitionInstance(recognition);
      
      // Enhanced speech recognition settings optimized for fast Telugu reading
      recognition.continuous = true; // Keep it continuous
      recognition.interimResults = true; // Get interim results for better responsiveness
      recognition.maxAlternatives = 15; // More alternatives for fast reading
      
      // More sensitive settings for better word detection
      recognition.grammar = null; // Disable grammar for more flexible recognition
      
      // Use Telugu language codes for better recognition
      recognition.lang = teluguLanguageCodes[0]; // Start with te-IN
      
      // Telugu-specific optimizations
      console.log('🔧 Speech recognition configured for Telugu:', recognition.lang);
      
             recognition.onresult = (event) => {
         let finalTranscript = '';
         let interimTranscript = '';
        let allAlternatives: string[] = [];
         
        // Enhanced result processing optimized for Telugu
         for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            
            // Collect all alternatives for better Telugu matching
            for (let j = 0; j < Math.min(result.length, 10); j++) {
              if (result[j] && result[j].transcript) {
                allAlternatives.push(result[j].transcript);
              }
            }
           } else {
            interimTranscript += result[0].transcript;
           }
         }
         
         // Use final transcript if available, otherwise use interim
         const transcript = finalTranscript || interimTranscript;
        if (!transcript || transcript.trim().length === 0) {
          console.log('❌ No transcript available');
          return;
        }
        
        console.log('🎤 Primary transcript:', transcript);
        console.log('🔄 All alternatives:', allAlternatives);
        console.log('📝 Current word index:', currentWordIndex);
        console.log('📝 Current word:', words[currentWordIndex]);
        console.log('📝 All words:', words);
         
         console.log('🎤 Spoken transcript:', transcript);
         console.log('📍 Current index:', currentWordIndex, 'of', words.length);
         
         // Search for any word in the paragraph that matches what was spoken
         console.log('🔍 Searching for spoken word in paragraph...');
         
         // Allow continuous processing for natural flow
         // No blocking - let user read naturally
         
                 // Search for any word in the paragraph that matches what was spoken
        const allTranscripts = [transcript, ...allAlternatives];
        let foundMatch = false;
        let matchedWordIndex = -1;
        let bestSimilarity = 0;
        let bestTranscript = '';
        
        console.log('🔍 Searching for spoken words in entire paragraph...');
        
        for (const currentTranscript of allTranscripts) {
          if (!currentTranscript) continue;
         
         // Normalize and split transcript - preserve Telugu characters better
          const transcriptWords = currentTranscript
           .split(/[\s\n\r]+/)
           .filter(word => word.trim().length > 0)
           .map(word => word.trim());
         
          console.log(`🔤 Checking transcript: "${currentTranscript}"`);
          console.log(`🔤 Words:`, transcriptWords);
          
          // Check each spoken word against ALL words in the paragraph
         for (const spokenWord of transcriptWords) {
           if (!spokenWord) continue;
           
            console.log(`🔍 Checking spoken word: "${spokenWord}"`);
            
                         // Search through all words in the paragraph, but prioritize current and future words
             for (let i = 0; i < words.length; i++) {
               const paragraphWord = words[i];
               
               // Skip words that are already processed
               if (pronunciationResults[i]) {
                 continue;
               }
               
               // Strong priority for current word, then sequential progression
               let priority = 1.0;
               if (i < currentWordIndex) {
                 priority = 0.0; // No priority for past words
               } else if (i === currentWordIndex) {
                 priority = 1.0; // Highest priority for current word
               } else if (i === currentWordIndex + 1) {
                 priority = 0.8; // Good priority for next word
               } else {
                 priority = 0.5; // Lower priority for words further ahead
               }
              
              console.log(`  Comparing: "${spokenWord}" with paragraph word: "${paragraphWord}" at index: ${i}`);
              
                             // Check for exact match first (highest priority)
               if (spokenWord.toLowerCase() === paragraphWord.toLowerCase()) {
                 console.log('✅ Exact match found at index:', i, 'with priority:', priority);
             foundMatch = true;
                 matchedWordIndex = i;
                 bestSimilarity = 1.0 * priority;
                 bestTranscript = currentTranscript;
             break;
           }
           
               // Check for similar words using improved algorithm optimized for Telugu
               const similarity = comparePronunciation(spokenWord, paragraphWord);
               const adjustedSimilarity = similarity * priority;
               console.log(`  Similarity for "${paragraphWord}" at index ${i}: ${similarity} * ${priority} = ${adjustedSimilarity}`);
               if (similarity > 0.3) { // Very low threshold for fast reading
                 console.log('✅ Similar match found at index:', i, 'with adjusted similarity:', adjustedSimilarity);
                 if (adjustedSimilarity > bestSimilarity) {
                   bestSimilarity = adjustedSimilarity;
                   matchedWordIndex = i;
                   bestTranscript = currentTranscript;
               foundMatch = true;
             }
           }
         }
         
            if (foundMatch) break; // Found a match, no need to check more spoken words
          }
          
          if (foundMatch) break; // Found a match, no need to check more transcripts
        }
         
         // Only check partial matches if no exact or similar match found
         if (!foundMatch) {
           // Use the primary transcript for partial matching
           const primaryTranscriptWords = transcript
             .split(/[\s\n\r]+/)
             .filter(word => word.trim().length > 0)
             .map(word => word.trim());
           
           for (const spokenWord of primaryTranscriptWords) {
             if (!spokenWord) continue;
             
             // Search through all unprocessed words in the paragraph
             for (let i = 0; i < words.length; i++) {
               const paragraphWord = words[i];
               
               // Skip words that are already processed
               if (pronunciationResults[i]) {
                 continue;
               }
               
               // Check for partial matches (more strict - only if lengths are similar)
               const spokenLength = spokenWord.length;
               const paragraphLength = paragraphWord.length;
               const lengthDiff = Math.abs(spokenLength - paragraphLength);
               
               // Only allow partial matches if the length difference is small
               if (lengthDiff <= 2 && (spokenWord.toLowerCase().includes(paragraphWord.toLowerCase()) || 
                   paragraphWord.toLowerCase().includes(spokenWord.toLowerCase()))) {
                 console.log('✅ Partial match found at index:', i);
                 foundMatch = true;
                 matchedWordIndex = i;
                 break;
               }
             }
             
             if (foundMatch) break;
           }
         }
         
         if (!foundMatch) {
           console.log('❌ No match found in paragraph');
         }
         
         if (foundMatch) {
           console.log('✅ Word matched at index:', matchedWordIndex, '!');
           
           // Mark the matched word as correct immediately
               setPronunciationResults(prev => ({
                 ...prev,
             [matchedWordIndex]: 'correct'
           }));
           
           // Only mark skipped words if we're moving forward significantly
           if (matchedWordIndex > currentWordIndex + 1) {
             const skippedWords = [];
             for (let i = currentWordIndex + 1; i < matchedWordIndex; i++) {
               if (!pronunciationResults[i]) {
                 skippedWords.push(i);
               }
             }
             
             if (skippedWords.length > 0) {
               console.log('🎯 Marking skipped words as correct:', skippedWords);
               setPronunciationResults(prev => {
                 const updated = { ...prev };
                 skippedWords.forEach(index => {
                   updated[index] = 'correct';
                 });
                 return updated;
               });
             }
           }
           
           // Move to next word after the matched word
           const nextIndex = matchedWordIndex + 1;
           if (nextIndex < words.length) {
             setCurrentWordIndex(nextIndex);
             setCurrentPracticeWord(words[nextIndex]);
             console.log('Fast move to next word:', words[nextIndex], 'at index:', nextIndex);
           } else {
             // All words completed
             setIsListening(false);
             showFinalReport();
           }
         } else {
           // No match found - move to next word immediately for fast reading
           console.log('❌ No match found, moving to next word...');
           
           // Mark current word as incorrect
                   setPronunciationResults(prev => ({
                     ...prev,
             [currentWordIndex]: 'incorrect'
           }));
           
           // Move to next word immediately
           const nextIndex = currentWordIndex + 1;
                 if (nextIndex < words.length) {
             setCurrentWordIndex(nextIndex);
                   setCurrentPracticeWord(words[nextIndex]);
             console.log('Fast move to next word:', words[nextIndex], 'at index:', nextIndex);
                 } else {
                   // All words completed
                   setIsListening(false);
             showFinalReport();
           }
         }
       };
       
       
      
                   // Enhanced error handling with automatic language switching
      let languageIndex = 0;
      
             recognition.onerror = (event) => {
         console.error('Speech recognition error:', event.error);
         
         // Handle different error types
         switch (event.error) {
           case 'no-speech':
             // No speech detected, restart after a short delay
             setTimeout(() => {
               if (isListening) {
                 try {
                   recognition.start();
                 } catch (error) {
                   console.error('Error restarting after no-speech:', error);
                 }
               }
             }, 500);
             break;
           case 'audio-capture':
             toast({
               title: "Microphone Error",
               description: "Please check your microphone permissions and try again.",
               variant: "destructive"
             });
             break;
           case 'network':
             toast({
               title: "Network Error",
               description: "Please check your internet connection and try again.",
               variant: "destructive"
             });
             break;
          case 'language-not-supported':
            // Try switching to next language
            languageIndex = (languageIndex + 1) % teluguLanguageCodes.length;
            const newLanguage = teluguLanguageCodes[languageIndex];
            recognition.lang = newLanguage;
            setCurrentLanguage(newLanguage);
            console.log(`🔄 Switching to language: ${newLanguage}`);
            
            setTimeout(() => {
              if (isListening) {
                try {
                  recognition.start();
                } catch (error) {
                  console.error('Error restarting after language switch:', error);
                }
              }
            }, 1000);
            break;
           case 'aborted':
             // Recognition was aborted, restart
             setTimeout(() => {
               if (isListening) {
                 try {
                   recognition.start();
                 } catch (error) {
                   console.error('Error restarting after abort:', error);
                 }
               }
             }, 1000);
             break;
           default:
            // For other errors, try to restart with exponential backoff
             setTimeout(() => {
               if (isListening) {
                 try {
                   recognition.start();
                 } catch (error) {
                   console.error('Error restarting after unknown error:', error);
                 }
               }
             }, 1500);
         }
       };
       
                      recognition.onend = () => {
         console.log('🔄 Speech recognition ended - attempting restart...');
         // Only restart if we're still supposed to be listening
         if (isListening) {
           console.log('🔄 Restarting recognition...');
           setTimeout(() => {
             try {
               recognition.start();
               console.log('✅ Recognition restarted successfully');
             } catch (error) {
               console.error('❌ Error restarting recognition:', error);
               // Try again after a longer delay if first attempt fails
               setTimeout(() => {
                 if (isListening) {
                   try {
                     recognition.start();
                     console.log('✅ Recognition restarted on retry');
                   } catch (retryError) {
                     console.error('❌ Error on retry restart:', retryError);
                     // Final attempt
                     setTimeout(() => {
                       if (isListening) {
                         try {
                           recognition.start();
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
           console.log('🛑 Not restarting - listening stopped by user');
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
  
       // Preprocess Telugu words for better recognition
  const preprocessTeluguWord = (word: string): string => {
    return word.toLowerCase()
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/[^\u0C00-\u0C7F\w]/g, '') // Remove non-Telugu and non-alphanumeric chars
      .replace(/[ాీూృౄెేైొోౌూృౄెేైొోౌ]/g, '') // Remove vowel modifiers for base comparison
      .trim();
  };
  
     const comparePronunciation = (spoken: string, expected: string): number => {
    // Enhanced normalization for Telugu characters
     const normalize = (str: string) => str.toLowerCase()
       .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/[^\u0C00-\u0C7F\w]/g, '') // Remove non-Telugu and non-alphanumeric chars
       .trim();
     
     const spokenNorm = normalize(spoken);
     const expectedNorm = normalize(expected);
     
    // Exact match (highest priority)
     if (spokenNorm === expectedNorm) return 1.0;
     
    // Check preprocessed Telugu words (without vowel modifiers)
    const spokenPreprocessed = preprocessTeluguWord(spoken);
    const expectedPreprocessed = preprocessTeluguWord(expected);
    if (spokenPreprocessed === expectedPreprocessed) return 0.95; // High similarity for base word match
    
    // Telugu-specific character mappings for common mispronunciations
    const teluguCharMappings: { [key: string]: string[] } = {
      'క': ['క', 'గ', 'ఖ'],
      'గ': ['గ', 'క', 'ఘ'],
      'చ': ['చ', 'జ', 'ఛ'],
      'జ': ['జ', 'చ', 'ఝ'],
      'ట': ['ట', 'డ', 'ఠ'],
      'డ': ['డ', 'ట', 'ఢ'],
      'త': ['త', 'ద', 'థ'],
      'ద': ['ద', 'త', 'ధ'],
      'ప': ['ప', 'బ', 'ఫ'],
      'బ': ['బ', 'ప', 'భ'],
      'మ': ['మ', 'న'],
      'న': ['న', 'మ'],
      'య': ['య', 'ర'],
      'ర': ['ర', 'య'],
      'ల': ['ల', 'ళ'],
      'ళ': ['ళ', 'ల'],
      'వ': ['వ', 'అ'],
      'శ': ['శ', 'ష'],
      'ష': ['ష', 'శ'],
      'స': ['స', 'శ', 'ష'],
      'హ': ['హ', 'అ'],
      'అ': ['అ', 'ఆ'],
      'ఆ': ['ఆ', 'అ'],
      'ఇ': ['ఇ', 'ఈ'],
      'ఈ': ['ఈ', 'ఇ'],
      'ఉ': ['ఉ', 'ఊ'],
      'ఊ': ['ఊ', 'ఉ'],
      'ఎ': ['ఎ', 'ఏ'],
      'ఏ': ['ఏ', 'ఎ'],
      'ఐ': ['ఐ', 'అ'],
      'ఒ': ['ఒ', 'ఓ'],
      'ఓ': ['ఓ', 'ఒ'],
      'ఔ': ['ఔ', 'అ']
    };
    
    // Check for Telugu character variations
    if (spokenNorm.length === expectedNorm.length) {
      let teluguSimilarity = 0;
      let totalChars = spokenNorm.length;
      
      for (let i = 0; i < totalChars; i++) {
        const spokenChar = spokenNorm[i];
        const expectedChar = expectedNorm[i];
        
        if (spokenChar === expectedChar) {
          teluguSimilarity += 1;
        } else if (teluguCharMappings[expectedChar] && teluguCharMappings[expectedChar].includes(spokenChar)) {
          teluguSimilarity += 0.8; // High similarity for Telugu character variations
        } else if (teluguCharMappings[spokenChar] && teluguCharMappings[spokenChar].includes(expectedChar)) {
          teluguSimilarity += 0.8; // High similarity for Telugu character variations
        }
      }
      
      const teluguCharSimilarity = teluguSimilarity / totalChars;
      if (teluguCharSimilarity > 0.6) { // Lower threshold for better Telugu recognition
        return teluguCharSimilarity;
      }
    }
    
    // Check for similar length words first (more accurate)
    const lengthDiff = Math.abs(spokenNorm.length - expectedNorm.length);
    
    // If lengths are very different, be more lenient for Telugu
    if (lengthDiff > 4) { // Increased tolerance for Telugu
      // Only allow high similarity for words with significant length difference
     if (spokenNorm.includes(expectedNorm) || expectedNorm.includes(spokenNorm)) {
        // But penalize if one is much longer than the other
        const longerLength = Math.max(spokenNorm.length, expectedNorm.length);
        const shorterLength = Math.min(spokenNorm.length, expectedNorm.length);
        const lengthRatio = shorterLength / longerLength;
        
        // If the shorter word is less than 60% of the longer word, reduce similarity
        if (lengthRatio < 0.6) { // More lenient for Telugu
          return 0.4; // Higher similarity for very different lengths
        }
        return 0.8; // Moderate similarity for reasonable length differences
      }
      return 0.0; // No match for very different lengths
    }
    
    // For similar length words, use more lenient matching
    if (spokenNorm.includes(expectedNorm) || expectedNorm.includes(spokenNorm)) {
      return 0.9;
    }
    
    // Check for partial matches at the beginning or end (only for similar lengths)
    if (lengthDiff <= 2) {
     if (spokenNorm.startsWith(expectedNorm) || expectedNorm.startsWith(spokenNorm)) {
       return 0.8;
     }
     
     if (spokenNorm.endsWith(expectedNorm) || expectedNorm.endsWith(spokenNorm)) {
       return 0.8;
      }
     }
     
    // Enhanced character-by-character similarity with Telugu awareness
     let matchingChars = 0;
     const minLength = Math.min(spokenNorm.length, expectedNorm.length);
     const maxLength = Math.max(spokenNorm.length, expectedNorm.length);
     
     for (let i = 0; i < minLength; i++) {
      const spokenChar = spokenNorm[i];
      const expectedChar = expectedNorm[i];
      
      if (spokenChar === expectedChar) {
         matchingChars++;
      } else if (teluguCharMappings[expectedChar] && teluguCharMappings[expectedChar].includes(spokenChar)) {
        matchingChars += 0.8; // Partial match for Telugu character variations
      } else if (teluguCharMappings[spokenChar] && teluguCharMappings[spokenChar].includes(expectedChar)) {
        matchingChars += 0.8; // Partial match for Telugu character variations
       }
     }
     
     const charSimilarity = matchingChars / maxLength;
     
    // Higher tolerance for Telugu pronunciation, but only for similar lengths
    if (lengthDiff <= 3 && charSimilarity > 0.5) { // More lenient for Telugu
       return charSimilarity;
     }
     
     // Check for similar length words with high character similarity
    if (lengthDiff <= 2 && charSimilarity > 0.4) { // More lenient for Telugu
       return charSimilarity + 0.1;
     }
     
     return 0.0;
   };
  
  const levenshteinDistance = (str1: string, str2: string): number => {
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

  const stopPronunciationPractice = () => {
    setIsListening(false);
    setCurrentUnit(null);
    setPronunciationResults({});
    setCurrentWordIndex(0);
    setAllWords([]);
    setCurrentPracticeWord('');
    
    // Stop any active speech recognition
    if (recognitionInstance) {
      recognitionInstance.stop();
      setRecognitionInstance(null);
    }
  };

  const showFinalReport = () => {
    const totalWords = allWords.length;
    const correctWords = Object.values(pronunciationResults).filter(r => r === 'correct').length;
    const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
    
    // Show simple completion message
    toast({
      title: `Reading Completed! 🎉`,
      description: `You have successfully completed the reading practice.`,
      duration: 3000,
    });
    
    console.log('📊 Reading completed:', { totalWords, correctWords, accuracy });
  };

  const resetPronunciationPractice = () => {
    if (!currentUnit) return;
    
    // Stop current recognition
    if (recognitionInstance) {
      recognitionInstance.stop();
      setRecognitionInstance(null);
    }
    
    // Reset all states
    setPronunciationResults({});
    setCurrentWordIndex(0);
    setCurrentPracticeWord(allWords[0] || '');
    
    // Restart practice
    startPronunciationPractice(currentUnit);
  };

  // Render text with pronunciation highlighting - only highlight current word and completed words
  const renderTextWithPronunciation = (text: string) => {
    const words = text.split(/\s+/);
    
    return words.map((word, index) => {
      const result = pronunciationResults[index];
      let className = 'inline-block px-1 rounded transition-all duration-200';
      
      // Highlight words based on pronunciation results
      if (result === 'correct') {
        className += ' bg-green-200 text-green-800 font-semibold';
      } else if (result === 'incorrect') {
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

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading units...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-green-700">Telugu Learning Lessons</h2>
          <p className="text-muted-foreground mt-1">
            Select a lesson to start your pronunciation practice
          </p>
        </div>
                 {!isStudentView && (
          <Button onClick={() => setIsAddingUnit(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
             <Plus className="w-4 h-4" />
            Add Lesson
           </Button>
         )}
      </div>

      {/* Add/Edit Unit Form */}
      {isAddingUnit && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingUnit ? 'Edit Unit' : 'Add New Unit'}
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <XCircle className="w-4 h-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Create a new unit with lesson name and paragraphs for pronunciation practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lessonName">Lesson Name (English)</Label>
                  <Input
                    id="lessonName"
                    value={formData.lessonName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lessonName: e.target.value }))}
                    placeholder="Enter lesson name in English"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teluguLessonName">Lesson Name (Telugu)</Label>
                  <Input
                    id="teluguLessonName"
                    value={formData.teluguLessonName}
                    onChange={(e) => setFormData(prev => ({ ...prev, teluguLessonName: e.target.value }))}
                    placeholder="Enter lesson name in Telugu"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Paragraphs</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddParagraph}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Paragraph
                  </Button>
                </div>
                
                {formData.paragraphs.map((paragraph, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Paragraph {index + 1}</Label>
                      {formData.paragraphs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveParagraph(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Content (English)</Label>
                        <Textarea
                          value={paragraph.content}
                          onChange={(e) => handleParagraphChange(index, 'content', e.target.value)}
                          placeholder="Enter paragraph content in English"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Content (Telugu)</Label>
                        <Textarea
                          value={paragraph.teluguContent}
                          onChange={(e) => handleParagraphChange(index, 'teluguContent', e.target.value)}
                          placeholder="Enter paragraph content in Telugu"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingUnit ? 'Update Unit' : 'Create Unit'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Units List */}
      <div className="space-y-4">
        {units.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Units Available</h3>
              <p className="text-muted-foreground">
                No units have been created yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.map((unit) => (
              <div
                key={unit._id}
                className="relative group cursor-pointer"
                       onClick={() => startPronunciationPractice(unit)}
              >
                {/* Lesson Banner */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6" />
                   </div>
                    <div className="text-right">
                      <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {unit.paragraphs.length} {unit.paragraphs.length === 1 ? 'Paragraph' : 'Paragraphs'}
                </div>
                      </div>
                       </div>
                  
                  <h3 className="text-xl font-bold mb-2">{unit.teluguLessonName}</h3>
                  <p className="text-green-100 text-sm mb-4">{unit.lessonName}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-100">
                      <Mic className="w-4 h-4" />
                      <span className="text-sm">Click to Practice</span>
                    </div>
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors duration-300"></div>
                    </div>
                  ))}
                </div>
        )}
      </div>

      {/* Pronunciation Practice Interface */}
      {isListening && currentUnit && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{currentUnit.teluguLessonName}</h2>
                <p className="text-green-100 text-sm">{currentUnit.lessonName}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm">Listening...</span>
              </div>
            </div>
              </div>
              
          {/* Content */}
          <div className="space-y-6">
            {/* Instructions */}
              <div className="text-center">
              <p className="text-lg font-medium text-gray-700 mb-2">
                Read the paragraph naturally
              </p>
              <p className="text-sm text-gray-500">
                Words will be marked as you pronounce them correctly
              </p>
            </div>
            
            {/* Progress */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Object.values(pronunciationResults).filter(r => r === 'correct').length} / {allWords.length}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${((currentWordIndex + 1) / allWords.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                  Word {currentWordIndex + 1} of {allWords.length}
                </p>
              </div>
              
            {/* Current Word */}
              {currentPracticeWord && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Current word:</p>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-2xl font-bold text-green-700">{currentPracticeWord}</p>
                </div>
                </div>
              )}
              
            {/* Paragraph Display */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Reading Text:</h3>
              <div className="text-lg leading-relaxed">
                {currentUnit.paragraphs.map((paragraph, index) => (
                  <div key={index} className="mb-4">
                    {isListening 
                      ? renderTextWithPronunciation(paragraph.teluguContent)
                      : paragraph.teluguContent
                    }
                </div>
                ))}
                </div>
              </div>
              
            {/* Controls */}
            <div className="flex gap-3 justify-center">
                 <Button
                   variant="outline"
                   onClick={resetPronunciationPractice}
                   className="flex items-center gap-2"
                 >
                   <RotateCcw className="w-4 h-4" />
                Restart
                 </Button>
                 <Button
                   variant="destructive"
                   onClick={stopPronunciationPractice}
                   className="flex items-center gap-2"
                 >
                   <MicOff className="w-4 h-4" />
                   Stop Practice
                 </Button>
               </div>
            </div>
        </div>
      )}


    </div>
  );
};

export default TeluguUnitManager;
