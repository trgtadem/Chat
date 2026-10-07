// Tasarim token'lari: kose yaricaplari, bosluklar ve yazi olcegi.
// Yuvarlak ve goz yormayan bir dil icin comert yaricaplar kullanilir.

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export type Radius = typeof radius;
export type Spacing = typeof spacing;

// Yazi boyutu tercihine gore olcek carpani
export const fontScaleMap: Record<'small' | 'medium' | 'large', number> = {
  small: 0.92,
  medium: 1,
  large: 1.14,
};
