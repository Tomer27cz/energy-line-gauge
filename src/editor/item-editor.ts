import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import memoizeOne  from 'memoize-one';

import { HomeAssistant, fireEvent } from 'custom-card-helpers';

import { ELGEntity, DEFAULT_ACTIONS, LabelConfigEntry } from '../types';
import { mdiGestureTap, mdiRuler, mdiTextShort } from '@mdi/js';

@customElement('energy-line-gauge-item-editor')
export class ItemEditor extends LitElement {
  @property({ attribute: false }) config?: ELGEntity;

  @property({ attribute: false }) hass?: HomeAssistant;

  private _schema = memoizeOne(() =>  {
    if (!this.hass) return [];

    const stateContentOptions = [
      ["name", this.hass.localize("ui.components.state-content-picker.name")], // Name
      ["state", this.hass.localize("ui.components.state-content-picker.state")], // State
      ["last_changed", this.hass.localize("ui.components.state-content-picker.last_changed")], // Last Changed
      ["last_updated", this.hass.localize("ui.components.state-content-picker.last_updated")], // Last Updated
      ["percentage", this.hass.localize("ui.panel.lovelace.editor.edit_section.settings.column_span") + " [%]"], // Width [%]
      ["icon", this.hass.localize("ui.panel.lovelace.editor.card.generic.icon")], // Icon
    ];

    const indicatorOptions = [
      { value: 'circle', label: "Circle" },
      { value: 'icon', label: "Icon" },
      { value: 'icon-fallback', label: "Icon Fallback (default)" },
      { value: 'none', label: "None" },
      { value: 'name', label: "Name" },
      { value: 'state', label: "State" },
      { value: 'percentage', label: "Percentage" },
    ]

    const multiplierOptions = [
      { value: 1000000000000, label: "10^12 (Tera)" },
      { value: 1000000000, label: "10^9 (Giga)" },
      { value: 1000000, label: "10^6 (Mega)" },
      { value: 1000, label: "10^3 (Kilo)" },
      { value: 1, label: "1 (Same as Main)" },
      { value: 0.001, label: "10^-3 (Milli)" },
      { value: 0.000001, label: "10^-6 (Micro)"},
      { value: 0.000000001, label: "10^-9 (Nano)" },
      { value: 0.000000000001, label: "10^-12 (Pico)" },
    ];

    return [
      {
        name: "entity",
        required: true,
        selector: {entity: {domain: "sensor"}},
      },

      {
        name: "",
        type: "grid",
        schema: [
          { name: "name", required: false, selector: {text: {}}},
          { name: "color", required: false, selector: {color_rgb: {}}},
        ]
      },

      {
        name: "",
        type: "grid",
        schema: [
          { name: "legend_indicator", required: false, selector: { select: { mode: "dropdown", options: indicatorOptions }}},
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
              { name: "legend_text_color", required: false, selector: {color_rgb: {}}},
            ]
          },

          {
            type: "grid",
            schema: [
              {
                type: "multi_select",
                options: stateContentOptions,
                name: "line_state_content",
                required: false,
                default: [],
              },
              { name: "line_text_color", required: false, selector: {color_rgb: {}}},
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
              { name: "multiplier", required: false, selector: { select: { mode: "dropdown", options: multiplierOptions }}},
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
  });

  protected render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    return html`
      <ha-form
          .hass=${this.hass}
          .data=${{...this.config}}
          .schema=${this._schema()}
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

      // Legend Indicator
      legend_indicator: {
        tryLocalize: () => "Legend Indicator",
        fallback: "Legend Indicator",
      },
      // Icon
      icon: {
        tryLocalize: "ui.panel.lovelace.editor.card.generic.icon",
        fallback: "Icon",
      },

      // ------------------------------------------------ State Content ------------------------------------------------

      // Legend
      state_content: {
        tryLocalize: "Legend",
        fallback: "Legend",
      },
      // Legend Text Color
      legend_text_color: {
        tryLocalize: "Legend Text Color",
        fallback: "Legend Text Color",
      },

      // Line
      line_state_content: {
        tryLocalize: "Line",
        fallback: "Line",
      },
      // Line Text Color
      line_text_color: {
        tryLocalize: "Line Text Color",
        fallback: "Line Text Color",
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
