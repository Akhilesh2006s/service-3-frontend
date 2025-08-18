import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Maximize, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getYouTubeVideoInfo, isYouTubeUrl } from '@/utils/youtubeUtils';

interface YouTubePlayerProps {
  videoUrl: string;
  title?: string;
  description?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
  showControls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoUrl,
  title,
  description,
  onPlay,
  onPause,
  onEnded,
  className = '',
  showControls = true,
  autoplay = false,
  muted = false,
  loop = false
}) => {
  const [videoInfo, setVideoInfo] = useState(getYouTubeVideoInfo(videoUrl));
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (videoUrl) {
      const info = getYouTubeVideoInfo(videoUrl);
      setVideoInfo(info);
      setShowFallback(!info.isValid);
    }
  }, [videoUrl]);

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handlePause = () => {
    setIsPlaying(false);
    onPause?.();
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  const openInYouTube = () => {
    if (videoInfo.videoId) {
      window.open(`https://www.youtube.com/watch?v=${videoInfo.videoId}`, '_blank');
    }
  };

  const toggleFullscreen = () => {
    const iframe = document.querySelector('.youtube-iframe') as HTMLIFrameElement;
    if (iframe) {
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      } else if ((iframe as any).webkitRequestFullscreen) {
        (iframe as any).webkitRequestFullscreen();
      } else if ((iframe as any).msRequestFullscreen) {
        (iframe as any).msRequestFullscreen();
      }
    }
  };

  if (!videoUrl) {
    return (
      <Card className={`border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 ${className}`}>
        <CardContent className="p-6">
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg flex items-center justify-center border-2 border-dashed border-primary/30">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Video Available</h3>
              <p className="text-muted-foreground">Please provide a valid video URL</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showFallback || !isYouTubeUrl(videoUrl)) {
    return (
      <Card className={`border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            {title || 'Video Player'}
          </CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg flex items-center justify-center border-2 border-dashed border-primary/30">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Invalid Video URL</h3>
              <p className="text-muted-foreground mb-4">
                Please provide a valid YouTube URL
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={openInYouTube}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in YouTube
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const embedUrl = `${videoInfo.embedUrl}?autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}&rel=0&modestbranding=1&showinfo=0`;

  return (
    <Card className={`border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5" />
          {title || 'YouTube Video'}
        </CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            <iframe
              className="youtube-iframe w-full h-full"
              src={embedUrl}
              title={title || 'YouTube video player'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => {
                // YouTube iframe doesn't provide play/pause events directly
                // We'll use a different approach for tracking state
              }}
            />
          </div>
          
          {showControls && (
            <div className="flex gap-2">
              <Button 
                onClick={handlePlay}
                className="flex items-center gap-2"
                disabled={isPlaying}
              >
                <Play className="w-4 h-4" />
                Play
              </Button>
              <Button 
                onClick={handlePause}
                className="flex items-center gap-2"
                disabled={!isPlaying}
                variant="outline"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
              <Button 
                onClick={toggleFullscreen}
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Maximize className="w-4 h-4" />
                Fullscreen
              </Button>
              <Button 
                onClick={openInYouTube}
                variant="outline" 
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in YouTube
              </Button>
            </div>
          )}
          
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Video Information:</h4>
            <p className="text-sm text-muted-foreground">
              Video ID: {videoInfo.videoId}
            </p>
            {description && (
              <p className="text-sm text-muted-foreground mt-2">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default YouTubePlayer;

