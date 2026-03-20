import { useState, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Mantra } from "@/lib/types";
import useSoundGenerator from "@/hooks/use-sound-generator";
import { useAuth } from "@/contexts/AuthContext";
import { Heart } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface MantraCardProps {
  mantra: Mantra;
  deityId: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (mantraId: string, isFavorite: boolean) => void;
  isShivaPage?: boolean;
}

const MantraCard = ({ mantra, deityId, isFavorite = false, onFavoriteToggle, isShivaPage = false }: MantraCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorited, setFavorited] = useState(isFavorite);
  const [isToggling, setIsToggling] = useState(false);
  const { generateOmSound } = useSoundGenerator();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  // Toggle favorite status
  const toggleFavorite = async () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to add favorites",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsToggling(true);
      console.log(`Toggle favorite for mantra ID: ${mantra.id}, current state: ${favorited}`);
      
      if (favorited) {
        // Remove from favorites
        console.log(`Removing mantra ${mantra.id} from favorites`);
        const response = await apiRequest("DELETE", `/api/favorites/${mantra.id}`);
        console.log("Remove favorite response:", response);
        
        setFavorited(false);
        toast({
          title: "Removed from favorites",
          description: `${mantra.title} removed from your favorites`,
        });
      } else {
        // Add to favorites
        console.log(`Adding mantra ${mantra.id} to favorites`);
        const response = await apiRequest("POST", `/api/favorites/${mantra.id}`);
        console.log("Add favorite response:", response);
        
        setFavorited(true);
        toast({
          title: "Added to favorites",
          description: `${mantra.title} added to your favorites`,
        });
      }
      
      // Invalidate favorites cache
      console.log("Invalidating favorites cache");
      await queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      
      // Call the parent component callback if provided
      if (onFavoriteToggle) {
        console.log("Calling parent callback with new state:", !favorited);
        onFavoriteToggle(mantra.id, !favorited);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };
  
  // Play a meditative tone using the sound generator hook
  const playTone = useCallback(() => {
    if (isPlaying) return;
    
    try {
      setIsPlaying(true);
      generateOmSound({ duration: 3000 });
      
      // Reset playing state after sound completes
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
    } catch (error) {
      console.error("Error playing tone:", error);
      setIsPlaying(false);
    }
  }, [isPlaying, generateOmSound]);

  return (
    <div className={`${isShivaPage ? 'bg-white/95 backdrop-blur-md' : 'bg-white'} rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg`}>
      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className={`font-poppins font-semibold text-lg ${isShivaPage ? 'text-blue-800' : 'text-saffron'}`}>{mantra.title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFavorite}
            disabled={isToggling}
            className={`hover:bg-transparent ${favorited ? 'text-red-500' : 'text-gray-400'}`}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`h-5 w-5 transition-all duration-300 ${favorited ? 'fill-current' : ''}`}
            />
          </Button>
        </div>
        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="mb-3 md:mb-0 md:w-1/2">
            <p className="font-sanskrit text-lg mb-1">{mantra.sanskrit}</p>
            <p className="text-gray-700 italic">{mantra.transliteration}</p>
            
            {/* Audio Controls */}
            <div className="flex items-center mt-2">
              {mantra.audioUrl ? (
                <div>
                  <audio 
                    controls 
                    className="w-full h-8"
                    src={mantra.audioUrl}
                    onPlay={() => console.log("Playing audio:", mantra.audioUrl)}
                    onError={(e) => {
                      console.error("Audio error:", e);
                      // Show error message in console with full path
                      console.error(`Failed to load audio at: ${mantra.audioUrl}`);
                    }}
                  >
                    Your browser does not support the audio element.
                  </audio>
                  <span className="text-xs text-gray-500 italic">Audio path: {mantra.audioUrl}</span>
                </div>
              ) : (
                <div className="w-full flex items-center justify-between">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={playTone}
                    disabled={isPlaying}
                    className="text-divine-blue border-divine-blue hover:bg-divine-blue/10"
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
                    {isPlaying ? "Playing..." : "Play Sound"}
                  </Button>
                  <span className="text-xs text-gray-500 italic">Meditative tone</span>
                </div>
              )}
            </div>
          </div>
          <div className="md:w-1/2">
            <h4 className="text-sm font-semibold text-gray-600 mb-1">Meaning:</h4>
            <p className="text-sm text-gray-600">{mantra.meaning}</p>
            <h4 className="text-sm font-semibold text-gray-600 mt-2 mb-1">Benefits:</h4>
            <p className="text-sm text-gray-600">{mantra.benefits}</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link href={`/chant/${deityId}/${mantra.id}`}>
            <Button 
              className={`${isShivaPage ? 'bg-blue-800 hover:bg-blue-700' : 'bg-divine-blue hover:bg-divine-blue/90'} text-white px-4 py-2 rounded-lg flex items-center mx-auto transition duration-300`}
            >
              <svg 
                className="mr-2 h-4 w-4" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              Chant 108 Times
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MantraCard;
