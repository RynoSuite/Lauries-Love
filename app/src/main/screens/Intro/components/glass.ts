import { Dimensions } from 'react-native';
import colors from 'styles/colors';

/**
 * The shared vocabulary for the intro slides' phone mockups.
 *
 * Both slides draw the same device at the same size with the same glass, so
 * the numbers and the translucency live here rather than being copied — a
 * second copy is how two mockups end up subtly different sizes.
 */

// Scaled off the window rather than fixed, so a mockup leaves room for its
// slide's title and description on a small phone instead of pushing them off
// the bottom — which is exactly what the screenshots these replace used to do.
const WINDOW_HEIGHT = Dimensions.get('window').height;

export const H = Math.round(Math.max(196, Math.min(246, WINDOW_HEIGHT * 0.27)));
export const W = Math.round(H * 0.7);
export const RADIUS = Math.round(W * 0.1);
export const PAD = 10;
export const INNER = W - PAD * 2;

// Alpha suffixes on the palette's own hexes. Glass is a translucent surface,
// so every value here is deliberately low: the effect comes from what shows
// through, not from the colour itself.
export const GLASS_FILL = `${colors.magenta}1F`; // 12%
export const GLASS_HALO = `${colors.magentaHi}14`; // 8%
export const GLASS_EDGE_SOFT = `${colors.white}14`; // 8%
export const SCREEN_FILL = `${colors.ground}B3`; // 70% — the slide's gradient shows through

// Frosted glass has three parts, and the panel builds all three.
//
// 1. The refracted backdrop. A real frosted panel blurs what is behind it;
//    there is no blur available here (expo-blur is not installed, and it is
//    expensive on Android), but the intro's background is a smooth vertical
//    gradient with no detail in it — and a blurred smooth gradient is the same
//    smooth gradient. So a faint vertical wash stands in for it exactly.
export const FROST = {
  colors: [
    `${colors.white}12`,
    `${colors.magentaHi}14`,
    `${colors.deepwater}26`,
  ] as const,
  locations: [0, 0.55, 1] as const,
};

// 2. The specular sweep: light crossing the surface from the top-left corner,
//    strongest where it lands and gone by the middle.
export const SHEEN = {
  colors: [`${colors.white}2B`, `${colors.white}0A`, 'transparent'] as const,
  locations: [0, 0.38, 0.78] as const,
};

// 3. The lit edge. Glass catches light on the sides facing the source and
//    almost none on the others, so the four borders are deliberately unequal:
//    bright along the top, half that down the left, barely there on the
//    bottom and right. An even border reads as a drawn outline; an uneven one
//    reads as a pane with a light above it.
export const EDGE_TOP = `${colors.white}47`; // 28%
export const EDGE_LEFT = `${colors.white}26`; // 15%
export const EDGE_RIGHT = `${colors.white}0F`; // 6%
export const EDGE_BOTTOM = `${colors.white}0A`; // 4%
