import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

/**
 * Returns a font size scaled to the device width.
 * @param baseFontSize The base font size (e.g., 16)
 */
export function getResponsiveFontSize(baseFontSize: number) {
  // 375 is a common base width (iPhone 11/12/13/14)
  const baseWidth = 375;
  return Math.round(baseFontSize * (width / baseWidth));
} 