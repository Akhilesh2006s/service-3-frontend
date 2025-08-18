/**
 * YouTube URL utilities for converting various YouTube URL formats to embed URLs
 */

export interface YouTubeVideoInfo {
  videoId: string;
  embedUrl: string;
  thumbnailUrl: string;
  isValid: boolean;
}

/**
 * Extract video ID from various YouTube URL formats
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;

  // Regular YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Convert any YouTube URL to embed URL
 */
export const convertToYouTubeEmbedUrl = (url: string): string => {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }
  
  return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Get YouTube video info including embed URL and thumbnail
 */
export const getYouTubeVideoInfo = (url: string): YouTubeVideoInfo => {
  const videoId = extractYouTubeVideoId(url);
  
  if (!videoId) {
    return {
      videoId: '',
      embedUrl: '',
      thumbnailUrl: '',
      isValid: false
    };
  }

  return {
    videoId,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    isValid: true
  };
};

/**
 * Check if a URL is a valid YouTube URL
 */
export const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  
  const youtubeDomains = [
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'www.youtu.be'
  ];
  
  try {
    const urlObj = new URL(url);
    return youtubeDomains.some(domain => urlObj.hostname === domain);
  } catch {
    return false;
  }
};

/**
 * Generate different thumbnail sizes for YouTube videos
 */
export const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'maxres'): string => {
  const qualities = {
    default: 'default.jpg',
    medium: 'mqdefault.jpg',
    high: 'hqdefault.jpg',
    maxres: 'maxresdefault.jpg'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualities[quality]}`;
};

