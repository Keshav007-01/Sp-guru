import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Mantra } from "@/lib/types";

interface FeaturedMantraProps {
  mantra: Mantra;
  deityId: string;
  deityName: string;
  deityDescription: string;
  svgIcon: string;
}

const FeaturedMantra = ({ mantra, deityId, deityName, deityDescription, svgIcon }: FeaturedMantraProps) => {
  return (
    <div className="mt-12">
      <h3 className="text-xl font-poppins font-semibold text-center mb-6">Featured Mantra of the Day</h3>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row items-center mb-4">
          <div className="w-16 h-16 rounded-full bg-saffron/10 flex items-center justify-center mb-4 md:mb-0 md:mr-4">
            <div 
              className="h-14 w-14 rounded-full"
              style={{
                backgroundColor: '#f8f4e3', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <div 
                className="h-10 w-10 text-saffron"
                dangerouslySetInnerHTML={{ __html: svgIcon }}
              />
            </div>
          </div>
          <div className="text-center md:text-left">
            <h4 className="font-poppins font-semibold text-lg text-saffron">{mantra.title}</h4>
            <p className="text-sm text-gray-600">{deityName} | {deityDescription}</p>
          </div>
        </div>
        <div className="text-center mb-4">
          <p className="font-sanskrit text-lg mb-2">{mantra.sanskrit}</p>
          <p className="text-gray-700 italic">{mantra.transliteration}</p>
          <p className="text-sm text-gray-600 mt-2">{mantra.meaning}</p>
          {mantra.audioUrl && (
            <div className="mt-3 max-w-xs mx-auto">
              <audio 
                controls 
                className="w-full h-8"
                src={mantra.audioUrl}
                loop
                onPlay={() => console.log("Playing featured mantra audio:", mantra.audioUrl)}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <Link href={`/chant/${deityId}/${mantra.id}`}>
            <Button className="bg-divine-blue hover:bg-divine-blue/90 text-white px-4 py-2 rounded-lg flex items-center transition duration-300">
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
              Start Chanting
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturedMantra;
