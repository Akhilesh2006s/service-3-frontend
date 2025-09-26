import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Settings,
  Shield,
  Mic,
  Speaker
} from 'lucide-react';
import { 
  runCompatibilityTest, 
  testTeluguSpeech, 
  provideUserGuidance,
  speakText,
  checkBrowserSupport 
} from '@/utils/speechUtils';

interface AudioTroubleshootingProps {
  onClose?: () => void;
}

const AudioTroubleshooting: React.FC<AudioTroubleshootingProps> = ({ onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSecureContext, setIsSecureContext] = useState(false);

  useEffect(() => {
    // Check if we're in a secure context
    setIsSecureContext(window.isSecureContext);
    
    // Auto-run basic diagnostics
    runBasicDiagnostics();
  }, []);

  const runBasicDiagnostics = async () => {
    setIsRunning(true);
    try {
      const results = await runCompatibilityTest();
      setTestResults(results);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const testAudioPlayback = async () => {
    setIsRunning(true);
    try {
      const success = await testTeluguSpeech('రండి');
      if (success) {
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Audio test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const checkBrowserPermissions = async () => {
    try {
      // Check microphone permission
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      console.log('Microphone permission:', micPermission.state);
      
      // Check if we can access audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context state:', audioContext.state);
      
      return {
        microphone: micPermission.state,
        audioContext: audioContext.state
      };
    } catch (error) {
      console.error('Permission check failed:', error);
      return null;
    }
  };

  const getSecurityRecommendations = () => {
    if (!isSecureContext) {
      return {
        title: "Security Context Issue",
        message: "Your application is not running in a secure context (HTTPS). This can cause audio issues.",
        solutions: [
          "Use HTTPS instead of HTTP",
          "For localhost development, use https://localhost:8080",
          "Or use a secure tunnel service like ngrok"
        ]
      };
    }
    return null;
  };

  const getBrowserSpecificSolutions = () => {
    if (!testResults) return [];
    
    const solutions = [];
    
    if (testResults.browser.chrome) {
      solutions.push({
        title: "Chrome Solutions",
        icon: "🟢",
        steps: [
          "Check if autoplay is blocked: Click the speaker icon in the address bar",
          "Go to Settings > Privacy and security > Site Settings > Sound",
          "Ensure 'Allow sites to play sound' is enabled",
          "Try refreshing the page after enabling audio"
        ]
      });
    }
    
    if (testResults.browser.firefox) {
      solutions.push({
        title: "Firefox Solutions", 
        icon: "🦊",
        steps: [
          "Go to about:config and search for 'media.webspeech.synth.enabled'",
          "Set it to 'true' if it's disabled",
          "Check about:preferences#privacy for autoplay settings",
          "Ensure 'Block websites from automatically playing sound' is not blocking your site"
        ]
      });
    }
    
    if (testResults.browser.safari) {
      solutions.push({
        title: "Safari Solutions",
        icon: "🧭", 
        steps: [
          "Go to Safari > Preferences > Websites > Auto-Play",
          "Set your site to 'Allow All Auto-Play'",
          "Check System Preferences > Sound > Output",
          "Ensure your speakers/headphones are working"
        ]
      });
    }
    
    return solutions;
  };

  const securityIssue = getSecurityRecommendations();
  const browserSolutions = getBrowserSpecificSolutions();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Troubleshooting Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This guide will help you resolve audio issues in your Telugu learning application.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={runBasicDiagnostics} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Run Diagnostics
            </Button>
            
            <Button 
              onClick={testAudioPlayback} 
              disabled={isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Test Audio
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Context Warning */}
      {securityIssue && (
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{securityIssue.title}</strong><br />
            {securityIssue.message}
            <ul className="mt-2 list-disc list-inside">
              {securityIssue.solutions.map((solution, index) => (
                <li key={index} className="text-sm">{solution}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span>Speech Synthesis</span>
                <Badge variant={testResults.support.speechSynthesis ? "default" : "destructive"}>
                  {testResults.support.speechSynthesis ? "Supported" : "Not Supported"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Voices Available</span>
                <Badge variant={testResults.voiceTest ? "default" : "destructive"}>
                  {testResults.voiceTest ? `${testResults.support.voicesCount} voices` : "No voices"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Telugu Test</span>
                <Badge variant={testResults.teluguTest ? "default" : "destructive"}>
                  {testResults.teluguTest ? "Working" : "Failed"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Secure Context</span>
                <Badge variant={isSecureContext ? "default" : "destructive"}>
                  {isSecureContext ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Browser-Specific Solutions */}
      {browserSolutions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Browser-Specific Solutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {browserSolutions.map((solution, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 flex items-center gap-2">
                  {solution.icon} {solution.title}
                </h4>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  {solution.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Fixes */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Fixes to Try</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="w-full justify-start"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh the page
            </Button>
            
            <Button 
              onClick={() => {
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }} 
              variant="outline" 
              className="w-full justify-start"
            >
              <VolumeX className="h-4 w-4 mr-2" />
              Stop all audio and retry
            </Button>
            
            <Button 
              onClick={async () => {
                try {
                  await speakText('రండి', {
                    onEnd: () => console.log('Test completed'),
                    onError: (error) => console.error('Test failed:', error)
                  });
                } catch (error) {
                  console.error('Direct test failed:', error);
                }
              }} 
              variant="outline" 
              className="w-full justify-start"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Test with simple Telugu word
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>System Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Modern browser (Chrome 33+, Firefox 49+, Safari 7+, Edge 14+)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>HTTPS connection (required for speech synthesis)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Audio output device (speakers/headphones)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>JavaScript enabled</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default AudioTroubleshooting;
