import { LitElement, TemplateResult, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { HomeAssistant, fireEvent } from 'custom-card-helpers';

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

      { name: "name", required: false, selector: {text: {}}},

      {
        name: "",
        type: "grid",
        schema: [
          { name: "color", required: false, selector: {color_rgb: {}}},
          { name: "icon", required: false, selector: {icon: {}}},
        ]
      },

      {
        name: "state_content",
        type: "expandable",
        flatten: true,
        iconPath: mdiTextShort,
        schema: [
          {
            type: "grid",
            schema: [
              {
                type: "multi_select",
                options: [
                  ["name", this.hass.localize("ui.components.state-content-picker.name")], // Name
                  ["state", this.hass.localize("ui.components.state-content-picker.state")], // State
                  ["last_changed", this.hass.localize("ui.components.state-content-picker.last_changed")], // Last Changed
                  ["last_updated", this.hass.localize("ui.components.state-content-picker.last_updated")], // Last Updated
                  ["percentage", this.hass.localize("ui.panel.lovelace.editor.edit_section.settings.column_span") + " [%]"], // Width [%]
                ],
                name: "state_content",
                required: false,
                default: ["name"],
              },
              {
                type: "multi_select",
                options: [
                  ["name", this.hass.localize("ui.components.state-content-picker.name")], // Name
                  ["state", this.hass.localize("ui.components.state-content-picker.state")], // State
                  ["last_changed", this.hass.localize("ui.components.state-content-picker.last_changed")], // Last Changed
                  ["last_updated", this.hass.localize("ui.components.state-content-picker.last_updated")], // Last Updated
                  ["percentage", this.hass.localize("ui.panel.lovelace.editor.edit_section.settings.column_span") + " [%]"], // Width [%]
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
        name: "unit",
        type: "expandable",
        flatten: true,
        iconPath: mdiRuler,
        schema: [
          {
            name: "",
            type: "grid",
            schema: [
              { name: "unit", required: false, selector: {text: {}}},
              { name: "multiplier", required: false, selector:
                {
                  select: {
                    mode: "dropdown",
                    options: [
                      { value: 1000000000000, label: "10^12 (Tera)" },
                      { value: 1000000000, label: "10^9 (Giga)" },
                      { value: 1000000, label: "10^6 (Mega)" },
                      { value: 1000, label: "10^3 (Kilo)" },
                      { value: 1, label: "1 (Same as Main)" },
                      { value: 0.001, label: "10^-3 (Milli)" },
                      { value: 0.000001, label: "10^-6 (Micro)"},
                      { value: 0.000000001, label: "10^-9 (Nano)" },
                      { value: 0.000000000001, label: "10^-12 (Pico)" },
                    ]
                  }
                }
              },
              { name: "precision", required: false, selector: {number: {}}},
              { name: "cutoff", required: false, selector: {number: {}}},
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
    if (!this.hass) return "";

    const labelMap: Record<string, string | ((hass: any) => string)> = {
      // Entity (required)
      entity: (hass) =>
        `${hass.localize("ui.panel.lovelace.editor.card.generic.entity")} (${hass.localize("ui.panel.lovelace.editor.card.config.required")})`,

      // Name
      name: "ui.panel.lovelace.editor.card.generic.name",

      // RGB Color
      color: "ui.components.selectors.selector.types.color_rgb",
      // Icon
      icon: "ui.panel.lovelace.editor.card.generic.icon",

      // ------------------------------------------------ State Content ------------------------------------------------

      // State Content
      state_content: "ui.panel.lovelace.editor.card.heading.entity_config.state_content",

      // State Content (Line)
      line_state_content: (hass) =>
        `${hass.localize("ui.panel.lovelace.editor.card.heading.entity_config.state_content")} (${hass.localize("ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line")})`,

      // ---------------------------------------------------------------------------------------------------------------

      // ---------------------------------------------------- Unit -----------------------------------------------------

      // Unit
      unit: "ui.panel.lovelace.editor.card.generic.unit",
      // Unit system
      multiplier: "ui.panel.config.core.section.core.core_config.unit_system",
      // Precision
      precision: "ui.dialogs.entity_registry.editor.precision",
      // Lower Limit
      cutoff: "ui.panel.config.automation.editor.triggers.type.numeric_state.lower_limit",

      // ---------------------------------------------------------------------------------------------------------------

      // -------------------------------------------------- Interactions -----------------------------------------------

      // Interactions
      interactions: "ui.panel.lovelace.editor.card.generic.interactions",
      // Tap Action
      tap_action: "ui.panel.lovelace.editor.card.generic.tap_action",
      // Hold Action
      hold_action: "ui.panel.lovelace.editor.card.generic.hold_action",
      // Double Tap Action
      double_tap_action: "ui.panel.lovelace.editor.card.generic.double_tap_action",

      // ---------------------------------------------------------------------------------------------------------------
    };

    const entry = labelMap[schema.name];
    if (!entry) return schema.name;

    return typeof entry === "function" ? entry(this.hass) : this.hass.localize(entry);
  };

  private _valueChanged(ev: any): void {
    if (!this.config || !this.hass) {
      return;
    }
    const config = ev.detail.value;
    fireEvent(this, 'config-changed', { ...this.config, ...config });
  }
}
