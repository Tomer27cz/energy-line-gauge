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
        name: "",
        type: "grid",
        schema: [
          { name: "title", required: false, selector: { text: {} } },
          { name: "subtitle", required: false, selector: { text: {} } }
        ]
      },

      {
        name: "",
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
            name: "",
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
            ],
          },

          {
            name: "",
            type: "grid",
            schema: [
              { name: "color", required: false, selector: { color_rgb: {} } },
              { name: "color_bg", required: false, selector: { color_rgb: {} } },
            ],
          },

          {
            type: "expandable",
            title: this.hass.localize(`ui.panel.config.zwave_js.node_config.value`),
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
                          { value: "left", label: "Left (default)" },
                          { value: "right", label: "Right" },
                          { value: "none", label: "Not Displayed" },
                          { value: "top-left", label: "Top Left" },
                          { value: "top-center", label: "Top Center" },
                          { value: "top-right", label: "Top Right" },
                          { value: "bottom-left", label: "Bottom Left" },
                          { value: "bottom-center", label: "Bottom Center" },
                          { value: "bottom-right", label: "Bottom Right" },
                        ]
                      }
                    }
                  },
                  { name: "text_size", required: false, selector: { number: { min: 0.5, max: 5, step: 0.1, mode: "box"} } },
                ],
              },
            ]
          },
          {
            type: "expandable",
            title: `${this.hass.localize(
              `ui.panel.lovelace.editor.card.heading.entity_config.state_content`
            )} (${this.hass.localize(
              "ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line"
            )})`, // State content (Line)
            flatten: true,
            schema: [
              {
                type: "grid",
                schema: [
                  { name: "line_text_position", required: false, selector:
                    {
                      select: {
                        mode: "dropdown",
                        options: [
                          { value: "left", label: "Left (default)" },
                          { value: "right", label: "Right" },
                          { value: "center", label: "Center" },
                          { value: "top-left", label: "Top Left" },
                          { value: "top-center", label: "Top Center" },
                          { value: "top-right", label: "Top Right" },
                          { value: "bottom-left", label: "Bottom Left" },
                          { value: "bottom-center", label: "Bottom Center" },
                          { value: "bottom-right", label: "Bottom Right" },
                        ]
                      }
                    }
                  },
                  { name: "line_text_size", required: false, selector: { number: { min: 0.2, max: 4, step: 0.1, mode: "box"} } },
                ],
              },
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
            name: "",
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
            name: "",
            type: "grid",
            schema: [
              { name: "untracked_legend_label", required: false, selector: { text: {} } },
              { name: "untracked_legend_icon", required: false, selector: { icon: {} } },
            ],
          },
          {
            name: "",
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
        name: "interactions",
        type: "expandable",
        flatten: true,
        iconPath: mdiGestureTap,
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
          ${this.hass!.localize("ui.panel.lovelace.editor.card.heading.entities")}
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
    if (this.hass) {
      switch (schema.name) {
        case "title": // Title
            return this.hass.localize(`ui.panel.lovelace.editor.card.heading.heading_style_options.title`);
        case "subtitle": // Subtitle
            return this.hass.localize(`ui.panel.lovelace.editor.card.heading.heading_style_options.subtitle`);
        case "entity": // Entity (required)
            return `${this.hass.localize("ui.panel.lovelace.editor.card.generic.entity")} (${this.hass.localize("ui.panel.lovelace.editor.card.config.required")})`;
        case "name":
        case "untracked_legend_label": // Name
            return this.hass.localize(`ui.panel.lovelace.editor.card.generic.name`);
        case "unit": // Unit
            return this.hass.localize(`ui.panel.lovelace.editor.card.generic.unit`);
        case "icon":
        case "untracked_legend_icon": // Icon
            return this.hass.localize(`ui.panel.lovelace.editor.card.generic.icon`);
        case "color": // Line
            return this.hass.localize(`ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line`);
        case "color_bg": // Background
            return this.hass.localize(`ui.panel.lovelace.editor.edit_view.tab_background`);
        case "precision": // Display Precision
            return this.hass.localize(`ui.dialogs.entity_registry.editor.precision`);
        case "min": // Minimum
            return this.hass.localize(`ui.panel.lovelace.editor.card.generic.minimum`);
        case "max": // Maximum
            return this.hass.localize(`ui.panel.lovelace.editor.card.generic.maximum`);
        case "cutoff": // Lower limit
            return this.hass.localize(`ui.panel.config.automation.editor.triggers.type.numeric_state.lower_limit`);
        case "legend_hide": // Hide legend
            return this.hass.localize(`ui.panel.lovelace.editor.card.statistics-graph.hide_legend`);
        case "legend_all": // Select all
            return this.hass.localize(`ui.components.subpage-data-table.select_all`);
        case "untracked_consumption": // Untracked consumption
            return this.hass.localize(`ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption`);
        case "untracked_legend": // Untracked consumption
            return this.hass.localize(`ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption`);
        case "untracked_state_content": // State content
            return this.hass.localize(`ui.panel.lovelace.editor.card.heading.entity_config.state_content`);
        case "untracked_line_state_content": // State content (Line)
          return `${this.hass.localize(`ui.panel.lovelace.editor.card.heading.entity_config.state_content`)} (${this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line")})`;
        case "interactions": // Interactions
            return this.hass.localize(`ui.panel.lovelace.editor.card.generic.interactions`);
        case "tap_action": // Tap action
            return this.hass.localize(`ui.panel.lovelace.editor.card.generic.tap_action`);
        case "hold_action": // Hold action
            return this.hass.localize(`ui.panel.lovelace.editor.card.generic.hold_action`);
        case "double_tap_action": // Double tap action
            return this.hass.localize(`ui.panel.lovelace.editor.card.generic.double_tap_action`);
        case "corner": // Theme
            return this.hass.localize(`ui.panel.lovelace.editor.card.generic.theme`);
        case "position":
        case "line_text_position": // Position
            return this.hass.localize(`ui.panel.lovelace.editor.card.entities.secondary_info_values.position`);
        case "show_delta": // Show stat
            return this.hass.localize(`ui.panel.lovelace.editor.card.statistic.stat_types`);
        case "text_size":
        case "line_text_size": // Text Size (rem)
            return `Text ${this.hass.localize(`ui.panel.config.zwave_js.node_config.size`)} (rem)`;
        case "suppress_warnings":
            return "Suppress Warnings";
        case "offset": // Offset (optional)
            return this.hass.localize(`ui.panel.config.automation.editor.triggers.type.calendar.offset`);
        case "statistics": // Statistic
            return this.hass.localize(`ui.panel.lovelace.editor.card.statistics-graph.picked_statistic`);
        case "statistics_day_offset": // Offset (optional) (Day)
            return `${this.hass.localize("ui.panel.config.automation.editor.triggers.type.calendar.offset")} (${this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.periods.day")})`;
        case "statistics_period": // Period
            return this.hass.localize(`ui.panel.lovelace.editor.card.statistics-graph.period`);
        case "statistics_function": // Show stat types
            return this.hass.localize(`ui.panel.lovelace.editor.card.statistics-graph.stat_types`);
        default:
          return schema.name;
      }
    } else {
      return "";
    }
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
