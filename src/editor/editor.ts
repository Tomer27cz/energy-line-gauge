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

import memoizeOne  from 'memoize-one';

import { fireEvent } from '../helpers';
import { HomeAssistant, LovelaceCardEditor, ELGConfig, HassCustomElement, ELGEntity } from '../types';
import { localize, setupLocalize } from '../localize/localize';
import { DEFAULT_ACTIONS } from '../const'

import './item-editor';
import './items-editor';
import './color-editor';
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

  private _schema = memoizeOne(() => {
    if (!this.hass) return [];

    const sl = setupLocalize(this.hass);

    const cornerOptions = [
      { value: "square", label: sl('cornerOptions.square') },
      { value: "lite-rounded", label: sl('cornerOptions.lite-rounded') },
      { value: "medium-rounded", label: sl('cornerOptions.medium-rounded') },
      { value: "rounded", label: sl('cornerOptions.rounded') },
      { value: "circular", label: sl('cornerOptions.circular') },
    ];

    const lineSeparatorWidthOptions = [
      { value: "total020", label: sl('lineSeparatorWidthOptions.total020') },
      { value: "total030", label: sl('lineSeparatorWidthOptions.total030') },
      { value: "total040", label: sl('lineSeparatorWidthOptions.total040') },
      { value: "total050", label: sl('lineSeparatorWidthOptions.total050') },
      { value: "total060", label: sl('lineSeparatorWidthOptions.total060') },
      { value: "total070", label: sl('lineSeparatorWidthOptions.total070') },
      { value: "total080", label: sl('lineSeparatorWidthOptions.total080') },
      { value: "total090", label: sl('lineSeparatorWidthOptions.total090') },
      { value: "total100", label: sl('lineSeparatorWidthOptions.total100') },
      { value: "each002", label: sl('lineSeparatorWidthOptions.each002') },
      { value: "each004", label: sl('lineSeparatorWidthOptions.each004') },
      { value: "each006", label: sl('lineSeparatorWidthOptions.each006') },
      { value: "each008", label: sl('lineSeparatorWidthOptions.each008') },
      { value: "each010", label: sl('lineSeparatorWidthOptions.each010') },
      { value: "each012", label: sl('lineSeparatorWidthOptions.each012') },
      { value: "each014", label: sl('lineSeparatorWidthOptions.each014') },
      { value: "each016", label: sl('lineSeparatorWidthOptions.each016') },
      { value: "each018", label: sl('lineSeparatorWidthOptions.each018') },
      { value: "each020", label: sl('lineSeparatorWidthOptions.each020') },
    ];

    const indicatorOptions = [
      { value: "circle", label: sl('indicatorOptions.circle') },
      { value: "icon", label: sl('indicatorOptions.icon') },
      { value: "icon-fallback", label: sl('indicatorOptions.icon-fallback') },
      { value: "none", label: sl('indicatorOptions.none') },
      { value: "name", label: sl('indicatorOptions.name') },
      { value: "state", label: sl('indicatorOptions.state') },
      { value: "percentage", label: sl('indicatorOptions.percentage') },
    ];

    const createDefaultedOptions = (baseOptions: ReadonlyArray<{ value: string, label: string }>, defaultValue: string) => {
      const defaultLabelString = ` (${sl("default_string")})`;
      return baseOptions.map(option => {
        let label = option.label.replace(defaultLabelString, "");
        if (option.value === defaultValue) {label += defaultLabelString;}
        return { value: option.value, label };
      });
    };
    const _basePositionOptions = [
      { value: "left", label: sl("positionOptions.left") },
      { value: "right", label: sl("positionOptions.right") },
      { value: "none", label: sl("positionOptions.none") },
      { value: "top-left", label: sl("positionOptions.top-left") },
      { value: "top-center", label: sl("positionOptions.top-center") },
      { value: "top-right", label: sl("positionOptions.top-right") },
      { value: "bottom-left", label: sl("positionOptions.bottom-left") },
      { value: "bottom-center", label: sl("positionOptions.bottom-center") },
      { value: "bottom-right", label: sl("positionOptions.bottom-right") },
    ];

    const positionOptions = createDefaultedOptions(_basePositionOptions, "left");
    const linePositionOptions = positionOptions.concat({ value: "center", label: sl("positionOptions.center") });
    const valuePositionOptions = positionOptions.concat({ value: "in-title-right", label: sl("positionOptions.in-title-right") }, { value: "in-title-left", label: sl("positionOptions.in-title-left") });

    const titlePositionOptions = createDefaultedOptions(_basePositionOptions, "top-left");
    const deltaPositionOptions = createDefaultedOptions(_basePositionOptions, "bottom-center");
    const legendPositionOptions = createDefaultedOptions(_basePositionOptions, "bottom-center");

    const alignmentOptions = [
      { value: "left", label: sl("alignmentOptions.left") },
      { value: "right", label: sl("alignmentOptions.right") },
      { value: "center", label: sl("alignmentOptions.center") },
      { value: "space-around", label: sl("alignmentOptions.space-around") },
      { value: "space-between", label: sl("alignmentOptions.space-between") },
      { value: "space-evenly", label: sl("alignmentOptions.space-evenly") },
    ];

    const styleOptions = [
      ["weight-lighter", sl("styleOptions.weight-lighter")],
      ["weight-bold", sl("styleOptions.weight-bold")],
      ["weight-bolder", sl("styleOptions.weight-bolder")],
      ["style-italic", sl("styleOptions.style-italic")],
      ["decoration-underline", sl("styleOptions.decoration-underline")],
      ["decoration-overline", sl("styleOptions.decoration-overline")],
      ["decoration-line-through", sl("styleOptions.decoration-line-through")],
      ["transform-uppercase", sl("styleOptions.transform-uppercase")],
      ["transform-lowercase", sl("styleOptions.transform-lowercase")],
      ["transform-capitalize", sl("styleOptions.transform-capitalize")],
      ["family-monospace", sl("styleOptions.family-monospace")],
      ["shadow-light", sl("styleOptions.shadow-light")],
      ["shadow-medium", sl("styleOptions.shadow-medium")],
      ["shadow-heavy", sl("styleOptions.shadow-heavy")],
      ["shadow-hard", sl("styleOptions.shadow-hard")],
      ["shadow-neon", sl("styleOptions.shadow-neon")],
      ["black-outline", sl("styleOptions.black-outline")],
      ["white-outline", sl("styleOptions.white-outline")],
    ];

    const overflowOptions = [
      { value: "ellipsis", label: sl("overflowOptions.ellipsis") },
      { value: "clip", label: sl("overflowOptions.clip") },
      { value: "fade", label: sl("overflowOptions.fade") },
      { value: "tooltip", label: sl("overflowOptions.tooltip") },
      { value: "tooltip-segment", label: sl("overflowOptions.tooltip-segment") },
    ];
    const overflowDirectionOptions = [
      { value: "right", label: sl("overflowDirectionOptions.right") },
      { value: "left", label: sl("overflowDirectionOptions.left") },
    ];

    const untrackedStateContent = [
      ["name", sl("untrackedStateContent.name")],
      ["state", sl("untrackedStateContent.state")],
      ["percentage", sl("untrackedStateContent.percentage")],
      ["icon", sl("untrackedStateContent.icon")],
    ];

    const statisticsPeriods = [
      { value: "5minute", label: sl("statisticsPeriods.5minute")},
      { value: "hour", label: sl("statisticsPeriods.hour")},
      { value: "day", label: sl("statisticsPeriods.day")},
      { value: "week", label: sl("statisticsPeriods.week")},
      { value: "month", label: sl("statisticsPeriods.month")},
    ];

    const statisticsFunctions = [
      { value: "change", label: sl("statisticsFunctions.change")},
      { value: "max", label: sl("statisticsFunctions.max")},
      { value: "mean", label: sl("statisticsFunctions.mean")},
      { value: "min", label: sl("statisticsFunctions.min")},
      { value: "state", label: sl("statisticsFunctions.state")},
      { value: "sum", label: sl("statisticsFunctions.sum")},
    ];

    return [
      {
        name: "entity",
        required: true,
        selector: { entity: { domain: ["sensor", "input_number", "number", "counter"] } },
      },

      {
        type: "grid",
        schema: [
          { name: "title", required: false, selector: { text: {} } },
          { name: "subtitle", required: false, selector: { text: {} } }
        ]
      },

      {
        type: "grid",
        schema: [
          { name: "min", required: false, selector: { number: { min: 0 } } },
          { name: "max", required: false, selector: { number: { min: 0 } } },
        ]
      },

      {
        type: "expandable",
        name: "expandable_appearance", // Appearance
        flatten: true,
        iconPath: mdiPalette,
        schema: [
          {
            type: "grid",
            schema: [
              { name: "line_height", required: false, selector: { number: { min: 0.5, max: 10, step: 0.1, mode: "box" } } },
              { name: "corner", required: false, selector: { select: { mode: "dropdown", options: cornerOptions }}},
            ],
          },

          {
            type: "grid",
            schema: [
              { name: "legend_indicator", required: false, selector: { select: { mode: "dropdown", options: indicatorOptions }}},
              { name: "state_content_separator", required: false, selector: { text: {} } },
            ],
          },

          {
            type: "grid",
            schema: [
              { name: "color", required: false, selector: { color_elg: { mode: "line" } } },
              { name: "color_bg", required: false, selector: { color_elg: { mode: "line" } } },
            ],
          },

          {
            type: "grid",
            schema: [
              { name: "suppress_warnings", required: false, selector: { boolean: {} } },
              { name: "line_separator", required: false, selector: { boolean: {} } },

            ],
          },

          {
            type: "grid",
            schema: [
              { name: "line_separator_width", required: false, selector: { select: { mode: "dropdown", options: lineSeparatorWidthOptions }}},
              { name: "line_separator_color", required: false, selector: { color_elg: { mode: "line" } } },
            ],
          },

          {
            type: "expandable",
            name: "expandable_appearance_value", // Value
            flatten: true,
            schema: [
              {
                type: "grid",
                schema: [
                  { name: "position", required: false, selector: { select: { mode: "dropdown", options: valuePositionOptions } } },
                  { name: "text_size", required: false, selector: { number: { min: 0.5, max: 5, step: 0.1, mode: "box" } } },
                ],
              },

              {
                type: "grid",
                schema: [
                  { name: "text_style", type: "multi_select", options: styleOptions },
                  { name: "text_color", required: false, selector: { color_elg: { mode: "text" } } },
                ],
              },
            ]
          },

          {
            type: "expandable",
            name: "expandable_appearance_title", // Title
            flatten: true,
            schema: [
              {
                type: "grid",
                schema: [
                  { name: "title_position", required: false, selector: { select: { mode: "dropdown", options: titlePositionOptions } } },
                  { name: "title_text_size", required: false, selector: { number: { min: 0.5, max: 5, step: 0.1, mode: "box" } } },
                ],
              },

              { name: "title_text_style", type: "multi_select", options: styleOptions },

              {
                type: "grid",
                schema: [
                  { name: "title_text_color", required: false, selector: { color_elg: { mode: "text" } } },
                  { name: "subtitle_text_color", required: false, selector: { color_elg: { mode: "text" } } },
                ],
              },

            ]
          },

          {
            type: "expandable",
            name: "expandable_appearance_legend", // Legend
            flatten: true,
            schema: [
              {
                type: "grid",
                schema: [
                  { name: "legend_hide", required: false, selector: { boolean: {} } },
                  { name: "legend_all", required: false, selector: { boolean: {} } },
                ],
              },
              {
                type: "grid",
                schema: [
                  { name: "legend_position", required: false, selector: { select: { mode: "dropdown", options: legendPositionOptions } } },
                  { name: "legend_alignment", required: false, selector: { select: { mode: "dropdown", options: alignmentOptions } } },
                ],
              },
              {
                type: "grid",
                schema: [
                  { name: "legend_text_color", required: false, selector: { color_elg: { mode: "text" } } },
                  { name: "legend_text_size", required: false, selector: { number: { min: 0.5, max: 5, step: 0.1, mode: "box" } } },
                ],
              },
              { name: "legend_text_style", type: "multi_select", options: styleOptions },
            ]
          },

          {
            type: "expandable",
            name: "expandable_appearance_delta", // Delta
            flatten: true,
            schema: [
              {
                type: "grid",
                schema: [
                  { name: "show_delta", required: false, selector: { boolean: {} } },
                  { name: "delta_position", required: false, selector: { select: { mode: "dropdown", options: deltaPositionOptions }}},
                ],
              },
            ]
          },

          {
            type: "expandable",
            name: "expandable_appearance_line_text", // State content (Line)
            flatten: true,
            schema: [
              {
                type: "grid",
                schema: [
                  { name: "line_text_position", required: false, selector: { select: { mode: "dropdown", options: linePositionOptions }}},
                  { name: "line_text_size", required: false, selector: { number: { min: 0.5, max: 5, step: 0.1, mode: "box" }}},
                ],
              },
              {
                type: "grid",
                schema: [
                  { name: "line_text_overflow", required: false, selector: { select: { mode: "dropdown", options: overflowOptions }}},
                  { name: "overflow_direction", required: false, selector: { select: { mode: "dropdown", options: overflowDirectionOptions }}},
                ],
              },
              {
                type: "grid",
                schema: [
                  { name: "line_text_style", type: "multi_select", options: styleOptions },
                  { name: "line_text_color", required: false, selector: { color_elg: { mode: "text" } } },
                ],
              },

            ]
          },
        ],
      },

      {
        type: "expandable",
        iconPath: mdiChartAreaspline,
        name: 'expandable_value', // Value
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
        name: "expandable_untracked", // Untracked consumption
        flatten: true,
        schema: [
          {
            type: "grid",
            schema: [
              { name: "untracked_legend", required: false, selector: { boolean: {} } },
              { name: "untracked_legend_label", required: false, selector: { text: {} } },
            ],
          },

          {
            type: "grid",
            schema: [
              { name: "untracked_legend_indicator", required: false, selector: { select: { mode: "dropdown", options: indicatorOptions }}},
              { name: "untracked_legend_icon", required: false, selector: { icon: {} } },
            ],
          },

          {
            type: "grid",
            schema: [
              {
                type: "multi_select",
                options: untrackedStateContent,
                name: "untracked_state_content",
                required: false,
                default: ["name"],
              },
              {
                type: "multi_select",
                options: untrackedStateContent,
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
        name: "expandable_statistic", // Statistic
        flatten: true,
        schema: [
          {
            name: "",
            type: "grid",
            schema: [
              { name: "statistics", required: false, selector: { boolean: {} } },
              { name: "statistics_day_offset", required: false, selector: { number: { min: 1, step: 1} } },
              { name: "statistics_period", required: false, selector: { select: { mode: "dropdown", options: statisticsPeriods }}},
              { name: "statistics_function", required: false, selector: { select: { mode: "dropdown", options: statisticsFunctions }}},
            ],
          },
        ],
      },

      {
        type: "expandable",
        iconPath: mdiGestureTap,
        name: "expandable_interactions", // Interactions
        flatten: true,
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

  protected render(): TemplateResult | void {
    if (!this.hass || !this._config) return html``;
    if (this._subElementEditor != undefined) return this._renderSubElementEditor();

    const data = {
      ...this._config,
    };

    return html`
      <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${this._schema()}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
      ></ha-form>
      <ha-expansion-panel outlined>
        <div slot="header" role="heading" aria-level="3">
          <ha-svg-icon slot="leading-icon" .path=${mdiListBox}></ha-svg-icon>
          ${this.hass.localize("ui.panel.lovelace.editor.card.heading.entities")}
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
    if (!this.hass) return "";
    if (schema.name === "" || schema.name === undefined) {
      return "";
    }

    return localize(schema.name, this.hass);
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
          <mwc-icon-button @click=${this._goBack_subElementEditor}>
            <ha-icon icon="mdi:arrow-left"></ha-icon>
          </mwc-icon-button>
        </div>
      </div>
      <energy-line-gauge-item-editor
          .hass=${this.hass}
          .config=${this._config.entities[this._subElementEditor || 0]}
          .entities=${this._config.entities}
          @config-changed=${this._itemChanged}
      ></energy-line-gauge-item-editor>
      `;
  }

  private _goBack_subElementEditor(): void {
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

  /**
   * General config change
   */

  private _valueChanged(ev: any): void {
    if (!this._config || !this.hass) {
      return;
    }
    const config = ev.detail.value;
    fireEvent(this, 'config-changed', { config: config });
  }

  static get styles(): CSSResultGroup {
    // noinspection CssInvalidHtmlTagReference
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
