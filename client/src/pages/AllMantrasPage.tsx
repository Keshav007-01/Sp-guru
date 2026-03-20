import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Deity } from "@shared/schema";
import { Loader2 } from "lucide-react";
import AdBanner from "@/components/AdBanner";

export default function AllMantrasPage() {
  // Fetch all deities to display their mantras
  const { data: deities, isLoading } = useQuery<Deity[]>({
    queryKey: ["/api/deities"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-amber-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-amber-800 mb-6">
          Sacred Mantras Collection
        </h1>
        <p className="text-lg text-center text-amber-700 mb-10">
          Explore our collection of powerful mantras from various deities for your spiritual journey
        </p>

        {/* Ad Banner */}
        <div className="mb-8">
          <AdBanner slotId="mantras-page-top" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {deities?.map((deity) => (
            <div 
              key={deity.id} 
              className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Deity Header with Image Background */}
              <div 
                className="relative h-48 flex items-center justify-center bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(/images/${
                    deity.id === 'lakshmi' || deity.id === 'durga' || deity.id === 'saraswati' 
                      ? 'goddess-' 
                      : 'lord-'
                  }${deity.id === 'ganesha' ? 'ganesh' : deity.id}${deity.id === 'ram' ? '.webp' : '.png'})`,
                  backgroundSize: 'cover'
                }}
              >
                <div className="absolute inset-0 bg-black/40"></div>
                <h2 className="text-3xl font-bold text-white z-10">{deity.name}</h2>
              </div>
              
              <div className="p-6">
                <p className="text-gray-700 mb-6">{deity.description}</p>
                
                <Link href={`/deity/${deity.id}`}>
                  <div className="bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded-full inline-block transition-colors font-medium text-center w-full">
                    View {deity.name} Mantras
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}