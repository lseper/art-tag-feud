/**
 * Mobile breakpoints for responsive design.
 * Values represent max-width thresholds.
 */
export const breakpoints = {
  xs: '360px',   // Small Android phones
  sm: '390px',   // iPhone 14/15
  md: '430px',   // iPhone Pro Max
  lg: '490px',   // Medium phones
  xl: '600px',   // Larger phones / small tablets
  mobile: '768px', // Threshold for mobile layout switch
} as const;

/**
 * Media query helpers for styled-components.
 * Usage: ${media.xl} { ... }
 */
export const media = {
  xs: `@media (max-width: ${breakpoints.xs})`,
  sm: `@media (max-width: ${breakpoints.sm})`,
  md: `@media (max-width: ${breakpoints.md})`,
  lg: `@media (max-width: ${breakpoints.lg})`,
  xl: `@media (max-width: ${breakpoints.xl})`,
  mobile: `@media (max-width: ${breakpoints.mobile})`,
};

/**
 * Numeric breakpoint values for JS comparisons.
 */
export const breakpointValues = {
  xs: 360,
  sm: 390,
  md: 430,
  lg: 490,
  xl: 600,
  mobile: 768,
} as const;
