import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import memoizeOne  from 'memoize-one';

import { fireEvent } from '../helpers';
import { localize, setupLocalize } from '../localize/localize';
import { HomeAssistant, ELGEntity } from '../types';
import { DEFAULT_ACTIONS } from '../const';

import { mdiGestureTap, mdiRuler, mdiTextShort } from '@mdi/js';

@customElement('energy-line-gauge-item-editor')
export class ItemEditor extends LitElement {
  @property({ attribute: false }) config?: ELGEntity;

  @property({ attribute: false }) entities?: ELGEntity[];

  @property({ attribute: false }) hass?: HomeAssistant;

  private _schema = memoizeOne(() =>  {
    if (!this.hass) return [];

    const sl = setupLocalize(this.hass);

    const stateContentOptions = [
      ["name", sl('stateContentOptions.name')],
      ["state", sl('stateContentOptions.state')],
      ["last_changed", sl('stateContentOptions.last_changed')],
      ["last_updated", sl('stateContentOptions.last_updated')],
      ["percentage", sl('stateContentOptions.percentage')],
      ["icon", sl('stateContentOptions.icon')],
    ];

    const indicatorOptions = [
      { value: 'circle', label: sl('indicatorOptions.circle') },
      { value: 'icon', label: sl('indicatorOptions.icon') },
      { value: 'icon-fallback', label: sl('indicatorOptions.icon-fallback') },
      { value: 'none', label: sl('indicatorOptions.none') },
      { value: 'name', label: sl('indicatorOptions.name') },
      { value: 'state', label: sl('indicatorOptions.state') },
      { value: 'percentage', label: sl('indicatorOptions.percentage') },
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
          { name: "color", required: false, selector: {color_elg: { mode: "line", entity: this.config?.entity, entities: this.entities } } },
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
              { name: "legend_text_color", required: false, selector: {color_elg: { mode: "text" }}},
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
              { name: "line_text_color", required: false, selector: {color_elg: { mode: "text" }}},
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
    if (schema.name === "" || schema.name === undefined) {
      return "";
    }

    return localize(`itemEditor.${schema.name}`, this.hass);
  };

  private _valueChanged(ev: any): void {
    if (!this.config || !this.hass) {
      return;
    }
    const config = ev.detail.value;
    fireEvent(this, 'config-changed', { ...this.config, ...config });
  }
}
