import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { quickAudioTest, testSpeechSynthesisAudio } from '@/utils/audioDetection';
import { speakText } from '@/utils/speechUtils';

interface AudioTestButtonProps {
  text?: string;
  onTestComplete?: (result: { working: boolean; message: string }) => void;
  className?: string;
}

const AudioTestButton: React.FC<AudioTestButtonProps> = ({ 
  text = 'రండి', 
  onTestComplete,
  className = ''
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ working: boolean; message: string } | null>(null);

  const runAudioTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Run quick audio test
      const result = await quickAudioTest();
      setTestResult(result);
      onTestComplete?.(result);
      
      // If basic test passes, try actual speech
      if (result.working) {
        try {
          await speakText(text, {
            onEnd: () => {
              console.log('✅ Audio test completed successfully');
            },
            onError: (error) => {
              console.error('❌ Audio test failed:', error);
              setTestResult({ working: false, message: `Speech error: ${error.error}` });
            }
          });
        } catch (error) {
          console.error('❌ Speech test failed:', error);
          setTestResult({ working: false, message: 'Speech test failed' });
        }
      }
    } catch (error) {
      console.error('❌ Audio test failed:', error);
      setTestResult({ working: false, message: 'Audio test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const getButtonIcon = () => {
    if (isTesting) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (testResult?.working) return <Volume2 className="h-4 w-4 text-green-500" />;
    if (testResult && !testResult.working) return <VolumeX className="h-4 w-4 text-red-500" />;
    return <Volume2 className="h-4 w-4" />;
  };

  const getButtonText = () => {
    if (isTesting) return 'Testing...';
    if (testResult?.working) return 'Audio OK';
    if (testResult && !testResult.working) return 'Audio Issue';
    return 'Test Audio';
  };

  const getButtonVariant = () => {
    if (testResult?.working) return 'default';
    if (testResult && !testResult.working) return 'destructive';
    return 'outline';
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Button
        onClick={runAudioTest}
        disabled={isTesting}
        variant={getButtonVariant()}
        className="flex items-center gap-2"
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>
      
      {testResult && (
        <div className={`text-xs p-2 rounded ${
          testResult.working 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {testResult.message}
        </div>
      )}
    </div>
  );
};

export default AudioTestButton;
