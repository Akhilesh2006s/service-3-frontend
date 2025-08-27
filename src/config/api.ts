// API Configuration for Telugu Learning App

export interface APIConfig {
  googleSpeechAPI: {
    enabled: boolean;
    apiKey?: string;
    baseUrl: string;
    rateLimit: number;
    costPerMinute: number;
  };
  email: {
    enabled: boolean;
    service: string;
    user?: string;
    password?: string;
  };
}

// Default configuration
export const defaultAPIConfig: APIConfig = {
  googleSpeechAPI: {
    enabled: false, // Set to true when API key is provided
    apiKey: process.env.VITE_GOOGLE_SPEECH_API_KEY,
    baseUrl: 'https://speech.googleapis.com/v1/speech:recognize',
    rateLimit: 1000, // requests per minute
    costPerMinute: 0.006 // $0.006 per 15 seconds
  },
  email: {
    enabled: false, // Set to true when credentials are provided
    service: 'gmail',
    user: process.env.VITE_EMAIL_USER,
    password: process.env.VITE_EMAIL_PASSWORD
  }
};

// API Usage Information
export const apiUsageInfo = {
  googleSpeechAPI: {
    service: 'Google Speech-to-Text API',
    description: 'Real-time speech recognition for Telugu pronunciation analysis',
    features: [
      'Telugu language support (te-IN)',
      'Word-level confidence scores',
      'Real-time transcription',
      'Custom vocabulary support'
    ],
    pricing: {
      costPerMinute: 0.006,
      freeTier: '60 minutes per month',
      rateLimit: '1000 requests per minute'
    },
    setup: [
      'Create Google Cloud Project',
      'Enable Speech-to-Text API',
      'Create API key with restrictions',
      'Set up billing account'
    ]
  },

};

// Environment variable validation
export function validateAPIConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check Google Speech API
  if (defaultAPIConfig.googleSpeechAPI.enabled && !defaultAPIConfig.googleSpeechAPI.apiKey) {
    errors.push('Google Speech API key is required when enabled');
  }
  

  
  // Check Email
  if (defaultAPIConfig.email.enabled) {
    if (!defaultAPIConfig.email.user) {
      errors.push('Email user is required');
    }
    if (!defaultAPIConfig.email.password) {
      errors.push('Email password is required');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Get current API configuration
export function getCurrentAPIConfig(): APIConfig {
  return {
    ...defaultAPIConfig,
    googleSpeechAPI: {
      ...defaultAPIConfig.googleSpeechAPI,
      enabled: !!defaultAPIConfig.googleSpeechAPI.apiKey
    },
    email: {
      ...defaultAPIConfig.email,
      enabled: !!(defaultAPIConfig.email.user && defaultAPIConfig.email.password)
    }
  };
}

// Calculate estimated monthly costs
export function calculateMonthlyCosts(usage: {
  speechMinutes: number;
}): {
  speechAPI: number;
  total: number;
} {
  const config = getCurrentAPIConfig();
  
  const speechAPI = config.googleSpeechAPI.enabled 
    ? usage.speechMinutes * config.googleSpeechAPI.costPerMinute
    : 0;
    
  return {
    speechAPI,
    total: speechAPI
  };
}

// Development mode helpers
export const isDevelopment = process.env.NODE_ENV === 'development';

export const devConfig = {
  mockSpeechAnalysis: isDevelopment,
  enableLogging: isDevelopment
}; 
