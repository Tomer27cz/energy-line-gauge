import { ActionConfig, LovelaceCardConfig } from 'custom-card-helpers';

export interface ELGConfig extends LovelaceCardConfig {
  entity: string;

  title?: string;
  subtitle?: string;
  header?: string;
  label?: string;

  min?: number;
  max?: number | string;

  precision?: number;
  unit?: string;
  cutoff?: number;
  corner?: 'square' | 'lite_rounded' | 'medium_rounded' | 'rounded' | 'circular';
  position?: 'left' | 'right' | 'none' | 'top-left' | 'top-middle' | 'top-right' | 'bottom-left' | 'bottom-middle' | 'bottom-right';

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

// Types from home-assistant-js-websocket
export declare type Context = {
  id: string;
  user_id: string | null;
  parent_id: string | null;
};
export declare type HassEventBase = {
  origin: string;
  time_fired: string;
  context: Context;
};
export declare type HassEvent = HassEventBase & {
  event_type: string;
  data: {
    [key: string]: any;
  };
};
export declare type StateChangedEvent = HassEventBase & {
  event_type: "state_changed";
  data: {
    entity_id: string;
    new_state: HassEntity | null;
    old_state: HassEntity | null;
  };
};
export declare type HassConfig = {
  latitude: number;
  longitude: number;
  elevation: number;
  unit_system: {
    length: string;
    mass: string;
    volume: string;
    temperature: string;
    pressure: string;
    wind_speed: string;
    accumulated_precipitation: string;
  };
  location_name: string;
  time_zone: string;
  components: string[];
  config_dir: string;
  allowlist_external_dirs: string[];
  allowlist_external_urls: string[];
  version: string;
  config_source: string;
  safe_mode: boolean;
  state: "NOT_RUNNING" | "STARTING" | "RUNNING" | "STOPPING" | "FINAL_WRITE";
  external_url: string | null;
  internal_url: string | null;
  currency: string;
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
export declare type HassService = {
  name?: string;
  description: string;
  target?: {} | null;
  fields: {
    [field_name: string]: {
      name?: string;
      description: string;
      example: string | boolean | number;
      selector?: {};
    };
  };
};
export declare type HassDomainServices = {
  [service_name: string]: HassService;
};
export declare type HassServices = {
  [domain: string]: HassDomainServices;
};
export declare type HassUser = {
  id: string;
  is_owner: boolean;
  name: string;
};
export declare type HassServiceTarget = {
  entity_id?: string | string[];
  device_id?: string | string[];
  area_id?: string | string[];
};

