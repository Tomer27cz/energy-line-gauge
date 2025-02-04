/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { EnergyLineGaugeConfig, EnergyLineGaugeDeviceConfig } from './types';
import { customElement, property, state } from 'lit/decorators';

const LOCALE = {
  en: {

  },
};

export interface SubElementEditorConfig {
  index?: number;
  elementConfig?: any;
  saveElementConfig?: (elementConfig: any) => void;
  context?: any;
  type?: "header" | "footer" | "row" | "feature" | "element" | "heading-badge" | undefined;
}

export interface EditorTarget extends EventTarget {
  value?: string;
  index?: number;
  checked?: boolean;
  configValue?: string;
  type?: HTMLInputElement["type"];
  config: any;
}


@customElement('energy-line-gauge-editor')
export class EnergyLineGaugeEditor extends ScopedRegistryHost(LitElement) implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: EnergyLineGaugeConfig;

  @state() private _configEntities: EnergyLineGaugeDeviceConfig[] = processEditorEntities(this._config?.devices);

  @state() private _subElementEditorConfig?: SubElementEditorConfig;


  public setConfig(config: EnergyLineGaugeConfig): void {
    this._config = config;
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._config) {
      return html``;
    }

    if (this._subElementEditorConfig) {
      return html`
        <hui-sub-element-editor
          .hass=${this.hass}
          .config=${this._subElementEditorConfig}
          @go-back=${this._goBack}
          @config-changed=${this._handleSubElementChanged}
        >
        </hui-sub-element-editor>
      `;
    }

    const entity = this.hass.states[this._config.entity];
    const precision_array = Array.from({
        length: 11
    }, (_, i) => ({
        label: entity ? parseFloat(entity.state).toFixed(i) : `num${i>0?'.':''}${'0'.repeat(i)}`,
        value: i
    }));

    const schema = [
      {
        name: "entity",
        required: true,
        selector: { entity: { domain: "sensor" } },
      },
      {
        name: "",
        type: "grid",
        schema: [
          { name: "name", required: false, selector: { text: {} } },
          { name: "unit", required: false, selector: { text: {} } }
        ]
      },
      {
        name: "",
        type: "grid",
        schema: [
          { name: "min", required: false, selector: { number: {} }},
          { name: "max", required: false, selector: { number: {} }},
          {
            name: "accuracy",
            required: false,
            selector: {
              select: {
                options: precision_array
              }
            }
          },

        ]
      },
      {
        name: "",
        type: "expandable",
        title: this.hass.localize(
          "ui.panel.lovelace.editor.card.tile.appearance"
        ),
        schema: [
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
              { name: "font_size", required: false, selector: { number: { min: 0.01, step: 0.01} } },
              { name: "corner", required: false, selector:
                {
                  select: {
                    options: [
                      {value: "square", label: "Square"},
                      {value: "lite_rounded", label: "Lite Rounded"},
                      {value: "rounded", label: "Rounded"},
                      {value: "circular", label: "Circular"},
                      {value: "circular", label: "Circular"},
                      {value: "circular", label: "Circular"},
                    ]
                  }
                }
              },
              { name: "lower_cutoff", required: false, selector: { number: {} } },
              { name: "color", required: false, selector: { color: {} } },
              { name: "background_color", required: false, selector: { color: {} } },
            ],
          },
          {
            name: "",
            type: "grid",
            schema: [
              { name: "show_current", selector: { boolean: {} } },
              { name: "show_details", selector: { boolean: {} } },
              { name: "show_graph", selector: { boolean: {} } },
              { name: "show_info", selector: { boolean: {} } },
              { name: "show_only_today", selector: { boolean: {} } },
              { name: "graph_baseline_zero", selector: { boolean: {} } },
            ],
          },
        ],
      },
      {
        name: "devices",
        type: "array",
        // add_text: "Add device",
        // allow_add: true,
        required: false,
        schema: [
          {
            name: "entity1",
            required: true,
            selector: { entity: { domain: "sensor" } },
          },
          {
            name: "name1",
            required: false,
            selector: { text: {} },
          },
          // {
          //   name: "color",
          //   required: false,
          //   selector: { color: {} },
          // },
          {
            name: "lower_cutoff1",
            required: false,
            selector: { number: {} },
          },
        ],
      }
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
      <energy-line-gauge-editor-entities-card-row-editor
        .hass=${this.hass}
        .entities=${this._configEntities}
        @entities-changed=${this._valueChanged}
        @edit-detail-element=${this._editDetailElement}
      ></energy-line-gauge-editor-entities-card-row-editor>
    `;
  }

  // private _valueChanged(ev): void {
  //   if (!this._config || !this.hass) {
  //     return;
  //   }
  //   const target = ev.target;
  //   if (this[`_${target.configValue}`] === target.value) {
  //     return;
  //   }
  //   if (target.configValue) {
  //     if (target.value === '') {
  //       const tmpConfig = { ...this._config };
  //       delete tmpConfig[target.configValue];
  //       this._config = tmpConfig;
  //     } else {
  //       this._config = {
  //         ...this._config,
  //         [target.configValue]: target.checked !== undefined ? target.checked : target.value,
  //       };
  //     }
  //   }
  //   fireEvent(this, 'config-changed', { config: this._config });
  // }

  private _valueChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    if (!this._config || !this.hass) {
      return;
    }

    const target = ev.target! as EditorTarget;
    const configValue =
      target.configValue || this._subElementEditorConfig?.type;
    const value =
      target.checked !== undefined
        ? target.checked
        : target.value || ev.detail.config || ev.detail.value;

    if (configValue === "row" || (ev.detail && ev.detail.entities)) {
      const newConfigEntities =
        ev.detail.entities || this._configEntities!.concat();
      if (configValue === "row") {
        if (!value) {
          newConfigEntities.splice(this._subElementEditorConfig!.index!, 1);
          this._goBack();
        } else {
          newConfigEntities[this._subElementEditorConfig!.index!] = value;
        }

        this._subElementEditorConfig!.elementConfig = value;
      }

      this._config = { ...this._config!, entities: newConfigEntities };
      this._configEntities = processEditorEntities(this._config!.entities);
    } else if (configValue) {
      if (value === "") {
        this._config = { ...this._config };
        delete this._config[configValue!];
      } else {
        this._config = {
          ...this._config,
          [configValue]: value,
        };
      }
    }

    fireEvent(this, "config-changed", { config: this._config });
  }

  private _computeLabelCallback = (schema) => {
    if (this.hass) {
      switch (schema.name) {
        case "title":
          return this.hass.localize(
            `ui.panel.lovelace.editor.card.generic.title`
          );
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
        case "unit":
          return this.hass.localize(
            `ui.panel.lovelace.editor.card.generic.unit`
          );
        case "min":
          return this.hass.localize(
            `ui.panel.lovelace.editor.card.generic.minimum`
          );
        case "max":
          return this.hass.localize(
            `ui.panel.lovelace.editor.card.generic.maximum`
          );
        default:
          return this._ll(schema.name);
      }
    } else {
      return "";
    }
  };

  private _handleSubElementChanged(ev) {
    ev.stopPropagation()
    if (!this._config || !this.hass) {
      return
    }

    const configValue = this._subElementEditorConfig?.type
    const value = ev.detail.config

    if (configValue === "row") {
      const newConfigEntities = this._configEntities.concat()
      if (!value) {
        // @ts-ignore
        newConfigEntities.splice(this._subElementEditorConfig.index, 1)
        this._goBack()
      } else {
        // @ts-ignore
        newConfigEntities[this._subElementEditorConfig.index] = value
      }

      this._config = { ...this._config, entities: newConfigEntities }
      this._configEntities = processEditorEntities(this._config.entities)
    } else if (configValue) {
      if (value === "") {
        this._config = { ...this._config }
        delete this._config[configValue]
      } else {
        this._config = {
          ...this._config,
          [configValue]: value
        }
      }
    }

    this._subElementEditorConfig = {
      ...this._subElementEditorConfig,
      elementConfig: value
    }

    fireEvent(this, "config-changed", { config: this._config })
  }

  private _editDetailElement(ev) {
    this._subElementEditorConfig = ev.detail.subElementConfig
  }

  private _goBack() {
    this._subElementEditorConfig = undefined
  }

  _ll(str) {
    return LOCALE[this.lang]?.[str] ?? LOCALE.en[str] ?? str;
  }

  static get styles(): CSSResultGroup {
    // noinspection CssUnresolvedCustomProperty,CssUnusedSymbol,CssInvalidHtmlTagReference
    return css`
      mwc-select,
      mwc-textfield {
        margin-bottom: 16px;
        display: block;
      }
      mwc-formfield {
        padding-bottom: 8px;
      }
      mwc-switch {
        --mdc-theme-secondary: var(--switch-checked-color);
      }
    `;
  }
}

function processEditorEntities(entities) {
  return entities.map((entityConf) => {
    if (typeof entityConf === "string") {
      return { entity: entityConf };
    }
    return entityConf;
  });
}

