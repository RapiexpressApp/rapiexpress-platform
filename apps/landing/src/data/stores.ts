import type { ImageMetadata } from 'astro';

import aeropostaleLogo from '../assets/stores/aeropostale.png';
import amazonLogo from '../assets/stores/amazon.png';
import bathBodyWorksLogo from '../assets/stores/bath-body-works.png';
import cartersLogo from '../assets/stores/carters.png';
import childrensPlaceLogo from '../assets/stores/childrens-place.png';
import ebayLogo from '../assets/stores/ebay.png';
import gapLogo from '../assets/stores/gap.png';
import sephoraLogo from '../assets/stores/sephora.png';
import sheinLogo from '../assets/stores/shein.png';
import targetLogo from '../assets/stores/target.png';
import temuLogo from '../assets/stores/temu.png';
import victoriasSecretLogo from '../assets/stores/victorias-secret.png';
import walmartLogo from '../assets/stores/walmart.png';

export interface Store {
  name: string;
  href: string;
  logo: ImageMetadata;
}

export const stores: Store[] = [
  { name: 'Amazon', href: 'https://www.amazon.com/', logo: amazonLogo },
  { name: 'Shein', href: 'https://www.shein.com/', logo: sheinLogo },
  { name: 'Temu', href: 'https://www.temu.com/', logo: temuLogo },
  { name: 'Walmart', href: 'https://www.walmart.com/', logo: walmartLogo },
  { name: 'Target', href: 'https://www.target.com/', logo: targetLogo },
  { name: 'eBay', href: 'https://www.ebay.com/', logo: ebayLogo },
  { name: "Victoria's Secret", href: 'https://www.victoriassecret.com/us/', logo: victoriasSecretLogo },
  { name: 'Sephora', href: 'https://www.sephora.com/', logo: sephoraLogo },
  { name: "Carter's", href: 'https://www.carters.com/', logo: cartersLogo },
  { name: 'Gap', href: 'https://www.gap.com/', logo: gapLogo },
  { name: "The Children's Place", href: 'https://www.childrensplace.com/us/home', logo: childrensPlaceLogo },
  { name: 'Aeropostale', href: 'https://www.aeropostale.com/', logo: aeropostaleLogo },
  { name: 'Bath & Body Works', href: 'https://www.bathandbodyworks.com/', logo: bathBodyWorksLogo },
];
