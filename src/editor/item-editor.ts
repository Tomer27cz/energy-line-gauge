import { LitElement, TemplateResult, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { HomeAssistant, fireEvent } from 'custom-card-helpers';

import { ELGEntity, DEFAULT_ACTIONS, LabelConfigEntry } from '../types';
import { mdiGestureTap, mdiRuler, mdiTextShort } from '@mdi/js';

@customElement('energy-line-gauge-item-editor')
export class ItemEditor extends LitElement {
  @property({ attribute: false }) config?: ELGEntity;

  @property({ attribute: false }) hass?: HomeAssistant;

  protected render(): TemplateResult {
    if (!this.hass || !this.config) {
      return html``;
    }

    const stateContentOptions = [
      ["name", this.hass.localize("ui.components.state-content-picker.name")], // Name
      ["state", this.hass.localize("ui.components.state-content-picker.state")], // State
      ["last_changed", this.hass.localize("ui.components.state-content-picker.last_changed")], // Last Changed
      ["last_updated", this.hass.localize("ui.components.state-content-picker.last_updated")], // Last Updated
      ["percentage", this.hass.localize("ui.panel.lovelace.editor.edit_section.settings.column_span") + " [%]"], // Width [%]
      ["icon", this.hass.localize("ui.panel.lovelace.editor.card.generic.icon")], // Icon
    ];

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
                options: stateContentOptions,
                name: "state_content",
                required: false,
                default: ["name"],
              },
              {
                type: "multi_select",
                options: stateContentOptions,
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

    const labelMap: Record<string, LabelConfigEntry> = {
      // Entity (required)
      entity: {
        tryLocalize: (hass) => `${hass.localize("ui.panel.lovelace.editor.card.generic.entity")} (${hass.localize("ui.panel.lovelace.editor.card.config.required")})`,
        fallback: "Entity (required)",
      },

      // Name
      name: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.name",
        fallback: "Name",
      },

      // RGB Color
      color: {
        tryLocalize: "ui.components.selectors.selector.types.color_rgb",
        fallback: "Color",
      },
      // Icon
      icon: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.icon",
        fallback: "Icon",
      },

      // ------------------------------------------------ State Content ------------------------------------------------

      // State Content
      state_content: {
        tryLocalize: "ui.panel.lovelace.editor.card.heading.entity_config.state_content",
        fallback: "State Content",
      },

      // State Content (Line)
      line_state_content: {
        tryLocalize: (hass) => `${hass.localize("ui.panel.lovelace.editor.card.heading.entity_config.state_content")} (${hass.localize("ui.panel.lovelace.editor.card.statistics-graph.chart_type_labels.line")})`,
        fallback: "State Content (Line)",
      },

      // ---------------------------------------------------------------------------------------------------------------

      // ---------------------------------------------------- Unit -----------------------------------------------------

      // Unit
      unit: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.unit",
        fallback: "Unit",
      },
      // Unit system
      multiplier: {
        tryLocalize: "ui.panel.config.core.section.core.core_config.unit_system",
        fallback: "Unit System",
      },
      // Precision
      precision: {
        tryLocalize: "ui.dialogs.entity_registry.editor.precision",
        fallback: "Precision",
      },
      // Lower Limit
      cutoff: {
        tryLocalize: "ui.panel.config.automation.editor.triggers.type.numeric_state.lower_limit",
        fallback: "Lower Limit",
      },

      // ---------------------------------------------------------------------------------------------------------------

      // -------------------------------------------------- Interactions -----------------------------------------------

      // Interactions
      interactions: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.interactions",
        fallback: "Interactions",
      },
      // Tap Action
      tap_action: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.tap_action",
        fallback: "Tap Action",
      },
      // Hold Action
      hold_action: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.hold_action",
        fallback: "Hold Action",
      },
      // Double Tap Action
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

  private _valueChanged(ev: any): void {
    if (!this.config || !this.hass) {
      return;
    }
    const config = ev.detail.value;
    fireEvent(this, 'config-changed', { ...this.config, ...config });
  }
}
