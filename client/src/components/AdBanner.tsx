import React, { useEffect, useRef } from 'react';
import { useAds } from '../contexts/AdContext';

// Add type definition for window.adsbygoogle
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdBannerProps {
  slotId: string;
  width?: string | number;
  height?: string | number;
}

const AdPlaceholder: React.FC<{ width?: string | number; height?: string | number }> = ({ 
  width = '100%', 
  height = '90px' 
}) => {
  return (
    <div 
      className="border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50"
      style={{ width, height, minHeight: '90px' }}
    >
      <p className="text-gray-400 text-xs text-center px-4">
        Advertisement Placeholder<br/>
        <span className="text-[10px]">Your Google AdSense ads will appear here</span>
      </p>
    </div>
  );
};

const AdBanner: React.FC<AdBannerProps> = ({ slotId, width = '100%', height = '90px' }) => {
  const { adsenseClientId, adsenseEnabled } = useAds();
  const adContainerRef = useRef<HTMLDivElement>(null);
  
  // Check if we have all the requirements to display ads
  const canDisplayAds = adsenseEnabled && 
                      adsenseClientId && 
                      !adsenseClientId.includes('XXXXXXXX') && 
                      slotId && 
                      slotId !== 'XXXXXXXXXX';
  
  useEffect(() => {
    // Only proceed if we can display ads and we're in the browser
    if (!canDisplayAds || !adContainerRef.current || typeof window === 'undefined') {
      return;
    }
    
    // Make sure AdSense is defined
    if (window.adsbygoogle === undefined) {
      window.adsbygoogle = [];
    }
    
    try {
      // Create the ad element
      const adElement = document.createElement('ins');
      adElement.className = 'adsbygoogle';
      adElement.style.display = 'block';
      adElement.style.width = typeof width === 'number' ? `${width}px` : width.toString();
      adElement.style.height = typeof height === 'number' ? `${height}px` : height.toString();
      adElement.dataset.adClient = adsenseClientId;
      adElement.dataset.adSlot = slotId;
      
      // Clear the container and add the new ad element
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
        adContainerRef.current.appendChild(adElement);
        
        // Push the ad
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('Error displaying ad:', error);
    }
  }, [adsenseClientId, slotId, width, height, canDisplayAds]);
  
  if (!canDisplayAds) {
    return <AdPlaceholder width={width} height={height} />;
  }
  
  return (
    <div className="my-4 flex justify-center">
      <div
        ref={adContainerRef}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          minWidth: '300px',
          minHeight: '50px'
        }}
      />
    </div>
  );
};

export default AdBanner;

// Pre-configured standard ad sizes
export const BannerAd: React.FC = () => (
  <AdBanner slotId="1234567890" width="728" height="90" />
);

export const RectangleAd: React.FC = () => (
  <AdBanner slotId="2345678901" width="300" height="250" />
);

export const SidebarAd: React.FC = () => (
  <AdBanner slotId="3456789012" width="300" height="250" />
);