# Telugu Learning Application - Speech Dictation & Audio Features Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Speech Synthesis (Text-to-Speech)](#speech-synthesis)
4. [Speech Recognition (Speech-to-Text)](#speech-recognition)
5. [Telugu Dictation Component](#telugu-dictation)
6. [Telugu Reading Component](#telugu-reading)
7. [Progress Tracking System](#progress-tracking)
8. [File Structure](#file-structure)
9. [Technical Implementation](#technical-implementation)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Telugu Learning Application is a comprehensive web-based platform that teaches Telugu language through interactive speech-based exercises. The application leverages modern web APIs for speech synthesis and recognition to provide real-time pronunciation feedback and dictation practice.

### Key Features
- **Speech Synthesis**: Converts Telugu text to speech for pronunciation guidance
- **Speech Recognition**: Captures user speech for pronunciation evaluation
- **Real-time Feedback**: Provides immediate visual feedback (green/red) for correct/incorrect pronunciation
- **Progress Tracking**: Saves user progress across different learning modules
- **Multiple Learning Modes**: Dictation, Reading, Sentence Formation, and Spelling exercises

---

## Architecture

### Frontend Architecture
```
src/
├── components/
│   ├── TeluguDictation.tsx      # Word-by-word dictation practice
│   ├── TeluguReading.tsx        # Story reading with pronunciation
│   ├── TeluguSpelling.tsx       # Audio-based spelling practice
│   ├── TeluguSentenceFormation.tsx # Sentence construction exercises
│   └── TeluguFillBlanks.tsx     # Fill-in-the-blanks exercises
├── utils/
│   └── speechUtils.ts           # Centralized speech utilities
├── contexts/
│   └── AuthContext.tsx          # User authentication
└── pages/
    └── LearnerDashboard.tsx     # Main learning interface
```

### Backend Architecture
```
server/
├── models/
│   ├── LearningProgress.js      # Progress tracking model
│   ├── TeluguStory.js           # Story content model
│   └── User.js                  # User management
├── routes/
│   ├── learning-progress.js     # Progress API endpoints
│   ├── teluguStories.js         # Story management
│   └── auth.js                  # Authentication
└── server.js                    # Main server file
```

---

## Speech Synthesis (Text-to-Speech)

### Overview
Speech synthesis converts Telugu text into spoken audio, enabling users to hear correct pronunciation.

### Implementation Details

#### 1. Browser Compatibility Check
```typescript
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
  }
  
  return support;
};
```

#### 2. Voice Selection Strategy
The application uses a priority-based approach for selecting the best voice for Telugu:

1. **Telugu Voice** (`te-IN`): Primary choice if available
2. **Hindi Voice** (`hi-IN`): Secondary choice (can pronounce Telugu well)
3. **Indian Language Voice**: Fallback for any Indian language voice
4. **English Voice**: Final fallback

```typescript
// Priority order for Telugu speech
let selectedVoice = null;

// 1. First try to find a Telugu voice
selectedVoice = voices.find(voice => voice.lang.startsWith('te'));

// 2. If no Telugu voice, try Hindi voice (can speak Telugu)
if (!selectedVoice) {
  selectedVoice = voices.find(voice => 
    voice.lang.startsWith('hi') || 
    voice.name.toLowerCase().includes('hindi')
  );
}

// 3. If no Hindi voice, try any Indian language voice
if (!selectedVoice) {
  selectedVoice = voices.find(voice => 
    voice.name.toLowerCase().includes('indian')
  );
}
```

#### 3. Speech Configuration
```typescript
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'hi-IN';        // Use Hindi language code for Telugu
utterance.rate = 0.6;            // Slightly slower for better clarity
utterance.pitch = 1.0;           // Normal pitch
utterance.volume = 1.0;          // Full volume
utterance.voice = selectedVoice; // Assign selected voice
```

#### 4. Error Handling & Retry Logic
```typescript
utterance.onerror = (event) => {
  if (event.error === 'interrupted') {
    // Retry once after a short delay
    setTimeout(() => {
      speakText(text, options);
    }, 100);
  } else if (event.error === 'language-unavailable') {
    // Try fallback with English
    speakText(text, { ...options, lang: 'en-US' });
  }
};
```

---

## Speech Recognition (Speech-to-Text)

### Overview
Speech recognition captures user speech and converts it to text for pronunciation evaluation.

### Implementation Details

#### 1. Browser Compatibility
```typescript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
```

#### 2. Recognition Configuration
```typescript
const recognition = new SpeechRecognition();
recognition.continuous = false;           // Single utterance
recognition.interimResults = false;       // Final results only
recognition.lang = 'te-IN';              // Telugu language
recognition.maxAlternatives = 1;          // Single result
```

#### 3. Event Handlers
```typescript
recognition.onstart = () => {
  setIsListening(true);
  console.log('🎤 Speech recognition started');
};

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  setSpokenWord(transcript);
  evaluatePronunciation(transcript, expectedWord);
};

recognition.onerror = (event) => {
  console.error('Speech recognition error:', event.error);
  setIsListening(false);
};
```

---

## Telugu Dictation Component

### Overview
The Telugu Dictation component provides word-by-word pronunciation practice with real-time feedback.

### Key Features

#### 1. Word Categories by Length
```typescript
const TELUGU_WORDS = {
  2: ["అమ", "అప", "అక", "అన", "అత", "అయ", "అవ", "అల", "అర", "అస", ...],
  3: ["అమ్మ", "అప్ప", "అక్క", "అన్న", "అత్త", "అయ్య", "అవ్వ", ...],
  4: ["అమ్మా", "అప్పా", "అక్కా", "అన్నా", "అత్తా", "అయ్యా", ...],
  5: ["అమ్మాయి", "అప్పాయి", "అక్కాయి", "అన్నాయి", ...],
  6: ["అమ్మాయికి", "అప్పాయికి", "అక్కాయికి", "అన్నాయికి", ...]
};
```

#### 2. Pronunciation Evaluation
```typescript
const evaluatePronunciation = (spoken: string, expected: string) => {
  // Normalize both strings
  const normalizedSpoken = spoken.toLowerCase().trim();
  const normalizedExpected = expected.toLowerCase().trim();
  
  // Direct comparison
  if (normalizedSpoken === normalizedExpected) {
    return 'correct';
  }
  
  // Similarity check for lenient evaluation
  const similarity = calculateSimilarity(normalizedSpoken, normalizedExpected);
  return similarity >= 0.7 ? 'correct' : 'incorrect';
};
```

#### 3. Progress Tracking
```typescript
const saveProgress = async (exerciseId: number, score: number, attempts: number = 1) => {
  const response = await fetch('/api/learning-progress/dictation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      exerciseId,
      score,
      attempts,
      timeSpent: Date.now() - wordStartTime
    })
  });
};
```

### User Flow
1. **Word Selection**: User selects word length (2-6 characters)
2. **Audio Playback**: System speaks the word using speech synthesis
3. **Speech Input**: User speaks the word into microphone
4. **Evaluation**: System compares spoken word with expected word
5. **Feedback**: Visual feedback (green/red) and score update
6. **Progression**: Move to next word or retry current word

---

## Telugu Reading Component

### Overview
The Telugu Reading component provides story reading practice with continuous pronunciation evaluation.

### Key Features

#### 1. Story Display
```typescript
interface TeluguStory {
  title: string;
  teluguTitle: string;
  content: string;
  teluguContent: string;
  paragraphs: Array<{
    content: string;
    teluguContent: string;
    order: number;
    hasAudio: boolean;
  }>;
}
```

#### 2. Word-by-Word Processing
```typescript
const processWords = (text: string) => {
  // Split text into words while preserving Telugu script
  const words = text.split(/\s+/).filter(word => word.length > 0);
  setAllWords(words);
  setCurrentWordIndex(0);
};
```

#### 3. Smart Word Matching
```typescript
const findMatchingWord = (spokenText: string, currentIndex: number) => {
  const normalizedSpoken = spokenText.toLowerCase().trim();
  
  // Check current word and nearby words
  for (let i = Math.max(0, currentIndex - 2); i <= Math.min(allWords.length - 1, currentIndex + 2); i++) {
    const word = allWords[i].toLowerCase().trim();
    if (normalizedSpoken.includes(word) || word.includes(normalizedSpoken)) {
      return i;
    }
  }
  
  return -1;
};
```

#### 4. Continuous Reading Mode
- **Sequential Progression**: Words are processed in order
- **Smart Skipping**: Allows 2-3 word skips for natural reading flow
- **Real-time Feedback**: Immediate visual feedback for each word
- **Progress Tracking**: Saves reading progress and completion status

---

## Progress Tracking System

### Database Schema

#### LearningProgress Model
```javascript
const learningProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Dictation Progress
  dictation: {
    currentExerciseIndex: Number,
    completedExercises: [{
      exerciseId: Number,
      score: Number,
      attempts: Number,
      completedAt: Date
    }],
    totalScore: Number,
    totalAttempts: Number,
    lastAccessed: Date
  },
  
  // Similar structure for sentenceFormation and spelling
});
```

### API Endpoints

#### 1. Save Progress
```javascript
POST /api/learning-progress/dictation
{
  "exerciseId": 1,
  "score": 100,
  "attempts": 1,
  "timeSpent": 5000
}
```

#### 2. Load Progress
```javascript
GET /api/learning-progress
// Returns complete progress summary for user
```

#### 3. Analytics
```javascript
GET /api/learning-progress/analytics
// Returns detailed analytics and performance metrics
```

### Progress Methods
```javascript
// Update dictation progress
learningProgressSchema.methods.updateDictationProgress = function(exerciseId, score, attempts = 1) {
  // Find existing exercise or create new one
  const existingIndex = this.dictation.completedExercises.findIndex(
    ex => ex.exerciseId === exerciseId
  );
  
  if (existingIndex >= 0) {
    // Update existing exercise with better score
    this.dictation.completedExercises[existingIndex].score = Math.max(
      this.dictation.completedExercises[existingIndex].score,
      score
    );
  } else {
    // Add new completed exercise
    this.dictation.completedExercises.push({
      exerciseId,
      score,
      attempts,
      completedAt: new Date()
    });
  }
  
  // Update totals and statistics
  this.updateOverallStats();
};
```

---

## File Structure

### Frontend Files
```
src/
├── components/
│   ├── TeluguDictation.tsx          # 775 lines - Dictation practice
│   ├── TeluguReading.tsx            # 1133 lines - Story reading
│   ├── TeluguSpelling.tsx           # Audio-based spelling
│   ├── TeluguSentenceFormation.tsx  # Sentence construction
│   ├── TeluguFillBlanks.tsx         # Fill-in-the-blanks
│   └── TeluguUnitManager.tsx        # Unit management
├── utils/
│   └── speechUtils.ts               # 234 lines - Speech utilities
├── contexts/
│   └── AuthContext.tsx              # Authentication context
└── pages/
    └── LearnerDashboard.tsx         # Main dashboard
```

### Backend Files
```
server/
├── models/
│   ├── LearningProgress.js          # 347 lines - Progress tracking
│   ├── TeluguStory.js               # Story content model
│   ├── User.js                      # User management
│   └── Exam.js                      # Assessment model
├── routes/
│   ├── learning-progress.js         # Progress API
│   ├── teluguStories.js             # Story management
│   ├── auth.js                      # Authentication
│   └── students.js                  # Student management
└── server.js                        # Main server
```

---

## Technical Implementation

### Speech Synthesis Flow
1. **Text Input**: Component calls `speakText(text, options)`
2. **Voice Selection**: System finds best available voice for Telugu
3. **Utterance Creation**: Creates `SpeechSynthesisUtterance` with configuration
4. **Error Handling**: Implements retry logic and fallback options
5. **Audio Playback**: Browser speaks the text using selected voice

### Speech Recognition Flow
1. **Initialization**: Creates `SpeechRecognition` instance with Telugu language
2. **Event Setup**: Configures `onstart`, `onresult`, `onerror` handlers
3. **Audio Capture**: Starts listening for user speech
4. **Text Processing**: Converts speech to text transcript
5. **Evaluation**: Compares transcript with expected word/text
6. **Feedback**: Provides visual and audio feedback

### Progress Tracking Flow
1. **Exercise Completion**: Component calls progress API
2. **Data Validation**: Backend validates exercise data
3. **Database Update**: Updates user's progress record
4. **Statistics Calculation**: Recalculates overall statistics
5. **Response**: Returns updated progress to frontend

### Error Handling Strategy
1. **Browser Compatibility**: Checks for speech API support
2. **Voice Availability**: Handles missing voices gracefully
3. **Network Issues**: Implements retry logic for API calls
4. **User Permissions**: Handles microphone access denial
5. **Speech Recognition Errors**: Provides fallback options

---

## Troubleshooting

### Common Issues

#### 1. Speech Synthesis Not Working
**Symptoms**: No audio playback
**Solutions**:
- Check browser support: `'speechSynthesis' in window`
- Verify voice availability: `window.speechSynthesis.getVoices()`
- Try different language codes: `'hi-IN'` for Telugu
- Check browser permissions and settings

#### 2. Speech Recognition Not Working
**Symptoms**: Microphone not responding
**Solutions**:
- Check microphone permissions
- Verify HTTPS connection (required for microphone access)
- Test with different browsers (Chrome recommended)
- Check browser console for errors

#### 3. Progress Not Saving
**Symptoms**: Progress lost after page refresh
**Solutions**:
- Verify user authentication
- Check API endpoint availability
- Validate request format and data
- Check database connection

#### 4. Voice Quality Issues
**Symptoms**: Poor pronunciation or robotic voice
**Solutions**:
- Try different voice selection strategies
- Adjust speech rate and pitch settings
- Use Hindi voice for better Telugu pronunciation
- Consider text preprocessing for better results

### Debug Tools

#### 1. Browser Console Logging
```typescript
console.log('🎤 Available voices:', voices.map(v => `${v.name} (${v.lang})`));
console.log('✅ Speech synthesis started:', text);
console.error('❌ Speech synthesis error:', event);
```

#### 2. Test Functions
```typescript
// Test speech synthesis
export const testSpeechSynthesis = () => {
  const support = checkBrowserSupport();
  return support.speechSynthesis && support.voices;
};

// Test Telugu speech specifically
export const testTeluguSpeech = (text: string = 'రండి') => {
  const voices = window.speechSynthesis.getVoices();
  const hindiVoice = voices.find(voice => voice.lang.startsWith('hi'));
  // ... implementation
};
```

#### 3. Network Debugging
```javascript
// Check API responses
fetch('/api/learning-progress')
  .then(response => response.json())
  .then(data => console.log('Progress data:', data))
  .catch(error => console.error('API error:', error));
```

---

## Performance Optimization

### 1. Voice Caching
```typescript
// Cache voices to avoid repeated API calls
let cachedVoices: SpeechSynthesisVoice[] = [];

const getVoices = () => {
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
};
```

### 2. Speech Queue Management
```typescript
// Prevent multiple simultaneous speech requests
let isSpeaking = false;

const speakText = (text: string) => {
  if (isSpeaking) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = true;
  // ... speech implementation
};
```

### 3. Progress Batching
```typescript
// Batch progress updates to reduce API calls
let pendingProgress: any[] = [];

const saveProgress = (data: any) => {
  pendingProgress.push(data);
  
  if (pendingProgress.length >= 5) {
    // Send batch update
    sendBatchProgress(pendingProgress);
    pendingProgress = [];
  }
};
```

---

## Future Enhancements

### 1. Advanced Speech Recognition
- Implement continuous speech recognition
- Add support for sentence-level evaluation
- Improve accuracy with machine learning models

### 2. Enhanced Progress Analytics
- Add detailed performance metrics
- Implement learning path recommendations
- Create progress visualization dashboards

### 3. Offline Support
- Implement service workers for offline functionality
- Cache speech synthesis for common words
- Add offline progress tracking

### 4. Accessibility Features
- Add keyboard navigation support
- Implement screen reader compatibility
- Add visual indicators for audio states

---

## Conclusion

The Telugu Learning Application provides a comprehensive speech-based learning experience through modern web technologies. The combination of speech synthesis and recognition creates an interactive environment where users can practice Telugu pronunciation with real-time feedback.

The modular architecture allows for easy extension and maintenance, while the robust error handling ensures a smooth user experience across different browsers and devices. The progress tracking system provides valuable insights into learning patterns and helps users maintain their learning momentum.

By leveraging the Web Speech API and implementing thoughtful fallback strategies, the application delivers a reliable and engaging learning experience for Telugu language acquisition.

