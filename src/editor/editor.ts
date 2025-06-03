import { LitElement, TemplateResult, html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  mdiPalette,
  mdiLightningBolt,
  mdiGestureTap,
  mdiListBox,
  mdiChartBar,
  mdiChartAreaspline,
} from '@mdi/js';

import memoizeOne  from 'memoize-one';

import { fireEvent, HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';
import {
  ELGConfig,
  HassCustomElement,
  ELGEntity,
  LabelConfigEntry,
  DEFAULT_ACTIONS
} from '../types';

import './item-editor';
import './items-editor';
import { configElementStyle } from '../styles';

@customElement('energy-line-gauge-editor')
export class EnergyLineGaugeEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config!: ELGConfig;

  public async setConfig(config: ELGConfig): Promise<void> {
    this._config = config;
  }

  protected async firstUpdated(): Promise<void> {
    // This Preloads all standard hass components that are not natively available
    if (!customElements.get('ha-form') || !customElements.get('hui-action-editor')) {
      (customElements.get('hui-button-card') as HassCustomElement)?.getConfigElement();
    }

    if (!customElements.get('ha-entity-picker')) {
      (customElements.get('hui-entities-card') as HassCustomElement)?.getConfigElement();
    }
  }

  private _schema = memoizeOne(() => {
    if (!this.hass) return [];

    const cornerOptions = [
      { value: "square", label: "Square (default)" },
      { value: "lite-rounded", label: "Lite Rounded" },
      { value: "medium-rounded", label: "Medium Rounded" },
      { value: "rounded", label: "Rounded" },
      { value: "circular", label: "Circular" },
    ];

    const indicatorOptions = [
      { value: "circle", label: "Circle" },
      { value: "icon", label: "Icon" },
      { value: "icon-fallback", label: "Icon Fallback (default)" },
      { value: "none", label: "None" },
    ];

    const positionOptions = [
      { value: "left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center left") + " (default)" },
      { value: "right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center right") },
      { value: "none", label: this.hass.localize("ui.panel.lovelace.editor.action-editor.actions.none") },
      { value: "top-left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top left") },
      { value: "top-center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top center") },
      { value: "top-right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top right") },
      { value: "bottom-left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom left") },
      { value: "bottom-center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom center") },
      { value: "bottom-right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom right") },
    ];
    const linePositionOptions = positionOptions.concat({ value: "center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center") })

    const alignmentOptions = [
      { value: "left", label: 'Left' },
      { value: "right", label: 'Right' },
      { value: "center", label: 'Center (default)' },
      { value: "space-around", label: 'Space Around' },
      { value: "space-between", label: 'Space Between' },
      { value: "space-evenly", label: 'Space Evenly' },
    ];

    const styleOptions = [
      ["weight-lighter", "Lighter Weight"],
      ["weight-bold", "Bold Weight"],
      ["weight-bolder", "Bolder Weight"],
      ["style-italic", "Italic"],
      ["decoration-underline", "Underline"],
      ["decoration-overline", "Overline"],
      ["decoration-line-through", "Line Through"],
      ["transform-uppercase", "Uppercase"],
      ["transform-lowercase", "Lowercase"],
      ["transform-capitalize", "Capitalize"],
      ["family-monospace", "Monospace"],
      ["shadow-light", "Light Shadow"],
      ["shadow-medium", "Medium Shadow"],
      ["shadow-heavy", "Heavy Shadow"],
      ["shadow-hard", "Hard Shadow"],
      ["shadow-neon", "Neon Shadow"],
      ["black-outline", "Black Outline"],
      ["white-outline", "White Outline"]
    ];

    const overflowOptions = [
      { value: "ellipsis", label: "Ellipsis (default)" }, // Ellipsis
      { value: "clip", label: "Clip" }, // Clip
      { value: "fade", label: "Fade" }, // Fade
      { value: "tooltip", label: "Tooltip" }, // Tooltip
      { value: "tooltip-segment", label: "Tooltip Segment" }, // Tooltip Segment
    ];
    const overflowDirectionOptions = [
      { value: "right", label: "Right (default)" }, // Right (default)
      { value: "left", label: "Left" }, // Left
    ];

    const untrackedStateContent = [
      ["name", this.hass.localize("ui.components.state-content-picker.name")], // Name
      ["state", this.hass.localize("ui.components.state-content-picker.state")], // State
      ["percentage", this.hass.localize("ui.panel.lovelace.editor.edit_section.settings.column_span") + " [%]"], // Width [%]
    ];

    const statisticsPeriods = [
      { value: "5minute", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.periods.5minute")}, // 5 Minutes
      { value: "hour", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.periods.hour")}, // Hour
      { value: "day", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.periods.day")}, // Day
      { value: "week", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.periods.week")}, // Week
      { value: "month", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.periods.month")}, // Month
    ];

    const statisticsFunctions = [
      { value: "change", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.stat_type_labels.change")}, // Change
      { value: "max", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.stat_type_labels.max")}, // Max
      { value: "mean", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.stat_type_labels.mean")}, // Mean
      { value: "min", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.stat_type_labels.min")}, // Min
      { value: "state", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.stat_type_labels.state")}, // State
      { value: "sum", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.stat_type_labels.sum")}, // Sum
    ];

    return [
      {
        name: "entity",
        required: true,
        selector: { entity: { domain: ["sensor", "input_number", "number", "counter"] } },
      },

      {
        type: "grid",
        schema: [
          { name: "title", required: false, selector: { text: {} } },
          { name: "subtitle", required: false, selector: { text: {} } }
        ]
      },

      {
        type: "grid",
        schema: [
          { name: "min", required: false, selector: { number: { min: 0 } } },
          { name: "max", required: false, selector: { number: { min: 0 } } },
        ]
      },

      {
        type: "expandable",
        name: "expandable_appearance", // Appearance
        flatten: true,
        iconPath: mdiPalette,
        schema: [
          {
            type: "grid",
            schema: [
              { name: "suppress_warnings", required: false, selector: { boolean: {} } },
              { name: "corner", required: false, selector: { select: { mode: "dropdown", options: cornerOptions }}},
            ],
          },

          {
            type: "grid",
            schema: [
              { name: "legend_indicator", required: false, selector: { select: { mode: "dropdown", options: indicatorOptions }}},
              { name: "state_content_separator", required: false, selector: { text: {} } },
            ],
          },

          {
            type: "grid",
            schema: [
              { name: "color", required: false, selector: { color_rgb: {} } },
              { name: "color_bg", required: false, selector: { color_rgb: {} } },
            ],
          },

          {
            type: "expandable",
            name: "expandable_appearance_value", // Value
            flatten: true,
            schema: [
              {
                type: "grid",
                schema: [
                  { name: "position", required: false, selector: { select: { mode: "dropdown", options: positionOptions } } },
                  { name: "text_size", required: false, selector: { number: { min: 0.5, max: 5, step: 0.1, mode: "box" } } },
                ],
              },
              { name: "text_style", type: "multi_select", options: styleOptions },
            ]
          },

          {
            type: "expandable",
            name: "expandable_appearance_title", // Title
            flatten: true,
            schema: [
              {
                type: "grid",
                schema: [
                  { name: "title_position", required: false, selector: { select: { mode: "dropdown", options: positionOptions } } },
                  { name: "title_text_size", required: false, selector: { number: { min: 0.5, max: 5, step: 0.1, mode: "box" } } },
                ],
              },
              { name: "title_text_style", type: "multi_select", options: styleOptions },
            ]
          },

          {
            type: "expandable",
            name: "expandable_appearance_legend", // Legend
            flatten: true,
            schema: [
              {
                type: "grid",
                schema: [
                  { name: "legend_hide", required: false, selector: { boolean: {} } },
                  { name: "legend_all", required: false, selector: { boolean: {} } },
                ],
              },
              {
                type: "grid",
                schema: [
                  { name: "legend_position", required: false, selector: { select: { mode: "dropdown", options: positionOptions } } },
                  { name: "legend_alignment", required: false, selector: { select: { mode: "dropdown", options: alignmentOptions } } },
                ],
              },
              {
                type: "grid",
                schema: [
                  { name: "legend_text_style", type: "multi_select", options: styleOptions },
                  { name: "legend_text_size", required: false, selector: { number: { min: 0.5, max: 5, step: 0.1, mode: "box" } } },
                ],
              },
            ]
          },

          {
            type: "expandable",
            name: "expandable_appearance_delta", // Delta
            flatten: true,
            schema: [
              {
                type: "grid",
                schema: [
                  { name: "show_delta", required: false, selector: { boolean: {} } },
                  { name: "delta_position", required: false, selector: { select: { mode: "dropdown", options: positionOptions }}},
                ],
              },
            ]
          },

          {
            type: "expandable",
            name: "expandable_appearance_line_text", // State content (Line)
            flatten: true,
            schema: [
              {
                type: "grid",
                schema: [
                  { name: "line_text_position", required: false, selector: { select: { mode: "dropdown", options: linePositionOptions }}},
                  { name: "line_text_size", required: false, selector: { number: { min: 0.5, max: 5, step: 0.1, mode: "box" }}},
                ],
              },
              {
                type: "grid",
                schema: [
                  { name: "line_text_overflow", required: false, selector: { select: { mode: "dropdown", options: overflowOptions }}},
                  { name: "overflow_direction", required: false, selector: { select: { mode: "dropdown", options: overflowDirectionOptions }}},
                ],
              },
              { name: "line_text_style", type: "multi_select", options: styleOptions },
            ]
          },
        ],
      },

      {
        type: "expandable",
        iconPath: mdiChartAreaspline,
        name: 'expandable_value', // Value
        flatten: true,
        schema: [
          {
            type: "grid",
            schema: [
              { name: "unit", required: false, selector: { text: {} } },
              { name: "precision", required: false, selector: { number: {min: 0, step: 1} }},
            ],
          },
          {
            type: "grid",
            schema: [
              { name: "cutoff", required: false, selector: { number: {} } },
              { name: "offset", required: false, selector: { text: {} } },
            ]
          },
        ],
      },

      {
        type: "expandable",
        iconPath: mdiLightningBolt,
        name: "expandable_untracked", // Untracked consumption
        flatten: true,
        schema: [
          { name: "untracked_legend", required: false, selector: { boolean: {} } },
          {
            type: "grid",
            schema: [
              { name: "untracked_legend_label", required: false, selector: { text: {} } },
              { name: "untracked_legend_icon", required: false, selector: { icon: {} } },
            ],
          },
          {
            type: "grid",
            schema: [
              {
                type: "multi_select",
                options: untrackedStateContent,
                name: "untracked_state_content",
                required: false,
                default: ["name"],
              },
              {
                type: "multi_select",
                options: untrackedStateContent,
                name: "untracked_line_state_content",
                required: false,
                default: [],
              },
            ],
          },
        ],
      },

      {
        type: "expandable",
        iconPath: mdiChartBar,
        name: "expandable_statistic", // Statistic
        flatten: true,
        schema: [
          {
            name: "",
            type: "grid",
            schema: [
              { name: "statistics", required: false, selector: { boolean: {} } },
              { name: "statistics_day_offset", required: false, selector: { number: { min: 1, step: 1} } },
              { name: "statistics_period", required: false, selector: { select: { mode: "dropdown", options: statisticsPeriods }}},
              { name: "statistics_function", required: false, selector: { select: { mode: "dropdown", options: statisticsFunctions }}},
            ],
          },
        ],
      },

      {
        type: "expandable",
        iconPath: mdiGestureTap,
        name: "expandable_interactions", // Interactions
        flatten: true,
        schema: [
          {
            name: "tap_action",
            selector: {
              ui_action: {
                default_action: "more-info",
                DEFAULT_ACTIONS,
              },
            },
          },
          {
            name: "hold_action",
            selector: {
              ui_action: {
                default_action: "more-info",
                DEFAULT_ACTIONS,
              },
            },
          },
          {
            name: "double_tap_action",
            selector: {
              ui_action: {
                default_action: "none",
                DEFAULT_ACTIONS,
              },
            },
          }
        ],
      },
    ];
  });

  protected render(): TemplateResult | void {
    if (!this.hass || !this._config) return html``;
    if (this._subElementEditor != undefined) return this._renderSubElementEditor();

    const data = {
      ...this._config,
    };

    return html`
      <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${this._schema()}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
      ></ha-form>
      <ha-expansion-panel outlined>
        <div slot="header" role="heading" aria-level="3">
          <ha-svg-icon slot="leading-icon" .path=${mdiListBox}></ha-svg-icon>
          ${this.hass.localize("ui.panel.lovelace.editor.card.heading.entities")}
        </div>
        <div class="content">
          <energy-line-gauge-items-editor 
            .hass=${this.hass}
            .entities=${this._config.entities}
            .entity_id=${this._config.entity}
            @edit-item=${this._edit_item}
            @config-changed=${this._entitiesChanged}
          ></energy-line-gauge-items-editor>
        </div>  
      </ha-expansion-panel>
      <br />
      `;
  }

  private _computeLabelCallback = (schema: any) => {
    if (!this.hass) return "";

    const labelMap: Record<string, LabelConfigEntry> = {
      // Entity (required)
      entity: {
        tryLocalize: (hass) =>
          `${hass.localize("ui.panel.lovelace.editor.card.generic.entity")} (${hass.localize("ui.panel.lovelace.editor.card.config.required")})`,
        fallback: "Entity (required)"
      },

      // Title
      title: {
        tryLocalize: "ui.panel.lovelace.editor.card.heading.heading_style_options.title",
        fallback: "Title"
      },
      // Subtitle
      subtitle: {
        tryLocalize: "ui.panel.lovelace.editor.card.heading.heading_style_options.subtitle",
        fallback: "Subtitle"
      },

      // Minimum
      min: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.minimum",
        fallback: "Minimum",
      },
      // Maximum
      max: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.maximum",
        fallback: "Maximum",
      },

      // ------------------------------------------- Appearance --------------------------------------------------------
      expandable_appearance: {
        tryLocalize: "ui.panel.lovelace.editor.card.map.appearance",
        fallback: "Appearance",
      },

      // Suppress Warnings
      suppress_warnings: {
        tryLocalize: () => "Suppress Warnings",
        fallback: "Suppress Warnings",
      },
      // Theme
      corner: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.theme",
        fallback: "Theme",
      },

      // Legend Indicator
      legend_indicator: {
        tryLocalize: () => "Legend Indicator",
        fallback: "Legend Indicator",
      },
      // State Content Separator
      state_content_separator: {
        tryLocalize: () => "State Content Separator",
        fallback: "State Content Separator",
      },

      // Line
      color: {
        tryLocalize: "ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line",
        fallback: "Line Color",
      },
      // Background
      color_bg: {
        tryLocalize: "ui.panel.lovelace.editor.edit_view.tab_background",
        fallback: "Background Color",
      },

      // ---------------------------------------------------- Value ----------------------------------------------------
      expandable_appearance_value: {
        tryLocalize: "ui.panel.config.zwave_js.node_config.value",
        fallback: "Value",
      },

      // Position
      position: {
        tryLocalize: 'ui.panel.lovelace.editor.card.entities.secondary_info_values.position',
        fallback: "Position",
      },
      // Size (rem)
      text_size: {
        tryLocalize: (hass) => `${hass.localize("ui.panel.config.zwave_js.node_config.size")} (rem)`,
        fallback: "Size (rem)",
      },

      // Style
      text_style: {
        tryLocalize: 'ui.panel.lovelace.editor.elements.style',
        fallback: "Style",
      },

      // ---------------------------------------------------------------------------------------------------------------

      // ---------------------------------------------------- Title ----------------------------------------------------
      expandable_appearance_title: {
        tryLocalize: 'ui.panel.lovelace.editor.card.heading.heading_style_options.title',
        fallback: "Title",
      },

      // Position
      title_position: {
        tryLocalize: 'ui.panel.lovelace.editor.card.entities.secondary_info_values.position',
        fallback: "Position",
      },
      // Size (rem)
      title_text_size: {
        tryLocalize: (hass) => `${hass.localize("ui.panel.config.zwave_js.node_config.size")} (rem)`,
        fallback: "Size (rem)",
      },

      // Style
      title_text_style: {
        tryLocalize: 'ui.panel.lovelace.editor.elements.style',
        fallback: "Style",
      },

      // ---------------------------------------------------------------------------------------------------------------

      // --------------------------------------------------- Legend ----------------------------------------------------
      expandable_appearance_legend: {
        tryLocalize: "Legend",
        fallback: "Legend",
      },

      // Hide legend
      legend_hide: {
        tryLocalize: "ui.panel.lovelace.editor.card.statistics-graph.hide_legend",
        fallback: "Hide Legend",
      },
      // Show all
      legend_all: {
        tryLocalize: 'ui.panel.config.category.filter.show_all',
        fallback: "Show All",
      },

      // Position
      legend_position: {
        tryLocalize: 'ui.panel.lovelace.editor.card.entities.secondary_info_values.position',
        fallback: "Position",
      },
      // Legend Alignment
      legend_alignment: {
        tryLocalize: () => "Legend Alignment",
        fallback: "Legend Alignment",
      },

      // Style
      legend_text_style: {
        tryLocalize: 'ui.panel.lovelace.editor.elements.style',
        fallback: "Style",
      },
      // Size (rem)
      legend_text_size: {
        tryLocalize: (hass) => `${hass.localize("ui.panel.config.zwave_js.node_config.size")} (rem)`,
        fallback: "Size (rem)",
      },

      // ---------------------------------------------------------------------------------------------------------------

      // ---------------------------------------------------- Delta ----------------------------------------------------
      expandable_appearance_delta: {
        tryLocalize: () => "Delta",
        fallback: "Delta",
      },

      // Show stat
      show_delta: {
        tryLocalize: "ui.panel.lovelace.editor.card.statistic.stat_types",
        fallback: "Show Delta",
      },
      // Position
      delta_position: {
        tryLocalize: 'ui.panel.lovelace.editor.card.entities.secondary_info_values.position',
        fallback: "Position",
      },

      // ---------------------------------------------------------------------------------------------------------------

      // --------------------------------------------- State content (Line) --------------------------------------------
      expandable_appearance_line_text: {
        tryLocalize: (hass) =>
        `${hass.localize("ui.panel.lovelace.editor.card.heading.entity_config.state_content")} (${hass.localize("ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line")})`,
        fallback: "State Content (Line)",
      },

      // Position
      line_text_position: {
        tryLocalize: 'ui.panel.lovelace.editor.card.entities.secondary_info_values.position',
        fallback: "Position",
      },
      // Size (rem)
      line_text_size: {
        tryLocalize: (hass) => `${hass.localize("ui.panel.config.zwave_js.node_config.size")} (rem)`,
        fallback: "Size (rem)",
      },

      // Overflow
      line_text_overflow: {
        tryLocalize: () => "Overflow",
        fallback: "Overflow",
      },
      // Overflow Direction
      overflow_direction: {
        tryLocalize: () => "Overflow Direction",
        fallback: "Overflow Direction",
      },

      // Style
      line_text_style: {
        tryLocalize: 'ui.panel.lovelace.editor.elements.style',
        fallback: "Style",
      },

      // ---------------------------------------------------------------------------------------------------------------
      // ---------------------------------------------------------------------------------------------------------------

      // ----------------------------------------------- Value ---------------------------------------------------------
      expandable_value: {
        tryLocalize: 'ui.panel.config.zwave_js.node_config.value',
        fallback: "Value",
      },

      // Unit
      unit: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.unit",
        fallback: "Unit",
      },
      // Display Precision
      precision: {
        tryLocalize: "ui.dialogs.entity_registry.editor.precision",
        fallback: "Display Precision",
      },

      // Lower limit
      cutoff: {
        tryLocalize: "ui.panel.config.automation.editor.triggers.type.numeric_state.lower_limit",
        fallback: "Lower Limit",
      },
      // Offset (optional)
      offset: {
        tryLocalize: "ui.panel.config.automation.editor.triggers.type.calendar.offset",
        fallback: "Offset (optional)",
      },

      // ---------------------------------------------------------------------------------------------------------------

      // ----------------------------------------- Untracked consumption -----------------------------------------------
      expandable_untracked: {
        tryLocalize: 'ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption',
        fallback: "Untracked Consumption",
      },

      // Untracked consumption
      untracked_legend: {
        tryLocalize: "ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption",
        fallback: "Untracked Consumption",
      },

      // Name
      untracked_legend_label: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.name",
        fallback: "Name",
      },
      // Icon
      untracked_legend_icon: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.icon",
        fallback: "Icon",
      },

      // State content
      untracked_state_content: {
        tryLocalize: "ui.panel.lovelace.editor.card.heading.entity_config.state_content",
        fallback: "State Content",
      },
      // State content (Line)
      untracked_line_state_content: {
        tryLocalize: (hass) =>
        `${hass.localize("ui.panel.lovelace.editor.card.heading.entity_config.state_content")} (${hass.localize("ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line")})`,
        fallback: "State Content (Line)",
      },

      // ---------------------------------------------------------------------------------------------------------------

      // ------------------------------------------------ Statistic ----------------------------------------------------
      expandable_statistic: {
        tryLocalize: 'ui.panel.lovelace.editor.card.statistics-graph.picked_statistic',
        fallback: "Statistic",
      },

      // Statistic
      statistics: {
        tryLocalize: "ui.panel.lovelace.editor.card.statistics-graph.picked_statistic",
        fallback: "Statistic",
      },
      // Offset (optional) (Day)
      statistics_day_offset: {
        tryLocalize: (hass) =>
        `${hass.localize("ui.panel.config.automation.editor.triggers.type.calendar.offset")} (${hass.localize("ui.panel.lovelace.editor.card.statistics-graph.periods.day")})`,
        fallback: "Offset (optional) (Day)",
      },
      // Period
      statistics_period: {
        tryLocalize: "ui.panel.lovelace.editor.card.statistics-graph.period",
        fallback: "Period",
      },
      // Show stat types
      statistics_function: {
        tryLocalize: "ui.panel.lovelace.editor.card.statistics-graph.stat_types",
        fallback: "Show Stat Types",
      },

      // ---------------------------------------------------------------------------------------------------------------

      // ----------------------------------------------- Interactions --------------------------------------------------
      expandable_interactions: {
        tryLocalize: 'ui.panel.lovelace.editor.card.generic.interactions',
        fallback: "Interactions",
      },

      // Tap action
      tap_action: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.tap_action",
        fallback: "Tap Action",
      },
      // Hold action
      hold_action: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.hold_action",
        fallback: "Hold Action",
      },
      // Double tap action
      double_tap_action: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.double_tap_action",
        fallback: "Double Tap Action",
      },

      // ---------------------------------------------------------------------------------------------------------------
    };

    const entry: LabelConfigEntry = labelMap[schema.name];
    if (!entry) return schema.name;

    const label = typeof entry.tryLocalize === "function" ? entry.tryLocalize(this.hass) : this.hass.localize(entry.tryLocalize);
    return label || entry.fallback || schema.name;
  };

  private _entitiesChanged(ev: CustomEvent<ELGEntity[]>): void {
    ev.stopPropagation();
    if (!this._config || !this.hass) {
      return;
    }
    fireEvent(this, 'config-changed', { config: { ...this._config, entities: ev.detail } as ELGConfig });
  }

  private _edit_item(ev: CustomEvent<number>): void {
    ev.stopPropagation();
    if (!this._config || !this.hass) {
      return;
    }
    // ev.detail => index
    this._subElementEditor = ev.detail;
  }

  /**
   * SubElementEditor
   */

  @state() private _subElementEditor: number | undefined = undefined;

  private _renderSubElementEditor(): TemplateResult {
    return html`
      <div class="header">
        <div class="back-title">
          <mwc-icon-button @click=${this._goBack}>
            <ha-icon icon="mdi:arrow-left"></ha-icon>
          </mwc-icon-button>
        </div>
      </div>
      <energy-line-gauge-item-editor
          .hass=${this.hass}
          .config=${this._config.entities[this._subElementEditor || 0]}
          @config-changed=${this._itemChanged}
      ></energy-line-gauge-item-editor>
      `;
  }

  private _goBack(): void {
    this._subElementEditor = undefined;
  }

  private _itemChanged(ev: CustomEvent<ELGEntity>) {
    ev.stopPropagation();
    if (!this._config || !this.hass) {
      return;
    }
    if (this._subElementEditor != undefined) {
      const entities = [...this._config.entities];
      entities[this._subElementEditor] = ev.detail;
      fireEvent(this, 'config-changed', { config : { ...this._config, entities: entities }});
    }
  }

  private _valueChanged(ev: any): void {
    if (!this._config || !this.hass) {
      return;
    }
    const config = ev.detail.value;
    fireEvent(this, 'config-changed', { config: config });
  }

    static get styles(): CSSResultGroup {
        return [
            configElementStyle,
            css`
              ha-form {
                padding-bottom: 24px;
                display: block;
              }
            `
        ];
    }
}
