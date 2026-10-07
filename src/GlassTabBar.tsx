import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { PixelRatio, StyleSheet, View, useColorScheme, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  type WithSpringConfig,
} from "react-native-reanimated";
import { runOnUISync, scheduleOnRN } from "react-native-worklets";

import { GlassSurface } from "./GlassSurface";
import type { TabIcon } from "./icons";
import { TAB_BAR_HEIGHT, tabBarScale } from "./layout";
import { setHighFrameRate } from "./native";
import { SkiaLib, type SkImage } from "./skia";

const {
  Canvas,
  Fill,
  Group,
  ImageShader,
  LinearGradient,
  Paragraph,
  Path,
  RoundedRect,
  Shader,
  Skia,
  TextAlign,
  drawAsImage,
  useFonts,
  vec,
} = SkiaLib;

export interface GlassTabItem {
  key: string;
  label: string;
  icon: TabIcon;
}

export interface GlassTabBarProps {
  items: GlassTabItem[];
  activeIndex: number;
  onChange: (index: number) => void;
  /** Defaults to the system colour scheme. */
  dark?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  /** The screen colour behind the bar, shown inside the lens where it looks past the bar's edge. */
  backgroundColor?: string;
  /** `require()`d font file for the labels (Skia shapes them itself); the system font otherwise. */
  labelFont?: number;
  /** The `BlurTarget` wrapping the content the bar floats over (Android). */
  blurTarget?: RefObject<View | null>;
  style?: StyleProp<ViewStyle>;
}

export const DEFAULT_COLORS = {
  dark: { active: "#FFFFFF", inactive: "rgba(235,235,245,0.6)", background: "#000000" },
  light: { active: "#0E1018", inactive: "rgba(60,60,67,0.6)", background: "#FFFFFF" },
};
const NO_FONTS = {};

// Room around the bar for the droplet to swell, stretch and overshoot past it.
const BLEED = 48;
// Lifted droplet, matched to iOS 26 recordings: ~1.35x a tab wide and ~1.2x the (pressed) bar tall.
// Bar metrics below are at the 402 dp reference width; tabBarScale() shrinks them on narrower screens.
const GROW_X = 0.36;
const GROW_Y = 0.36;
// As on iOS 26, the whole bar swells ~5% and brightens a little while it's held.
const PRESS_SCALE = 0.05;
const PRESS_IN: WithSpringConfig = { stiffness: 1000, damping: 58, mass: 1 };
const PRESS_OUT: WithSpringConfig = { stiffness: 700, damping: 45, mass: 1 };
// As on iOS, the drop pops up tall at once but widens more slowly, and stays wide for a moment
// while it sinks back to the bar, so a landing spreads into the pill instead of shrinking.
const WIDEN_IN: WithSpringConfig = { stiffness: 220, damping: 30, mass: 1 };
const WIDEN_OUT_DELAY = 60;
// The drop follows its goal (the finger's travel, or a tab) through an underdamped spring
// (units: dp and ms). It trails a moving finger by ~2*ZETA/OMEGA (~52 ms), catches up quickly when
// the finger stops and swings a few dp past the bar's ends after a fast flick.
const FOLLOW_OMEGA = 0.027;
const FOLLOW_ZETA = 0.7;
const STEP_MS = 4;
// How far (dp, at the reference width) the drop may swing past the first or last tab. Past an end
// a stiffer, bouncier spring takes over, so a flick's momentum shows as a short bounce off the end.
const END_GIVE = 5;
const END_OMEGA = 0.08;
const END_ZETA = 0.5;
// While dragging into an end, the goal is carried past it by the drop's momentum (ms of travel).
const END_CARRY_MS = 6;
// Jelly, measured from iOS 26 recordings (speeds in dp/ms, springs in 1/ms). While a finger drags it,
// the drop squashes to the bar's height and ~9% wider as it speeds up (FLAT_FROM..FLAT_TO, ~80 ms).
// Slowing down kicks a soft spring that makes it ~12% taller and ~7% narrower, peaking ~0.22 s after
// the stop and back to its resting shape by ~0.65 s, barely dipping below it (fitted to the recording).
const FLAT_FROM = 0.06;
const FLAT_TO = 0.3;
const FLAT_WIDEN = 0.09;
const MORPH_OMEGA = 0.05;
const JELLY_OMEGA = 0.005;
const JELLY_ZETA = 0.7;
const DECEL_KICK = 0.025;
const TALL_MAX = 1.3;
const TALL_GROW = 0.16;
const TALL_NARROW = 0.09;
const FULL_SPEED = 2.2;
const LIFT_IN: WithSpringConfig = { stiffness: 900, damping: 54, mass: 1 };
const LIFT_OUT: WithSpringConfig = { stiffness: 1600, damping: 80, mass: 1 };
// A released drop sinks into the pill once it is this close (dp) to its tab, and never sooner than
// MIN_LIFT_MS after the press, so a tap visibly travels and lands (~0.25 s in all, as on iOS).
const LAND_NEAR = 6;
const MIN_LIFT_MS = 160;
const REST_HANDOFF = 0.35;
// Finger travel (dp) before a press turns into a drag, so a tap's jitter doesn't nudge the drop.
const DRAG_SLOP = 6;
const ICON_SHADOW_DARK = "rgba(0,0,0,0.45)";
const ICON_SHADOW_LIGHT = "rgba(255,255,255,0.75)";
const BASE_INSET = 5;
const BASE_ICON = 22;
const BASE_LABEL = 10.5;
const BASE_ICON_Y = 11;
const BASE_LABEL_Y = 38;
// Only the outer rim of the drop bends light; how far (dp) it pushes at the very edge.
const RIM_BEND = 9;
// As on iOS 26, the lifted drop magnifies what's under it (~1.2x, on top of the bar's swell).
const MAGNIFY = 0.18;
const PD = PixelRatio.get();
// The selected tab's pill tint at rest (premultiplied RGBA).
const PILL_DARK = premultiplied("#FFFFFF", 0.15);
const PILL_LIGHT = premultiplied("#0E1018", 0.06);

function smoothstep(from: number, to: number, value: number): number {
  "worklet";
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

function premultiplied(color: string, alpha: number): number[] {
  const [r, g, b, a] = Skia.Color(color);
  const opacity = a * alpha;
  return [r * opacity, g * opacity, b * opacity, opacity];
}
const RIM_DARK = ["rgba(255,255,255,0.3)", "rgba(255,255,255,0.05)", "rgba(255,255,255,0.05)", "rgba(255,255,255,0.18)"];
// Clear glass catches a little light, so the lifted drop reads slightly brighter than the bar.
const BODY_DARK = premultiplied("#FFFFFF", 0.06);
const BODY_LIGHT = premultiplied("#FFFFFF", 0.16);
const RIM_LIGHT = ["rgba(255,255,255,0.95)", "rgba(255,255,255,0.3)", "rgba(255,255,255,0.3)", "rgba(255,255,255,0.8)"];

// The droplet lens. The tab rows are rendered once into two images (plain and selected, device
// pixels); per frame this one shader composes them (selected inside the drop and the rest tab's
// cell, plain elsewhere, over the rest pill and press glow) and bends that composite inside the
// drop. Coordinates arrive in device pixels; geometry uniforms are in dp.
const LENS = Skia.RuntimeEffect.Make(`
uniform shader plainRow;
uniform shader selectedRow;
uniform float pd;
uniform float2 center;
uniform float2 halfSize;
uniform float lift;
uniform float band;
uniform float distortion;
uniform float magnify;
uniform float chroma;
uniform float4 body;
uniform float rim;
uniform float motion;
uniform float2 barCenter;
uniform float2 barHalf;
uniform float4 page;
uniform float flatten;
uniform float2 restCell;
uniform float4 pill;
uniform float4 pillColor;
uniform float glow;

float sdCapsule(float2 p, float2 b) {
  float r = min(b.x, b.y);
  float2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

half4 content(float2 p) {
  float2 xy = p * pd;
  float inDrop = lift > 0.01 ? smoothstep(0.5, -0.5, sdCapsule(p - center, halfSize)) : 0.0;
  float inRest = step(restCell.x, p.x) * step(p.x, restCell.y);
  half4 row = mix(plainRow.eval(xy), selectedRow.eval(xy), half(max(inDrop, inRest)));
  half4 under = half4(pillColor) * half(smoothstep(0.5, -0.5, sdCapsule(p - pill.xy, pill.zw)));
  under += half4(glow) * half(smoothstep(0.5, -0.5, sdCapsule(p - barCenter, barHalf))) * (1.0 - under.a);
  return row + under * (1.0 - row.a);
}

half4 main(float2 xy) {
  float2 p = xy / pd;
  half4 base = content(p);
  if (lift < 0.002) return base;
  float2 rel = p - center;
  float d = sdCapsule(rel, halfSize);
  if (d > 1.5) return base;

  float e = 0.75;
  float2 n = normalize(float2(
    sdCapsule(rel + float2(e, 0.0), halfSize) - sdCapsule(rel - float2(e, 0.0), halfSize),
    sdCapsule(rel + float2(0.0, e), halfSize) - sdCapsule(rel - float2(0.0, e), halfSize)) + 0.00001);

  // The middle of the drop magnifies evenly around its centre. On top of that, as in the iOS 26
  // tab bar, the flat top and bottom look outward (pulling the bar's own edges in, so the bar reads
  // thinner through the drop), while the rounded ends look inward and magnify more, smearing
  // whatever sits under them into a bright blob around the curve with strong colour fringes.
  float2 q = center + rel / (1.0 + magnify * lift);
  float edge = 1.0 - clamp(-d / band, 0.0, 1.0);
  float bend = edge * edge;
  float2 src = q + n * bend * (distortion + motion * 6.0) * lift;

  // Each rounded end is a radial lens around its cap centre: the pull toward the centre grows with
  // the radius, so magnification is smooth and round and strongest at the tip.
  float capR = halfSize.y;
  float2 cap = center + float2(sign(rel.x) * max(halfSize.x - capR, 0.0), 0.0);
  float2 fromCap = p - cap;
  float capDist = length(fromCap);
  float ends = smoothstep(0.0, 0.7, abs(fromCap.x) / capR) * step(0.0, abs(rel.x) - (halfSize.x - capR));
  float2 lensSrc = cap + (q - cap) * (1.0 - 0.32 * clamp(capDist / capR, 0.0, 1.0) * lift);
  src = mix(src, lensSrc, ends);
  // Squashed, the flat top and bottom only see the bar (a page-coloured lip would read as inset).
  float barEdge = barHalf.y - 1.0;
  src.y = mix(src.y, clamp(src.y, barCenter.y - barEdge, barCenter.y + barEdge), flatten);

  float split = (chroma * (1.0 + 0.2 * ends) + motion * 1.5) * bend * lift;
  half4 g = content(src);
  half r = content(src + n * split).r;
  half b = content(src - n * split).b;
  half4 seen = half4(r, g.g, b, g.a);

  // Where the bent view runs past the bar's edge, show the page there instead of the bar's glass
  // (the native blur is under this canvas, so it's painted over with the page colour).
  float barAtSrc = sdCapsule(src - barCenter, barHalf);
  float barHere = sdCapsule(p - barCenter, barHalf);
  float pastBar = smoothstep(-0.75, 0.75, barAtSrc) * smoothstep(0.75, -0.75, barHere);
  half4 glass = seen + half4(page) * half(pastBar) * (1.0 - seen.a);
  glass = glass + half4(body) * (1.0 - glass.a);

  // Clear glass reads through its light: a faint key-lit line on the rim and a hairline Fresnel
  // glow just inside it.
  float2 keyDir = normalize(float2(0.55, 0.85));
  float light = 0.25 + 0.9 * max(0.0, dot(-n, keyDir)) + 0.45 * max(0.0, dot(n, keyDir));
  float rimLine = smoothstep(1.3, 0.0, abs(d)) * rim * light;
  float fresnel = smoothstep(-2.5, 0.0, d) * 0.12 * rim;
  float shine = rimLine + fresnel;
  glass.rgb += half3(shine) * (1.0 - glass.a * 0.5);
  glass.a = max(glass.a, half(shine));

  // The glass turns fully opaque early in the pop-up and ignores spring overshoot, so the
  // unrefracted icons never show through as a ghost copy.
  float inside = smoothstep(1.0, -0.5, d) * clamp(lift * 2.5, 0.0, 1.0);
  return mix(base, glass, half(inside));
}
`)!;

/**
 * iOS 26-style floating tab bar: native glass behind, and a Skia layer whose droplet refracts
 * the real icons in place while dragging, then snaps to the nearest tab.
 */
export function GlassTabBar({
  items,
  activeIndex,
  onChange,
  dark,
  activeColor: activeColorProp,
  inactiveColor: inactiveColorProp,
  backgroundColor,
  labelFont,
  blurTarget,
  style,
}: GlassTabBarProps) {
  const scheme = useColorScheme();
  const isDark = dark ?? scheme === "dark";
  const defaults = isDark ? DEFAULT_COLORS.dark : DEFAULT_COLORS.light;
  const activeColor = activeColorProp ?? defaults.active;
  const inactiveColor = inactiveColorProp ?? defaults.inactive;
  // Callers often rebuild `items` every render; everything drawn from them is keyed on their content.
  const itemsKey = items
    .map((item) => `${item.key}\u0000${item.label}\u0000${item.icon.stroke}\u0000${item.icon.solid ?? ""}`)
    .join("\u0001");
  const page = useMemo(() => premultiplied(backgroundColor ?? defaults.background, 1), [backgroundColor, defaults.background]);
  const { width: windowWidth } = useWindowDimensions();
  const k = tabBarScale(windowWidth);
  const HEIGHT = Math.round(TAB_BAR_HEIGHT * k);
  const INSET = BASE_INSET * k;
  const PILL_H = HEIGHT - INSET * 2;
  const ICON = BASE_ICON * k;
  const LABEL_SIZE = BASE_LABEL * k;
  const ICON_Y = BASE_ICON_Y * k;
  const LABEL_Y = BASE_LABEL_Y * k;
  const [width, setWidth] = useState(0);
  const slot = width > 0 ? (width - INSET * 2) / items.length : 0;
  const fontManager = useFonts(labelFont ? { TabLabel: [labelFont] } : NO_FONTS);
  // With no custom font the provider is empty and Skia falls back to the system font.
  const fontsReady = fontManager !== null;

  const reduceMotion = useReducedMotion();
  // Drop position (left of its tab cell, dp), its velocity (dp/ms) and where it's heading.
  const x = useSharedValue(0);
  const xv = useSharedValue(0);
  const goal = useSharedValue(0);
  const lift = useSharedValue(0);
  // How far the drop has widened (0..1); it lags `lift` on the way up and on the way down.
  const widen = useSharedValue(0);
  // Set on release until the drop has reached its tab and starts sinking into the pill.
  const landing = useSharedValue(false);
  // 0..1 while the bar is held: it swells and brightens.
  const press = useSharedValue(0);
  // ms since the last press, counted by the frame callback.
  const sincePress = useSharedValue(0);
  const dragging = useSharedValue(false);
  const lastIndex = useSharedValue(activeIndex);
  // Goal and finger x at press, and whether the press has become a drag.
  const anchorX = useSharedValue(0);
  const anchorFinger = useSharedValue(0);
  const moved = useSharedValue(false);
  // The tab drawn selected at rest; moved on release so the new tab lights up before navigation.
  const restIndex = useSharedValue(activeIndex);
  // How squashed the drop is by drag speed (0..1) and how much taller it bulges after slowing down,
  // with their spring velocities.
  const flat = useSharedValue(0);
  const flatV = useSharedValue(0);
  const tall = useSharedValue(0);
  const tallV = useSharedValue(0);
  const liquidRunning = useSharedValue(false);
  // Read by the lens uniforms so bumping it forces a repaint without moving anything.
  const repaint = useSharedValue(0);
  // Where the last settle was aimed (NaN until the first one).
  const settledOn = useSharedValue(Number.NaN);
  // Set once the frame callback exists; the callback stops itself through this on the JS thread.
  const liquidRef = useRef<{ setActive: (active: boolean) => void } | null>(null);
  const stopLiquid = () => {
    if (liquidRunning.get()) return;
    liquidRef.current?.setActive(false);
    setHighFrameRate(false);
  };

  // The liquid simulation only runs while the droplet moves (drag, tap, settle) and stops itself
  // once everything is at rest, so an idle tab bar costs nothing. All springs are integrated in
  // small fixed sub-steps, so they behave the same at 60 or 120 Hz and through dropped frames.
  const liquid = useFrameCallback((info) => {
    const dt = Math.min(48, info.timeSincePreviousFrame ?? 16);
    const steps = Math.ceil(dt / STEP_MS);
    const h = dt / steps;
    const min = INSET;
    const max = width - INSET - slot;
    const give = END_GIVE * k;
    const held = dragging.get();
    sincePress.set(sincePress.get() + dt);
    let g = goal.get();
    const v0 = xv.get();
    if (held && ((g <= min && v0 < 0) || (g >= max && v0 > 0))) {
      g += Math.max(-give, Math.min(give, v0 * END_CARRY_MS));
    }
    let p = x.get();
    let v = xv.get();
    let f = flat.get();
    let fv = flatV.get();
    let tl = tall.get();
    let tv = tallV.get();
    const jelly = held && moved.get() && !reduceMotion;
    for (let i = 0; i < steps; i++) {
      const before = g - p;
      const lastSpeed = Math.abs(v);
      const past = p < min || p > max;
      const omega = past ? END_OMEGA : FOLLOW_OMEGA;
      const zeta = past ? END_ZETA : FOLLOW_ZETA;
      v += (omega * omega * before - 2 * zeta * omega * v) * h;
      p += v * h;
      if (!held && before * (g - p) < 0) {
        // Landings never swing past the tab, so a tap to the last tab can't leave the bar.
        p = g;
        v = 0;
      } else if (p < min - give || p > max + give) {
        p = Math.min(max + give, Math.max(min - give, p));
        v = 0;
      }
      const speed = Math.abs(v);
      if (jelly && speed < lastSpeed) tv += (lastSpeed - speed) * DECEL_KICK;
      const flatTarget = jelly ? smoothstep(FLAT_FROM, FLAT_TO, speed) : 0;
      fv += (MORPH_OMEGA * MORPH_OMEGA * (flatTarget - f) - 2 * MORPH_OMEGA * fv) * h;
      f += fv * h;
      tv += (-JELLY_OMEGA * JELLY_OMEGA * tl - 2 * JELLY_ZETA * JELLY_OMEGA * tv) * h;
      tl += tv * h;
    }
    if (tl > TALL_MAX) {
      tl = TALL_MAX;
      tv = Math.min(0, tv);
    }
    x.set(p);
    xv.set(v);
    flat.set(Math.min(1, Math.max(0, f)));
    flatV.set(fv);
    tall.set(tl);
    tallV.set(tv);

    if (landing.get() && sincePress.get() >= MIN_LIFT_MS && Math.abs(g - p) < LAND_NEAR * k) {
      landing.set(false);
      lift.set(withSpring(0, LIFT_OUT));
      widen.set(withDelay(WIDEN_OUT_DELAY, withSpring(0, LIFT_OUT)));
      press.set(withSpring(0, PRESS_OUT));
    }

    const atRest =
      !held &&
      !landing.get() &&
      lift.get() < 0.001 &&
      widen.get() < 0.001 &&
      Math.abs(g - p) < 0.01 &&
      Math.abs(v) < 0.00002 &&
      Math.abs(f) < 0.002 &&
      Math.abs(tl) < 0.002 &&
      Math.abs(tv) < 0.00002;
    if (atRest && liquidRunning.get()) {
      liquidRunning.set(false);
      x.set(g);
      xv.set(0);
      flat.set(0);
      flatV.set(0);
      tall.set(0);
      tallV.set(0);
      scheduleOnRN(stopLiquid);
    }
  }, false);
  useEffect(() => {
    liquidRef.current = liquid;
  }, [liquid]);
  // Callers flag `liquidRunning` on the UI thread first, so a stop already queued sees it and backs off.
  // The drop moves at the screen's top refresh rate (120 Hz on adaptive screens), as on iOS.
  const startLiquid = () => {
    liquid.setActive(true);
    setHighFrameRate(true);
  };
  useEffect(() => () => setHighFrameRate(false), []);

  // Moves the drop when the tab changes from outside (links, first layout). A release already
  // sent it there, so that case doesn't restart it mid-flight.
  useEffect(() => {
    if (slot === 0 || dragging.get()) return;
    restIndex.set(activeIndex);
    const target = INSET + activeIndex * slot;
    if (lastIndex.get() === activeIndex && settledOn.get() === target) return;
    const first = Number.isNaN(settledOn.get());
    lastIndex.set(activeIndex);
    settledOn.set(target);
    if (first) {
      goal.set(target);
      x.set(target);
      return;
    }
    runOnUISync(() => {
      "worklet";
      goal.set(target);
      liquidRunning.set(true);
    });
    startLiquid();
  }, [activeIndex, dragging, goal, lastIndex, liquidRunning, restIndex, settledOn, slot, x]);

  const indexAt = (px: number) => {
    "worklet";
    return Math.min(items.length - 1, Math.max(0, Math.floor((px - INSET) / Math.max(1, slot))));
  };

  // Everything here runs on the UI thread; the only JS hops are waking the liquid simulation and
  // the final tab switch, so React never renders during a drag.
  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      dragging.set(true);
      landing.set(false);
      liquidRunning.set(true);
      scheduleOnRN(startLiquid);
      sincePress.set(0);
      lift.set(withSpring(1, LIFT_IN));
      widen.set(withSpring(1, WIDEN_IN));
      press.set(withSpring(1, PRESS_IN));
      const index = indexAt(event.x);
      const home = INSET + index * slot;
      anchorX.set(home);
      anchorFinger.set(event.x);
      moved.set(false);
      goal.set(home);
      lastIndex.set(index);
    })
    .onChange((event) => {
      const travel = event.x - anchorFinger.get();
      if (!moved.get()) {
        if (Math.abs(travel) < DRAG_SLOP) return;
        moved.set(true);
      }
      // No rubber band: the goal stops at the end tabs; only the drop's own momentum carries it past.
      const target = Math.min(width - INSET - slot, Math.max(INSET, anchorX.get() + travel));
      goal.set(target);
      // The tab under the goal's centre is the one picked, wherever the finger grabbed it.
      const index = indexAt(target + slot / 2);
      lastIndex.set(index);
    })
    .onFinalize(() => {
      const index = lastIndex.get();
      const target = INSET + index * slot;
      dragging.set(false);
      restIndex.set(index);
      settledOn.set(target);
      goal.set(target);
      landing.set(true);
      if (index !== activeIndex) scheduleOnRN(onChange, index);
    });

  const uniforms = useDerivedValue(() => {
    repaint.get();
    const l = lift.get();
    const w = Math.max(0, widen.get());
    const motion = Math.min(1, Math.abs(xv.get()) / FULL_SPEED);
    const f = flat.get();
    const tl = tall.get() * l;
    // Squashed, the drop's rim lies on the bar's rim (half a dp inside its edge); a lifted drop is
    // never shorter than the bar.
    const lifted = (PILL_H / 2) * (1 + l * GROW_Y) * (1 + TALL_GROW * tl);
    const barHalf = HEIGHT / 2 - 0.5;
    const flatHalf = Math.min(lifted, barHalf);
    const floor = PILL_H / 2 + (barHalf - PILL_H / 2) * Math.min(1, Math.max(0, l));
    const halfY = Math.max(floor, lifted + (flatHalf - lifted) * f);
    // The drop may grow past the bar's ends only as far as it has widened.
    const give = w * (slot / 2) * GROW_X;
    const cx = BLEED + x.get() + slot / 2;
    const hx = (slot / 2) * (1 + w * GROW_X) * (1 + FLAT_WIDEN * f - TALL_NARROW * tl);
    const left = Math.max(cx - hx, BLEED + INSET - give);
    const right = Math.min(cx + hx, BLEED + width - INSET + give);
    return {
      pd: PD,
      center: [(left + right) / 2, BLEED + HEIGHT / 2],
      halfSize: [Math.max(PILL_H / 2, (right - left) / 2), halfY],
      lift: l,
      band: halfY * 0.6,
      distortion: RIM_BEND * k,
      magnify: MAGNIFY,
      chroma: 1.4,
      body: isDark ? BODY_DARK : BODY_LIGHT,
      rim: isDark ? 0.45 : 0.7,
      motion,
      barCenter: [BLEED + width / 2, BLEED + HEIGHT / 2],
      barHalf: [width / 2, HEIGHT / 2],
      page,
      flatten: f,
      // The rest tab stays lit until the drop has lifted enough to take over (and lights again as
      // it lands), so a press never shows the active icon plain for a frame.
      restCell: l > REST_HANDOFF ? [0, -1] : [BLEED + INSET + slot * restIndex.get(), BLEED + INSET + slot * (restIndex.get() + 1)],
      // At rest the drop is the selected tab's pill: its own shape, tinted, fading out as it lifts.
      pill: [(left + right) / 2, BLEED + HEIGHT / 2, Math.max(PILL_H / 2, (right - left) / 2), halfY],
      pillColor: (isDark ? PILL_DARK : PILL_LIGHT).map((c) => c * (1 - l)),
      glow: press.get() * (isDark ? 0.05 : 0.12),
    };
  });

  const barStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + PRESS_SCALE * press.get() }] }));
  const labels = useMemo(() => {
    if (!fontsReady || slot === 0) return null;
    const make = (label: string, color: string) => {
      const builder = Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Center }, fontManager!);
      builder.pushStyle({
        color: Skia.Color(color),
        ...(labelFont ? { fontFamilies: ["TabLabel"] } : null),
        fontSize: LABEL_SIZE,
        // Keeps labels legible over busy content now that the glass is clearer.
        shadows: [{ color: Skia.Color(isDark ? ICON_SHADOW_DARK : ICON_SHADOW_LIGHT), offset: { x: 0, y: 0.5 }, blurRadius: 2 }],
      });
      builder.addText(label);
      const paragraph = builder.build();
      paragraph.layout(slot);
      return paragraph;
    };
    return {
      plain: items.map((item) => make(item.label, inactiveColor)),
      selected: items.map((item) => make(item.label, activeColor)),
    };
  }, [LABEL_SIZE, activeColor, fontManager, fontsReady, inactiveColor, isDark, itemsKey, labelFont, slot]);

  const renderRow = (isSelected: (index: number) => boolean, rowLabels: NonNullable<typeof labels>["plain"]) =>
    items.map((item, index) => {
      const selected = isSelected(index);
      const color = selected ? activeColor : inactiveColor;
      const cx = BLEED + INSET + slot * index + slot / 2;
      const icon = item.icon;
      const shadow = isDark ? ICON_SHADOW_DARK : ICON_SHADOW_LIGHT;
      const solid = selected && icon.solid;
      return (
        <Group key={item.key}>
          {/* A soft offset copy under each icon keeps it legible over the clearer glass. */}
          <Group transform={[{ translateX: cx - ICON / 2 }, { translateY: BLEED + ICON_Y + 0.6 }, { scale: ICON / 24 }]}>
            <Path
              path={solid ? icon.solid! : icon.stroke}
              style={solid ? "fill" : "stroke"}
              strokeWidth={2.6}
              strokeCap="round"
              strokeJoin="round"
              color={shadow}
            />
          </Group>
          <Group transform={[{ translateX: cx - ICON / 2 }, { translateY: BLEED + ICON_Y }, { scale: ICON / 24 }]}>
            {solid ? (
              <>
                <Path path={icon.solid!} color={color} />
                {icon.cutout ? (
                  <Path path={icon.cutout} style="stroke" strokeWidth={2} strokeCap="round" strokeJoin="round" blendMode="clear" />
                ) : null}
              </>
            ) : (
              <Path
                path={icon.stroke}
                style="stroke"
                strokeWidth={selected ? 2.1 : 1.7}
                strokeCap="round"
                strokeJoin="round"
                color={color}
              />
            )}
            {icon.dot ? <Path path={icon.dot} color={solid ? "#000000" : color} blendMode={solid ? "clear" : "srcOver"} /> : null}
          </Group>
          <Paragraph paragraph={rowLabels[index]} x={BLEED + INSET + slot * index} y={BLEED + LABEL_Y} width={slot} />
        </Group>
      );
    });
  // Both rows (with the bar's rim, which the drop bends inward with the bar) are rendered once into
  // device-pixel images, so a frame is one shaded rect instead of re-recording every icon.
  const canvasW = width + BLEED * 2;
  const canvasH = HEIGHT + BLEED * 2;
  const [rows, setRows] = useState<{ plain: SkImage; selected: SkImage; key: string } | null>(null);
  const rowsKey = `${canvasW}x${canvasH}:${activeColor}:${inactiveColor}:${isDark}:${itemsKey}`;
  useEffect(() => {
    if (!labels || slot === 0) return;
    let cancelled = false;
    const size = { width: Math.ceil(canvasW * PD), height: Math.ceil(canvasH * PD) };
    const rim = (
      <RoundedRect x={BLEED + 0.5} y={BLEED + 0.5} width={width - 1} height={HEIGHT - 1} r={HEIGHT / 2} style="stroke" strokeWidth={1}>
        <LinearGradient
          start={vec(BLEED, BLEED)}
          end={vec(BLEED + width * 0.6, BLEED + HEIGHT)}
          colors={isDark ? RIM_DARK : RIM_LIGHT}
          positions={[0, 0.35, 0.8, 1]}
        />
      </RoundedRect>
    );
    const draw = (selected: boolean) =>
      drawAsImage(
        <Group transform={[{ scale: PD }]}>
          {rim}
          {renderRow(() => selected, selected ? labels.selected : labels.plain)}
        </Group>,
        size,
      );
    Promise.all([draw(false), draw(true)]).then(([plain, selected]) => {
      if (!cancelled && plain && selected) setRows({ plain, selected, key: rowsKey });
    });
    return () => {
      cancelled = true;
    };
  }, [labels, rowsKey]);
  const canvasReady = slot > 0 && rows !== null;
  // Android can drop the canvas's first frame on a cold start (the surface isn't attached yet), and
  // an idle bar never draws again, so it stays empty until touched. Repaint once it's on screen.
  useEffect(() => {
    if (!canvasReady) return;
    const timers = [100, 500].map((ms) => setTimeout(() => repaint.set(repaint.get() + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, [canvasReady, repaint]);

  return (
    <Animated.View
      accessibilityRole="tablist"
      style={[styles.bar, { height: HEIGHT, borderRadius: HEIGHT / 2 }, style, barStyle]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <GlassSurface dark={isDark} radius={HEIGHT / 2} blurTarget={blurTarget} clearing={press} />

      {canvasReady ? (
        <Canvas style={[styles.canvas, { width: canvasW, height: canvasH }]} pointerEvents="none">
          <Group transform={[{ scale: 1 / PD }]}>
            <Fill>
              <Shader source={LENS} uniforms={uniforms}>
                <ImageShader image={rows.plain} x={0} y={0} width={rows.plain.width()} height={rows.plain.height()} fit="fill" />
                <ImageShader image={rows.selected} x={0} y={0} width={rows.selected.width()} height={rows.selected.height()} fit="fill" />
              </Shader>
            </Fill>
          </Group>
        </Canvas>
      ) : null}

      <GestureDetector gesture={pan}>
        <View style={[styles.row, { paddingHorizontal: INSET }]}>
          {items.map((item, index) => (
            <View
              key={item.key}
              accessible
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: index === activeIndex }}
              accessibilityActions={ACTIVATE}
              onAccessibilityAction={() => onChange(index)}
              style={styles.item}
            />
          ))}
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const ACTIVATE = [{ name: "activate" as const }];

const styles = StyleSheet.create({
  bar: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  canvas: { position: "absolute", top: -BLEED, left: -BLEED },
  row: { flex: 1, flexDirection: "row" },
  item: { flex: 1 },
});
