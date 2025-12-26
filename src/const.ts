// Actions
export const DEFAULT_ACTIONS = ["more-info", "toggle", "navigate", "url", "perform-action", "assist", "none"] as const;

// Styling Options
export const CORNER_TYPES = ['square', 'lite-rounded', 'medium-rounded', 'rounded', 'circular'] as const;

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
export const LEGEND_ALIGNMENT_TYPES = ['left', 'right', 'center', 'space-around', 'space-between', 'space-evenly'] as const;

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