import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Heart } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileData {
  profile: {
    id: number;
    username: string;
    displayName: string;
    email: string;
    totalChants: number;
    favoriteCount: number;
    streakDays: number;
    lastActive: string;
  };
  favorites: Array<{
    mantra: {
      id: string;
      title: string;
      deityId: string;
      sanskrit: string;
      transliteration: string;
    };
    deity: {
      id: string;
      name: string;
      description: string;
    };
  }>;
}

// Fallback profile data for development when API isn't ready
const defaultProfileData: ProfileData = {
  profile: {
    id: 1,
    username: "devotee",
    displayName: "Spiritual Seeker",
    email: "devotee@example.com",
    totalChants: 108,
    favoriteCount: 5,
    streakDays: 7,
    lastActive: new Date().toISOString()
  },
  favorites: []
};

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [initials, setInitials] = useState("U");
  
  // Debug log to track component rendering and auth state
  useEffect(() => {
    console.log("ProfilePage rendered, auth state:", !!currentUser);
    if (currentUser) {
      console.log("Current user info:", {
        displayName: currentUser.displayName,
        email: currentUser.email,
        uid: currentUser.uid
      });
    }
  }, [currentUser]);

  // Fetch user profile data along with favorites
  const { data, isLoading, error } = useQuery<ProfileData>({
    queryKey: ["/api/user/profile"],
    enabled: true // Always enabled with our backend dummy auth
  });
  
  // Add separate effect for debugging
  useEffect(() => {
    if (data) {
      console.log("Profile data loaded:", data);
    }
    if (error) {
      console.error("Error loading profile:", error);
    }
  }, [data, error]);

  useEffect(() => {
    // Set user initials for the avatar
    if (currentUser?.displayName) {
      const nameParts = currentUser.displayName.split(" ");
      if (nameParts.length >= 2) {
        setInitials(`${nameParts[0][0]}${nameParts[1][0]}`);
      } else if (nameParts.length === 1 && nameParts[0].length > 0) {
        setInitials(nameParts[0][0]);
      }
    } else if (currentUser?.email) {
      setInitials(currentUser.email[0].toUpperCase());
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-divine-saffron" />
          <p className="mt-4 text-lg">Loading profile information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error Loading Profile</h2>
          <p className="text-red-500 mb-4">
            {error instanceof Error ? error.message : "Failed to load your profile information."}
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
        <h1 className="text-3xl font-bold text-divine-saffron mb-2">My Profile</h1>
        <p className="text-gray-600">Your spiritual journey on Divine Mantras</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="lg:col-span-1">
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src={currentUser?.photoURL || ""} alt="Profile" />
                  <AvatarFallback className="bg-divine-blue text-white text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl">{currentUser?.displayName || "User"}</CardTitle>
              <CardDescription className="text-sm">{currentUser?.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                  <p className="text-divine-blue">
                    {currentUser?.metadata?.creationTime ? 
                      new Date(currentUser.metadata.creationTime).toLocaleDateString() : 
                      "Unknown"}
                  </p>
                </div>
                
                {data?.profile && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Chanting Stats</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-amber-50 p-3 rounded-lg text-center">
                          <p className="text-xl font-semibold text-divine-saffron">{data.profile.totalChants}</p>
                          <p className="text-xs text-gray-500">Total Chants</p>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-lg text-center">
                          <p className="text-xl font-semibold text-divine-saffron">{data.profile.streakDays}</p>
                          <p className="text-xs text-gray-500">Day Streak</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Last Active</h3>
                      <p className="text-divine-blue">
                        {new Date(data.profile.lastActive).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Link href="/favorites">
                <Button variant="outline" className="w-full">
                  <Heart className="mr-2 h-4 w-4" />
                  View All Favorites
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Favorite Mantras Section */}
        <div className="lg:col-span-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="mr-2 h-5 w-5 text-red-500" />
                Favorite Mantras
              </CardTitle>
              <CardDescription>
                Your personal collection of sacred mantras
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.favorites && data.favorites.length > 0 ? (
                <div className="space-y-4">
                  {data.favorites.slice(0, 5).map((favorite, index) => (
                    <div key={favorite.mantra.id}>
                      {index > 0 && <Separator className="my-2" />}
                      <div className="flex justify-between items-start">
                        <div>
                          <Link href={`/chant/${favorite.deity.id}/${favorite.mantra.id}`}>
                            <h3 className="text-divine-blue font-medium hover:underline">
                              {favorite.mantra.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-gray-500">{favorite.deity.name}</p>
                          <p className="font-sanskrit text-sm mt-1">{favorite.mantra.sanskrit}</p>
                          <p className="text-xs italic text-gray-600">{favorite.mantra.transliteration}</p>
                        </div>
                        <Link href={`/chant/${favorite.deity.id}/${favorite.mantra.id}`}>
                          <Button size="sm" variant="ghost" className="text-divine-blue">
                            Chant
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  
                  {data.favorites.length > 5 && (
                    <div className="mt-4 text-center">
                      <Link href="/favorites">
                        <Button variant="link" className="text-divine-saffron">
                          View all {data.favorites.length} favorites
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="text-amber-600 text-5xl mb-4">🪷</div>
                  <h3 className="text-lg font-medium text-divine-blue mb-2">No Favorites Yet</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Add mantras to your favorites to access them quickly here.
                  </p>
                  <Link href="/">
                    <Button className="bg-divine-saffron hover:bg-divine-saffron/90">
                      Explore Mantras
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;