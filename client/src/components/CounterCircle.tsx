import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CounterCircleProps {
  onComplete: () => void;
  audioRef?: React.RefObject<HTMLAudioElement>;
  isAutoModeExternal?: boolean;
  onAutoModeChange?: (isAuto: boolean) => void;
  deityImage?: string;
  deitySvgIcon?: string;
  deityName?: string;
}

const CounterCircle = ({ 
  onComplete, 
  audioRef, 
  isAutoModeExternal, 
  onAutoModeChange,
  deityImage,
  deitySvgIcon,
  deityName
}: CounterCircleProps) => {
  const [count, setCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [beads, setBeads] = useState<JSX.Element[]>([]);
  const [localIsAutoMode, setLocalIsAutoMode] = useState(true); // Set default to auto mode
  const totalCount = 108;
  const containerRef = useRef<HTMLDivElement>(null);
  const autoModeInitialized = useRef(false);
  
  // Use either external or local auto mode state
  const isAutoMode = isAutoModeExternal !== undefined ? isAutoModeExternal : localIsAutoMode;
  
  // Handle auto mode changes
  const handleAutoModeChange = (newValue: boolean) => {
    if (onAutoModeChange) {
      onAutoModeChange(newValue);
    } else {
      setLocalIsAutoMode(newValue);
    }
  };

  const generateBeads = () => {
    const beadElements: JSX.Element[] = [];
    const containerSize = containerRef.current ? 
      Math.min(containerRef.current.offsetWidth, containerRef.current.offsetHeight) : 
      (window.innerWidth < 640 ? 220 : 280);
    
    const radius = containerSize / 2 - 10;
    const centerX = containerSize / 2;
    const centerY = containerSize / 2;

    for (let i = 0; i < totalCount; i++) {
      const angle = (i / totalCount) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      beadElements.push(
        <div
          key={i}
          className={`counter-bead absolute w-3 h-3 rounded-full ${
            i < count ? "bg-saffron active" : "bg-gray-300"
          }`}
          style={{
            left: `${x}px`,
            top: `${y}px`,
            transition: "all 0.3s ease",
            zIndex: 5,
            boxShadow: i < count ? '0 0 5px rgba(255,214,102,0.7)' : '0 0 3px rgba(0,0,0,0.2)',
            border: i < count ? '1px solid rgba(255,214,102,0.9)' : '1px solid rgba(180,180,180,0.5)'
          }}
        />
      );
    }
    return beadElements;
  };

  useEffect(() => {
    const handleResize = () => {
      setBeads(generateBeads());
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [count]);

  // Debug log
  useEffect(() => {
    console.log("CounterCircle state:", { 
      isAutoMode, 
      isStarted, 
      hasAudioRef: !!audioRef?.current,
      count
    });
  }, [isAutoMode, isStarted, audioRef, count]);

  // Auto-play audio when in auto mode and started
  useEffect(() => {
    if (!audioRef?.current) return;
    
    if (isStarted && isAutoMode && count < totalCount) {
      console.log("Auto-playing audio");
      audioRef.current.play().catch(err => {
        console.error("Error auto-playing audio:", err);
      });
    }
  }, [isStarted, isAutoMode, audioRef, count, totalCount]);

  // Set up audio tracking for auto mode using timeupdate
  useEffect(() => {
    if (!audioRef?.current || !isAutoMode || !isStarted) return;
    
    console.log("Setting up audio timeupdate tracker");
    
    const audio = audioRef.current;
    let lastTime = 0;
    
    const handleTimeUpdate = () => {
      // If we've looped back to the beginning (current time is less than last time)
      if (audio.currentTime < lastTime) {
        console.log("Audio loop detected, current time:", audio.currentTime, "last time:", lastTime);
        // Only increment if we haven't reached the total count
        if (count < totalCount) {
          console.log("Incrementing counter from", count, "to", count + 1);
          setCount(prevCount => prevCount + 1);
        }
      }
      lastTime = audio.currentTime;
    };

    // Set up the timeupdate event listener
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      console.log("Cleaning up audio timeupdate listener");
      // Clean up the event listener
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [audioRef, isAutoMode, isStarted, count, totalCount]);
  
  // Check if count has reached 108, stop audio, and trigger completion
  useEffect(() => {
    if (count >= totalCount) {
      // Stop the audio if we have an audio reference
      if (audioRef?.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Trigger the completion callback
      onComplete();
    }
  }, [count, onComplete, totalCount, audioRef]);

  const startChanting = () => {
    setIsStarted(true);
  };

  const incrementCounter = () => {
    if (count < totalCount) {
      setCount((prevCount) => {
        const newCount = prevCount + 1;
        return newCount;
      });
    }
  };

  const resetCounter = () => {
    setCount(0);
    setIsStarted(false);
    
    // Stop and reset the audio if we have an audio reference
    if (audioRef?.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      console.log("Audio stopped and reset on counter reset");
    }
  };

  const progressPercent = (count / totalCount) * 100;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-poppins font-semibold text-lg text-calmGray">
          108 Repetitions Counter
        </h3>
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-2">
            <Label htmlFor="counter-mode" className="text-sm text-gray-600">
              {isAutoMode ? "Auto" : "Manual"}
            </Label>
            <Switch
              id="counter-mode"
              checked={isAutoMode}
              onCheckedChange={handleAutoModeChange}
              className="data-[state=checked]:bg-divine-blue"
            />
          </div>
          {isAutoMode && (
            <p className="text-xs text-gray-500 mt-1 italic">
              Counter will increase with audio completion
            </p>
          )}
        </div>
      </div>

      <div className="text-center mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-5xl font-bold text-saffron"
          >
            {count}
          </motion.div>
        </AnimatePresence>
        <p className="text-gray-600">out of 108 repetitions</p>
      </div>

      <div 
        ref={containerRef} 
        className="counter-circle mb-6 relative mx-auto"
        style={{ 
          width: window.innerWidth < 640 ? "220px" : "280px", 
          height: window.innerWidth < 640 ? "220px" : "280px" 
        }}
      >
        {/* Deity image inside the circle */}
        {deityImage && (
          <div 
            className="absolute inset-0 flex items-center justify-center" 
            style={{
              zIndex: 0,
              padding: '25px' // Padding to keep image within the beads
            }}
          >
            <div 
              className="w-full h-full rounded-full overflow-hidden"
              style={{
                backgroundImage: `url('${deityImage}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.9,
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,214,102,0.3)'
              }}
            />
          </div>
        )}
        {beads}
      </div>

      <div className="flex justify-center space-x-4">
        {!isStarted ? (
          <Button
            onClick={startChanting}
            className="bg-divine-blue hover:bg-divine-blue/90 text-white px-6 py-3 rounded-lg flex items-center transition duration-300"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start Chanting
          </Button>
        ) : (
          <Button
            onClick={incrementCounter}
            disabled={count >= totalCount || isAutoMode}
            className={`px-6 py-3 rounded-lg flex items-center transition duration-300 ${
              count === totalCount
                ? "bg-success hover:bg-success/90 text-white"
                : "bg-divine-blue hover:bg-divine-blue/90 text-white"
            }`}
          >
            {count === totalCount ? (
              <>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Completed
              </>
            ) : (
              <>
                {isAutoMode ? (
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                )}
                {isAutoMode ? "Auto Counting" : "Counter"}
              </>
            )}
          </Button>
        )}
        <Button
          onClick={resetCounter}
          variant="outline"
          className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-6 py-3 rounded-lg flex items-center transition duration-300"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reset
        </Button>
      </div>

      <div className="mt-6">
        <Progress value={progressPercent} className="h-2.5" />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default CounterCircle;
