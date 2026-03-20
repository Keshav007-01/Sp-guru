declare module 'react-adsense' {
  import React from 'react';

  interface GoogleAdsenseProps {
    client: string;
    slot: string;
    className?: string;
    style?: React.CSSProperties;
    format?: 'auto' | 'rectangle' | 'horizontal' | string;
    responsive?: 'true' | 'false' | string;
    layoutKey?: string;
  }

  interface AdsenseProps {
    className?: string;
    style?: React.CSSProperties;
    client: string;
    slot: string;
    format?: 'auto' | 'rectangle' | 'horizontal' | string;
    responsive?: 'true' | 'false' | string;
    layoutKey?: string;
  }

  export default {
    Google: React.ComponentType<GoogleAdsenseProps>,
    Adsense: React.ComponentType<AdsenseProps>
  };
}