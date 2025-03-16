import React, { useEffect, useState, useRef } from 'react';
import { apiRequest } from '../lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';

export function VideoIntro() {
  // Always show video on initial load
  const [showVideo, setShowVideo] = useState<boolean>(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Attempt to play the video automatically when the component mounts
  useEffect(() => {
    if (!videoRef.current) return;
    
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
              setAutoplayBlocked(false);
              
              // Update the server that we've shown the intro
              try {
                apiRequest('POST', '/api/user/preferences/intro-video', {
                  shown: true
                });
              } catch (error) {
                console.error('Error updating intro video status:', error);
              }
            })
            .catch(error => {
              console.error('Autoplay was prevented:', error);
              setAutoplayBlocked(true); // Set autoplay blocked state
              setVideoLoaded(true); // Still consider the video as loaded
            });
        }
      } catch (error) {
        console.error('Error playing video:', error);
        setVideoError(true);
      }
    };
    
    playVideo();
    
    // Clean up event listeners
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);
  
  // Handle manual play
  const handleManualPlay = () => {
    if (!videoRef.current) return;
    
    // User has interacted with the page, so we can try to play the video again
    videoRef.current.play()
      .then(() => {
        setAutoplayBlocked(false);
      })
      .catch((error) => {
        console.error('Manual play failed:', error);
        setVideoError(true);
      });
  };
  
  // Handle video end event
  useEffect(() => {
    // Set a timeout to hide the video after it's done playing
    const videoElement = videoRef.current;
    
    const handleVideoEnd = () => {
      // Add a small delay before closing to let any final frame stay visible
      setTimeout(() => setShowVideo(false), 300);
    };
    
    if (videoElement) {
      videoElement.addEventListener('ended', handleVideoEnd);
      
      // Fallback in case video doesn't play or there's an error
      const timeout = setTimeout(() => {
        // Only auto-close if video isn't playing properly and autoplay isn't just blocked
        if ((videoError || !videoLoaded) && !autoplayBlocked) {
          setShowVideo(false);
        }
      }, 10000); // Longer timeout to allow for the video to fully play
      
      return () => {
        videoElement.removeEventListener('ended', handleVideoEnd);
        clearTimeout(timeout);
      };
    }
  }, [videoLoaded, videoError, autoplayBlocked]);
  
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
            onClick={() => setShowVideo(false)}
            className="absolute top-4 right-4 text-white opacity-70 hover:opacity-100 text-sm px-3 py-1 rounded-full border border-white/30 hover:bg-white/10 transition-all z-10"
          >
            Skip
          </button>
          
          {/* Video element with multiple sources for better compatibility */}
          <video 
            ref={videoRef}
            className="max-w-full max-h-full object-contain w-full h-full"
            autoPlay 
            muted
            playsInline
            onError={() => setVideoError(true)}
            onLoadedData={() => setVideoLoaded(true)}
            controls={false}
          >
            <source src="/videos/intro.mp4" type="video/mp4" />
            {/* Fallback message */}
            Your browser does not support the video tag.
          </video>
          
          {/* Play button overlay when autoplay is blocked */}
          {autoplayBlocked && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer"
              onClick={handleManualPlay}
            >
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="40" 
                    height="40" 
                    viewBox="0 0 24 24" 
                    fill="white" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
                <p className="text-white font-medium text-lg">Tap to play intro</p>
              </motion.div>
            </motion.div>
          )}
          
          {/* Error message if video fails to load */}
          {videoError && (
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
                  onClick={() => setShowVideo(false)}
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