import { ActionConfig, LovelaceCardConfig, HomeAssistant } from 'custom-card-helpers';
import { TemplateResult } from 'lit';

export interface ELGConfig extends LovelaceCardConfig {
  entity: string;

  // Title
  title?: string;
  subtitle?: string;
  header?: string;

  title_position?: PositionType;
  title_text_size?: number;
  title_text_style?: TextStyleType;

  // MIN/MAX
  min?: number | string;
  max?: number | string;

  // Value
  precision?: number; // Decimal precision for the value
  unit?: string; // String appended to the value
  cutoff?: number; // Cutoff value for the entity state
  offset?: string | number; // Offset values into the past - duration string (e.g., "1h", "30m", "15s")

  position?: PositionType;
  text_size?: number;
  text_style?: TextStyleType;

  // Styling
  corner?: CornerType;
  state_content_separator?: string;

  color?: [number, number, number] | string;
  color_bg?: [number, number, number] | string;
  colour?: [number, number, number] | string; // For British English support
  colour_bg?: [number, number, number] | string; // For British English support

  // Line Text
  line_text_position?: LinePositionType;
  line_text_size?: number;
  line_text_style?: TextStyleType;
  line_text_overflow?: TextOverflowType;
  overflow_direction?: OverflowDirectionType;

  // Actions
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;

  // Legend
  legend_hide?: boolean;
  legend_all?: boolean;

  legend_position?: PositionType;
  legend_alignment?: LegendAlignmentType
  legend_indicator?: IndicatorType;
  legend_text_size?: number;
  legend_text_style?: TextStyleType;

  // Show Delta
  show_delta?: boolean;
  delta_position?: PositionType;

  // Untracked Legend
  untracked_legend?: boolean;
  untracked_legend_label?: string;
  untracked_legend_icon?: string;
  untracked_state_content?: UntrackedStateContentType;
  untracked_line_state_content?: UntrackedStateContentType;

  // Suppress Warnings
  suppress_warnings?: boolean;

  // Statistics
  statistics?: boolean;
  statistics_day_offset?: number;
  statistics_period?: StatisticsPeriodType;
  statistics_function?: StatisticsFunctionType;

  entities: ELGEntity[];
}

export interface ELGEntity {
  entity: string;

  // Title
  name?: string;
  icon?: string;
  color?: [number, number, number] | 'auto';
  colour?: [number, number, number] | 'auto'; // For British English support

  // Value
  cutoff?: number;
  unit?: string;
  multiplier?: number;
  precision?: number;

  // State Content
  state_content?: StateContentType;
  line_state_content?: StateContentType;

  // Styling
  legend_indicator?: IndicatorType;

  // Actions
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface ELGEntityState {
  state: number;
  width: number;
  stateObject: HassEntity;
}

// Helper interface for functions returning template and text
export interface LabelRenderResult {
  template: TemplateResult | string; // Allow string for simple cases
  fullText: string;
}

// State Content Types -------------------------------------------------------------------------------------------------

export const CORNER_TYPES = ['square', 'lite-rounded', 'medium-rounded', 'rounded', 'circular'] as const;
export const TEXT_STYLE_TYPES = ['weight-lighter', 'weight-bold', 'weight-bolder', 'style-italic', 'decoration-underline', 'decoration-overline', 'decoration-line-through', 'transform-uppercase', 'transform-lowercase', 'transform-capitalize', 'family-monospace', 'shadow-light', 'shadow-medium', 'shadow-heavy', 'shadow-hard', 'shadow-neon', 'black-outline', 'white-outline'] as const;
export const TEXT_OVERFLOW_TYPES = ['ellipsis', 'clip', 'tooltip', 'tooltip-segment', 'fade'] as const;
export const OVERFLOW_DIRECTION_TYPES = ['left', 'right'] as const;
export const INDICATOR_TYPES = ['circle', 'icon', 'icon-fallback', 'none'] as const;

export const POSITION_TYPES = ['left', 'right', 'none', 'top-left', 'top-middle', 'top-center', 'top-right', 'bottom-left', 'bottom-middle', 'bottom-center', 'bottom-right'] as const; // -middle & -center are equivalent
export const LINE_POSITION_TYPES = ['left', 'right', 'none', 'center', 'top-left', 'top-right', 'top-center', 'bottom-left', 'bottom-right', 'bottom-center'] as const;
export const LEGEND_ALIGNMENT_TYPES = ['left', 'right', 'center', 'space-around', 'space-between', 'space-evenly'] as const;

export const STATE_CONTENT_TYPES = ['name', 'state', 'last_changed', 'last_updated', 'percentage', 'icon'] as const;
export const UNTRACKED_STATE_CONTENT_TYPES = ['name', 'state', 'percentage'] as const;

export const STATISTICS_PERIOD_TYPES = ['5minute', 'hour', 'day', 'week', 'month'] as const;
export const STATISTICS_FUNCTION_TYPES = ['change', 'last_reset', 'max', 'mean', 'min', 'state', 'sum'] as const;

export type CornerType = typeof CORNER_TYPES[number];
export type TextStyleType = typeof TEXT_STYLE_TYPES[number][];
export type TextOverflowType = typeof TEXT_OVERFLOW_TYPES[number];
export type OverflowDirectionType = typeof OVERFLOW_DIRECTION_TYPES[number];
export type IndicatorType = typeof INDICATOR_TYPES[number];

export type PositionType = typeof POSITION_TYPES[number];
export type LinePositionType = typeof LINE_POSITION_TYPES[number];
export type LegendAlignmentType = typeof LEGEND_ALIGNMENT_TYPES[number];

export type StateContentType = typeof STATE_CONTENT_TYPES[number][];
export type UntrackedStateContentType = typeof UNTRACKED_STATE_CONTENT_TYPES[number][];

export type StatisticsPeriodType = typeof STATISTICS_PERIOD_TYPES[number];
export type StatisticsFunctionType = typeof STATISTICS_FUNCTION_TYPES[number];

// EDITOR---------------------------------------------------------------------------------------------------------------

export const DEFAULT_ACTIONS = [
  "more-info",
  "toggle",
  "navigate",
  "url",
  "perform-action",
  "assist",
  "none",
];

export interface LabelConfigEntry {
  tryLocalize: string | ((hass: HomeAssistant) => string);
  fallback: string;
}

export interface EditorTarget extends EventTarget {
  value?: string;
  index?: number;
  checked?: boolean;
  configValue?: string;
  type?: HTMLInputElement['type'];
  config: ActionConfig;
}

export interface HTMLElementValue extends HTMLElement {
  value: string;
}
declare global {
  interface Window {
    loadCardHelpers: () => Promise<void>;
    customCards: { type?: string; name?: string; description?: string; preview?: boolean }[];
    ResizeObserver: { new (callback: ResizeObserverCallback): ResizeObserver; prototype: ResizeObserver };
  }

  interface Element {
    offsetWidth: number;
  }
}

export interface HassCustomElement extends CustomElementConstructor {
  getConfigElement(): Promise<unknown>;
}

// Types from home-assistant-js-websocket ------------------------------------------------------------------------------
export declare type Context = {
  id: string;
  user_id: string | null;
  parent_id: string | null;
};
export declare type HassEntityBase = {
  entity_id: string;
  state: string;
  last_changed: string;
  last_updated: string;
  attributes: HassEntityAttributeBase;
  context: Context;
};
export declare type HassEntityAttributeBase = {
  friendly_name?: string;
  unit_of_measurement?: string;
  icon?: string;
  entity_picture?: string;
  supported_features?: number;
  hidden?: boolean;
  assumed_state?: boolean;
  device_class?: string;
  state_class?: string;
};
export declare type HassEntity = HassEntityBase & {
  attributes: {
    [key: string]: any;
  };
};
export declare type HassEntities = {
  [entity_id: string]: HassEntity;
};

export interface HassHistoryEntry {
  last_updated: string;
  state: string;
  last_changed: string;
  attributes?: any;
  entity_id: string;
}

export type HassHistory = Array<HassHistoryEntry>;

// Statistic Own Observations ------------------------------------------------------------------------------------------

export declare type HassStatistics = {
  [entity_id: string]: HassStatisticEntry[];
};

export interface HassStatisticEntry {
  start: number;
  end: number;
  last_reset: number | null;
  max: number | null;
  mean: number | null;
  min: number | null;
  sum: number | null;
  state: number | null;
  change: number | null;
}

// Energy Line Gauge History -------------------------------------------------------------------------------------------

export declare type ELGHistoryOffsetEntities = {
  [entity_id: string]: ELGHistoryOffsetEntry[];
};

export type ELGHistoryOffset = {
  start_time: number;
  end_time: number;
  updating: boolean;
  history: ELGHistoryOffsetEntities;
}

export type ELGHistoryOffsetEntry = {
  state: string;
  last_changed: string;
}

// Energy Line Gauge History Statistics --------------------------------------------------------------------------------

export declare type ELGHistoryStatisticsBuckets = {
  [entity_id: string]: ELGHistoryStatisticsBucket[];
};

export type ELGHistoryStatistics = {
  updating: boolean;
  date: Date;
  buckets: ELGHistoryStatisticsBuckets;
}

export type ELGHistoryStatisticsBucket = HassStatisticEntry