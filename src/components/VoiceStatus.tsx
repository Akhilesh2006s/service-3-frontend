import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { checkGoogleGeetaVoice, speakText } from '@/utils/speechUtils';

const VoiceStatus: React.FC = () => {
  const [geetaStatus, setGeetaStatus] = useState<{ available: boolean; voice: SpeechSynthesisVoice | null; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    // Check for Google Geeta voice on component mount
    const checkVoices = () => {
      const status = checkGoogleGeetaVoice();
      setGeetaStatus(status);
      console.log('🎤 Voice status check:', status.message);
    };

    checkVoices();

    // Re-check when voices change
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = checkVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const testVoice = async () => {
    setIsTesting(true);
    setTestResult('Testing voice...');
    
    try {
      await speakText('రండి', {
        onEnd: () => {
          setTestResult('✅ Voice test completed successfully');
          setIsTesting(false);
        },
        onError: (error) => {
          setTestResult(`❌ Voice test failed: ${error.error}`);
          setIsTesting(false);
        }
      });
    } catch (error) {
      setTestResult(`❌ Voice test failed: ${error}`);
      setIsTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (!geetaStatus) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (geetaStatus.available) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-orange-500" />;
  };

  const getStatusBadge = () => {
    if (!geetaStatus) return <Badge variant="secondary">Checking...</Badge>;
    if (geetaStatus.available) return <Badge variant="default">Google Geeta Available</Badge>;
    return <Badge variant="outline">Using Alternative Voice</Badge>;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Voice Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Google Geeta Voice</span>
            {getStatusBadge()}
          </div>
          
          {geetaStatus && (
            <div className="text-sm text-muted-foreground">
              {geetaStatus.message}
            </div>
          )}
          
          {geetaStatus?.voice && (
            <div className="text-xs bg-green-50 p-2 rounded">
              <strong>Selected Voice:</strong> {geetaStatus.voice.name}<br />
              <strong>Language:</strong> {geetaStatus.voice.lang}<br />
              <strong>Type:</strong> {geetaStatus.voice.localService ? 'Local' : 'Remote'}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button 
            onClick={testVoice} 
            disabled={isTesting}
            className="w-full"
            variant="outline"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            {isTesting ? 'Testing...' : 'Test Voice'}
          </Button>
          
          {testResult && (
            <div className={`text-xs p-2 rounded ${
              testResult.includes('✅') 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {testResult}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <strong>Voice Priority:</strong><br />
          1. Google Geeta (preferred)<br />
          2. Telugu voices<br />
          3. Hindi voices<br />
          4. Other Indian voices<br />
          5. Any available voice
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceStatus;
