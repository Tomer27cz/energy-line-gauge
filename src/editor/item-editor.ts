import { LitElement, TemplateResult, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { HomeAssistant } from 'custom-card-helpers';

import { fireEvent } from '../util';
import { ELGEntity, DEFAULT_ACTIONS } from '../types';
import { mdiGestureTap, mdiTextShort } from '@mdi/js';

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
        name: "content",
        type: "expandable",
        flatten: true,
        iconPath: mdiTextShort,
        schema: [
          {
            name: "",
            type: "grid",
            schema: [
              {name: "name", required: false, selector: {text: {}}},
              {name: "cutoff", required: false, selector: {number: {}}},

            ]
          },
          {
            name: "",
            type: "grid",
            schema: [
              {name: "color", required: false, selector: {color_rgb: {}}},
              {name: "icon", required: false, selector: {icon: {}}},
            ]
          },
          {
            type: "multi_select",
            options: [
              ["name", this.hass.localize("ui.components.state-content-picker.name")],
              ["state", this.hass.localize("ui.components.state-content-picker.state")],
              ["last_changed", this.hass.localize("ui.components.state-content-picker.last_changed")],
              ["last_updated", this.hass.localize("ui.components.state-content-picker.last_updated")],
            ],
            name: "state_content",
            required: false,
            default: ["name"],
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
