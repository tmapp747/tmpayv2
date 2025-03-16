import React, { useEffect, useState, useRef } from 'react';
import { apiRequest } from '../lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';

export function VideoIntro() {
  // Always show video on initial load
  const [showVideo, setShowVideo] = useState<boolean>(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [useGif, setUseGif] = useState(true); // Start with GIF for guaranteed autoplay
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const gifRef = useRef<HTMLImageElement>(null);
  
  // Close the intro after playback
  const handleClose = () => {
    // Add a small delay before closing to let any final frame stay visible
    setTimeout(() => setShowVideo(false), 300);
    
    // Update the server that we've shown the intro
    try {
      apiRequest('POST', '/api/user/preferences/intro-video', {
        shown: true
      });
    } catch (error) {
      console.error('Error updating intro video status:', error);
    }
  };
  
  // Handle GIF timing (simulate video end event)
  useEffect(() => {
    if (!useGif) return;
    
    // GIF plays for about 6 seconds, then we auto-close
    const timeout = setTimeout(() => {
      handleClose();
    }, 6500); // Slightly longer than the GIF to ensure it completes
    
    return () => {
      clearTimeout(timeout);
    };
  }, [useGif]);
  
  // Try to play the video if we're not using the GIF
  useEffect(() => {
    if (useGif || !videoRef.current) return;
    
    // Force immediate play attempt
    const playVideo = async () => {
      try {
        // Pre-load the video
        videoRef.current!.load();
        
        // Force play
        const playPromise = videoRef.current!.play();
        
        // Handle play promise
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Video autoplay started successfully');
              setVideoLoaded(true);
            })
            .catch(error => {
              console.error('Autoplay was prevented:', error);
              // If video fails to play, switch back to GIF
              setUseGif(true);
            });
        }
      } catch (error) {
        console.error('Error playing video:', error);
        setVideoError(true);
        // If video errors, switch back to GIF
        setUseGif(true);
      }
    };
    
    playVideo();
    
    // Clean up event listeners
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [useGif]);
  
  // Handle video end event
  useEffect(() => {
    if (useGif) return; // Only for video element
    
    // Set a timeout to hide the video after it's done playing
    const videoElement = videoRef.current;
    
    if (videoElement) {
      videoElement.addEventListener('ended', handleClose);
      
      // Fallback in case video doesn't play or there's an error
      const timeout = setTimeout(() => {
        // If video hasn't ended after reasonable time, just close it
        if (videoElement.currentTime < videoElement.duration - 0.5) {
          handleClose();
        }
      }, 12000); // Max time to wait for video
      
      return () => {
        videoElement.removeEventListener('ended', handleClose);
        clearTimeout(timeout);
      };
    }
  }, [videoLoaded, videoError, useGif]);
  
  return (
    <AnimatePresence>
      {showVideo && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          style={{ touchAction: 'none' }}
        >
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-white opacity-70 hover:opacity-100 text-sm px-3 py-1 rounded-full border border-white/30 hover:bg-white/10 transition-all z-10"
          >
            Skip
          </button>
          
          {/* GIF animation (guaranteed to autoplay) */}
          {useGif && (
            <div className="w-full h-full flex items-center justify-center">
              <img 
                ref={gifRef}
                src="/videos/intro-small.gif" 
                alt="Loading animation"
                className="max-w-full max-h-full object-contain" 
                onError={() => setVideoError(true)}
              />
            </div>
          )}
          
          {/* Video element as fallback */}
          {!useGif && (
            <video 
              ref={videoRef}
              className="max-w-full max-h-full object-contain w-full h-full"
              autoPlay 
              muted
              playsInline
              preload="auto"
              onError={() => setVideoError(true)}
              onLoadedData={() => setVideoLoaded(true)}
              controls={false}
              poster="/videos/intro-small.gif" // Use GIF as poster image while video loads
            >
              {/* Multiple formats for compatibility */}
              <source src="/videos/intro-mobile.mp4" type="video/mp4" />
              <source src="/videos/intro-autoplay.mp4" type="video/mp4" />
              {/* Fallback message */}
              Your browser does not support the video tag.
            </video>
          )}
          
          {/* Error message if both video and GIF fail to load */}
          {videoError && !useGif && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center p-6 max-w-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3 className="text-white text-lg font-medium mb-2">Video playback error</h3>
                <p className="text-white/80 mb-4">We couldn't play the intro video. You can continue to the app.</p>
                <button 
                  onClick={handleClose}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Continue to App
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VideoIntro;