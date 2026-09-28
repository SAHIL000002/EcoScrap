import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Shared responsive layer for every EcoScrap screen.
 *
 * Design reference: the Stitch mocks are authored at a 390px logical width
 * (px-margin = 20px page gutter). Accepted device matrix: 360x800, 390x844,
 * 412x915 and graceful degradation beyond those sizes.
 *
 * Rules applied here (kept intentionally conservative so Stitch fidelity is
 * preserved):
 *  - Layout (card widths, gutters, bar heights) scales with the live width.
 *  - Typography only scales for display sizes (>= 16px) and is clamped to
 *    -8% / +8% so body copy keeps its designed, readable size.
 *  - Nothing is derived from a hard-coded device size: every value comes from
 *    useWindowDimensions() / safe-area insets.
 */

export const DESIGN_WIDTH = 390;

const SCALE_MIN = 0.9;
const SCALE_MAX = 1.12;
const FONT_MIN = 0.92;
const FONT_MAX = 1.08;
const MIN_SCALED_FONT = 16;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const widthScaleFor = (width) => clamp(width / DESIGN_WIDTH, SCALE_MIN, SCALE_MAX);

export const useResponsive = () => {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const widthScale = widthScaleFor(width);
  const isCompact = width < 375; // 360-class devices
  const isWide = width >= 412; // 412-class devices and above

  // Page gutter: Stitch uses 20px (px-margin). Trim to 16px on very narrow
  // devices so two-column grids and headers keep breathing room.
  const gutter = isCompact ? 16 : 20;

  // Layout scale (spacing, widths, fixed-size bars).
  const scale = (size) => Math.round(size * widthScale);

  // Typography scale: only display-size text responds to width, and only
  // mildly. Body copy (< 16px) is never shrunk.
  const font = (size) =>
    size < MIN_SCALED_FONT ? size : Math.round(size * clamp(widthScale, FONT_MIN, FONT_MAX));

  return {
    width,
    height,
    fontScale,
    insets,
    topInset: insets.top,
    bottomInset: insets.bottom,
    isCompact,
    isWide,
    widthScale,
    gutter,
    scale,
    font
  };
};

export default useResponsive;
