// Simple speech synthesis utility
let currentUtterance: SpeechSynthesisUtterance | null = null;
let speakingState = false;

// Browser compatibility check
const checkBrowserSupport = () => {
  const support = {
    speechSynthesis: 'speechSynthesis' in window,
    speechSynthesisUtterance: 'SpeechSynthesisUtterance' in window,
    voices: false,
    voicesCount: 0
  };
  
  if (support.speechSynthesis) {
    const voices = window.speechSynthesis.getVoices();
    support.voices = voices.length > 0;
    support.voicesCount = voices.length;
    console.log('🔍 Browser support check:', support);
    console.log('🔍 Available voices:', voices.map(v => `${v.name} (${v.lang})`));
  }
  
  return support;
};

// Initialize speech synthesis
if ('speechSynthesis' in window) {
  // Ensure voices are loaded
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      console.log('✅ Speech synthesis voices loaded');
      checkBrowserSupport();
    };
  } else {
    checkBrowserSupport();
  }
}

export const speakText = (text: string, options?: {
  lang?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
  onError?: (error: any) => void;
}) => {
  console.log('🎤 speakText called with:', { text, options });
  
  if (!('speechSynthesis' in window)) {
    console.warn('❌ Speech synthesis not supported');
    options?.onError?.({ error: 'not-supported' });
    return;
  }

  // Check browser support
  const support = checkBrowserSupport();
  if (!support.voices) {
    console.warn('⚠️ No voices available, trying to load...');
    // Try to trigger voice loading
    window.speechSynthesis.getVoices();
  }

  // Stop any current speech
  if (speakingState && currentUtterance) {
    console.log('🛑 Stopping current speech');
    window.speechSynthesis.cancel();
    speakingState = false;
    currentUtterance = null;
  }

  try {
    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set properties
    utterance.lang = options?.lang || 'te-IN';
    utterance.rate = options?.rate || 0.75;
    utterance.pitch = options?.pitch || 1.0;
    utterance.volume = 1.0;

    // Try to find a Telugu voice
    const voices = window.speechSynthesis.getVoices();
    console.log('🎤 Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    
    // Priority order for Telugu speech - Google Geeta first
    let selectedVoice = null;
    
    // 1. First try to find Google Geeta voice specifically
    selectedVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('geeta') || 
      voice.name.toLowerCase().includes('google geeta') ||
      (voice.lang === 'te-IN' && voice.name.toLowerCase().includes('geeta'))
    );
    
    // 2. If no Google Geeta, try any Telugu voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith('te'));
    }
    
    // 3. If no Telugu voice, try Hindi voice (can speak Telugu)
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.lang.startsWith('hi') || 
        voice.name.toLowerCase().includes('hindi') ||
        voice.name.toLowerCase().includes('हिन्दी')
      );
    }
    
    // 4. If still no voice, use default
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('✅ Using voice for Telugu:', selectedVoice.name, `(${selectedVoice.lang})`);
    } else {
      console.log('⚠️ No suitable voice found, using default');
    }

    // Set up event handlers
    utterance.onstart = () => {
      console.log('✅ Speech synthesis started:', text);
      speakingState = true;
      currentUtterance = utterance;
    };

    utterance.onend = () => {
      console.log('✅ Speech synthesis ended:', text);
      speakingState = false;
      currentUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('❌ Speech synthesis error:', event);
      speakingState = false;
      currentUtterance = null;
      
      // Handle specific errors
      if (event.error === 'interrupted') {
        console.log('🔄 Speech was interrupted, retrying...');
        // Retry once after a short delay
        setTimeout(() => {
          speakText(text, options);
        }, 100);
      } else if (event.error === 'not-allowed' || event.error === 'language-unavailable') {
        // Try fallback with English
        console.log('🔄 Trying fallback with English voice');
        speakText(text, { ...options, lang: 'en-US' });
      } else {
        options?.onError?.(event);
      }
    };

    // Speak immediately
    console.log('🎤 Speaking:', text);
    window.speechSynthesis.speak(utterance);

  } catch (error) {
    console.error('❌ Error creating speech utterance:', error);
    options?.onError?.(error);
  }
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    console.log('🛑 Stopping speech synthesis');
    window.speechSynthesis.cancel();
    speakingState = false;
    currentUtterance = null;
  }
};

export const isSpeaking = () => {
  return speakingState;
};

// Test function for debugging
export const testSpeechSynthesis = () => {
  console.log('🧪 Testing speech synthesis...');
  const support = checkBrowserSupport();
  
  if (!support.speechSynthesis) {
    console.error('❌ Speech synthesis not supported');
    return false;
  }
  
  if (!support.voices) {
    console.warn('⚠️ No voices available');
    return false;
  }
  
  console.log('✅ Speech synthesis should work');
  return true;
};

// Test Telugu speech specifically with Google Geeta
export const testTeluguSpeech = (text: string = 'రండి') => {
  console.log('🧪 Testing Telugu speech with Google Geeta:', text);
  
  const voices = window.speechSynthesis.getVoices();
  const geetaVoice = voices.find(voice => 
    voice.name.toLowerCase().includes('geeta') || 
    voice.name.toLowerCase().includes('google geeta') ||
    (voice.lang === 'te-IN' && voice.name.toLowerCase().includes('geeta'))
  );
  
  if (geetaVoice) {
    console.log('✅ Found Google Geeta voice for Telugu:', geetaVoice.name);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = geetaVoice;
    utterance.lang = 'te-IN'; // Use Telugu language code
    utterance.rate = 0.75;
    utterance.pitch = 1.1;
    
    utterance.onstart = () => console.log('✅ Telugu test started with Google Geeta');
    utterance.onend = () => console.log('✅ Telugu test completed');
    utterance.onerror = (error) => console.error('❌ Telugu test failed:', error);
    
    window.speechSynthesis.speak(utterance);
    return true;
  } else {
    console.log('❌ No Google Geeta voice found for Telugu');
    return false;
  }
};

// Legacy export for compatibility
export const speechManager = {
  speak: speakText,
  stop: stopSpeech,
  isCurrentlySpeaking: isSpeaking,
  getQueueLength: () => 0
};
