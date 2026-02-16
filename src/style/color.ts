import { CSSColor, RGBColor, SeverityType } from '../types';

import colorString from 'color-string';
import { CONFIG_DEFAULTS } from '../config/defaults';

export function toRGB(color: CSSColor | RGBColor | [number, number, number]): RGBColor {
  if (!color) return [0,0,0,0];

  if (Array.isArray(color)) {
    if (color.length === 3) return [...color, 1] as RGBColor;
    return color;
  }

  if (color.startsWith('var(')) {
    const varName = color.slice(4, -1).trim();
    color = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  return colorString.get.rgb(color) as RGBColor ?? [0,0,0,0];
}

export function rgbToHex(color: RGBColor | undefined): string | undefined {
  if (!color) return undefined;
  const [r, g, b] = color;

  const toHex = (c: number): string => {
    const clamped = Math.max(0, Math.min(255, Math.round(c)));
    const hex = clamped.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function calcTextColor(backgroundColor: CSSColor): CSSColor {
  if (!backgroundColor) return;

  const [r, g, b, _] = toRGB(backgroundColor);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 125 ? "black" : "white";
}

export function getLineTextColor(
  textColorType?: CSSColor,
  backgroundColor?: CSSColor,
): CSSColor {
  return textColorType || calcTextColor(backgroundColor) || CONFIG_DEFAULTS.line_text_color;
}

export function getBlend(start: SeverityType, end: SeverityType, state: number): CSSColor {
  if (start.from === end.from) return start.color;

  const range: number = end.from - start.from;
  const position: number = state - start.from;

  const t: number = Math.max(0, Math.min(1, position / range));

  const startRGBA = toRGB(start.color) ?? [0,0,0,0];
  const endRGBA = toRGB(end.color) ?? [0,0,0,0];

  const r: number = startRGBA[0] + (endRGBA[0] - startRGBA[0]) * t;
  const g: number = startRGBA[1] + (endRGBA[1] - startRGBA[1]) * t;
  const b: number = startRGBA[2] + (endRGBA[2] - startRGBA[2]) * t;
  const a: number = startRGBA[3] + (endRGBA[3] - startRGBA[3]) * t;

  return colorString.to.rgb(
    Math.round(r),
    Math.round(g),
    Math.round(b),
    a
  ) as CSSColor;
}