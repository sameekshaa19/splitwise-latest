export const colors = {
  primaryBg: '#19183B',
  secondary: '#708993',
  accent: '#A1C2BD',
  lightBg: '#E7F2EF',
};

export const text = {
  // On dark backgrounds
  onPrimary: '#E7F2EF',
  // On light cards/backgrounds
  onLight: '#19183B',
  muted: '#708993',
};

export const theme = {
  colors,
  text,
  fontFamily: 'Helvetica',
};

export type Theme = typeof theme;
