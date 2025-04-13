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

  color?: [number, number, number] | string;
  color_bg?: [number, number, number] | string;

  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;

  legend_hide?: boolean;
  legend_all?: boolean;

  untracked_legend?: boolean;
  untracked_legend_label?: string;
  untracked_legend_icon?: string;

  entities: ELGEntity[];
}

export interface ELGEntity {
  attribute?: string;
  entity: string;
  name?: string;
  icon?: string;
  color?: [number, number, number] | string;
  cutoff?: number;

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
