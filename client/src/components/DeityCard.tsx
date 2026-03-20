import { useLocation } from "wouter";
import { Deity } from "@/lib/types";

interface DeityCardProps {
  deity: Deity;
}

const DeityCard = ({ deity }: DeityCardProps) => {
  const [, setLocation] = useLocation();
  
  return (
    <div onClick={() => setLocation(`/deity/${deity.id}`)} className="deity-card bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 cursor-pointer hover:translate-y-[-5px] hover:shadow-lg block">
      <div className="p-4 text-center">
        <div className="w-24 h-24 mx-auto mb-3 bg-cream-bg rounded-full flex items-center justify-center">
          <div 
            className="h-20 w-20 rounded-full"
            style={{
              backgroundColor: '#f8f4e3', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            <div 
              className="h-16 w-16 text-saffron"
              dangerouslySetInnerHTML={{ __html: deity.svgIcon }}
            />
          </div>
        </div>
        <h3 className="font-poppins font-semibold text-lg text-saffron">{deity.name}</h3>
        <p className="text-sm text-gray-600">{deity.description}</p>
        <span className="inline-block mt-2 text-xs bg-divine-blue/10 text-divine-blue px-2 py-1 rounded-full">
          {deity.mantraCount} Mantras
        </span>
      </div>
    </div>
  );
};

export default DeityCard;
