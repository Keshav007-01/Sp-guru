import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import MantraCard from "@/components/MantraCard";

interface FavoriteItem {
  mantra: {
    id: string;
    title: string;
    deityId: string;
    sanskrit: string;
    transliteration: string;
    meaning: string;
    benefits: string;
    audioUrl?: string;
  };
  deity: {
    id: string;
    name: string;
    description: string;
  };
}

const FavoritesPage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Debug log to track component rendering and auth state
  useEffect(() => {
    console.log("FavoritesPage rendered, auth state:", !!currentUser);
  }, [currentUser]);

  const { data, isLoading, error, refetch } = useQuery<FavoriteItem[]>({
    queryKey: ["/api/favorites"],
    enabled: true // Enable regardless of user state with our backend dummy auth
  });

  useEffect(() => {
    // For debugging
    if (data) {
      console.log("Favorites data loaded:", data);
    }
    if (error) {
      console.error("Error loading favorites:", error);
    }
  }, [data, error]);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      console.log("Setting favorites from data:", data);
      setFavorites(data);
    }
  }, [data]);

  const handleFavoriteToggle = (mantraId: string, _isFavorite: boolean) => {
    console.log(`Favorite toggled for ${mantraId}, removing from local state`);
    // Remove the mantra from the local list when unfavorited
    setFavorites(prev => prev.filter(fav => fav.mantra.id !== mantraId));
    
    // Refresh the data after a short delay to ensure backend has updated
    setTimeout(() => {
      console.log("Refetching favorites after toggle");
      refetch();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-divine-saffron" />
          <p className="mt-4 text-lg">Loading your favorite mantras...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error Loading Favorites</h2>
          <p className="text-red-500 mb-4">
            {error instanceof Error ? error.message : "Failed to load your favorite mantras."}
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-amber-50/60 backdrop-blur-sm rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-divine-saffron mb-2">My Favorite Mantras</h1>
        <p className="text-gray-600">Your personal collection of sacred mantras for daily practice.</p>
      </div>

      {favorites && favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => (
            <MantraCard 
              key={favorite.mantra.id} 
              mantra={favorite.mantra} 
              deityId={favorite.deity.id}
              isFavorite={true}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-8 text-center">
          <div className="text-amber-600 text-6xl mb-4">🪷</div>
          <h2 className="text-2xl font-semibold text-divine-blue mb-4">No Favorites Yet</h2>
          <p className="text-gray-600 mb-6">
            You haven't added any mantras to your favorites list.
            Explore our collection and add mantras that resonate with your spiritual journey.
          </p>
          <Link href="/">
            <Button className="bg-divine-saffron hover:bg-divine-saffron/90">
              Explore Mantras
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;