import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Volume2, AlertTriangle, X, Settings } from 'lucide-react';
import { detectAudioIssues, speakText } from '@/utils/speechUtils';

interface AudioIssueAlertProps {
  onShowTroubleshooting?: () => void;
}

const AudioIssueAlert: React.FC<AudioIssueAlertProps> = ({ onShowTroubleshooting }) => {
  const [audioIssues, setAudioIssues] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Check for audio issues on component mount
    const checkAudioIssues = () => {
      const issues = detectAudioIssues();
      setAudioIssues(issues);
      setIsVisible(issues.hasIssues);
    };

    checkAudioIssues();

    // Re-check periodically
    const interval = setInterval(checkAudioIssues, 5000);
    return () => clearInterval(interval);
  }, []);

  const testAudio = async () => {
    setIsTesting(true);
    try {
      await speakText('రండి', {
        onEnd: () => {
          setIsTesting(false);
          // If audio works, hide the alert
          setIsVisible(false);
        },
        onError: (error) => {
          setIsTesting(false);
          console.error('Audio test failed:', error);
        }
      });
    } catch (error) {
      setIsTesting(false);
      console.error('Audio test failed:', error);
    }
  };

  if (!isVisible || !audioIssues) {
    return null;
  }

  const getPrimaryIssue = () => {
    if (!audioIssues.issues.length) return null;
    
    // Find the highest severity issue
    const highSeverity = audioIssues.issues.find((issue: any) => issue.severity === 'high');
    if (highSeverity) return highSeverity;
    
    return audioIssues.issues[0];
  };

  const primaryIssue = getPrimaryIssue();

  return (
    <Alert className="border-orange-200 bg-orange-50 mb-4">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <strong>Audio Issue Detected</strong>
            {primaryIssue && (
              <p className="text-sm mt-1">
                {primaryIssue.message}
              </p>
            )}
            <p className="text-sm mt-1">
              Audio may not be working. Please check your system volume and browser permissions.
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={testAudio}
              disabled={isTesting}
              className="text-orange-700 border-orange-300 hover:bg-orange-100"
            >
              <Volume2 className="h-3 w-3 mr-1" />
              {isTesting ? 'Testing...' : 'Test Audio'}
            </Button>
            
            {onShowTroubleshooting && (
              <Button
                size="sm"
                variant="outline"
                onClick={onShowTroubleshooting}
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
              >
                <Settings className="h-3 w-3 mr-1" />
                Fix
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="text-orange-600 hover:bg-orange-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default AudioIssueAlert;
