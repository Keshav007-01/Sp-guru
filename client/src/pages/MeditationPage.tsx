import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, PlayCircle, PauseCircle, VolumeX, Volume2, Clock } from "lucide-react";
import useSoundGenerator from "@/hooks/use-sound-generator";

// Sound options
const MEDITATION_SOUNDS = [
  { id: "om-chant", name: "Om Chanting", audioUrl: "/audio/om-chant-meditation.mp3", type: "chant" },
  { id: "relaxing-flute", name: "Relaxing Flute", audioUrl: "/audio/relaxing-flute.mp3", type: "instrument" },
  { id: "hare-krishna", name: "Hare Krishna", audioUrl: "/audio/hare-krishna.mp3", type: "chant" },
];

// Visualization options
const VISUALIZATIONS = [
  { id: "om-symbol", name: "Om Symbol", imageUrl: "/images/om-symbol.svg", type: "svg" },
  { id: "mandala", name: "Rotating Mandala", imageUrl: "/images/mandala.svg", type: "svg" },
  { id: "hanuman", name: "Meditating Hanuman", imageUrl: "/attached_assets/km007._Hanuman_meditating_in_a_serene_forest_clearing_his_eyes__c2f3a626-c39e-48b8-85c9-f2c849aab6c4.png", type: "image" },
  { id: "deity", name: "Divine Deities", imageUrl: "/attached_assets/km007._Lord_Vishnu_reclining_on_the_coils_of_the_celestial_serp_2db1fb22-2a58-472f-aa16-3c84169ecc43.png", type: "image" },
];

const MeditationPage = () => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const startButtonRef = useRef<HTMLDivElement | null>(null);
  const { generateOmSound } = useSoundGenerator();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [selectedSound, setSelectedSound] = useState<string>("om-chant");
  const [selectedVisualization, setSelectedVisualization] = useState<string>("om-symbol");
  const [meditationDuration, setMeditationDuration] = useState<number>(10); // minutes
  const [volume, setVolume] = useState<number>(70);
  const [isMeditating, setIsMeditating] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  // Sound setup
  useEffect(() => {
    if (audioRef.current) {
      if (selectedSound) {
        const sound = MEDITATION_SOUNDS.find(s => s.id === selectedSound);
        if (sound) {
          audioRef.current.src = sound.audioUrl;
          audioRef.current.loop = true;
          audioRef.current.volume = volume / 100;
          
          if (isMeditating) {
            audioRef.current.play().catch(error => {
              console.error("Audio playback error:", error);
              toast({
                title: "Audio Playback Error",
                description: "There was an issue playing the meditation sound.",
                variant: "destructive",
              });
            });
          }
        }
      }
    }
  }, [selectedSound, isMeditating, volume, toast]);
  
  // Video visualization setup
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Visualization setup
  useEffect(() => {
    if (isMeditating) {
      // We'll always use the video visualization now
      if (videoRef.current) {
        videoRef.current.style.display = 'block';
        videoRef.current.volume = volume / 100;
        
        // Play the video on loop
        videoRef.current.play().catch(error => {
          console.error("Video playback error:", error);
          toast({
            title: "Video Playback Error",
            description: "There was an issue playing the meditation visualization.",
            variant: "destructive",
          });
        });
      }
    } else {
      // Hide video when not meditating
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.style.display = 'none';
      }
    }
  }, [isMeditating, volume, toast]);
  
  // Timer setup
  useEffect(() => {
    if (isMeditating) {
      setTimeRemaining(meditationDuration * 60); // convert to seconds
      
      const countdownTimer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            endMeditation();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      timerRef.current = countdownTimer;
      
      // Setup haptic feedback at regular intervals
      setupHapticFeedback();
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
      };
    }
  }, [isMeditating, meditationDuration]);
  
  // Removed scroll event handler - button is now permanently fixed at the bottom
  
  // Setup haptic feedback patterns
  const setupHapticFeedback = () => {
    // Trigger vibration every 5 minutes
    const hapticInterval = setInterval(() => {
      if (navigator.vibrate) {
        // Gentle pulse pattern
        navigator.vibrate([100, 50, 100]);
      }
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
    
    hapticIntervalRef.current = hapticInterval;
  };
  
  // Format time to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start meditation
  const startMeditation = () => {
    if (meditationDuration <= 0) {
      toast({
        title: "Invalid Duration",
        description: "Please select a meditation duration greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    setIsMeditating(true);
    
    toast({
      title: "Meditation Started",
      description: `${meditationDuration} minute meditation with ${MEDITATION_SOUNDS.find(s => s.id === selectedSound)?.name}.`,
    });
    
    // Initial haptic feedback to indicate start
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  };
  
  // End meditation
  const endMeditation = () => {
    setIsMeditating(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Stop video visualization
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.style.display = 'none';
    }
    
    // Clean up other visualizations for backward compatibility
    if (svgContainerRef.current) {
      svgContainerRef.current.innerHTML = '';
    }
    
    if (imageRef.current) {
      imageRef.current.style.display = 'none';
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
    }
    
    // Exit fullscreen if active
    if (isFullscreen && document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
      setIsFullscreen(false);
    }
    
    // Final haptic feedback to indicate completion
    if (navigator.vibrate) {
      navigator.vibrate([100, 100, 100, 100, 100]); // Completion pattern
    }
    
    toast({
      title: "Meditation Complete",
      description: "Your meditation session has ended. Namaste 🙏",
    });
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const meditationElem = document.getElementById('meditation-container');
      if (meditationElem?.requestFullscreen) {
        meditationElem.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(err => {
          console.error("Error attempting to enable fullscreen:", err);
        });
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error("Error attempting to exit fullscreen:", err);
      });
    }
  };
  
  // Display all sounds (no filtering since we only have three options)
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-amber-50/60 backdrop-blur-sm rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-divine-saffron mb-2">Sacred Meditation</h1>
        <p className="text-gray-600">Find inner peace with guided meditation and ambient sounds</p>
      </div>
      
      {/* Meditation button (always visible at the bottom) */}
      {!isMeditating && (
        <div 
          id="meditation-start-button"
          className="fixed bottom-0 left-0 right-0 p-4 z-50"
          style={{ 
            boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.2)",
            background: "rgba(255, 255, 255, 0.9)"
          }}
        >
          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 h-12 text-base font-semibold shadow-lg rounded-lg border-2 border-white"
            onClick={startMeditation}
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Start Meditation
          </Button>
        </div>
      )}
      
      {isMeditating ? (
        // Meditation in progress view
        <div 
          id="meditation-container"
          className="relative bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
          style={{ minHeight: '70vh' }}
        >
          {/* Visualization */}
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            {/* Video Visualization */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              src="/videos/cosmic_om_meditation.mp4"
              loop
              muted
              playsInline
              style={{ display: 'none' }}
            />
            
            {/* Legacy containers kept for backward compatibility */}
            <div ref={svgContainerRef} className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }} />
            <img 
              ref={imageRef}
              className="absolute inset-0 w-full h-full object-contain opacity-90 p-8"
              alt="Meditation visualization"
              style={{ display: 'none' }}
            />
            
            {/* Timer at top */}
            <div className="absolute top-0 left-0 right-0 flex justify-center z-20 pt-4">
              <div className="bg-amber-600/90 backdrop-blur-md px-8 py-4 rounded-xl shadow-lg">
                <h2 className="text-5xl font-bold text-white text-center">
                  {formatTime(timeRemaining)}
                </h2>
                <p className="text-lg text-center text-white mt-1">
                  {MEDITATION_SOUNDS.find(s => s.id === selectedSound)?.name}
                </p>
              </div>
            </div>
            
            {/* Controls at bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center z-20 pb-8">
              <div className="flex gap-4">
                <Button 
                  onClick={endMeditation}
                  className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl shadow-lg text-lg font-semibold flex items-center"
                >
                  <PauseCircle className="mr-2 h-6 w-6" />
                  End Meditation
                </Button>
                
                <Button
                  onClick={toggleFullscreen}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl shadow-lg text-lg font-semibold flex items-center"
                >
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Audio (hidden) */}
          <audio ref={audioRef} className="hidden" />
        </div>
      ) : (
        // Meditation setup view
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Meditation Sound Selection */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center">
                  <Volume2 className="mr-2 h-5 w-5 text-divine-blue" />
                  Choose Your Sound
                </div>
              </CardTitle>
              <CardDescription>
                Select the ambient sound to accompany your meditation
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MEDITATION_SOUNDS.map((sound) => (
                  <div 
                    key={sound.id}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedSound === sound.id 
                        ? 'bg-amber-50 border-divine-saffron' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => setSelectedSound(sound.id)}
                  >
                    <h3 className="font-medium text-divine-blue">{sound.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{sound.type}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="volume">Volume</Label>
                  <div className="flex items-center">
                    {volume === 0 ? (
                      <VolumeX className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-divine-blue" />
                    )}
                    <span className="text-sm ml-2">{volume}%</span>
                  </div>
                </div>
                <Slider
                  id="volume"
                  min={0}
                  max={100}
                  step={1}
                  value={[volume]}
                  onValueChange={(v) => setVolume(v[0])}
                  aria-label="Volume"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Meditation Settings */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-divine-blue" />
                  Meditation Settings
                </div>
              </CardTitle>
              <CardDescription>
                Customize your meditation duration and visualization
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="mb-6">
                <Label htmlFor="duration" className="mb-2 block">Duration (minutes)</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[5, 10, 15, 20, 30, 45].map((mins) => (
                    <Button
                      key={mins}
                      type="button"
                      variant={meditationDuration === mins ? "default" : "outline"}
                      className={meditationDuration === mins ? "bg-divine-blue" : ""}
                      onClick={() => setMeditationDuration(mins)}
                    >
                      {mins} min
                    </Button>
                  ))}
                </div>
                
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-gray-500 mr-3">Custom:</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={meditationDuration}
                    onChange={(e) => setMeditationDuration(Number(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <span className="text-sm text-gray-500 ml-2">minutes</span>
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Visualization</Label>
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-divine-saffron">
                  <div className="flex items-center mb-2">
                    <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center mr-3">
                      <PlayCircle className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-medium text-divine-blue text-lg">Cosmic Om Meditation</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    A beautiful cosmic visualization with the sacred Om symbol that enhances your meditation experience. 
                    The visualization plays in a continuous loop, helping maintain focus throughout your session.
                  </p>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t pt-6">
              <div className="text-center text-lg text-amber-600 font-semibold">
                ↓ Look for the orange START MEDITATION button at the bottom to begin ↓
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
      
      {/* Guide Card */}
      <Card className="shadow-md mt-6">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-divine-blue" />
              Meditation Guide
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-amber-50/60 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-divine-blue mb-2">Posture</h3>
              <p className="text-sm text-gray-600">
                Sit comfortably with your spine straight. You can sit cross-legged on the floor, 
                in a chair with your feet flat on the ground, or in any position where your spine 
                can remain upright without strain.
              </p>
            </div>
            
            <div className="bg-amber-50/60 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-divine-blue mb-2">Breathing</h3>
              <p className="text-sm text-gray-600">
                Close your eyes and breathe naturally. Notice the rhythm of your breath 
                without trying to control it. Feel the sensation of the breath entering and 
                leaving your body.
              </p>
            </div>
            
            <div className="bg-amber-50/60 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-divine-blue mb-2">Focus</h3>
              <p className="text-sm text-gray-600">
                If your mind wanders, gently bring your attention back to your breath or the sound. 
                Don't judge yourself for getting distracted – simply notice it and return to your 
                meditation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Extra space at bottom for mobile so the sticky button doesn't overlap content */}
      {!isMeditating && <div className="h-24 sm:h-0" />}
    </div>
  );
};

export default MeditationPage;