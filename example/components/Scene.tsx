import {
  BlurMask,
  Circle,
  drawAsImage,
  Group,
  ImageFormat,
  LinearGradient,
  Path,
  Rect,
  Skia,
  vec,
  type SkPath,
} from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import { Image, PixelRatio, View } from "react-native";

import type { SceneSpec } from "./data";

const rendered = new Map<string, string>();

/**
 * An illustrated landscape (sky, sun, layered terrain) standing in for a photo. It's drawn once
 * offscreen and shown as an image, so hidden tabs come back without a blank frame.
 */
export function Scene({
  spec,
  width,
  height,
  radius = 24,
  scrim = true,
}: {
  spec: SceneSpec;
  width: number;
  height: number;
  radius?: number;
  scrim?: boolean;
}) {
  const key = `${spec.seed}:${Math.round(width)}x${Math.round(height)}:${scrim}`;
  const [image, setImage] = useState(() => ({ key, uri: rendered.get(key) }));
  const uri = image.key === key ? image.uri : rendered.get(key);

  useEffect(() => {
    if (rendered.has(key)) return;
    let live = true;
    const scale = Math.min(PixelRatio.get(), 2);
    drawAsImage(
      <Group transform={[{ scale }]}>
        <SceneArt spec={spec} width={width} height={height} scrim={scrim} />
      </Group>,
      { width: Math.round(width * scale), height: Math.round(height * scale) },
    ).then((art) => {
      if (!art) return;
      const data = `data:image/jpeg;base64,${art.encodeToBase64(ImageFormat.JPEG, 88)}`;
      rendered.set(key, data);
      if (live) setImage({ key, uri: data });
    });
    return () => {
      live = false;
    };
  }, [key, spec, width, height, scrim]);

  const box = { width, height, borderRadius: radius, overflow: "hidden" as const, backgroundColor: spec.sky[spec.sky.length - 1] };
  return uri ? <Image source={{ uri }} style={box} fadeDuration={0} /> : <View style={box} />;
}

function SceneArt({ spec, width, height, scrim }: { spec: SceneSpec; width: number; height: number; scrim: boolean }) {
  const layers = buildLayers(spec, width, height);
  const stars = spec.stars ? buildStars(spec.seed, width, height) : [];
  const sun = { x: spec.sun.x * width, y: spec.sun.y * height, r: spec.sun.r * Math.min(width, height) };

  return (
    <Group>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={spec.sky} />
      </Rect>
      {stars.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={s.r} color="white" opacity={s.o} />
      ))}
      <Circle cx={sun.x} cy={sun.y} r={sun.r * 2.2} color={spec.sun.color} opacity={0.35}>
        <BlurMask blur={sun.r * 1.4} style="normal" />
      </Circle>
      <Circle cx={sun.x} cy={sun.y} r={sun.r} color={spec.sun.color} />
      {spec.balloons?.map((color, i) => {
        const rng = random(spec.seed * 31 + i);
        const x = width * (0.15 + 0.7 * rng());
        const y = height * (0.12 + 0.3 * rng());
        const r = Math.min(width, height) * (0.025 + 0.03 * rng());
        return (
          <Group key={i}>
            <Circle cx={x} cy={y} r={r} color={color} />
            <Rect x={x - r * 0.25} y={y + r * 1.25} width={r * 0.5} height={r * 0.4} color="#5A3A2A" />
          </Group>
        );
      })}
      {layers.map((path, i) => (
        <Path key={i} path={path} color={spec.layers[i]} />
      ))}
      {spec.kind === "city" ? <Windows spec={spec} width={width} height={height} /> : null}
      {scrim ? (
        <Rect x={0} y={height * 0.4} width={width} height={height * 0.6}>
          <LinearGradient start={vec(0, height * 0.4)} end={vec(0, height)} colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]} />
        </Rect>
      ) : null}
    </Group>
  );
}

function Windows({ spec, width, height }: { spec: SceneSpec; width: number; height: number }) {
  const rng = random(spec.seed + 7);
  const base = height * 0.92;
  const rects = Array.from({ length: 70 }, () => ({ x: width * rng(), y: base - height * 0.3 * rng(), o: 0.35 + 0.6 * rng() }));
  return (
    <>
      {rects.map((w, i) => (
        <Rect key={i} x={w.x} y={w.y} width={2.5} height={3.5} color="#FFD58A" opacity={w.o} />
      ))}
    </>
  );
}

function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Terrain silhouettes from back to front; each layer sits lower and flatter than the one behind it.
function buildLayers(spec: SceneSpec, w: number, h: number): SkPath[] {
  const n = spec.layers.length;
  const horizon = spec.horizon ?? 0.5;
  return spec.layers.map((_, i) => {
    const rng = random(spec.seed * 101 + i);
    const base = h * horizon + h * (1 - horizon) * (i / n) * 0.8;
    const path = Skia.PathBuilder.Make();
    path.moveTo(0, h);
    if (spec.kind === "peaks") {
      const amp = h * 0.22 * (1 - (i / n) * 0.55);
      let x = -w * 0.05;
      let up = rng() > 0.5;
      path.lineTo(x, base);
      while (x < w * 1.05) {
        x += w * (0.1 + 0.14 * rng());
        path.lineTo(x, base - (up ? amp * (0.55 + 0.45 * rng()) : amp * 0.25 * rng()));
        up = !up;
      }
    } else if (spec.kind === "city") {
      let x = 0;
      const amp = h * 0.32 * (1 - (i / n) * 0.4);
      while (x < w) {
        const bw = w * (0.05 + 0.08 * rng());
        const top = base - amp * (0.3 + 0.7 * rng());
        path.lineTo(x, top);
        path.lineTo(x + bw, top);
        x += bw;
      }
      path.lineTo(w, base);
    } else {
      const { amp, freq } = { dunes: { amp: 0.09, freq: 1.4 }, hills: { amp: 0.07, freq: 2 }, waves: { amp: 0.018, freq: 7 } }[spec.kind];
      const a = h * amp * (1 - (i / n) * 0.3);
      const phase = rng() * Math.PI * 2;
      const phase2 = rng() * Math.PI * 2;
      const f = (freq * (1 + i * 0.35) * Math.PI * 2) / w;
      for (let x = 0; x <= w + 4; x += 4) {
        path.lineTo(x, base - a * (0.65 * Math.sin(x * f + phase) + 0.35 * Math.sin(x * f * 2.3 + phase2)));
      }
    }
    path.lineTo(w, h);
    path.close();
    return path.detach();
  });
}

function buildStars(seed: number, w: number, h: number) {
  const rng = random(seed + 3);
  return Array.from({ length: 40 }, () => ({ x: w * rng(), y: h * 0.55 * rng(), r: 0.4 + rng() * 1.1, o: 0.3 + 0.7 * rng() }));
}
