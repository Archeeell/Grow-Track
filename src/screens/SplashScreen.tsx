/**
 * SplashScreen — pixel-faithful replica of Figma Make design.
 *
 * Source: https://www.figma.com/make/eKkRChZaUOgj5qKV1xCeia/Designer
 * All values extracted from live preview JS bundle + CSS keyframes.
 *
 * Animation pipeline (all 1 000 ms, parallel):
 *   splash-seed   — pepper-seed.webp:  0→120ms fade in, 230ms fade out
 *   splash-sprout — Sprout SVG 28px:   200ms in, 340ms hold, 550ms out
 *   splash-plant  — Leaf SVG 38px:     380ms in, 600ms out, 750ms gone
 *   splash-logo   — GrowTrackLogo:     630ms in, 900ms full, stays visible
 * Redirect fires at 1 100 ms (matches Make's setTimeout(fn, 1100)).
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts, splash as splashTokens } from '../theme';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';

// ─── SVG icon primitives ─────────────────────────────────────────────────────
// Lucide Sprout — same paths as in the Make bundle
function SproutIcon({ size, color }: { size: number; color: string }) {
  const scale = size / 24;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"
        stroke={color}
        strokeWidth={2 / scale}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"
        stroke={color}
        strokeWidth={2 / scale}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 21h14"
        stroke={color}
        strokeWidth={2 / scale}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Lucide Leaf
function LeafIcon({ size, color }: { size: number; color: string }) {
  const scale = size / 24;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20a10 10 0 0 0 10-10 25.9 25.9 0 0 0-1.04-7.281 1 1 0 0 0-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0 0 11 20"
        stroke={color}
        strokeWidth={2 / scale}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 21a5 5 0 0 1 2.911-4.544C7.613 15.212 8.351 15.24 11 13"
        stroke={color}
        strokeWidth={2 / scale}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Easing ──────────────────────────────────────────────────────────────────
// CSS 'ease' = cubic-bezier(0.25, 0.1, 0.25, 1.0)
const cssEase = Easing.bezier(0.25, 0.1, 0.25, 1.0);

// ─── Keyframe helpers ─────────────────────────────────────────────────────────
// Build an Animated.Value that follows a CSS keyframe timeline.
// `stops` = array of [timeMs, value] pairs (ms within 0–totalMs).
function buildKeyframeAnim(
  anim: Animated.Value,
  stops: [number, number][],
  totalMs = 1000,
): Animated.CompositeAnimation {
  const segs: Animated.CompositeAnimation[] = [];
  let prev = stops[0];
  for (let i = 1; i < stops.length; i++) {
    const curr = stops[i];
    const duration = curr[0] - prev[0];
    segs.push(
      Animated.timing(anim, {
        toValue: curr[1],
        duration,
        easing: cssEase,
        useNativeDriver: true,
      }),
    );
    prev = curr;
  }
  // Pad to totalMs if last stop < totalMs
  const lastStop = stops[stops.length - 1];
  if (lastStop[0] < totalMs) {
    segs.push(
      Animated.timing(anim, {
        toValue: lastStop[1],
        duration: totalMs - lastStop[0],
        easing: cssEase,
        useNativeDriver: true,
      }),
    );
  }
  return Animated.sequence(segs);
}

// ─── Props ───────────────────────────────────────────────────────────────────
type Props = {
  onFinish: () => void;
};

const useStyles = makeStyles(({ colors }) => ({
  // Full-screen centered container — bg matches native splash exactly
  outer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    // Max width constraint matches Make's max-w-[460px]
    ...(Platform.OS === 'web' ? { maxWidth: 460, alignSelf: 'center', width: '100%' as any } : {}),
  },
  // Inner 208×128px relative container (w-52 h-32)
  inner: {
    width: splashTokens.containerWidth,   // 208px
    height: splashTokens.containerHeight, // 128px
    alignItems: 'center',
    justifyContent: 'center',
  },
  // All animated children are positioned absolute over center
  absolute: {
    position: 'absolute',
  },
  // pepper-seed.webp — size-6 = 24×24px, pixelated rendering
  seedImage: {
    width: splashTokens.seedSize,         // 24px
    height: splashTokens.seedSize,        // 24px
    // React Native respects object-fit via resizeMode; pixelated rendering
    // is handled natively on mobile; on web we apply imageRendering via style
    ...(Platform.OS === 'web' ? { imageRendering: 'pixelated' } as any : {}),
  },
  // GrowTrackLogo container — flex row, gap 8px, color primary
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: splashTokens.logoGap,            // 8px
  },
  // "GrowTrack" text — Pixelify Sans SemiBold 23px, primary color
  logoText: {
    fontFamily: fonts.pixelSemiBold,      // PixelifySans-SemiBold
    fontSize: splashTokens.logoFontSize,  // 23px
    color: colors.primary,
    includeFontPadding: false,
    lineHeight: splashTokens.logoFontSize * 1.2,
  },
  // "." — accent color (#4ca8ff)
  logoDot: {
    color: colors.accentBlue,
  },
}));

// ─── Component ───────────────────────────────────────────────────────────────
export function SplashScreen({ onFinish }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  // Opacity values
  const seedOpacity = useRef(new Animated.Value(0)).current;
  const sproutOpacity = useRef(new Animated.Value(0)).current;
  const leafOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Transform values
  const seedTranslateY = useRef(new Animated.Value(6)).current;
  const sproutScale = useRef(new Animated.Value(0.7)).current;
  const leafScale = useRef(new Animated.Value(0.8)).current;
  const leafTranslateY = useRef(new Animated.Value(4)).current;
  const logoTranslateY = useRef(new Animated.Value(5)).current;

  useEffect(() => {
    const D = splashTokens.totalDuration; // 1000ms

    // splash-seed: opacity stops (% × D)
    const seedOpacityAnim = buildKeyframeAnim(seedOpacity, [
      [0, 0],
      [120, 1],   // 12% → fade in
      [230, 1],   // 23% → hold
      [340, 0],   // 34% → fade out
      [D, 0],
    ], D);
    const seedTranslateAnim = buildKeyframeAnim(seedTranslateY, [
      [0, 6],
      [120, 0],   // 12% → translateY(0)
      [D, 0],
    ], D);

    // splash-sprout: opacity
    const sproutOpacityAnim = buildKeyframeAnim(sproutOpacity, [
      [0, 0],
      [200, 0],   // 20% → still 0
      [340, 1],   // 34% → fade in
      [420, 1],   // 42% → hold
      [550, 0],   // 55% → fade out
      [D, 0],
    ], D);
    const sproutScaleAnim = buildKeyframeAnim(sproutScale, [
      [0, 0.7],
      [200, 0.7], // 20% → still 0.7
      [340, 1],   // 34% → scale up
      [D, 1],
    ], D);

    // splash-plant: opacity
    const leafOpacityAnim = buildKeyframeAnim(leafOpacity, [
      [0, 0],
      [380, 0],   // 38% → still 0
      [520, 1],   // 52% → fade in
      [600, 1],   // 60% → hold
      [750, 0],   // 75% → fade out
      [D, 0],
    ], D);
    const leafScaleAnim = buildKeyframeAnim(leafScale, [
      [0, 0.8],
      [380, 0.8], // 38% → still 0.8
      [520, 1],   // 52% → scale up
      [D, 1],
    ], D);
    const leafTranslateAnim = buildKeyframeAnim(leafTranslateY, [
      [0, 4],
      [380, 4],   // 38% → still 4px
      [520, 0],   // 52% → translateY(0)
      [D, 0],
    ], D);

    // splash-logo: opacity (fill-mode: both → stays at opacity 1)
    const logoOpacityAnim = buildKeyframeAnim(logoOpacity, [
      [0, 0],
      [630, 0],   // 63% → still 0
      [900, 1],   // 90% → fade in
      [D, 1],     // 100% → hold (forwards)
    ], D);
    const logoTranslateAnim = buildKeyframeAnim(logoTranslateY, [
      [0, 5],
      [630, 5],   // 63% → still 5px
      [900, 0],   // 90% → translateY(0)
      [D, 0],
    ], D);

    // Run all animations in parallel
    const master = Animated.parallel([
      seedOpacityAnim,
      seedTranslateAnim,
      sproutOpacityAnim,
      sproutScaleAnim,
      leafOpacityAnim,
      leafScaleAnim,
      leafTranslateAnim,
      logoOpacityAnim,
      logoTranslateAnim,
    ]);

    master.start();

    // Redirect fires at 1 100 ms — matches Make's setTimeout(fn, 1100)
    const timer = setTimeout(onFinish, splashTokens.redirectDelay);
    return () => {
      clearTimeout(timer);
      master.stop();
    };
  }, [onFinish]);

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        {/* splash-seed — pepper-seed.webp, 24×24px, absolute center */}
        <Animated.View
          style={[
            styles.absolute,
            {
              opacity: seedOpacity,
              transform: [{ translateY: seedTranslateY }],
            },
          ]}
        >
          <Image
            source={require('../../assets/items/pepper-seed.webp')}
            style={styles.seedImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* splash-sprout — Sprout SVG, 28×28px, absolute center */}
        <Animated.View
          style={[
            styles.absolute,
            {
              opacity: sproutOpacity,
              transform: [{ scale: sproutScale }],
            },
          ]}
        >
          <SproutIcon size={splashTokens.sproutSize} color={colors.primary} />
        </Animated.View>

        {/* splash-plant — Leaf SVG, 38×38px, absolute center */}
        <Animated.View
          style={[
            styles.absolute,
            {
              opacity: leafOpacity,
              transform: [
                { scale: leafScale },
                { translateY: leafTranslateY },
              ],
            },
          ]}
        >
          <LeafIcon size={splashTokens.leafSize} color={colors.primary} />
        </Animated.View>

        {/* splash-logo — GrowTrackLogo, animates in last, stays visible */}
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslateY }],
          }}
        >
          <GrowTrackLogo />
        </Animated.View>
      </View>
    </View>
  );
}

// ─── GrowTrackLogo ────────────────────────────────────────────────────────────
// Matches Figma Make: flex row, gap 8px, Sprout 21px + "GrowTrack" + "." (accent)
function GrowTrackLogo() {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <View style={styles.logo}>
      <SproutIcon size={splashTokens.logoIconSize} color={colors.primary} />
      <Text style={styles.logoText} allowFontScaling={false}>
        GrowTrack
        <Text style={styles.logoDot}>.</Text>
      </Text>
    </View>
  );
}
