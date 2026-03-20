import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import useSoundGenerator from "@/hooks/use-sound-generator";
import CounterCircle from "@/components/CounterCircle";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Deity, Mantra } from "@/lib/types";
import { BannerAd, RectangleAd } from "@/components/AdBanner";

interface ChantData {
  deity: Deity;
  mantra: Mantra;
}

interface ChantingPageProps {
  params?: {
    deityId: string;
    mantraId: string;
  };
}

// Helper function to get the correct image path for each deity
const getDeityImagePath = (deityId: string): string => {
  const imagePaths: Record<string, string> = {
    'shiva': '/images/lord-shiva.png',
    'ganesha': '/images/lord-ganesh.png',
    'krishna': '/images/lord-krishna.png',
    'vishnu': '/images/lord-vishnu.png',
    'hanuman': '/images/lord-hanuman.png',
    'lakshmi': '/images/goddess-lakshmi.png',
    'saraswati': '/images/goddess-saraswati.png',
    'durga': '/images/goddess-durga.png'
  };
  
  return imagePaths[deityId] || `/images/${deityId}.png`;
};

const ChantingPage = ({ params: routeParams }: ChantingPageProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true); // Set default to auto mode
  const { toast } = useToast();
  
  // Use route params first (for direct navigation), fall back to useRoute (for refresh/direct URL)
  const [, urlParams] = useRoute("/chant/:deityId/:mantraId");
  const deityId = routeParams?.deityId || urlParams?.deityId;
  const mantraId = routeParams?.mantraId || urlParams?.mantraId;
  const [, setLocation] = useLocation();
  const { generateOmSound, generateBellSound } = useSoundGenerator();
  const audioRef = useRef<HTMLAudioElement>(null);

  const { data: chantData, isLoading } = useQuery<ChantData>({
    queryKey: [`/api/chant/${deityId}/${mantraId}`],
  });

  const handleComplete = () => {
    setIsCompleted(true);
    // Play a bell sound upon completion
    try {
      generateBellSound({ duration: 4000, volume: 0.7 });
      
      toast({
        title: "Chanting Completed",
        description: "You have successfully completed 108 repetitions of this mantra.",
      });
    } catch (error) {
      console.error("Error playing completion sound:", error);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!chantData) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold">Mantra not found</h3>
        <p className="mt-2">
          <span
            onClick={() => setLocation("/")}
            className="text-divine-blue hover:underline cursor-pointer"
          >
            Go back to home
          </span>
        </p>
      </div>
    );
  }

  const { deity, mantra } = chantData;
  const isShivaPage = deity.id === 'shiva';

  // Determine if we have a background image for this deity
  const deityBackgroundClass = deity.id ? `${deity.id}-background` : '';

  return (
    <div id="chanting-view" className={deityBackgroundClass}>
      <div className="flex items-center mb-6">
        <div 
          onClick={() => setLocation(`/deity/${deity.id}`)}
          className="mr-3 bg-white/80 hover:bg-white p-2 rounded-full shadow-sm transition duration-300 cursor-pointer"
        >
          <svg
            className="h-5 w-5 text-divine-blue"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </div>
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-saffron/10 flex items-center justify-center mr-3">
            <div 
              className="h-10 w-10 rounded-full"
              style={{
                backgroundColor: '#f8f4e3', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <div 
                className="h-8 w-8 text-saffron"
                dangerouslySetInnerHTML={{ __html: deity.svgIcon }}
              />
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-poppins font-bold text-calmGray">
            {mantra.title}
          </h2>
        </div>
      </div>

      {/* Top Banner Ad */}
      <div className="mb-6">
        <BannerAd />
      </div>

      <div className="flex flex-col lg:flex-row lg:space-x-6">
        {/* Left Column - Mantra Information */}
        <div className="lg:w-1/3 mb-6 lg:mb-0">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-5 mb-4">
            <div className="text-center mb-4">
              <p className="font-sanskrit text-2xl mb-2">{mantra.sanskrit}</p>
              <p className="text-gray-700 italic text-lg">{mantra.transliteration}</p>
            </div>
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-1">Meaning:</h4>
              <p className="text-sm text-gray-600">{mantra.meaning}</p>
            </div>
            <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-1">Pronunciation Guide:</h4>
                <div className="flex flex-col space-y-2">
                  {mantra.audioUrl ? (
                    <audio 
                      ref={audioRef}
                      controls 
                      className="w-full h-8" 
                      src={mantra.audioUrl}
                      preload="auto"
                      loop
                      onPlay={() => console.log("Playing chant audio:", mantra.audioUrl)}
                      onTimeUpdate={(e) => console.log("Audio time update:", (e.target as HTMLAudioElement).currentTime)}
                      onError={(e) => console.error("Audio error in chanting page:", e)}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  ) : (
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          className={`${isShivaPage ? 'text-blue-800 border-blue-800 hover:bg-blue-800/10' : 'text-divine-blue border-divine-blue hover:bg-divine-blue/10'}`}
                          onClick={() => generateOmSound({ duration: 4000 })}
                        >
                          <svg 
                            className="mr-1 h-4 w-4" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                          </svg>
                          Play Om Sound
                        </Button>
                        <span className="text-xs text-gray-500 italic">Sacred Om vibration</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Button 
                          variant="outline"
                          size="sm"
                          className={`${isShivaPage ? 'text-blue-800 border-blue-800 hover:bg-blue-800/10' : 'text-divine-blue border-divine-blue hover:bg-divine-blue/10'}`}
                          onClick={() => generateBellSound({ duration: 3000 })}
                        >
                          <svg 
                            className="mr-1 h-4 w-4" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                          Temple Bell
                        </Button>
                        <span className="text-xs text-gray-500 italic">Tibetan singing bowl</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-1">Chanting Instructions:</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Sit in a comfortable position with straight spine</li>
                <li>Take deep breaths before starting</li>
                <li>Chant the mantra 108 times using the counter</li>
                <li>Focus on the vibration and meaning of the mantra</li>
              </ul>
            </div>
          </div>
          
          {/* In-content ad in left column */}
          <div className="mt-4">
            <RectangleAd />
          </div>
        </div>

        {/* Right Column - 108 Counter */}
        <div className="lg:w-2/3">
          <CounterCircle 
            onComplete={handleComplete} 
            audioRef={audioRef}
            isAutoModeExternal={isAutoMode}
            onAutoModeChange={setIsAutoMode}
            deityName={deity.name}
            deitySvgIcon={deity.svgIcon}
            deityImage={getDeityImagePath(deity.id)}
          />
          
          {/* Display ad after counter when completed */}
          {isCompleted && (
            <div className="mt-8">
              <RectangleAd />
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Banner Ad */}
      <div className="mt-8">
        <BannerAd />
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div>
    <div className="flex items-center mb-6">
      <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
      <Skeleton className="h-8 w-40" />
    </div>

    <div className="flex flex-col lg:flex-row lg:space-x-6">
      <div className="lg:w-1/3 mb-6 lg:mb-0">
        <div className="bg-white/90 rounded-lg shadow-md p-5 mb-4">
          <div className="text-center mb-4">
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
          </div>
          <div className="mb-4">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="mb-4">
            <Skeleton className="h-4 w-40 mb-1" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>

      <div className="lg:w-2/3">
        <div className="bg-white/90 rounded-lg shadow-md p-5">
          <Skeleton className="h-6 w-48 mx-auto mb-6" />
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto mb-10" />
          <div className="w-full h-40 flex items-center justify-center">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
          <div className="flex justify-center space-x-4 mt-6">
            <Skeleton className="h-12 w-36" />
            <Skeleton className="h-12 w-36" />
          </div>
          <div className="mt-6">
            <Skeleton className="h-2 w-full rounded-full mb-1" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ChantingPage;
