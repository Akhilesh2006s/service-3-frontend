import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { 
  runCompatibilityTest, 
  testTeluguSpeech, 
  provideUserGuidance,
  speakText,
  checkBrowserSupport 
} from '@/utils/speechUtils';

interface DiagnosticResults {
  browser: any;
  support: any;
  voiceTest: boolean;
  teluguTest: boolean;
  recommendations: string[];
}

const VoiceDiagnostics: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [testStatus, setTestStatus] = useState<string>('');

  const runDiagnostics = async () => {
    setIsRunning(true);
    setTestStatus('Running compatibility tests...');
    
    try {
      const testResults = await runCompatibilityTest();
      setResults(testResults);
      setTestStatus('Diagnostics completed');
    } catch (error) {
      console.error('Diagnostics failed:', error);
      setTestStatus('Diagnostics failed');
    } finally {
      setIsRunning(false);
    }
  };

  const testVoicePlayback = async () => {
    setIsTestingVoice(true);
    setTestStatus('Testing voice playback...');
    
    try {
      const success = await testTeluguSpeech('రండి');
      setTestStatus(success ? 'Voice test successful' : 'Voice test failed');
    } catch (error) {
      console.error('Voice test failed:', error);
      setTestStatus('Voice test failed');
    } finally {
      setIsTestingVoice(false);
    }
  };

  const getBrowserIcon = (browserName: string) => {
    switch (browserName.toLowerCase()) {
      case 'chrome': return '🟢';
      case 'firefox': return '🦊';
      case 'safari': return '🧭';
      case 'edge': return '🔷';
      default: return '🌐';
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {label}
      </Badge>
    );
  };

  useEffect(() => {
    // Auto-run diagnostics on component mount
    runDiagnostics();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Voice Reading Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This tool helps diagnose voice reading issues across different browsers. 
            It checks browser compatibility, voice availability, and provides specific solutions.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? '🔄' : '🔍'} Run Diagnostics
            </Button>
            
            <Button 
              onClick={testVoicePlayback} 
              disabled={isTestingVoice || !results}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isTestingVoice ? '🔄' : '🎤'} Test Voice
            </Button>
          </div>

          {testStatus && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{testStatus}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {results && (
        <div className="grid gap-6">
          {/* Browser Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getBrowserIcon(results.browser.name)} Browser Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Browser</label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {results.browser.name} {results.browser.version}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Device Type</label>
                  <p className="text-sm text-muted-foreground">
                    {results.browser.mobile ? 'Mobile' : 'Desktop'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Status */}
          <Card>
            <CardHeader>
              <CardTitle>Browser Support Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Speech Synthesis API</span>
                {getStatusBadge(results.support.speechSynthesis, 
                  results.support.speechSynthesis ? 'Supported' : 'Not Supported')}
              </div>
              
              <div className="flex items-center justify-between">
                <span>Voices Available</span>
                {getStatusBadge(results.voiceTest, 
                  results.voiceTest ? `${results.support.voicesCount} voices` : 'No voices')}
              </div>
              
              <div className="flex items-center justify-between">
                <span>Telugu Speech Test</span>
                {getStatusBadge(results.teluguTest, 
                  results.teluguTest ? 'Working' : 'Failed')}
              </div>
              
              <div className="flex items-center justify-between">
                <span>Secure Context</span>
                {getStatusBadge(results.support.isSecureContext, 
                  results.support.isSecureContext ? 'Yes' : 'No')}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {results.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {results.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Browser-Specific Solutions */}
          <Card>
            <CardHeader>
              <CardTitle>Browser-Specific Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.browser.chrome && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">Chrome Users</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Chrome has excellent voice support. If voices aren't working:
                  </p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Check if autoplay is blocked in browser settings</li>
                    <li>• Try refreshing the page</li>
                    <li>• Install Telugu language pack in Windows/Mac settings</li>
                  </ul>
                </div>
              )}

              {results.browser.firefox && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-800">Firefox Users</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Firefox may need additional configuration for Telugu voices:
                  </p>
                  <ul className="text-sm text-orange-700 mt-2 space-y-1">
                    <li>• Go to about:config and search for "media.webspeech.synth.enabled"</li>
                    <li>• Set it to "true" if it's disabled</li>
                    <li>• Install additional language packs</li>
                    <li>• Try using Chrome for better compatibility</li>
                  </ul>
                </div>
              )}

              {results.browser.safari && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">Safari Users</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Safari has limited voice support. Try these solutions:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Update to the latest Safari version</li>
                    <li>• Check System Preferences > Accessibility > Speech</li>
                    <li>• Try using Chrome or Firefox for better support</li>
                  </ul>
                </div>
              )}

              {results.browser.mobile && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800">Mobile Users</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    Mobile browsers have limited voice support:
                  </p>
                  <ul className="text-sm text-purple-700 mt-2 space-y-1">
                    <li>• Try using a desktop browser for best experience</li>
                    <li>• Ensure you have a stable internet connection</li>
                    <li>• Check if your device has Telugu language support</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Test */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Voice Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Test if voice reading is working with a simple Telugu word:
              </p>
              <Button 
                onClick={() => speakText('రండి', { 
                  onEnd: () => setTestStatus('Voice test completed'),
                  onError: (error) => setTestStatus(`Voice test failed: ${error.error}`)
                })}
                className="w-full"
              >
                🎤 Test Voice: "రండి" (Come)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VoiceDiagnostics;
