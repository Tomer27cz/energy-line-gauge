import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup } from 'lit';

import { customElement, property, state } from 'lit/decorators.js';

import {
  HomeAssistant,
  LovelaceCardEditor,
  LovelaceCard,
  hasAction,
  ActionHandlerEvent,
  handleAction,
} from 'custom-card-helpers';

import { version } from '../package.json';

import { ELGConfig, ELGEntity } from './types';
import { styles } from './styles';
import { actionHandler } from './action-handler';
import { findEntities } from './util';

import './editor/editor';

console.info(
  `%c ENERGY LINE GAUGE %c ${version} `,
  `font-weight: 700; color: #000000; background: #03a9f4;`,
  `font-weight: 700; color: #000000; background: #ffa600;`,
);

window.customCards.push({
  type: 'energy-line-gauge',
  name: 'Energy Line Gauge',
  description: "TODO: Add description",
  preview: true,
});

const COLORS = [
  "#4269d0",
  "#f4bd4a",
  "#ff725c",
  "#6cc5b0",
  "#a463f2",
  "#ff8ab7",
  "#9c6b4e",
  "#97bbf5",
  "#01ab63",
  "#9498a0",
  "#094bad",
  "#c99000",
  "#d84f3e",
  "#49a28f",
  "#048732",
  "#d96895",
  "#8043ce",
  "#7599d1",
  "#7a4c31",
  "#74787f",
  "#6989f4",
  "#ffd444",
  "#ff957c",
  "#8fe9d3",
  "#62cc71",
  "#ffadda",
  "#c884ff",
  "#badeff",
  "#bf8b6d",
  "#b6bac2",
  "#927acc",
  "#97ee3f",
  "#bf3947",
  "#9f5b00",
  "#f48758",
  "#8caed6",
  "#f2b94f",
  "#eff26e",
  "#e43872",
  "#d9b100",
  "#9d7a00",
  "#698cff",
  "#d9d9d9",
  "#00d27e",
  "#d06800",
  "#009f82",
  "#c49200",
  "#cbe8ff",
  "#fecddf",
  "#c27eb6",
  "#8cd2ce",
  "#c4b8d9",
  "#f883b0",
  "#a49100",
  "#f48800",
  "#27d0df",
  "#a04a9b",
];

@customElement('energy-line-gauge')
export class EnergyLineGauge extends LitElement {

  // noinspection JSUnusedGlobalSymbols
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor/editor');
    return document.createElement('energy-line-gauge-editor') as LovelaceCardEditor;
  }

  // noinspection JSUnusedGlobalSymbols
  public static getStubConfig(
      hass: HomeAssistant,
      entities: string[],
      entitiesFallback: string[]
  ): ELGConfig {
      const includeDomains = ["counter", "input_number", "number", "sensor"];
      const maxEntities = 4;
      const entityFilter = (stateObj: any): boolean =>
          !isNaN(Number(stateObj.state));

      const foundEntities = findEntities(
          hass,
          maxEntities,
          entities,
          entitiesFallback,
          includeDomains,
          entityFilter
      );

      return {
        type: "custom:energy-line-gauge",
        entity: foundEntities[0],
        title: "Energy Line Gauge",
        entities: [
          {entity: foundEntities[1], color: COLORS[0]},
          {entity: foundEntities[2], color: COLORS[1]},
          {entity: foundEntities[3], color: COLORS[2]},
        ]
      };
  }

  // static getStubConfig(): Record<string, unknown>  {
  //   return {
  //     entity: "sensor.glow_power_consumption",
  //     entities: [
  //       {entity: "sensor.plugg_0_power", color: [255, 114, 92], name: "Plug 0", cutoff: 5},
  //       {entity: "sensor.plugg_1_power", color: [108, 197, 176], name: "Plug 1"},
  //       {entity: "sensor.plugg_2_power", color: "#a463f2"},
  //       {entity: "sensor.plugg_3_power"},
  //     ],
  //     min: 0,
  //     max: "sensor.glow_power_consumption",
  //     precision: 0,
  //     cutoff: 5,
  //     corner: "square",
  //     color: [0, 170, 250],
  //     color_bg: [40, 40, 40],
  //     untracked_legend: true,
  //     untracked_legend_label: "Untracked",
  //     legend_hide: false,
  //     legend_all: false,
  //     unit: "W",
  //     title: "Power Consumption",
  //     subtitle: "Glow",
  //     label: "",
  //   }
  // }

  @property() public hass!: HomeAssistant;

  @state() private _config!: ELGConfig;

  @property() private _card!: LovelaceCard;

  private _setConfig(config: ELGConfig): ELGConfig {
    config = JSON.parse(JSON.stringify(config));

    config.min = config.min ?? 0;
    config.max = config.max ?? config.entity;
    config.precision = config.precision ?? 0;
    config.cutoff = config.cutoff ?? 5;
    config.corner = config.corner ?? "square";

    config.color = this.rgbToHex(config.color) ?? getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    config.color_bg = this.rgbToHex(config.color_bg) ?? getComputedStyle(document.documentElement).getPropertyValue('--secondary-background-color').trim();

    config.untracked_legend = !!(config.untracked_legend ?? config.entities);
    config.untracked_legend_label = config.untracked_legend_label === "" ? undefined : config.untracked_legend_label;

    config.legend_hide = config.legend_hide ?? false;
    config.legend_all = config.legend_all ?? false;

    if (config.entities) {
      const device_colors = config.entities.map(device => this.rgbToHex(device.color));
      for (const device of config.entities) {
        device.color = this.rgbToHex(device.color);
        if (!device.color) {
          device.color = COLORS.find(color => !device_colors.includes(color));
          device_colors.push(device.color);
        }
      }
    }

    return config;
  }

  // noinspection JSUnusedGlobalSymbols
  public async setConfig(config: ELGConfig): Promise<void> {
    if (!config) {this._invalidConfig()}
    this._config = this._setConfig(config);
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._card || (!changedProps.has('hass') && !changedProps.has('editMode'))) {
      return;
    }
    if (this.hass) {
      this._card.hass = this.hass;
    }
  }

  public static get styles(): CSSResultGroup {
    return styles;
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      this._invalidConfig()
    }

  // .tap_action=${this._config.tap_action}
  // .hold_action=${this._config.hold_action}
  // .double_tap_action=${this._config.double_tap_action}

    return html`
      <ha-card 
        .header=${this._config.header}
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config.hold_action),
          hasDoubleClick: hasAction(this._config.double_tap_action),
        })}
        tabindex="0"
        .label=${this._config.label}
      >
        <div class="line-gauge-card" style="--color: ${this._config.color}; --background-color: ${this._config.color_bg}"">
          ${this._createInnerHtml()}
        </div>
      </ha-card>
    `;
  }

  _createLegend() {
    if (!this._config.entities || this._config.legend_hide) {
      return html``;
    }

    return html`
    <div class="chart-legend">
      <ul>
        ${this._config.entities.map((device: ELGEntity) => {
          if (!device.entity) {this._invalidConfig()}
    
          const stateObj = this.hass.states[device.entity];
          if (!stateObj) {
            return html`
              <hui-warning>
                ${this.hass.localize("ui.panel.lovelace.warning.entity_not_found", {
                  entity: device.entity || "[empty]",
                })}
              </hui-warning>
            `;
          }
    
          if (stateObj.state === "unavailable") {
            return html`
              <ha-card class="unavailable">
                ${this.hass.localize("ui.panel.lovelace.warning.entity_unavailable", {
                  entity: `${stateObj?.attributes?.friendly_name} (${device.entity})` || device.entity,
                })}
              </ha-card>
            `;
          }
    
          if (parseFloat(stateObj.state) < (device.cutoff??this._config.cutoff??0) && !this._config.legend_all) {
            return html``;
          }
    
          return html`
            <li
              @action=${this._handleAction}
              .actionHandler=${actionHandler({
                hasHold: hasAction(device.hold_action),
                hasDoubleClick: hasAction(device.double_tap_action),
              })}
              title="${this._entityName(device)}" 
              id="legend-${device.entity.replace('.', '-')}"
            >
              ${device.icon ? 
                  html`<ha-icon style="color:${device.color}" icon="${device.icon}"></ha-icon>` : 
                  html`<div class="bullet" style="background-color:${device.color + "7F"};border-color:${device.color};"></div>`
              }
              <div class="label">${this._entityName(device)}</div>
            </li>`;
        })}  
        ${this._config.untracked_legend ? html`
          <li title="${this._config.untracked_legend_label}" id="legend-untracked" style="display: inline-grid;">
            ${this._config.untracked_legend_icon ? 
                html`<ha-icon style="color:${this._config.color}" icon="${this._config.untracked_legend_icon}"></ha-icon>` : 
                html`<div class="bullet" style="background-color:${this._config.color + "7F"};border-color:${this._config.color};"></div>`
            }
            <div class="label">${this._config.untracked_legend_label ?? this.hass.localize("ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption")}</div>
          </li>` : html``}
      </ul>
    </div>`
  }
  _createInnerHtml() {
    if (!this.hass.states[this._config.entity]) {
      return html`
        <hui-warning>
          ${this.hass.localize("ui.panel.lovelace.warning.entity_not_found", {
            entity: this._config.entity || "[empty]",
          })}
        </hui-warning>
      `;
    }
    const value = this.hass.states[this._config.entity].state;

    return html`
      ${this._config.title || this._config.subtitle ? html`
        <div class="gauge-header">
          ${this._config.title ? html`<div class="gauge-title">${this._config.title}</div>` : ''}
          ${this._config.subtitle ? html`<div class="gauge-subtitle">${this._config.subtitle}</div>` : ''}
        </div>` : ''}
      <div class="gauge-frame">
        <div class="gauge-value">${this._formatValue(value)}</div>
        <div class="gauge-line">
          <div class="main-line" style="width: ${this._calculateWidth(this._config.entity)};"></div>
          <div class="device-line-container">
          ${this._config.entities ? this._config.entities.map((device: ELGEntity) => {
            const stateObj = this.hass.states[device.entity];
      
            if (!stateObj || stateObj.state === "unavailable" || (stateObj.state < this._ce(device.cutoff??this._config.cutoff))) {
              return html``;
            }
      
            return html`
              <div 
                  id="line-${device.entity.replace(".", "-")}" 
                  class="device-line" 
                  style="background-color: ${device.color}; width: ${this._calculateWidth(stateObj.state)}"
                  @action=${this._handleAction}
                  .actionHandler=${actionHandler({
                    hasHold: hasAction(device.hold_action),
                    hasDoubleClick: hasAction(device.double_tap_action),
                  })}
              ></div>`;
          }) : ''}
          </div>
        </div>
      </div>
      ${this._config.entities ? this._createLegend() : ''}
      ${this._config.label ? html`<div class="gauge-label">${this._config.label}</div>` : ''}
    `;
  }

  private _invalidConfig() {
    if (!this.hass) {throw new Error("Invalid configuration (no hass)");}
    throw new Error(this.hass.localize("ui.panel.lovelace.editor.condition-editor.invalid_config_title"));
  }

  private _entityName(device: ELGEntity): string {
    if (!device.entity) {this._invalidConfig()}
    if (device.name) {return device.name;}
    return this.hass.states[device.entity].attributes.friendly_name || device.entity.split('.')[1];
  }

  private _formatValue(value: any) {
    return this._config.unit ? `${parseFloat(value).toFixed(this._config.precision)} ${this._config.unit}` : parseFloat(value).toFixed(this._config.precision);
  }

  private rgbToHex(color: [number, number, number] | undefined | string):string | undefined {
    if (!color) {return undefined;}
    if (typeof color === "string") {return color;}
    return "#" + ((1 << 24) | (color[0] << 16) | (color[1] << 8) | color[2]).toString(16).slice(1).toUpperCase();
  }

  private _ce(entity: any): any {
    // Check if entity is an entity_id (configEntity)
    const stateObj = this.hass.states[entity];
    if (!stateObj) {return entity;}

    return parseFloat(stateObj.state);
  }

  // Yes I know using any is bad, but I don't care.
  private _calculateWidth(value: any, min:any=this._config.min, max:any=this._config.max) {
    value = this._ce(value);
    min = this._ce(min);max = this._ce(max);
    const clampValue = Math.min(Math.max(value, min), max);
    return `${((clampValue - min) / (max - min)) * 100}%`;
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    handleAction(this, this.hass!, this._config!, ev.detail.action!);
  }
}
