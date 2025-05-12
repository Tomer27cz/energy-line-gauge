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

export const toHEX = (
  color: [number, number, number] | undefined | string
): string | undefined =>{
  if (!color) {return undefined;}
  if (typeof color === "string") {return color;}
  return "#" + ((1 << 24) | (color[0] << 16) | (color[1] << 8) | color[2]).toString(16).slice(1).toUpperCase();
}

export const toRGB = (
  color: [number, number, number] | undefined | string
): [number, number, number] | undefined => {
  if (!color) {return undefined;}
  if (typeof color === "string") {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return [r, g, b];
  }
  return color;
}

export const textColor = (
  backgroundColor: [number, number, number] | undefined | string
): [number, number, number] | undefined => {
  if (typeof backgroundColor === "string") {backgroundColor = toRGB(backgroundColor);}
  if (!backgroundColor) {return undefined;}
  const [r, g, b] = backgroundColor;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 125 ? [0, 0, 0] : [255, 255, 255];
}