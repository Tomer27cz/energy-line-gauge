import { LitElement, html } from "lit";

const LOCALE = {
  en: {

  },
};

export const fireEvent = (node, type, detail = {}, options = {}) => {
  const event = new Event(type, {
    bubbles: options.bubbles ?? true,
    cancelable: options.cancelable ?? false,
    composed: options.composed ?? true,
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

export class EnergyLineGaugeEditor extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  setConfig(config) {
    this.config = config;
    this._configEntities = processEditorEntities(config.entities)
  }

  render() {
    if (!this.config || !this.hass) return html``;

    if (this._subElementEditorConfig) {
      return html`
        <hui-sub-element-editor
          .hass=${this.hass}
          .config=${this._subElementEditorConfig}
          @go-back=${this._goBack}
          @config-changed=${this._handleSubElementChanged}
        >
        </hui-sub-element-editor>
      `
    }

    let entity = this.hass.states[this.config.entity];
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
      ...this.config,
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

  _valueChanged = (ev) => {
    const config = ev.detail.value;
    fireEvent(this, "config-changed", { config });
  };

  _computeLabelCallback = (schema) => {
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

  _handleSubElementChanged(ev) {
    ev.stopPropagation()
    if (!this._config || !this.hass) {
      return
    }

    const configValue = this._subElementEditorConfig?.type
    const value = ev.detail.config

    if (configValue === "row") {
      const newConfigEntities = this._configEntities.concat()
      if (!value) {
        newConfigEntities.splice(this._subElementEditorConfig.index, 1)
        this._goBack()
      } else {
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

  _editDetailElement(ev) {
    this._subElementEditorConfig = ev.detail.subElementConfig
  }

  _goBack() {
    this._subElementEditorConfig = undefined
  }

  _ll(str) {
    return LOCALE[this.lang]?.[str] ?? LOCALE.en[str] ?? str;
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