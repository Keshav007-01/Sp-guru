import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import MantraCard from "@/components/MantraCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Deity, Mantra } from "@/lib/types";
import { BannerAd, RectangleAd, SidebarAd } from "@/components/AdBanner";

interface DeityMantrasProps {
  params?: {
    deityId: string;
  };
}

const DeityMantras = ({ params: routeParams }: DeityMantrasProps) => {
  // Use route params first (for direct navigation), fall back to useRoute (for refresh/direct URL)
  const [, urlParams] = useRoute("/deity/:deityId");
  const deityId = routeParams?.deityId || urlParams?.deityId;

  const { data: deity, isLoading } = useQuery<Deity>({
    queryKey: [`/api/deities/${deityId}`],
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!deity) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold">Deity not found</h3>
        <p className="mt-2">
          <Link href="/">
            <a className="text-divine-blue hover:underline">Go back to home</a>
          </Link>
        </p>
      </div>
    );
  }
  
  // Determine the deity background class
  const isShivaPage = deityId === 'shiva';
  const deityBackgroundClass = deityId ? `${deityId}-background` : '';

  return (
    <div 
      id="mantra-view" 
      className={`${deityBackgroundClass} p-4 pt-6`}
    >
      
      <div className="flex items-center mb-6">
        <Link href="/" className={`mr-3 ${isShivaPage ? 'bg-white/90' : 'bg-white/80'} hover:bg-white p-2 rounded-full shadow-sm transition duration-300`}>
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
        </Link>
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-saffron/20 flex items-center justify-center mr-3 overflow-hidden">
            <img 
              src={deity.id === 'ram' ? `/images/lord-${deity.id}.webp` : `/images/lord-${deity.id}.png`}
              alt={deity.name}
              className="h-12 w-12 object-cover"
              onError={(e) => {
                // Fallback to specific image filenames if lord-{deity.id}.png doesn't exist
                if (deity.id === 'lakshmi') {
                  e.currentTarget.src = "/images/goddess-lakshmi.png";
                } else if (deity.id === 'saraswati') {
                  e.currentTarget.src = "/images/goddess-saraswati.png";
                } else if (deity.id === 'durga') {
                  e.currentTarget.src = "/images/goddess-durga.png";
                } else if (deity.id === 'hanuman') {
                  e.currentTarget.src = "/images/lord-hanuman.png";
                } else if (deity.id === 'ganesh') {
                  e.currentTarget.src = "/images/lord-ganesh.png";
                } else if (deity.id === 'vishnu') {
                  e.currentTarget.src = "/images/lord-vishnu.png";
                } else if (deity.id === 'krishna') {
                  e.currentTarget.src = "/images/lord-krishna.png";
                } else if (deity.id === 'shiva') {
                  e.currentTarget.src = "/images/lord-shiva.png";
                } else if (deity.id === 'ram') {
                  e.currentTarget.src = "/images/lord-ram.webp";
                } else {
                  e.currentTarget.src = "/images/om-symbol.svg";
                }
              }}
            />
          </div>
          <h2 className={`text-2xl font-poppins font-bold ${isShivaPage ? 'text-white' : 'text-calmGray'}`}>
            {deity.name} Mantras
          </h2>
        </div>
      </div>

      {/* Top Banner Ad */}
      <BannerAd />

      <div className={`${isShivaPage ? 'bg-white/90' : 'bg-white/90'} backdrop-blur-sm rounded-lg shadow-md p-4 mb-6`}>
        <p className="text-gray-600">{deity.longDescription}</p>
      </div>

      {/* Layout with sidebar ad for larger screens */}
      <div className="lg:flex lg:gap-6">
        {/* Main Content */}
        <div className="lg:flex-1">
          {/* Mantra Cards List */}
          <div className="space-y-4">
            {deity.mantras.map((mantra: Mantra, index: number) => (
              <div key={mantra.id}>
                <MantraCard mantra={mantra} deityId={deity.id} isShivaPage={isShivaPage} />
                {/* Insert ad after every third mantra */}
                {index % 3 === 2 && index < deity.mantras.length - 1 && (
                  <div className="my-8">
                    <RectangleAd />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar for Ads (only visible on large screens) */}
        <div className="hidden lg:block lg:w-[300px] sticky top-4 self-start">
          <SidebarAd />
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

    <Skeleton className="h-24 w-full rounded-lg mb-6" />

    <div className="space-y-4">
      {Array(3)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-5">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="flex flex-col md:flex-row md:space-x-4">
              <div className="mb-3 md:mb-0 md:w-1/2">
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-5 w-2/3 mb-4" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="md:w-1/2">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        ))}
    </div>
  </div>
);

export default DeityMantras;
