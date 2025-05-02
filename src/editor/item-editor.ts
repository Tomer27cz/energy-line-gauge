import { LitElement, TemplateResult, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { HomeAssistant } from 'custom-card-helpers';

import { fireEvent } from '../util';
import { ELGEntity, DEFAULT_ACTIONS } from '../types';
import { mdiGestureTap, mdiRuler, mdiTextShort } from '@mdi/js';

@customElement('energy-line-gauge-item-editor')
export class ItemEditor extends LitElement {
  @property({ attribute: false }) config?: ELGEntity;

  @property({ attribute: false }) hass?: HomeAssistant;

  protected render(): TemplateResult {
    if (!this.hass || !this.config) {
      return html``;
    }
    const item = {...this.config};
    const schema = [
      {
        name: "entity",
        required: true,
        selector: {entity: {domain: "sensor"}},
      },

      {
        name: "",
        type: "grid",
        schema: [
          {name: "name", required: false, selector: {text: {}}},
          {name: "icon", required: false, selector: {icon: {}}},

        ]
      },




      {
        name: this.hass.localize("ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line"),
        type: "expandable",
        flatten: true,
        iconPath: mdiTextShort,
        schema: [
          {
            name: "",
            type: "grid",
            schema: [
              {name: "color", required: false, selector: {color_rgb: {}}},
              {name: "cutoff", required: false, selector: {number: {}}},
            ]
          },
          {
            name: this.hass.localize(`ui.panel.lovelace.editor.card.heading.entity_config.state_content`),
            type: "grid",
            schema: [
              {
                type: "multi_select",
                options: [
                  ["name", this.hass.localize("ui.components.state-content-picker.name")],
                  ["state", this.hass.localize("ui.components.state-content-picker.state")],
                  ["last_changed", this.hass.localize("ui.components.state-content-picker.last_changed")],
                  ["last_updated", this.hass.localize("ui.components.state-content-picker.last_updated")],
                  ["percentage", this.hass.localize("ui.panel.lovelace.editor.edit_section.settings.column_span") + " [%]"],
                ],
                name: "state_content",
                required: false,
                default: ["name"],
              },
              {
                type: "multi_select",
                options: [
                  ["name", this.hass.localize("ui.components.state-content-picker.name")],
                  ["state", this.hass.localize("ui.components.state-content-picker.state")],
                  ["last_changed", this.hass.localize("ui.components.state-content-picker.last_changed")],
                  ["last_updated", this.hass.localize("ui.components.state-content-picker.last_updated")],
                  ["percentage", this.hass.localize("ui.panel.lovelace.editor.edit_section.settings.column_span") + " [%]"],
                ],
                name: "line_state_content",
                required: false,
                default: [],
              },
            ]
          },

        ],
      },


      {
        name: this.hass.localize(`ui.panel.lovelace.editor.card.generic.unit`),
        type: "expandable",
        flatten: true,
        iconPath: mdiRuler,
        schema: [
          {
            name: "",
            type: "grid",
            schema: [
              {name: "unit", required: false, selector: {text: {}}},
              { name: "multiplier", required: false, selector:
                {
                  select: {
                    mode: "dropdown",
                    options: [
                      {
                        value: 1000000000000,
                        label: "10^12 (Tera)",
                      },
                      {
                        value: 1000000000,
                        label: "10^9 (Giga)",
                      },
                      {
                        value: 1000000,
                        label: "10^6 (Mega)",
                      },
                      {
                        value: 1000,
                        label: "10^3 (Kilo)",
                      },
                      {
                        value: 1,
                        label: "1 (Same as Main)",
                      },
                      {
                        value: 0.001,
                        label: "10^-3 (Milli)",
                      },
                      {
                        value: 0.000001,
                        label: "10^-6 (Micro)",
                      },
                      {
                        value: 0.000000001,
                        label: "10^-9 (Nano)",
                      },
                      {
                        value: 0.000000000001,
                        label: "10^-12 (Pico)",
                      },
                    ]
                  }
                }
              },
              {name: "precision", required: false, selector: {number: {}}},
            ]
          }
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

    // <h1>${this.hass.localize("ui.panel.lovelace.editor.sub-element-editor.types.element")}</h1>

    return html`
      <ha-form
          .hass=${this.hass}
          .data=${item}
          .schema=${schema}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
      ></ha-form>
      <br />
    `;

  }

  private _computeLabelCallback = (schema: any) => {
    if (this.hass) {
      switch (schema.name) {
        case "entity":
          return `${this.hass.localize(
              "ui.panel.lovelace.editor.card.generic.entity"
          )} (${this.hass.localize(
              "ui.panel.lovelace.editor.card.config.required"
          )})`;
        case "name":
          return this.hass.localize(
              `ui.panel.lovelace.editor.card.generic.name`
          );
        case "color":
            return this.hass.localize(
                `ui.components.selectors.selector.types.color_rgb`
            );
        case "icon":
          return this.hass.localize(
              `ui.panel.lovelace.editor.card.generic.icon`
          );
        case "content":
          return this.hass.localize(
              `ui.panel.lovelace.editor.card.markdown.content`
          );
        case "cutoff":
          return this.hass.localize(
              `ui.panel.lovelace.editor.card.sensor.limit_min`
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
        case "state_content":
          return this.hass.localize(
              `ui.panel.lovelace.editor.card.heading.entity_config.state_content`
          );
        case "line_state_content":
          return `${this.hass.localize(
            `ui.panel.lovelace.editor.card.heading.entity_config.state_content`
          )} (${this.hass.localize(
            "ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line"
          )})`;
        case "unit":
          return this.hass.localize(
              `ui.panel.lovelace.editor.card.generic.unit`
          );
        case "multiplier":
          return this.hass.localize(
              `ui.panel.config.core.section.core.core_config.unit_system`
          );
        case "precision":
          return this.hass.localize(
            `ui.dialogs.entity_registry.editor.precision`
          );
        default:
          return schema.name;
      }
    } else {
      return "";
    }
  };

  private _valueChanged(ev: any): void {
    if (!this.config || !this.hass) {
      return;
    }
    const config = ev.detail.value;
    fireEvent(this, 'config-changed', { ...this.config, ...config });
  }
}
