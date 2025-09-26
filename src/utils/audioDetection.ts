// Audio detection utilities for troubleshooting speech synthesis issues
export interface AudioDetectionResult {
  hasAudio: boolean;
  issues: string[];
  recommendations: string[];
  browserInfo: {
    name: string;
    version: string;
    isSecureContext: boolean;
    supportsAudioContext: boolean;
    supportsSpeechSynthesis: boolean;
  };
}

// Detect if audio is actually playing
export const detectAudioPlayback = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Create a test audio context to detect audio capability
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        // Audio context is suspended, try to resume it
        audioContext.resume().then(() => {
          resolve(audioContext.state === 'running');
        }).catch(() => {
          resolve(false);
        });
      } else {
        resolve(audioContext.state === 'running');
      }
    } catch (error) {
      console.error('Audio context creation failed:', error);
      resolve(false);
    }
  });
};

// Test if speech synthesis is actually producing audio
export const testSpeechSynthesisAudio = (text: string = 'రండి'): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve(false);
      return;
    }

    let audioDetected = false;
    const startTime = Date.now();
    
    // Create a test utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1.0;
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    
    // Set up event handlers
    utterance.onstart = () => {
      console.log('🎤 Test speech synthesis started');
      audioDetected = true;
    };
    
    utterance.onend = () => {
      console.log('🎤 Test speech synthesis ended');
      resolve(audioDetected);
    };
    
    utterance.onerror = (error) => {
      console.error('🎤 Test speech synthesis error:', error);
      resolve(false);
    };
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!audioDetected) {
        console.log('🎤 Test speech synthesis timeout');
        resolve(false);
      }
    }, 5000);
    
    // Start the test
    window.speechSynthesis.speak(utterance);
  });
};

// Comprehensive audio detection
export const detectAudioIssues = async (): Promise<AudioDetectionResult> => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Browser detection
  const userAgent = navigator.userAgent;
  const browserName = getBrowserName(userAgent);
  const browserVersion = getBrowserVersion(userAgent);
  
  const browserInfo = {
    name: browserName,
    version: browserVersion,
    isSecureContext: window.isSecureContext,
    supportsAudioContext: !!(window.AudioContext || (window as any).webkitAudioContext),
    supportsSpeechSynthesis: 'speechSynthesis' in window
  };
  
  // Check security context
  if (!browserInfo.isSecureContext) {
    issues.push('Not running in secure context (HTTPS required)');
    recommendations.push('Use HTTPS or localhost with secure context');
  }
  
  // Check speech synthesis support
  if (!browserInfo.supportsSpeechSynthesis) {
    issues.push('Speech synthesis not supported');
    recommendations.push('Use a modern browser like Chrome, Firefox, Safari, or Edge');
  }
  
  // Check audio context support
  if (!browserInfo.supportsAudioContext) {
    issues.push('Audio context not supported');
    recommendations.push('Update your browser or try a different browser');
  }
  
  // Test audio context
  const audioContextWorking = await detectAudioPlayback();
  if (!audioContextWorking) {
    issues.push('Audio context not working');
    recommendations.push('Check browser audio permissions and system volume');
  }
  
  // Test speech synthesis
  const speechWorking = await testSpeechSynthesisAudio();
  if (!speechWorking) {
    issues.push('Speech synthesis not producing audio');
    recommendations.push('Check system audio settings and browser permissions');
  }
  
  // Browser-specific recommendations
  if (browserName === 'firefox') {
    recommendations.push('Check about:config for media.webspeech.synth.enabled');
  } else if (browserName === 'safari') {
    recommendations.push('Check Safari > Preferences > Websites > Auto-Play');
  } else if (browserName === 'chrome') {
    recommendations.push('Check chrome://settings/content/sound and chrome://settings/content/autoplay');
  }
  
  return {
    hasAudio: audioContextWorking && speechWorking,
    issues,
    recommendations,
    browserInfo
  };
};

// Get browser name from user agent
const getBrowserName = (userAgent: string): string => {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) return 'chrome';
  if (userAgent.includes('Firefox')) return 'firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
  if (userAgent.includes('Edge')) return 'edge';
  return 'unknown';
};

// Get browser version from user agent
const getBrowserVersion = (userAgent: string): string => {
  const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+\.\d+)/);
  return match ? match[2] : 'unknown';
};

// Quick audio test for immediate feedback
export const quickAudioTest = async (): Promise<{ working: boolean; message: string }> => {
  try {
    // Test 1: Check basic support
    if (!('speechSynthesis' in window)) {
      return { working: false, message: 'Speech synthesis not supported' };
    }
    
    // Test 2: Check secure context
    if (!window.isSecureContext) {
      return { working: false, message: 'Not in secure context (HTTPS required)' };
    }
    
    // Test 3: Check voices
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      return { working: false, message: 'No voices available' };
    }
    
    // Test 4: Quick speech test
    const speechWorking = await testSpeechSynthesisAudio('Hello');
    if (!speechWorking) {
      return { working: false, message: 'Speech synthesis not producing audio' };
    }
    
    return { working: true, message: 'Audio is working correctly' };
  } catch (error) {
    return { working: false, message: `Audio test failed: ${error}` };
  }
};
