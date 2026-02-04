import { CSSColor, RGBColor, SeverityType } from '../types';

import colorString from 'color-string';

export const COLORS = [
  "#4269d0",
  "#f4bd4a",
  "#ff725c",
  "#6cc5b0",
  "#a463f2",
  "#ff8ab7",
  "#9c6b4e",
  "#97bbf5",
  "#01ab63",
  "#9498a0",
  "#094bad",
  "#c99000",
  "#d84f3e",
  "#49a28f",
  "#048732",
  "#d96895",
  "#8043ce",
  "#7599d1",
  "#7a4c31",
  "#74787f",
  "#6989f4",
  "#ffd444",
  "#ff957c",
  "#8fe9d3",
  "#62cc71",
  "#ffadda",
  "#c884ff",
  "#badeff",
  "#bf8b6d",
  "#b6bac2",
  "#927acc",
  "#97ee3f",
  "#bf3947",
  "#9f5b00",
  "#f48758",
  "#8caed6",
  "#f2b94f",
  "#eff26e",
  "#e43872",
  "#d9b100",
  "#9d7a00",
  "#698cff",
  "#d9d9d9",
  "#00d27e",
  "#d06800",
  "#009f82",
  "#c49200",
  "#cbe8ff",
  "#fecddf",
  "#c27eb6",
  "#8cd2ce",
  "#c4b8d9",
  "#f883b0",
  "#a49100",
  "#f48800",
  "#27d0df",
  "#a04a9b",
];

// export const COLORS: RGBColor[] = [
//   [66, 105, 208, 1],
//   [244, 189, 74, 1],
//   [255, 114, 92, 1],
//   [108, 197, 176, 1],
//   [164, 99, 242, 1],
//   [255, 138, 183, 1],
//   [156, 107, 78, 1],
//   [151, 187, 245, 1],
//   [1, 171, 99, 1],
//   [148, 152, 160, 1],
//   [9, 75, 173, 1],
//   [201, 144, 0, 1],
//   [216, 79, 62, 1],
//   [73, 162, 143, 1],
//   [4, 135, 50, 1],
//   [217, 104, 149, 1],
//   [128, 67, 206, 1],
//   [117, 153, 209, 1],
//   [122, 76, 49, 1],
//   [116, 120, 127, 1],
//   [105, 137, 244, 1],
//   [255, 212, 68, 1],
//   [255, 149, 124, 1],
//   [143, 233, 211, 1],
//   [98, 204, 113, 1],
//   [255, 173, 218, 1],
//   [200, 132, 255, 1],
//   [186, 222, 255, 1],
//   [191, 139, 109, 1],
//   [182, 186, 194, 1],
//   [146, 122, 204, 1],
//   [151, 238, 63, 1],
//   [191, 57, 71, 1],
//   [159, 91, 0, 1],
//   [244, 135, 88, 1],
//   [140, 174, 214, 1],
//   [242, 185, 79, 1],
//   [239, 242, 110, 1],
//   [228, 56, 114, 1],
//   [217, 177, 0, 1],
//   [157, 122, 0, 1],
//   [105, 140, 255, 1],
//   [217, 217, 217, 1],
//   [0, 210, 126, 1],
//   [208, 104, 0, 1],
//   [0, 159, 130, 1],
//   [196, 146, 0, 1],
//   [203, 232, 255, 1],
//   [254, 205, 223, 1],
//   [194, 126, 182, 1],
//   [140, 210, 206, 1],
//   [196, 184, 217, 1],
//   [248, 131, 176, 1],
//   [164, 145, 0, 1],
//   [244, 136, 0, 1],
//   [39, 208, 223, 1],
//   [160, 74, 155, 1]
// ];

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

export function getTextColor(
  textColorType?: CSSColor,
  defaultColor?: CSSColor,
  backgroundColor?: CSSColor,
): CSSColor {
  return textColorType || calcTextColor(backgroundColor) || defaultColor;
}

export function getBlend(start: SeverityType, end: SeverityType, state: number): CSSColor {
  if (start.from === end.from) return start.color;

  const range: number = end.from - start.from;
  const position: number = state - start.from;

  const t: number = Math.max(0, Math.min(1, position / range));

  const startRGBA = toRGB(start.color) ?? [0,0,0,0];
  const endRGBA = toRGB(end.color) ?? [0,0,0,0];

  const r = startRGBA[0] + (endRGBA[0] - startRGBA[0]) * t;
  const g = startRGBA[1] + (endRGBA[1] - startRGBA[1]) * t;
  const b = startRGBA[2] + (endRGBA[2] - startRGBA[2]) * t;
  const a = startRGBA[3] + (endRGBA[3] - startRGBA[3]) * t;

  return colorString.to.rgb(
    Math.round(r),
    Math.round(g),
    Math.round(b),
    a
  ) as CSSColor;
}