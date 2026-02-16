// Actions
export const DEFAULT_ACTIONS = ["more-info", "toggle", "navigate", "url", "perform-action", "assist", "none"] as const;

// Styling Options
export const CORNER_TYPES = ['square', 'lite-rounded', 'medium-rounded', 'rounded', 'circular'] as const;

export const SORTING_TYPES = ['alpha-asc', 'alpha-desc', 'value-asc', 'value-desc', 'none'] as const;

export const LINE_SEPARATOR_WIDTH_TYPES = [
  'total020', 'total030', 'total040', 'total050', 'total060', 'total070', 'total080', 'total090', 'total100',
  'each002', 'each004', 'each006', 'each008', 'each010', 'each012', 'each014', 'each016', 'each018', 'each020'
] as const; // [mode][width], width = {number}{number}.{number}

export const TEXT_STYLE_TYPES = [
  'weight-lighter', 'weight-bold', 'weight-bolder',
  'style-italic',
  'decoration-underline', 'decoration-overline', 'decoration-line-through',
  'transform-uppercase', 'transform-lowercase', 'transform-capitalize',
  'family-monospace',
  'shadow-light', 'shadow-medium', 'shadow-heavy', 'shadow-hard', 'shadow-neon',
  'black-outline', 'white-outline'
] as const;

export const TEXT_OVERFLOW_TYPES = ['ellipsis', 'clip', 'tooltip', 'tooltip-segment', 'fade'] as const;
export const OVERFLOW_DIRECTION_TYPES = ['left', 'right'] as const;
export const INDICATOR_TYPES = ['circle', 'icon', 'icon-fallback', 'none', 'name', 'state', 'percentage'] as const;

// Positioning
export const POSITION_TYPES = [
  'left', 'right', 'none',
  'top-left', 'top-middle', 'top-center', 'top-right',
  'bottom-left', 'bottom-middle', 'bottom-center', 'bottom-right'
] as const;

export const VALUE_POSITION_TYPES = [...POSITION_TYPES, 'in-title-right', 'in-title-left'] as const;
export const LINE_POSITION_TYPES = [...POSITION_TYPES, 'center'] as const;
export const LEGEND_ALIGNMENT_TYPES = ['left', 'right', 'center', 'space-around', 'space-between', 'space-evenly', 'new-line', 'new-line-left', 'new-line-right'] as const;

// Content Configuration
export const STATE_CONTENT_TYPES = ['name', 'state', 'last_changed', 'last_updated', 'percentage', 'icon'] as const;
export const UNTRACKED_STATE_CONTENT_TYPES = ['name', 'state', 'percentage', 'icon'] as const;

// Statistics
export const STATISTICS_PERIOD_TYPES = ['5minute', 'hour', 'day', 'week', 'month'] as const;
export const STATISTICS_FUNCTION_TYPES = ['change', 'last_reset', 'max', 'mean', 'min', 'state', 'sum'] as const;

// Formatting
export enum NumberFormat {
  language = "language",
  system = "system",
  comma_decimal = "comma_decimal",
  decimal_comma = "decimal_comma",
  space_comma = "space_comma",
  none = "none",
}

export enum TimeFormat {
  language = "language",
  system = "system",
  am_pm = "12",
  twenty_four = "24",
}

// Material Design Icons

export const mdiClose = "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";
export const mdiMenuDown = "M7,10L12,15L17,10H7Z";
export const mdiMenuUp = "M7,15L12,10L17,15H7Z";
export const mdiPalette = "M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A1.5,1.5 0 0,0 13.5,19.5C13.5,19.11 13.35,18.76 13.11,18.5C12.88,18.23 12.73,17.88 12.73,17.5A1.5,1.5 0 0,1 14.23,16H16A5,5 0 0,0 21,11C21,6.58 16.97,3 12,3Z";
export const mdiGestureTap = "M10,9A1,1 0 0,1 11,8A1,1 0 0,1 12,9V13.47L13.21,13.6L18.15,15.79C18.68,16.03 19,16.56 19,17.14V21.5C18.97,22.32 18.32,22.97 17.5,23H11C10.62,23 10.26,22.85 10,22.57L5.1,18.37L5.84,17.6C6.03,17.39 6.3,17.28 6.58,17.28H6.8L10,19V9M11,5A4,4 0 0,1 15,9C15,10.5 14.2,11.77 13,12.46V11.24C13.61,10.69 14,9.89 14,9A3,3 0 0,0 11,6A3,3 0 0,0 8,9C8,9.89 8.39,10.69 9,11.24V12.46C7.8,11.77 7,10.5 7,9A4,4 0 0,1 11,5Z";
export const mdiRuler = "M1.39,18.36L3.16,16.6L4.58,18L5.64,16.95L4.22,15.54L5.64,14.12L8.11,16.6L9.17,15.54L6.7,13.06L8.11,11.65L9.53,13.06L10.59,12L9.17,10.59L10.59,9.17L13.06,11.65L14.12,10.59L11.65,8.11L13.06,6.7L14.47,8.11L15.54,7.05L14.12,5.64L15.54,4.22L18,6.7L19.07,5.64L16.6,3.16L18.36,1.39L22.61,5.64L5.64,22.61L1.39,18.36Z";
export const mdiTextShort = "M4,9H20V11H4V9M4,13H14V15H4V13Z";
export const mdiDelete = "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";
export const mdiPencil = "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";
export const mdiLightningBolt = "M11 15H6L13 1V9H18L11 23V15Z";
export const mdiListBox = "M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M7 7H9V9H7V7M7 11H9V13H7V11M7 15H9V17H7V15M17 17H11V15H17V17M17 13H11V11H17V13M17 9H11V7H17V9Z";
export const mdiChartBar = "M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z";
export const mdiChartAreaspline = "M17.45,15.18L22,7.31V19L22,21H2V3H4V15.54L9.5,6L16,9.78L20.24,2.45L21.97,3.45L16.74,12.5L10.23,8.75L4.31,19H6.57L10.96,11.44L17.45,15.18Z";
export const mdiGaugeFull = "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,14.4 19,16.5 17.3,18C15.9,16.7 14,16 12,16C10,16 8.2,16.7 6.7,18C5,16.5 4,14.4 4,12A8,8 0 0,1 12,4M10,6A1,1 0 0,0 9,7A1,1 0 0,0 10,8A1,1 0 0,0 11,7A1,1 0 0,0 10,6M14,6A1,1 0 0,0 13,7A1,1 0 0,0 14,8A1,1 0 0,0 15,7A1,1 0 0,0 14,6M17.09,8.94C16.96,8.94 16.84,8.97 16.7,9L13.5,10.32L13.23,10.43C12.67,10 11.91,9.88 11.25,10.15C10.23,10.56 9.73,11.73 10.15,12.75C10.56,13.77 11.73,14.27 12.75,13.85C13.41,13.59 13.88,13 14,12.28L14.23,12.18L17.45,10.88L17.47,10.87C18,10.66 18.23,10.08 18.03,9.56C17.87,9.18 17.5,8.93 17.09,8.94M7,9A1,1 0 0,0 6,10A1,1 0 0,0 7,11A1,1 0 0,0 8,10A1,1 0 0,0 7,9Z"
export const mdiPlus = "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z";

// Colors

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
