import {
  ELGConfig,
  ELGEntity,

  CORNER_TYPES,
  POSITION_TYPES,
  LINE_POSITION_TYPES,
  LEGEND_ALIGNMENT_TYPES,
  STATE_CONTENT_TYPES,
  UNTRACKED_STATE_CONTENT_TYPES,
  STATISTICS_PERIOD_TYPES,
  STATISTICS_FUNCTION_TYPES,

  CornerType,
  PositionType,
  LinePositionType,
  LegendAlignmentType,

  StateContentType,
  UntrackedStateContentType,

  StatisticsPeriodType,
  StatisticsFunctionType,
} from './types';

import { toRGB, toHEX, COLORS } from './color';

// Some values are undefined but set programmatically in the code - comment
const DEFAULTS = {
  entity: undefined, // string

  // Title
  title: undefined,
  subtitle: undefined,
  header: undefined,
  title_position: 'top-left' as PositionType,
  title_text_size: 2,

  // MIN/MAX
  min: 0,
  max: undefined, // entity

  // Value
  precision: 0,
  unit: undefined,
  cutoff: 5,
  offset: undefined, // parsed

  // Styling
  corner: 'square' as CornerType,
  position: 'left' as PositionType,
  text_size: 2.5,

  line_text_position: 'left' as LinePositionType,
  line_text_size: 1,

  color: undefined, // --primary-color
  color_bg: undefined, // --secondary-background-color

  // Actions
  tap_action: undefined,
  hold_action: undefined,
  double_tap_action: undefined,

  // Legend
  legend_hide: false,
  legend_all: false,
  legend_position: 'bottom-center' as PositionType,
  legend_alignment: 'center' as LegendAlignmentType,

  // Show Delta
  show_delta: false,
  delta_position: 'bottom-center' as PositionType,

  // Untracked Legend
  untracked_legend: false,
  untracked_legend_label: undefined,
  untracked_legend_icon: undefined,
  untracked_state_content: ['name'] as UntrackedStateContentType,
  untracked_line_state_content: undefined,

  // Suppress Warnings
  suppress_warnings: false,

  // Statistics
  statistics: false,
  statistics_day_offset: 1,
  statistics_period: 'hour' as StatisticsPeriodType,
  statistics_function: 'mean' as StatisticsFunctionType,

  entities: [],
}

const ENTITY_DEFAULTS = {
  entity: undefined,

  // Entity
  name: undefined,
  icon: undefined,
  color: 'auto',

  // Value
  cutoff: undefined,
  unit: undefined,
  multiplier: 1,
  precision: 0,

  // State Content
  state_content: ['name'] as StateContentType,
  line_state_content: undefined,

  // Actions
  tap_action: undefined,
  hold_action: undefined,
  double_tap_action: undefined,
}

export const setConfigDefaults = (config: ELGConfig): ELGConfig => {
  const rootStyle = getComputedStyle(document.documentElement);
  const defaultColor = toRGB(rootStyle.getPropertyValue('--primary-color').trim());
  const defaultBgColor = toRGB(rootStyle.getPropertyValue('--secondary-background-color').trim());

  return {
    ...config,

    // Title
    title: config.title ?? DEFAULTS.title,
    subtitle: config.subtitle ?? DEFAULTS.subtitle,
    header: config.header ?? DEFAULTS.header,
    title_position: validatedValue(config.title_position, POSITION_TYPES, DEFAULTS.title_position),
    title_text_size: config.title_text_size ?? DEFAULTS.title_text_size,

    // MIN/MAX
    min: config.min ?? DEFAULTS.min,
    max: config.max ?? config.entity, // entity

    // Value
    precision: config.precision ?? DEFAULTS.precision,
    unit: config.unit ?? DEFAULTS.unit,
    cutoff: config.cutoff ?? DEFAULTS.cutoff,
    offset: config.offset ? parseDurationToMilliseconds(config.offset) : DEFAULTS.offset,

    // Styling
    corner: validatedValue(config.corner, CORNER_TYPES, DEFAULTS.corner),
    position: validatedValue(config.position, POSITION_TYPES, DEFAULTS.position),
    text_size: config.text_size ?? DEFAULTS.text_size,

    line_text_position: validatedValue(config.line_text_position, LINE_POSITION_TYPES, DEFAULTS.line_text_position),
    line_text_size: config.line_text_size ?? DEFAULTS.line_text_size,

    color: validateColor(config.color, defaultColor), // --primary-color
    color_bg: validateColor(config.color_bg, defaultBgColor), // --secondary-background-color

    // Actions
    tap_action: config.tap_action ?? DEFAULTS.tap_action,
    hold_action: config.hold_action ?? DEFAULTS.hold_action,
    double_tap_action: config.double_tap_action ?? DEFAULTS.double_tap_action,

    // Legend
    legend_hide: config.legend_hide ?? DEFAULTS.legend_hide,
    legend_all: config.legend_all ?? DEFAULTS.legend_all,
    legend_position: validatedValue(config.legend_position, POSITION_TYPES, DEFAULTS.legend_position),
    legend_alignment: validatedValue(config.legend_alignment, LEGEND_ALIGNMENT_TYPES, DEFAULTS.legend_alignment),

    // Show Delta
    show_delta: config.show_delta ?? DEFAULTS.show_delta,
    delta_position: validatedValue(config.delta_position, POSITION_TYPES, DEFAULTS.delta_position),

    // Untracked Legend
    untracked_legend: !!(config.untracked_legend ?? config.entities), // if entities are set, untracked_legend is true
    untracked_legend_label: config.untracked_legend_label ?? DEFAULTS.untracked_legend_label,
    untracked_legend_icon: config.untracked_legend_icon ?? DEFAULTS.untracked_legend_icon,
    untracked_state_content: validateArray(config.untracked_state_content, UNTRACKED_STATE_CONTENT_TYPES) ?? DEFAULTS.untracked_state_content,
    untracked_line_state_content: validateArray(config.untracked_line_state_content, UNTRACKED_STATE_CONTENT_TYPES) ?? DEFAULTS.untracked_line_state_content,

    suppress_warnings: config.suppress_warnings ?? DEFAULTS.suppress_warnings,

    statistics: config.statistics ?? DEFAULTS.statistics,
    statistics_day_offset: config.statistics_day_offset ?? DEFAULTS.statistics_day_offset,
    statistics_period: validatedValue(config.statistics_period, STATISTICS_PERIOD_TYPES, DEFAULTS.statistics_period),
    statistics_function: validatedValue(config.statistics_function, STATISTICS_FUNCTION_TYPES, DEFAULTS.statistics_function),

    entities: Array.isArray(config.entities) ? setEntitiesDefaults(config.entities) : config.entities,
  };
};

export const setEntitiesDefaults = (entities: ELGEntity[]): ELGEntity[] => {
  const usedColors = new Set(
    entities.map(e => toHEX(e.color)?.toUpperCase()).filter(Boolean)
  );

  return entities.map(entity => {
    let color = entity.color;

    if (!color || color === "auto") {
      const available = COLORS.find(c => !usedColors.has(c.toUpperCase()));
      color = toRGB(available);
      usedColors.add(available?.toUpperCase() || "");
    }

    return {
      ...entity,

      // Entity
      name: entity.name ?? ENTITY_DEFAULTS.name,
      icon: entity.icon ?? ENTITY_DEFAULTS.icon,
      color: color,

      // Value
      cutoff: entity.cutoff ?? ENTITY_DEFAULTS.cutoff,
      unit: entity.unit ?? ENTITY_DEFAULTS.unit,
      multiplier: entity.multiplier ?? ENTITY_DEFAULTS.multiplier,
      precision: entity.precision ?? ENTITY_DEFAULTS.precision,

      // State Content
      state_content: validateArray(entity.state_content, STATE_CONTENT_TYPES) ?? ENTITY_DEFAULTS.state_content,
      line_state_content: validateArray(entity.line_state_content, STATE_CONTENT_TYPES) ?? ENTITY_DEFAULTS.line_state_content,

      // Actions
      tap_action: entity.tap_action ?? ENTITY_DEFAULTS.tap_action,
      hold_action: entity.hold_action ?? ENTITY_DEFAULTS.hold_action,
      double_tap_action: entity.double_tap_action ?? ENTITY_DEFAULTS.double_tap_action,
    };
  });
};

// Config value transformers -------------------------------------------------------------------------------------------

function parseDurationToMilliseconds(durationStr: string | number) {
  if (typeof durationStr === "number") {return;} // If passed number directly, return undefined (when typing number but not adding unit - prevents error)
  const match = durationStr.match(/^(\d+)([hmsd])$/i); // Case-insensitive for unit
  if (!match) return;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return;
  }
}

function validatedValue<T extends readonly string[]>(
  currentValue: string | undefined,
  possibleValues: T,
  defaultValue: T[number]
): T[number] {
  return (currentValue && possibleValues.includes(currentValue as T[number]))
    ? currentValue as T[number]
    : defaultValue;
}
function validateArray<T extends readonly string[]>(
  values: unknown,
  allowed: T
): T[number][] | undefined {
  if (!Array.isArray(values)) return undefined;
  return values.filter((item): item is T[number] => allowed.includes(item as T[number]));
}

function validateColor(
  color: string | [number, number, number] | undefined,
  defaultValue: [number, number, number] | undefined
): [number, number, number] | undefined {
  if (!color) return defaultValue;
  if (color === "auto") return defaultValue;
  if (Array.isArray(color)) return color as [number, number, number];
  return toRGB(color);
}
