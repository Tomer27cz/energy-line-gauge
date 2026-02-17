import {
  ELGConfig,
  ELGEntity,

  CornerType,
  LineSeparatorWidthType,
  TextOverflowType,
  OverflowDirectionType,
  PositionType,
  ValuePositionType,
  IndicatorType,
  LinePositionType,
  LegendAlignmentType,

  StateContentType,
  UntrackedStateContentType,

  StatisticsPeriodType,
  StatisticsFunctionType,

  CSSColor,
  SeverityType,
} from '../types';

import {
  CORNER_TYPES,
  SORTING_TYPES,
  LINE_SEPARATOR_WIDTH_TYPES,
  TEXT_OVERFLOW_TYPES,
  OVERFLOW_DIRECTION_TYPES,
  POSITION_TYPES,
  VALUE_POSITION_TYPES,
  INDICATOR_TYPES,
  LINE_POSITION_TYPES,
  LEGEND_ALIGNMENT_TYPES,
  STATE_CONTENT_TYPES,
  UNTRACKED_STATE_CONTENT_TYPES,
  STATISTICS_PERIOD_TYPES,
  STATISTICS_FUNCTION_TYPES,
} from "./const";

import { COLORS } from './const';

// Some values are undefined but set programmatically in the code - comment
export const CONFIG_DEFAULTS = {
  entity: undefined, // string
  attribute: undefined,

  // Title
  title: undefined,
  subtitle: undefined,
  header: undefined,

  title_position: 'top-left' as PositionType,
  title_text_size: 2,
  title_text_style: undefined,

  title_text_color: 'var(--primary-text-color)' as CSSColor,
  subtitle_text_color: 'var(--secondary-text-color)' as CSSColor,

  // MIN/MAX
  min: 0,
  max: undefined, // entity

  // Value
  precision: 0,
  unit: undefined,
  cutoff: 0,
  offset: undefined, // parsed
  sorting: undefined,

  position: 'left' as ValuePositionType,
  text_size: 2.5,
  text_style: undefined,
  text_color: 'var(--primary-text-color)' as CSSColor,

  // Styling
  line_height: 3,
  corner: 'square' as CornerType,
  state_content_separator: ' ⸱ ',

  line_separator: false,
  line_separator_width: 'total050' as LineSeparatorWidthType,
  line_separator_color: 'var(--card-background-color)',

  color: 'var(--primary-color)',
  color_bg: 'var(--secondary-background-color)',

  // Line Text
  line_text_position: 'left' as LinePositionType,
  line_text_size: 1,
  line_text_style: undefined,
  line_text_color: 'var(--primary-text-color)' as CSSColor,
  line_text_overflow: 'tooltip' as TextOverflowType,
  overflow_direction: 'right' as OverflowDirectionType,

  // Actions
  tap_action: undefined,
  hold_action: undefined,
  double_tap_action: undefined,

  // Legend
  legend_hide: false,
  legend_all: false,

  legend_position: 'bottom-center' as PositionType,
  legend_alignment: 'center' as LegendAlignmentType,
  legend_indicator: 'icon-fallback' as IndicatorType,
  legend_text_size: 1,
  legend_text_style: undefined,
  legend_text_color: 'var(--secondary-text-color)' as CSSColor,

  // Show Delta
  show_delta: false,
  delta_position: 'bottom-center' as PositionType,

  // Untracked Legend
  untracked_legend: false,
  untracked_legend_label: undefined,
  untracked_legend_icon: undefined,
  untracked_legend_indicator: 'icon-fallback' as IndicatorType,

  untracked_state_content: ['name'] as UntrackedStateContentType,
  untracked_line_state_content: undefined,

  // Suppress Warnings
  suppress_warnings: false,

  // Statistics
  statistics: false,
  statistics_day_offset: 1,
  statistics_period: 'hour' as StatisticsPeriodType,
  statistics_function: 'mean' as StatisticsFunctionType,

  // Severity
  severity: false,
  severity_levels: undefined,
  severity_blend: false,

  // Entities
  entities: [],
}

export const ENTITY_DEFAULTS = {
  entity: undefined,
  attribute: undefined,

  // Entity
  name: undefined,
  icon: undefined,
  color: 'auto',

  // Value
  cutoff: undefined,
  unit: undefined,
  multiplier: 1,
  precision: undefined,

  // State Content
  state_content: ['name'] as StateContentType,
  line_state_content: undefined,

  // Styling
  legend_indicator: undefined,

  legend_text_color: undefined,
  line_text_color: undefined,

  // Actions
  tap_action: undefined,
  hold_action: undefined,
  double_tap_action: undefined,
}

export const setConfigDefaults = (config: ELGConfig): ELGConfig => {
  return {
    ...config,

    // Entity
    attribute: config.attribute ?? CONFIG_DEFAULTS.attribute,

    // Title
    title: config.title ?? CONFIG_DEFAULTS.title,
    subtitle: config.subtitle ?? CONFIG_DEFAULTS.subtitle,
    header: config.header ?? CONFIG_DEFAULTS.header,

    title_position: validatedValue(config.title_position, POSITION_TYPES, CONFIG_DEFAULTS.title_position),
    title_text_size: config.title_text_size ?? CONFIG_DEFAULTS.title_text_size,
    title_text_style: config.title_text_style ?? CONFIG_DEFAULTS.title_text_style,

    title_text_color: validateColor(config.title_text_color ?? config.title_text_colour, CONFIG_DEFAULTS.title_text_color),
    subtitle_text_color: validateColor(config.subtitle_text_color ?? config.subtitle_text_colour, CONFIG_DEFAULTS.subtitle_text_color),

    // MIN/MAX
    min: config.min ?? CONFIG_DEFAULTS.min,
    max: config.max ?? config.entity, // entity

    // Value
    precision: config.precision ?? CONFIG_DEFAULTS.precision,
    unit: config.unit ?? CONFIG_DEFAULTS.unit,
    cutoff: config.cutoff ?? CONFIG_DEFAULTS.cutoff,
    offset: config.offset ? parseDurationToMilliseconds(config.offset) : CONFIG_DEFAULTS.offset,
    sorting: validatedValue(config.sorting, SORTING_TYPES, CONFIG_DEFAULTS.sorting),

    position: validatedValue(config.position, VALUE_POSITION_TYPES, CONFIG_DEFAULTS.position),
    text_size: config.text_size ?? CONFIG_DEFAULTS.text_size,
    text_style: config.text_style ?? CONFIG_DEFAULTS.text_style,

    text_color: validateColor(config.text_color ?? config.text_colour, CONFIG_DEFAULTS.text_color),

    // Styling
    line_height: config.line_height ?? CONFIG_DEFAULTS.line_height,
    corner: validatedValue(config.corner, CORNER_TYPES, CONFIG_DEFAULTS.corner),
    state_content_separator: config.state_content_separator ?? CONFIG_DEFAULTS.state_content_separator,

    line_separator: config.line_separator ?? CONFIG_DEFAULTS.line_separator,
    line_separator_width: validatedValue(config.line_separator_width, LINE_SEPARATOR_WIDTH_TYPES, CONFIG_DEFAULTS.line_separator_width),
    line_separator_color: validateColor(config.line_separator_color ?? config.line_separator_colour, CONFIG_DEFAULTS.line_separator_color),

    color: validateColor(config.color ?? config.colour, CONFIG_DEFAULTS.color),
    color_bg: validateColor(config.color_bg ?? config.colour_bg, CONFIG_DEFAULTS.color_bg),

    // Line Text
    line_text_position: validatedValue(config.line_text_position, LINE_POSITION_TYPES, CONFIG_DEFAULTS.line_text_position),
    line_text_size: config.line_text_size ?? CONFIG_DEFAULTS.line_text_size,
    line_text_style: config.line_text_style ?? CONFIG_DEFAULTS.line_text_style,
    line_text_color: validateColor(config.line_text_color ?? config.line_text_colour, undefined), // undefined to allow automatic handling instead of default
    line_text_overflow: validatedValue(config.line_text_overflow, TEXT_OVERFLOW_TYPES, CONFIG_DEFAULTS.line_text_overflow),
    overflow_direction: validatedValue(config.overflow_direction, OVERFLOW_DIRECTION_TYPES, CONFIG_DEFAULTS.overflow_direction),

    // Actions
    tap_action: config.tap_action ?? CONFIG_DEFAULTS.tap_action,
    hold_action: config.hold_action ?? CONFIG_DEFAULTS.hold_action,
    double_tap_action: config.double_tap_action ?? CONFIG_DEFAULTS.double_tap_action,

    // Legend
    legend_hide: config.legend_hide ?? CONFIG_DEFAULTS.legend_hide,
    legend_all: config.legend_all ?? CONFIG_DEFAULTS.legend_all,

    legend_position: validatedValue(config.legend_position, POSITION_TYPES, CONFIG_DEFAULTS.legend_position),
    legend_alignment: validatedValue(config.legend_alignment, LEGEND_ALIGNMENT_TYPES, CONFIG_DEFAULTS.legend_alignment),
    legend_indicator: validatedValue(config.legend_indicator, INDICATOR_TYPES, CONFIG_DEFAULTS.legend_indicator),
    legend_text_size: config.legend_text_size ?? CONFIG_DEFAULTS.legend_text_size,
    legend_text_style: config.legend_text_style ?? CONFIG_DEFAULTS.legend_text_style,
    legend_text_color: validateColor(config.legend_text_color ?? config.legend_text_colour, CONFIG_DEFAULTS.legend_text_color),

    // Show Delta
    show_delta: config.show_delta ?? CONFIG_DEFAULTS.show_delta,
    delta_position: validatedValue(config.delta_position, POSITION_TYPES, CONFIG_DEFAULTS.delta_position),

    // Untracked Legend
    untracked_legend: !!(config.untracked_legend ?? config.entities), // if entities are set, untracked_legend is true
    untracked_legend_label: config.untracked_legend_label ?? CONFIG_DEFAULTS.untracked_legend_label,
    untracked_legend_icon: config.untracked_legend_icon ?? CONFIG_DEFAULTS.untracked_legend_icon,
    untracked_legend_indicator: validatedValue(config.untracked_legend_indicator, INDICATOR_TYPES, CONFIG_DEFAULTS.untracked_legend_indicator),

    untracked_state_content: validateArray(config.untracked_state_content, UNTRACKED_STATE_CONTENT_TYPES) ?? CONFIG_DEFAULTS.untracked_state_content,
    untracked_line_state_content: validateArray(config.untracked_line_state_content, UNTRACKED_STATE_CONTENT_TYPES) ?? CONFIG_DEFAULTS.untracked_line_state_content,

    // Suppress Warnings
    suppress_warnings: config.suppress_warnings ?? CONFIG_DEFAULTS.suppress_warnings,

    // Statistics
    statistics: config.statistics ?? CONFIG_DEFAULTS.statistics,
    statistics_day_offset: config.statistics_day_offset ?? CONFIG_DEFAULTS.statistics_day_offset,
    statistics_period: validatedValue(config.statistics_period, STATISTICS_PERIOD_TYPES, CONFIG_DEFAULTS.statistics_period),
    statistics_function: validatedValue(config.statistics_function, STATISTICS_FUNCTION_TYPES, CONFIG_DEFAULTS.statistics_function),

    // Severity
    severity: config.severity ?? CONFIG_DEFAULTS.severity,
    severity_levels: Array.isArray(config.severity_levels) ? validateSeverityLevels(config.severity_levels) : config.severity_levels,
    severity_blend: config.severity_blend ?? CONFIG_DEFAULTS.severity_blend,

    // Entities
    entities: Array.isArray(config.entities) ? setEntitiesDefaults(config.entities) : config.entities,
  };
};

export const setEntitiesDefaults = (entities: ELGEntity[]): ELGEntity[] => {
  const usedColors = new Set(entities.map(e => e.color).filter(Boolean));

  const validatedEntities: ELGEntity[] = [];

  for (const entity of entities) {
    let color = entity.color ?? (entity as any).colour;

    if (!color || color === "auto") {
      color = COLORS.find(c => !usedColors.has(c));
      usedColors.add(color);
    }

    if (entity.entity === undefined || entity.entity === null || entity.entity === '' || entity.entity === 'none' || entity.entity === 'null' || entity.entity === 'undefined') {
      continue;
    }

    validatedEntities.push({
      ...entity,

      // Attribute
      attribute: entity.attribute ?? ENTITY_DEFAULTS.attribute,

      // Entity
      name: entity.name ?? ENTITY_DEFAULTS.name,
      icon: entity.icon ?? ENTITY_DEFAULTS.icon,
      color: validateColor(color, ENTITY_DEFAULTS.color),

      // Value
      cutoff: entity.cutoff ?? ENTITY_DEFAULTS.cutoff,
      unit: entity.unit ?? ENTITY_DEFAULTS.unit,
      multiplier: entity.multiplier ?? ENTITY_DEFAULTS.multiplier,
      precision: entity.precision ?? ENTITY_DEFAULTS.precision,

      // State Content
      state_content: validateArray(entity.state_content, STATE_CONTENT_TYPES) ?? ENTITY_DEFAULTS.state_content,
      line_state_content: validateArray(entity.line_state_content, STATE_CONTENT_TYPES) ?? ENTITY_DEFAULTS.line_state_content,

      // Styling
      legend_indicator: validatedValue(entity.legend_indicator, INDICATOR_TYPES, ENTITY_DEFAULTS.legend_indicator),

      legend_text_color: validateColor(entity.legend_text_color ?? entity.legend_text_colour, ENTITY_DEFAULTS.legend_text_color),
      line_text_color: validateColor(entity.line_text_color ?? entity.line_text_colour, ENTITY_DEFAULTS.line_text_color),

      // Actions
      tap_action: entity.tap_action ?? ENTITY_DEFAULTS.tap_action,
      hold_action: entity.hold_action ?? ENTITY_DEFAULTS.hold_action,
      double_tap_action: entity.double_tap_action ?? ENTITY_DEFAULTS.double_tap_action,
    });
  }

  return validatedEntities;
};

export const validateSeverityLevels = (levels: SeverityType[]): SeverityType[] | undefined => {
  const usedColors = new Set(levels.map(e => e.color).filter(Boolean));

  const validatedLevels: SeverityType[] = [];
  for (const level of levels) {
    let color = level.color ?? level.colour;

    if (!color || color === "auto") {
      color = COLORS.find(c => !usedColors.has(c));
      usedColors.add(color);
    }

    validatedLevels.push({
      from: level.from ?? 0,
      color: validateColor(color, 'var(--primary-color)'),
    });
  }

  // Sort from highest to lowest - Optimization for later processing (when checking severities can return on first match)
  validatedLevels.sort((a, b) => b.from - a.from);

  return validatedLevels;
}

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
  defaultValue: T[number] | undefined
): T[number] | undefined {
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

function validateColor(color: CSSColor, defaultValue: CSSColor): CSSColor {
  if (!color) return defaultValue;
  if (color === "auto") return defaultValue;
  if (Array.isArray(color)) return `rgba(${color})`;
  return color;
}
