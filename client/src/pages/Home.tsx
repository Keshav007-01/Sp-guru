import { useQuery } from "@tanstack/react-query";
import DeityCard from "@/components/DeityCard";
import FeaturedMantra from "@/components/FeaturedMantra";
import { Skeleton } from "@/components/ui/skeleton";
import { Deity, FeaturedMantra as FeaturedMantraType } from "@/lib/types";
import { BannerAd, RectangleAd } from "@/components/AdBanner";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Headphones, Music, BookOpen, Heart } from "lucide-react";

const Home = () => {
  const { data: deities, isLoading: deitiesLoading } = useQuery<Deity[]>({
    queryKey: ["/api/deities"],
  });

  const { data: featuredMantra, isLoading: featuredLoading } = useQuery<FeaturedMantraType>({
    queryKey: ["/api/featured-mantra"],
  });

  if (deitiesLoading || featuredLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div id="home-view" className="space-y-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-xl p-8 shadow-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-amber-800 mb-4">
            Divine Mantras: Sacred Sounds for Spiritual Growth
          </h1>
          <p className="text-xl text-amber-700 mb-6">
            Begin your spiritual journey with authentic mantras, guided meditation, and ancient wisdom
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Link href="/mantras">
                <span className="flex items-center">
                  Explore Mantras <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-50">
              <Link href="/meditation">
                <span className="flex items-center">
                  Start Meditating <Headphones className="ml-2 h-4 w-4" />
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* About This Website */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-poppins font-bold text-amber-800 mb-4">
          Welcome to Divine Mantras
        </h2>
        <p className="text-gray-700 max-w-3xl mx-auto mb-4">
          Divine Mantras is a sanctuary for those seeking spiritual connection through the ancient practice 
          of mantra chanting. Our platform offers authentic Sanskrit mantras dedicated to various Hindu deities, 
          guided meditation experiences, and spiritual teachings based on ancient Vedic wisdom.
        </p>
        <p className="text-gray-700 max-w-3xl mx-auto">
          Whether you're beginning your spiritual journey or deepening your practice, our tools help you connect 
          with divine energies through sacred sounds that have been chanted for thousands of years.
        </p>
      </div>

      {/* Why Chanting is Important */}
      <div className="bg-amber-50 p-8 rounded-xl">
        <h2 className="text-2xl md:text-3xl font-poppins font-bold text-amber-800 text-center mb-6">
          The Power of Mantra Chanting
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-amber-700 mb-3">Spiritual Benefits</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Creates a direct connection with divine energies</li>
              <li>Purifies the mind and heart</li>
              <li>Awakens inner consciousness</li>
              <li>Develops devotion and spiritual awareness</li>
              <li>Connects you to ancient spiritual traditions</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-amber-700 mb-3">Physical & Mental Benefits</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Reduces stress and anxiety</li>
              <li>Improves concentration and focus</li>
              <li>Creates harmonious vibrational patterns in the body</li>
              <li>Calms the nervous system</li>
              <li>Promotes deeper breathing and relaxation</li>
            </ul>
          </div>
        </div>
        <p className="text-center text-gray-700 mt-6 max-w-3xl mx-auto">
          The tradition of chanting a mantra 108 times amplifies these benefits, with each repetition 
          deepening the connection between the practitioner, the mantra's vibration, and the divine energy it represents.
        </p>
      </div>

      {/* Top Banner Ad */}
      <BannerAd />

      {/* What We Offer */}
      <div className="mb-10">
        <h2 className="text-2xl md:text-3xl font-poppins font-bold text-amber-800 text-center mb-6">
          What Divine Mantras Offers
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/mantras" className="block">
            <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-all cursor-pointer border border-amber-100 hover:border-amber-200">
              <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-amber-800">♪♪</span>
              </div>
              <h3 className="text-xl font-semibold text-amber-700 mb-2">Sacred Mantras</h3>
              <p className="text-gray-600">
                Explore authentic Sanskrit mantras for various deities with proper pronunciation, 
                meanings, and benefits. Use our 108 counter for traditional practice.
              </p>
            </div>
          </Link>
          
          <Link href="/meditation" className="block">
            <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-all cursor-pointer border border-blue-100 hover:border-blue-200">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-blue-800">🎧</span>
              </div>
              <h3 className="text-xl font-semibold text-blue-700 mb-2">Guided Meditation</h3>
              <p className="text-gray-600">
                Experience peaceful meditation with ambient sounds, timer functions, and beautiful 
                visualizations to deepen your practice and inner peace.
              </p>
            </div>
          </Link>
          
          <Link href="/blog" className="block">
            <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-all cursor-pointer border border-amber-100 hover:border-amber-200">
              <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-amber-800">📖</span>
              </div>
              <h3 className="text-xl font-semibold text-amber-700 mb-2">Spiritual Teachings</h3>
              <p className="text-gray-600">
                Learn about the philosophy behind mantras, meditation techniques, and ancient 
                wisdom from Vedic traditions through our blog.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Content Ad */}
      <RectangleAd />

      {/* Deity Selection */}
      <div className="mb-10">
        <h2 className="text-2xl md:text-3xl font-poppins font-bold text-amber-800 text-center mb-4">
          Explore Sacred Mantras by Deity
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-center mb-8">
          Select a deity to discover their mantras and begin your spiritual
          journey through the ancient practice of 108 repetitions.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {deities && deities.map((deity: Deity) => (
            <DeityCard key={deity.id} deity={deity} />
          ))}
        </div>
      </div>

      {/* Featured Mantra Section */}
      {featuredMantra && (
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-poppins font-bold text-amber-800 text-center mb-4">
            Featured Mantra of the Day
          </h2>
          <FeaturedMantra
            mantra={featuredMantra.mantra}
            deityId={featuredMantra.deityId}
            deityName={featuredMantra.deityName}
            deityDescription={featuredMantra.deityDescription}
            svgIcon={featuredMantra.svgIcon}
          />
        </div>
      )}

      {/* Quick Links Section */}
      <div className="mb-10">
        <h2 className="text-2xl md:text-3xl font-poppins font-bold text-amber-800 text-center mb-6">
          Begin Your Spiritual Journey
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/mantras">
            <div className="bg-gradient-to-b from-amber-50 to-amber-100 p-6 rounded-lg shadow-md text-center cursor-pointer hover:shadow-lg transition-all">
              <Heart className="h-12 w-12 text-amber-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-amber-800 mb-2">Mantra Chanting</h3>
              <p className="text-gray-600 mb-4">
                Explore sacred mantras dedicated to various deities and practice the traditional 108 repetitions.
              </p>
              <span className="text-amber-600 font-medium flex items-center justify-center">
                Explore Mantras <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </div>
          </Link>
          <Link href="/meditation">
            <div className="bg-gradient-to-b from-blue-50 to-blue-100 p-6 rounded-lg shadow-md text-center cursor-pointer hover:shadow-lg transition-all">
              <Headphones className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-blue-800 mb-2">Meditation</h3>
              <p className="text-gray-600 mb-4">
                Experience guided meditation with ambient sounds, timer functions, and beautiful visualizations.
              </p>
              <span className="text-blue-600 font-medium flex items-center justify-center">
                Start Meditating <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </div>
          </Link>
          <Link href="/blog">
            <div className="bg-gradient-to-b from-amber-50 to-amber-100 p-6 rounded-lg shadow-md text-center cursor-pointer hover:shadow-lg transition-all">
              <BookOpen className="h-12 w-12 text-amber-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-amber-800 mb-2">Spiritual Teachings</h3>
              <p className="text-gray-600 mb-4">
                Learn about the philosophy behind mantras, meditation techniques, and ancient Vedic wisdom.
              </p>
              <span className="text-amber-600 font-medium flex items-center justify-center">
                Read Articles <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom Banner Ad */}
      <BannerAd />
    </div>
  );
};

const LoadingSkeleton = () => (
  <div>
    <div className="text-center mb-10">
      <Skeleton className="h-12 w-3/4 max-w-2xl mx-auto mb-4" />
      <Skeleton className="h-6 w-full max-w-2xl mx-auto mb-1" />
      <Skeleton className="h-6 w-full max-w-xl mx-auto" />
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array(8)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden p-4">
            <Skeleton className="h-24 w-24 rounded-full mx-auto mb-3" />
            <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/3 mx-auto" />
          </div>
        ))}
    </div>
  </div>
);

export default Home;
