import React, { useEffect, useState, useRef } from 'react';

export function VideoIntro() {
  const [showVideo, setShowVideo] = useState<boolean>(() => {
    // Check if the intro has already been shown today
    const lastShownDate = localStorage.getItem('introVideoLastShown');
    const today = new Date().toDateString();
    
    if (lastShownDate === today) {
      return false; // Don't show if already shown today
    }
    
    // Update the last shown date
    localStorage.setItem('introVideoLastShown', today);
    return true;
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (!showVideo) return;
    
    // Set a timeout to hide the video after it's done playing
    const videoElement = videoRef.current;
    
    const handleVideoEnd = () => {
      setShowVideo(false);
    };
    
    if (videoElement) {
      videoElement.addEventListener('ended', handleVideoEnd);
      
      // Fallback in case video doesn't play or there's an error
      const timeout = setTimeout(() => {
        setShowVideo(false);
      }, 7000); // Set a reasonable timeout
      
      return () => {
        videoElement.removeEventListener('ended', handleVideoEnd);
        clearTimeout(timeout);
      };
    }
  }, [showVideo]);
  
  if (!showVideo) return null;
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <button 
        onClick={() => setShowVideo(false)}
        className="absolute top-4 right-4 text-white opacity-70 hover:opacity-100 text-sm px-3 py-1 rounded-full border border-white/30 hover:bg-white/10 transition-all z-10"
      >
        Skip
      </button>
      <video 
        ref={videoRef}
        className="max-w-full max-h-full"
        autoPlay 
        muted 
        playsInline
        src="/videos/intro.mp4"
      />
    </div>
  );
}

export default VideoIntro;