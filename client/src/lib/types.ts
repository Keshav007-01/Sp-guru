export interface Deity {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  svgIcon: string;
  mantraCount: number;
  mantras: Mantra[];
}

export interface Mantra {
  id: string;
  title: string;
  sanskrit: string;
  transliteration: string;
  meaning: string;
  benefits: string;
  audioUrl?: string;
}

export interface FeaturedMantra {
  mantra: Mantra;
  deityId: string;
  deityName: string;
  deityDescription: string;
  svgIcon: string;
}
