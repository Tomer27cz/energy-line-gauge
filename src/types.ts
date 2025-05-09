import { ActionConfig, LovelaceCardConfig } from 'custom-card-helpers';

export interface ELGConfig extends LovelaceCardConfig {
  entity: string;

  title?: string;
  subtitle?: string;
  header?: string;

  min?: number | string;
  max?: number | string;

  precision?: number;
  unit?: string;
  cutoff?: number;
  offset?: string | number;

  corner?: 'square' | 'lite_rounded' | 'medium_rounded' | 'rounded' | 'circular';
  position?: 'left' | 'right' | 'none' | 'top-left' | 'top-middle' | 'top-right' | 'bottom-left' | 'bottom-middle' | 'bottom-right';
  text_size?: number;

  line_text_position?: 'left' | 'right' | 'center' | 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  line_text_size?: number;

  color?: [number, number, number] | string;
  color_bg?: [number, number, number] | string;

  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;

  legend_hide?: boolean;
  legend_all?: boolean;

  show_delta?: boolean;

  untracked_legend?: boolean;
  untracked_legend_label?: string;
  untracked_legend_icon?: string;
  untracked_state_content?: string[];

  suppress_warnings?: boolean;

  statistics?: ELGStatistics;

  entities: ELGEntity[];
}

export interface ELGEntity {
  attribute?: string;
  entity: string;
  name?: string;
  icon?: string;
  color?: [number, number, number] | string;

  cutoff?: number;
  unit?: string;
  multiplier?: number;
  precision?: number;

  state_content?: string[];
  line_state_content?: string[];

  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface ELGStatistics {
  day_offset: number;
  period: "5minute" | "hour" | "day" | "week" | "month";
  function: "change" | "last_reset" | "max" | "mean" | "min" | "state" | "sum";
}


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