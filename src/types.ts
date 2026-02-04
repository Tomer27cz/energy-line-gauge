import { TemplateResult } from 'lit';
import {
  Auth,
  Connection,
  HassConfig,
  HassEntity as HACoreEntity,
  HassServices,
  HassServiceTarget,
  MessageBase,
} from "home-assistant-js-websocket";

import {
  CORNER_TYPES,
  SORTING_TYPES,
  INDICATOR_TYPES,
  LEGEND_ALIGNMENT_TYPES,
  LINE_POSITION_TYPES,
  LINE_SEPARATOR_WIDTH_TYPES,
  NumberFormat,
  OVERFLOW_DIRECTION_TYPES,
  POSITION_TYPES,
  STATE_CONTENT_TYPES,
  STATISTICS_FUNCTION_TYPES,
  STATISTICS_PERIOD_TYPES,
  TEXT_OVERFLOW_TYPES,
  TEXT_STYLE_TYPES,
  TimeFormat,
  UNTRACKED_STATE_CONTENT_TYPES,
  VALUE_POSITION_TYPES,
} from './config/const';

// =====================================================================================================================
// 1. HOME ASSISTANT CORE TYPES
// Types representing the internal Home Assistant state and connection.
// =====================================================================================================================

export interface HomeAssistant {
  auth: Auth;
  connection: Connection;
  connected: boolean;
  states: HassEntities;
  services: HassServices;
  config: HassConfig;
  themes: Themes;
  selectedTheme?: string | null;
  panels: Panels;
  panelUrl: string;

  // i18n & Localization
  language: string;
  locale: FrontendLocaleData;
  selectedLanguage: string | null;
  resources: Resources;
  localize: LocalizeFunc;
  translationMetadata: {
    fragments: string[];
    translations: {
      [lang: string]: Translation;
    };
  };

  dockedSidebar: boolean;
  moreInfoEntityId: string;
  user: CurrentUser;

  // Methods
  callService: (
    domain: ServiceCallRequest["domain"],
    service: ServiceCallRequest["service"],
    serviceData?: ServiceCallRequest["serviceData"],
    target?: ServiceCallRequest["target"]
  ) => Promise<void>;
  callApi: <T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    parameters?: { [key: string]: any }
  ) => Promise<T>;
  fetchWithAuth: (
    path: string,
    init?: { [key: string]: any }
  ) => Promise<Response>;
  sendWS: (msg: MessageBase) => Promise<void>;
  callWS: <T>(msg: MessageBase) => Promise<T>;
}

// Entities
export type HassEntityAttributeBase = {
  friendly_name?: string;
  unit_of_measurement?: string;
  icon?: string;
  entity_picture?: string;
  supported_features?: number;
  hidden?: boolean;
  assumed_state?: boolean;
  device_class?: string;
  state_class?: string;
  [key: string]: any;
};

export type HassEntity = HACoreEntity & {
  attributes: HassEntityAttributeBase;
};

export type HassEntities = {
  [entity_id: string]: HassEntity;
};

// Users & Auth
export interface Credential {
  auth_provider_type: string;
  auth_provider_id: string;
}

export interface MFAModule {
  id: string;
  name: string;
  enabled: boolean;
}

export interface CurrentUser {
  id: string;
  is_owner: boolean;
  is_admin: boolean;
  name: string;
  credentials: Credential[];
  mfa_modules: MFAModule[];
}

// Themes & UI
export interface Theme {
  "primary-color": string;
  "text-primary-color": string;
  "accent-color": string;
  [key: string]: string;
}

export interface Themes {
  default_theme: string;
  themes: { [key: string]: Theme };
}

export interface Panel {
  component_name: string;
  config: { [key: string]: any } | null;
  icon: string | null;
  title: string | null;
  url_path: string;
}

export interface Panels {
  [name: string]: Panel;
}

export interface Resources {
  [language: string]: { [key: string]: string };
}

export interface Translation {
  nativeName: string;
  isRTL: boolean;
  fingerprints: { [fragment: string]: string };
}

export interface FrontendLocaleData {
  language: string;
  number_format: NumberFormat;
  time_format: TimeFormat;
}

export type LocalizeFunc = (key: string, ...args: any[]) => string;

// Services
export interface ServiceCallRequest {
  domain: string;
  service: string;
  serviceData?: Record<string, any>;
  target?: HassServiceTarget;
}

// Events
export interface HASSDomEvent<T> extends Event {
  detail: T;
}

// =====================================================================================================================
// 2. LOVELACE & ACTION TYPES
// Types related to the Dashboard configuration and interaction actions.
// =====================================================================================================================

export interface LovelaceConfig {
  title?: string;
  views: LovelaceViewConfig[];
  background?: string;
}

export interface LovelaceViewConfig {
  index?: number;
  title?: string;
  badges?: Array<string | LovelaceBadgeConfig>;
  cards?: LovelaceCardConfig[];
  path?: string;
  icon?: string;
  theme?: string;
  panel?: boolean;
  background?: string;
  visible?: boolean | ShowViewConfig[];
}

export interface ShowViewConfig {
  user?: string;
}

export interface LovelaceBadgeConfig {
  type?: string;
  [key: string]: any;
}

export interface LovelaceCardConfig {
  index?: number;
  view_index?: number;
  type: string;
  [key: string]: any;
}

export interface LovelaceCard extends HTMLElement {
  hass?: HomeAssistant;
  isPanel?: boolean;
  editMode?: boolean;
  getCardSize(): number | Promise<number>;
  setConfig(config: LovelaceCardConfig): void;
}

export interface LovelaceCardEditor extends HTMLElement {
  hass?: HomeAssistant;
  lovelace?: LovelaceConfig;
  setConfig(config: LovelaceCardConfig): void;
}

// Actions
export type HapticType =
  | "success"
  | "warning"
  | "failure"
  | "light"
  | "medium"
  | "heavy"
  | "selection";

export interface BaseActionConfig {
  confirmation?: ConfirmationRestrictionConfig;
  repeat?: number;
  haptic?: HapticType;
}

export interface ConfirmationRestrictionConfig {
  text?: string;
  exemptions?: RestrictionConfig[];
}

export interface RestrictionConfig {
  user: string;
}

export interface ToggleMenuActionConfig extends BaseActionConfig {
  action: "toggle-menu";
}

export interface ToggleActionConfig extends BaseActionConfig {
  action: "toggle";
}

export interface CallServiceActionConfig extends BaseActionConfig {
  action: "call-service";
  service: string;
  service_data?: {
    entity_id?: string | [string];
    [key: string]: any;
  };
  target?: HassServiceTarget;
}

export interface NavigateActionConfig extends BaseActionConfig {
  action: "navigate";
  navigation_path: string;
}

export interface UrlActionConfig extends BaseActionConfig {
  action: "url";
  url_path: string;
}

export interface MoreInfoActionConfig extends BaseActionConfig {
  action: "more-info";
  entity?: string;
}

export interface NoActionConfig extends BaseActionConfig {
  action: "none";
}

export interface CustomActionConfig extends BaseActionConfig {
  action: "fire-dom-event";
}

export type ActionConfig =
  | ToggleActionConfig
  | CallServiceActionConfig
  | NavigateActionConfig
  | UrlActionConfig
  | MoreInfoActionConfig
  | NoActionConfig
  | CustomActionConfig
  | ToggleMenuActionConfig;

export interface ActionHandlerDetail {
  action: string;
}

export interface ActionHandlerOptions {
  hasHold?: boolean;
  hasDoubleClick?: boolean;
  disabled?: boolean;
}

export type ActionHandlerEvent = HASSDomEvent<ActionHandlerDetail>;

// =====================================================================================================================
// 3. CARD CONFIGURATION (ELG)
// Types specific to the Energy Line Gauge configuration structure.
// =====================================================================================================================

export interface ELGConfig extends LovelaceCardConfig {
  entity: string;

  // Title
  title?: string;
  subtitle?: string;
  header?: string;

  title_position?: PositionType;
  title_text_size?: number;
  title_text_style?: TextStyleType;

  title_text_color?: CSSColor;
  title_text_colour?: CSSColor; // British English support

  subtitle_text_color?: CSSColor;
  subtitle_text_colour?: CSSColor; // British English support

  // Min / Max
  min?: number | string;
  max?: number | string;

  // Value Display
  precision?: number;
  unit?: string;
  cutoff?: number;
  offset?: string | number; // Duration string (e.g., "1h") or milliseconds
  sorting?: SortingType;

  position?: ValuePositionType;
  text_size?: number;
  text_style?: TextStyleType;

  text_color?: CSSColor;
  text_colour?: CSSColor; // British English support

  // Styling
  line_height?: number;
  corner?: CornerType;
  state_content_separator?: string;

  line_separator?: boolean;
  line_separator_width?: LineSeparatorWidthType;

  line_separator_color?: CSSColor;
  line_separator_colour?: CSSColor; // British English support

  color?: CSSColor;
  color_bg?: CSSColor;
  colour?: CSSColor; // British English support
  colour_bg?: CSSColor; // British English support

  // Line Text
  line_text_position?: LinePositionType;
  line_text_size?: number;
  line_text_style?: TextStyleType;

  line_text_color?: CSSColor;
  line_text_colour?: CSSColor; // British English support

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
  legend_alignment?: LegendAlignmentType;
  legend_indicator?: IndicatorType;
  legend_text_size?: number;
  legend_text_style?: TextStyleType;

  legend_text_color?: CSSColor;
  legend_text_colour?: CSSColor; // British English support

  // Show Delta
  show_delta?: boolean;
  delta_position?: PositionType;

  // Untracked Legend
  untracked_legend?: boolean;
  untracked_legend_label?: string;
  untracked_legend_icon?: string;
  untracked_legend_indicator?: IndicatorType;

  untracked_state_content?: UntrackedStateContentType;
  untracked_line_state_content?: UntrackedStateContentType;

  // Misc
  suppress_warnings?: boolean;
  config_version?: number;

  // Statistics
  statistics?: boolean;
  statistics_day_offset?: number;
  statistics_period?: StatisticsPeriodType;
  statistics_function?: StatisticsFunctionType;

  // Severity Levels
  severity?: boolean
  severity_levels?: SeverityType[];
  severity_blend?: boolean;

  // Sub-Entities
  entities: ELGEntity[];
}

export interface ELGEntity {
  entity: string;

  // Identity
  name?: string;
  icon?: string;
  color?: CSSColor;
  colour?: CSSColor; // British English support

  // Value Processing
  cutoff?: number;
  unit?: string;
  multiplier?: number;
  precision?: number;

  // Display Content
  state_content?: StateContentType;
  line_state_content?: StateContentType;

  // Styling
  legend_indicator?: IndicatorType;
  legend_text_color?: CSSColor;
  legend_text_colour?: CSSColor; // British English support
  line_text_color?: CSSColor;
  line_text_colour?: CSSColor; // British English support

  // Actions
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface SeverityType {
  from: number;
  color?: CSSColor;
  colour?: CSSColor; // British English support
}

// =====================================================================================================================
// 4. INTERNAL STATE & DATA
// Types used for calculation, history retrieval, and runtime state.
// =====================================================================================================================

export interface ELGState {
  state: number;
  width: number;
  percentage: number;
}

export interface ELGEntityState extends ELGState {
  stateObject: HassEntity;
}

export interface EntityWarning {
  message: string;
  entity_id?: string;
}

// History API
export interface HassHistoryEntry {
  last_updated: string;
  state: string;
  last_changed: string;
  attributes?: any;
  entity_id: string;
}

export type HassHistory = Array<HassHistoryEntry>;

export type ELGHistoryOffsetEntities = {
  [entity_id: string]: ELGHistoryOffsetEntry[];
};

export type ELGHistoryOffsetEntry = {
  state: string;
  last_changed: string;
};

export type ELGHistoryOffset = {
  start_time: number;
  end_time: number;
  updating: boolean;
  history: ELGHistoryOffsetEntities;
};

// Statistics API
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

export type HassStatistics = {
  [entity_id: string]: HassStatisticEntry[];
};

export type ELGHistoryStatisticsBucket = HassStatisticEntry;

export type ELGHistoryStatisticsBuckets = {
  [entity_id: string]: ELGHistoryStatisticsBucket[];
};

export type ELGHistoryStatistics = {
  updating: boolean;
  date: Date;
  buckets: ELGHistoryStatisticsBuckets;
};

// =====================================================================================================================
// 5. STYLING & OPTION TYPES
// Derived from the constant arrays in const.ts.
// =====================================================================================================================

export type RGBColor = [number, number, number, number];
export type CSSColor = string | undefined;

export type CornerType = typeof CORNER_TYPES[number];
export type SortingType = typeof SORTING_TYPES[number];
export type LineSeparatorWidthType = typeof LINE_SEPARATOR_WIDTH_TYPES[number];
export type TextStyleType = typeof TEXT_STYLE_TYPES[number][];
export type TextOverflowType = typeof TEXT_OVERFLOW_TYPES[number];
export type OverflowDirectionType = typeof OVERFLOW_DIRECTION_TYPES[number];
export type IndicatorType = typeof INDICATOR_TYPES[number];

export type PositionType = typeof POSITION_TYPES[number];
export type ValuePositionType = typeof VALUE_POSITION_TYPES[number];
export type LinePositionType = typeof LINE_POSITION_TYPES[number];
export type LegendAlignmentType = typeof LEGEND_ALIGNMENT_TYPES[number];

export type StateContentType = typeof STATE_CONTENT_TYPES[number][];
export type UntrackedStateContentType = typeof UNTRACKED_STATE_CONTENT_TYPES[number][];

export type StatisticsPeriodType = typeof STATISTICS_PERIOD_TYPES[number];
export type StatisticsFunctionType = typeof STATISTICS_FUNCTION_TYPES[number];

// =====================================================================================================================
// 6. EDITOR & RENDER TYPES
// Types used specifically for the Visual Editor and Label Rendering.
// =====================================================================================================================

export interface HassCustomElement extends CustomElementConstructor {
  getConfigElement(): Promise<unknown>;
}

export interface ELGColorSelector {
  color_elg: {
    mode?: "text" | "line" | "severity" | "all";
    entity?: string;
    entities?: ELGEntity[];
  } | null;
}

export interface EditorTarget extends EventTarget {
  value?: string;
  index?: number;
  checked?: boolean;
  configValue?: string;
  type?: HTMLInputElement['type'];
  config: ActionConfig;
}

export type ColorEditorMode = undefined | 'automatic' | 'custom_rgb' | 'custom_css' |
  'text_primary' | 'text_secondary' | 'text_disabled' |
  'line_primary' | 'line_accent' | 'line_primary_bg' | 'line_secondary_bg' | 'line_card_bg';

export interface ColorEditorOption {
  mode: ColorEditorMode;
  value: string;
  categories: ('text' | 'line' | 'severity' | undefined)[];
}

export interface LabelRenderResult {
  template: TemplateResult | string;
  text: string;
}

export interface RendererContext {
  defaultLabel: string;
}

export interface DeviceRendererContext extends RendererContext {
  device: ELGEntity;
}

export type PartRenderer = (
  value: string,
  context: any,
  line: boolean
) => LabelRenderResult;

// =====================================================================================================================
// 7. GLOBAL AUGMENTATION
// =====================================================================================================================

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