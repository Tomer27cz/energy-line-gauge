import { LitElement, TemplateResult, html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  mdiPalette,
  mdiLightningBolt,
  mdiGestureTap,
  mdiListBox,
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
    // This Preloads all standard hass components which are not natively avaiable
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
        title: this.hass.localize(`ui.panel.lovelace.editor.card.map.appearance`),
        iconPath: mdiPalette,
        schema: [
          {
            name: "",
            type: "grid",
            schema: [
              { name: "unit", required: false, selector: { text: {} } },
              { name: "precision", required: false, selector: { number: {min: 0, step: 1} }},
              { name: "cutoff", required: false, selector: { number: {} } },
            ]
          },

          {
            type: "grid",
            schema: [
              { name: "legend_hide", required: false, selector: { boolean: {} } },
              { name: "legend_all", required: false, selector: { boolean: {} } },
              { name: "show_delta", required: false, selector: { boolean: {} } },
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
                          {value: "square", label: "Square (default)"},
                          {value: "lite_rounded", label: "Lite Rounded"},
                          {value: "medium_rounded", label: "Medium Rounded"},
                          {value: "rounded", label: "Rounded"},
                          {value: "circular", label: "Circular"},
                        ]
                      }
                    }
              },
              { name: "position", required: false, selector:
                  {
                    select: {
                      mode: "dropdown",
                      options: [
                        {
                          value: "left",
                          label: "Left (default)",
                        },
                        {
                          value: "right",
                          label: "Right",
                        },
                        {
                          value: "none",
                          label: "Not Displayed",
                        },
                        {
                          value: "top-left",
                          label: "Top Left",
                        },
                        {
                          value: "top-center",
                          label: "Top Center",
                        },
                        {
                          value: "top-right",
                          label: "Top Right",
                        },
                        {
                          value: "bottom-left",
                          label: "Bottom Left",
                        },
                        {
                          value: "bottom-center",
                          label: "Bottom Center",
                        },
                        {
                          value: "bottom-right",
                          label: "Bottom Right",
                        },
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
            title: `${this.hass.localize(
              `ui.panel.lovelace.editor.card.heading.entity_config.state_content`
            )} (${this.hass.localize(
              "ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line"
            )})`,
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
                            {
                              value: "left",
                              label: "Left (default)",
                            },
                            {
                              value: "right",
                              label: "Right",
                            },
                            {
                              value: "top-left",
                              label: "Top Left",
                            },
                            {
                              value: "top-center",
                              label: "Top Center",
                            },
                            {
                              value: "top-right",
                              label: "Top Right",
                            },
                            {
                              value: "bottom-left",
                              label: "Bottom Left",
                            },
                            {
                              value: "bottom-center",
                              label: "Bottom Center",
                            },
                            {
                              value: "bottom-right",
                              label: "Bottom Right",
                            },
                          ]
                        }
                      }
                  },
                  { name: "line_text_size", required: false, selector: { number: { min: 0.25, max: 4, step: 0.1, mode: "box"} } },
                ],
              },
            ]
          },

        ],
      },
      {
        type: "expandable",
        iconPath: mdiLightningBolt,
        title: this.hass.localize(`ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption`),
        flatten: true,
        schema: [
          {
            name: "",
            type: "grid",
            schema: [
              { name: "untracked_legend", required: false, selector: { boolean: {} } },
              { name: "untracked_legend_label", required: false, selector: { text: {} } },
              { name: "untracked_legend_icon", required: false, selector: { icon: {} } },
              {
                type: "multi_select",
                options: [
                  ["name", this.hass.localize("ui.components.state-content-picker.name")],
                  ["state", this.hass.localize("ui.components.state-content-picker.state")],
                ],
                name: "untracked_state_content",
                required: false,
                default: ["name"],
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

  private _computeLabelCallback = (schema) => {
    if (this.hass) {
      switch (schema.name) {
        case "title":
          return this.hass.localize(
              `ui.panel.lovelace.editor.card.heading.heading_style_options.title`
          );
        case "subtitle":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.heading.heading_style_options.subtitle`
            );
        case "entity":
          return `${this.hass.localize(
              "ui.panel.lovelace.editor.card.generic.entity"
          )} (${this.hass.localize(
              "ui.panel.lovelace.editor.card.config.required"
          )})`;
        case "name":
        case "untracked_legend_label":
          return this.hass.localize(
              `ui.panel.lovelace.editor.card.generic.name`
          );
        case "unit":
          return this.hass.localize(
              `ui.panel.lovelace.editor.card.generic.unit`
          );
        case "icon":
        case "untracked_legend_icon":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.generic.icon`
            );
        case "color":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line`
            );
        case "color_bg":
            return this.hass.localize(
                `ui.panel.lovelace.editor.edit_view.tab_background`
            );
        case "precision":
            return this.hass.localize(
                `ui.dialogs.entity_registry.editor.precision`
            );
        case "min":
          return this.hass.localize(
              `ui.panel.lovelace.editor.card.generic.minimum`
          );
        case "max":
          return this.hass.localize(
              `ui.panel.lovelace.editor.card.generic.maximum`
          );
        case "cutoff":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.sensor.limit_min`
            );
        case "legend_hide":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.statistics-graph.hide_legend`
            );
        case "legend_all":
            return this.hass.localize(
                `ui.components.subpage-data-table.select_all`
            );
        case "untracked_consumption":
            return this.hass.localize(
                `ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption`
            );
        case "untracked_legend":
            return this.hass.localize(
                `ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption`
            );
        case "untracked_state_content":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.heading.entity_config.state_content`
            );
        case "interactions":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.generic.interactions`
            );
        case "tap_action":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.generic.tap_action`
            );
        case "hold_action":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.generic.hold_action`
            );
        case "double_tap_action":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.generic.double_tap_action`
            );
        case "corner":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.generic.theme`
            );
        case "position":
        case "line_text_position":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.entities.secondary_info_values.position`
            );
        case "show_delta":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.statistic.stat_types`
            );
        case "line_text_size":
            return this.hass.localize(
                `ui.panel.lovelace.editor.card.generic.icon_height`
            );
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
