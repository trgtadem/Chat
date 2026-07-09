import { WallpaperOption } from '../types';

// Duz renk duvar kagitlari
export const SOLID_WALLPAPERS: WallpaperOption[] = [
  { id: 'wp-default', type: 'color', value: '', name: 'Varsayilan (Tema)' },
  { id: 'wp-midnight', type: 'color', value: '#0A1628', name: 'Gece Mavisi' },
  { id: 'wp-ocean', type: 'color', value: '#112A46', name: 'Okyanus' },
  { id: 'wp-forest', type: 'color', value: '#102A22', name: 'Orman' },
  { id: 'wp-graphite', type: 'color', value: '#1E2432', name: 'Grafit' },
  { id: 'wp-plum', type: 'color', value: '#2A1A33', name: 'Erik' },
  { id: 'wp-sand', type: 'color', value: '#F1E9DC', name: 'Kum' },
  { id: 'wp-paper', type: 'color', value: '#ECEFF4', name: 'Kagit' },
];

// Gradyan duvar kagitlari
export const GRADIENT_WALLPAPERS: WallpaperOption[] = [
  { id: 'gr-dusk', type: 'gradient', value: '#1E3A8A', gradient: ['#1E3A8A', '#3B0764'], name: 'Alacakaranlik' },
  { id: 'gr-ocean', type: 'gradient', value: '#0F2027', gradient: ['#0F2027', '#203A43', '#2C5364'], name: 'Derin Deniz' },
  { id: 'gr-sunset', type: 'gradient', value: '#7F1D1D', gradient: ['#7F1D1D', '#B45309', '#F59E0B'], name: 'Gun Batimi' },
  { id: 'gr-aurora', type: 'gradient', value: '#064E3B', gradient: ['#064E3B', '#065F46', '#0EA5E9'], name: 'Kutup Isigi' },
  { id: 'gr-berry', type: 'gradient', value: '#4A044E', gradient: ['#4A044E', '#831843', '#BE185D'], name: 'Orman Meyvesi' },
  { id: 'gr-slate', type: 'gradient', value: '#0F172A', gradient: ['#0F172A', '#334155'], name: 'Duman' },
  { id: 'gr-peach', type: 'gradient', value: '#FDE68A', gradient: ['#FDE68A', '#FCA5A5', '#F9A8D4'], name: 'Seftali' },
];

// Desenli duvar kagitlari (ChatBackground icinde SVG ile cizilir)
export const PATTERN_WALLPAPERS: WallpaperOption[] = [
  { id: 'pt-dots', type: 'pattern', pattern: 'dots', value: '#0A1628', patternColor: '#233047', name: 'Noktalar' },
  { id: 'pt-grid', type: 'pattern', pattern: 'grid', value: '#0F172A', patternColor: '#233047', name: 'Izgara' },
  { id: 'pt-diagonal', type: 'pattern', pattern: 'diagonal', value: '#112033', patternColor: '#1F3350', name: 'Capraz' },
  { id: 'pt-cross', type: 'pattern', pattern: 'cross', value: '#141B2B', patternColor: '#263450', name: 'Arti' },
];
