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

import { fireEvent, HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';
import {
  ELGConfig,
  HassCustomElement,
  ELGEntity,
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

  protected render(): TemplateResult | void {
    if (!this.hass || !this._config) return html``;
    if (this._subElementEditor != undefined) return this._renderSubElementEditor();

    const schema = [
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
          { name: "min", required: false, selector: { number: {} }},
          { name: "max", required: false, selector: { number: {} }},
        ]
      },

      {
        type: "expandable",
        title: this.hass.localize(`ui.panel.lovelace.editor.card.map.appearance`), // Appearance
        iconPath: mdiPalette,
        schema: [
          {
            type: "grid",
            schema: [
              { name: "legend_hide", required: false, selector: { boolean: {} } },
              { name: "legend_all", required: false, selector: { boolean: {} } },
              { name: "show_delta", required: false, selector: { boolean: {} } },
              { name: "suppress_warnings", required: false, selector: { boolean: {} } },
            ]
          },
          {
            type: "grid",
            schema: [
              { name: "corner", required: false, selector:
                {
                  select: {
                    mode: "dropdown",
                    options: [
                      { value: "square", label: "Square (default)" },
                      { value: "lite_rounded", label: "Lite Rounded" },
                      { value: "medium_rounded", label: "Medium Rounded" },
                      { value: "rounded", label: "Rounded" },
                      { value: "circular", label: "Circular" },
                    ]
                  }
                }
              },
              { name: "legend_alignment", required: false, selector:
                {
                  select: {
                    mode: "dropdown",
                    options: [
                      { value: "left", label: "Left" },
                      { value: "right", label: "Right" },
                      { value: "center", label: "Center (default)" },
                      { value: "space-around", label: "Space Around" },
                      { value: "space-between", label: "Space Between" },
                      { value: "space-evenly", label: "Space Evenly" },
                    ]
                  }
                }
              },
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
            title: this.hass.localize(`ui.panel.lovelace.editor.card.entities.secondary_info_values.position`), // Position
            flatten: true,
            schema: [
              {
                type: "grid",
                schema: [
                  { name: "position", required: false, selector:
                    {
                      select: {
                        mode: "dropdown",
                        options: [
                          { value: "left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center left") + " (default)" },
                          { value: "right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center right") },
                          { value: "none", label: this.hass.localize("ui.panel.lovelace.editor.action-editor.actions.none") },
                          { value: "top-left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top left") },
                          { value: "top-center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top center") },
                          { value: "top-right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top right") },
                          { value: "bottom-left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom left") },
                          { value: "bottom-center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom center") },
                          { value: "bottom-right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom right") },
                        ]
                      }
                    }
                  },
                  { name: "title_position", required: false, selector:
                    {
                      select: {
                        mode: "dropdown",
                        options: [
                          { value: "left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center left") },
                          { value: "right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center right") },
                          { value: "none", label: this.hass.localize("ui.panel.lovelace.editor.action-editor.actions.none") },
                          { value: "top-left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top left") + " (default)" },
                          { value: "top-center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top center") },
                          { value: "top-right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top right") },
                          { value: "bottom-left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom left") },
                          { value: "bottom-center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom center") },
                          { value: "bottom-right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom right") },
                        ]
                      }
                    }
                  },
                ],
              },
              {
                type: "grid",
                schema: [
                  { name: "legend_position", required: false, selector:
                    {
                      select: {
                        mode: "dropdown",
                        options: [
                          { value: "left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center left") },
                          { value: "right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center right") },
                          { value: "none", label: this.hass.localize("ui.panel.lovelace.editor.action-editor.actions.none") },
                          { value: "top-left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top left") },
                          { value: "top-center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top center") },
                          { value: "top-right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top right") },
                          { value: "bottom-left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom left") },
                          { value: "bottom-center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom center") + " (default)" },
                          { value: "bottom-right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom right") },
                        ]
                      }
                    }
                  },
                  { name: "delta_position", required: false, selector:
                    {
                      select: {
                        mode: "dropdown",
                        options: [
                          { value: "left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center left") },
                          { value: "right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center right") },
                          { value: "none", label: this.hass.localize("ui.panel.lovelace.editor.action-editor.actions.none") },
                          { value: "top-left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top left") },
                          { value: "top-center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top center") },
                          { value: "top-right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top right") },
                          { value: "bottom-left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom left") },
                          { value: "bottom-center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom center") + " (default)" },
                          { value: "bottom-right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom right") },
                        ]
                      }
                    }
                  },
                ],
              },
              { name: "line_text_position", required: false, selector:
                {
                  select: {
                    mode: "dropdown",
                    options: [
                      { value: "left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center left") + " (default)" },
                      { value: "right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center right") },
                      { value: "center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.center") },
                      { value: "top-left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top left") },
                      { value: "top-center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top center") },
                      { value: "top-right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.top right") },
                      { value: "bottom-left", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom left") },
                      { value: "bottom-center", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom center") },
                      { value: "bottom-right", label: this.hass.localize("ui.panel.lovelace.editor.edit_view.background.alignment.options.bottom right") },
                    ]
                  }
                }
              },
            ]
          },

          {
            type: "expandable",
            title: `Text ${this.hass.localize("ui.panel.config.zwave_js.node_config.size")} (rem)`, // Text Size (rem)
            flatten: true,
            schema: [
              {
                type: "grid",
                schema: [
                  { name: "text_size", required: false, selector: { number: { min: 0.5, max: 5, step: 0.1, mode: "box"} } },
                  { name: "title_text_size", required: false, selector: { number: { min: 0.5, max: 5, step: 0.1, mode: "box"} } },
                ],
              },
              { name: "line_text_size", required: false, selector: { number: { min: 0.2, max: 4, step: 0.1, mode: "box"} } },
            ]
          },
        ],
      },

      {
        type: "expandable",
        iconPath: mdiChartAreaspline,
        title: this.hass.localize(`ui.panel.config.zwave_js.node_config.value`), // Value
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
        title: this.hass.localize(`ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption`), // Untracked consumption
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
                options: [
                  ["name", this.hass.localize("ui.components.state-content-picker.name")], // Name
                  ["state", this.hass.localize("ui.components.state-content-picker.state")], // State
                  ["percentage", this.hass.localize("ui.panel.lovelace.editor.edit_section.settings.column_span") + " [%]"], // Width [%]
                ],
                name: "untracked_state_content",
                required: false,
                default: ["name"],
              },
              {
                type: "multi_select",
                options: [
                  ["name", this.hass.localize("ui.components.state-content-picker.name")], // Name
                  ["state", this.hass.localize("ui.components.state-content-picker.state")], // State
                  ["percentage", this.hass.localize("ui.panel.lovelace.editor.edit_section.settings.column_span") + " [%]"], // Width [%]
                ],
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
        title: this.hass.localize(`ui.panel.lovelace.editor.card.statistics-graph.picked_statistic`), // Statistic
        flatten: true,
        schema: [
          {
            name: "",
            type: "grid",
            schema: [
              { name: "statistics", required: false, selector: { boolean: {} } },
              { name: "statistics_day_offset", required: false, selector: { number: { min: 1, step: 1} } },
              { name: "statistics_period", required: false, selector:
                {
                  select: {
                    mode: "dropdown",
                    options: [
                      { value: "5minute", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.periods.5minute")}, // 5 Minutes
                      { value: "hour", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.periods.hour")}, // Hour
                      { value: "day", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.periods.day")}, // Day
                      { value: "week", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.periods.week")}, // Week
                      { value: "month", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.periods.month")}, // Month
                    ]
                  }
                }
              },
              { name: "statistics_function", required: false, selector:
                {
                  select: {
                    mode: "dropdown",
                    options: [
                      { value: "change", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.stat_type_labels.change")}, // Change
                      { value: "max", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.stat_type_labels.max")}, // Max
                      { value: "mean", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.stat_type_labels.mean")}, // Mean
                      { value: "min", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.stat_type_labels.min")}, // Min
                      { value: "state", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.stat_type_labels.state")}, // State
                      { value: "sum", label: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.stat_type_labels.sum")}, // Sum
                    ]
                  }
                }
              },
            ],
          },
        ],
      },

      {
        type: "expandable",
        iconPath: mdiGestureTap,
        title: this.hass.localize(`ui.panel.lovelace.editor.card.generic.interactions`), // Interactions
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

    const data = {
      ...this._config,
    };

    return html`
      <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${schema}
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

    const labelMap: Record<string, string | ((hass: any) => string)> = {
      // Entity (required)
      entity: (hass) =>
        `${hass.localize("ui.panel.lovelace.editor.card.generic.entity")} (${hass.localize("ui.panel.lovelace.editor.card.config.required")})`,

      // Title
      title: "ui.panel.lovelace.editor.card.heading.heading_style_options.title",
      // Subtitle
      subtitle: "ui.panel.lovelace.editor.card.heading.heading_style_options.subtitle",

      // Minimum
      min: "ui.panel.lovelace.editor.card.generic.minimum",
      // Maximum
      max: "ui.panel.lovelace.editor.card.generic.maximum",

      // ------------------------------------------- Appearance --------------------------------------------------------
      // Hide legend
      legend_hide: "ui.panel.lovelace.editor.card.statistics-graph.hide_legend",
      // Select all
      legend_all: "ui.components.subpage-data-table.select_all",
      // Show stat
      show_delta: "ui.panel.lovelace.editor.card.statistic.stat_types",
      // Suppress Warnings
      suppress_warnings: () => "Suppress Warnings",

      // Theme
      corner: "ui.panel.lovelace.editor.card.generic.theme",
      // Legend Alignment
      legend_alignment: () => "Legend Alignment",

      // Line
      color: "ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line",
      // Background
      color_bg: "ui.panel.lovelace.editor.edit_view.tab_background",

      // ----------------------------------------------- Position ------------------------------------------------------

      // Value
      position: "ui.panel.config.zwave_js.node_config.value",
      // Title
      title_position: "ui.panel.lovelace.editor.card.heading.heading_style_options.title",

      // Legend
      legend_position: () => "Legend",
      // Show stat
      delta_position: "ui.panel.lovelace.editor.card.statistic.stat_types",

      // State content (Line)
      line_text_position: (hass) =>
        `${hass.localize("ui.panel.lovelace.editor.card.heading.entity_config.state_content")} (${hass.localize("ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line")})`,

      // ---------------------------------------------------------------------------------------------------------------

      // -------------------------------------------- Text Size (rem) --------------------------------------------------

      // Value
      text_size: "ui.panel.config.zwave_js.node_config.value",
      // Title
      title_text_size: "ui.panel.lovelace.editor.card.heading.heading_style_options.title",

      // State content (Line)
      line_text_size: (hass) =>
        `${hass.localize("ui.panel.lovelace.editor.card.heading.entity_config.state_content")} (${hass.localize("ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line")})`,

      // ---------------------------------------------------------------------------------------------------------------
      // ---------------------------------------------------------------------------------------------------------------

      // ----------------------------------------------- Value ---------------------------------------------------------

      // Unit
      unit: "ui.panel.lovelace.editor.card.generic.unit",
      // Display Precision
      precision: "ui.dialogs.entity_registry.editor.precision",

      // Lower limit
      cutoff: "ui.panel.config.automation.editor.triggers.type.numeric_state.lower_limit",
      // Offset (optional)
      offset: "ui.panel.config.automation.editor.triggers.type.calendar.offset",

      // ---------------------------------------------------------------------------------------------------------------

      // ----------------------------------------- Untracked consumption -----------------------------------------------

      // Untracked consumption
      untracked_legend: "ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption",

      // Name
      untracked_legend_label: "ui.panel.lovelace.editor.card.generic.name",
      // Icon
      untracked_legend_icon: "ui.panel.lovelace.editor.card.generic.icon",

      // State content
      untracked_state_content: "ui.panel.lovelace.editor.card.heading.entity_config.state_content",
      // State content (Line)
      untracked_line_state_content: (hass) =>
        `${hass.localize("ui.panel.lovelace.editor.card.heading.entity_config.state_content")} (${hass.localize("ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line")})`,

      // ---------------------------------------------------------------------------------------------------------------

      // ------------------------------------------------ Statistic ----------------------------------------------------

      // Statistic
      statistics: "ui.panel.lovelace.editor.card.statistics-graph.picked_statistic",
      // Offset (optional) (Day)
      statistics_day_offset: (hass) =>
        `${hass.localize("ui.panel.config.automation.editor.triggers.type.calendar.offset")} (${hass.localize("ui.panel.lovelace.editor.card.statistics-graph.periods.day")})`,
      // Period
      statistics_period: "ui.panel.lovelace.editor.card.statistics-graph.period",
      // Show stat types
      statistics_function: "ui.panel.lovelace.editor.card.statistics-graph.stat_types",

      // ---------------------------------------------------------------------------------------------------------------

      // ----------------------------------------------- Interactions --------------------------------------------------

      // Tap action
      tap_action: "ui.panel.lovelace.editor.card.generic.tap_action",
      // Hold action
      hold_action: "ui.panel.lovelace.editor.card.generic.hold_action",
      // Double tap action
      double_tap_action: "ui.panel.lovelace.editor.card.generic.double_tap_action",

      // ---------------------------------------------------------------------------------------------------------------
    };

    const entry = labelMap[schema.name];
    if (!entry) return schema.name;

    return typeof entry === "function" ? entry(this.hass) : this.hass.localize(entry);
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
