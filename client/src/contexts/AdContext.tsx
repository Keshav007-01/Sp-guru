import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AdContextType {
  adsenseClientId: string;
  adsenseEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

const AdContext = createContext<AdContextType>({
  adsenseClientId: '',
  adsenseEnabled: false,
  isLoading: true,
  error: null
});

interface AdProviderProps {
  children: ReactNode;
}

export const AdProvider: React.FC<AdProviderProps> = ({ children }) => {
  const [adsenseClientId, setAdsenseClientId] = useState<string>('');
  const [adsenseEnabled, setAdsenseEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAdsenseConfig = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/adsense-config');
        
        if (!response.ok) {
          throw new Error('Failed to fetch AdSense configuration');
        }
        
        const data = await response.json();
        
        if (data && data.publisherId) {
          // Ensure the publisher ID is properly formatted
          const formattedId = data.publisherId.startsWith('ca-pub-') 
            ? data.publisherId 
            : data.publisherId.startsWith('pub-') 
              ? `ca-${data.publisherId}` 
              : `ca-pub-${data.publisherId}`;
            
          setAdsenseClientId(formattedId);
          setAdsenseEnabled(true);
          
          // AdSense script is now added directly in the HTML for divinemantras108.com
          // This is commented out since we're using a direct script tag in index.html
          /* 
          if (!document.querySelector(`script[src*="adsbygoogle"]`)) {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${formattedId}`;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
          }
          */
          
          console.log(`Using AdSense publisher ID: ${formattedId} for divinemantras108.com`);
        } else {
          setAdsenseEnabled(false);
          console.log('AdSense publisher ID not configured');
        }
      } catch (err) {
        console.error('Error loading AdSense configuration:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setAdsenseEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdsenseConfig();
    
    // Clean up function for domain divinemantras108.com
    return () => {
      // We no longer remove the AdSense script since it's now part of the base HTML
      // and needs to remain for all pages on divinemantras108.com
      
      // Remove only meta tags related to AdSense if needed
      const metaTag = document.querySelector('meta[name="google-adsense-account"]');
      if (metaTag && metaTag.parentNode) {
        metaTag.parentNode.removeChild(metaTag);
      }
    };
  }, []);

  const contextValue = {
    adsenseClientId,
    adsenseEnabled,
    isLoading,
    error
  };

  return (
    <AdContext.Provider value={contextValue}>
      {children}
    </AdContext.Provider>
  );
};

export const useAds = () => useContext(AdContext);