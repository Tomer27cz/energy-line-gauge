/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { EnergyLineGaugeConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';
import {EnergyLineGaugeDeviceConfig} from "./types";

console.info(`%c ${localize('common.version')} ${CARD_VERSION} %c LINE-GAUGE-CARD ", "color: #000000; background:#ffa600 ; font-weight: 700;", "color: #000000; background: #03a9f4; font-weight: 700;`);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'energy-line-gauge',
  name: 'Energy Line Gauge',
  description: 'A customizable line gauge with a legend, optionally showing device power use as a percentage of a main entity.',
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
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: EnergyLineGaugeConfig;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement('energy-line-gauge-editor');
  }
  static getStubConfig() {
    return {
      entity: "sensor.glow_power_consumption",
      devices: [
        {entity: "sensor.plug_0_power", color: "#ff725c", name: "Plug 0", lower_cutoff: 5},
        {entity: "sensor.plug_1_power", color: "#6cc5b0", name: "Plug 1"},
        {entity: "sensor.plug_2_power", color: "#a463f2"},
        {entity: "sensor.plug_3_power"},
      ],
      min: 0,
      max: 7680,
      accuracy: 0,
      lower_cutoff: 5,
      font_size: 2.5,
      corner: "square",
      color: "#03a9f4",
      background_color: "#282828",
      untracked_legend: true,
      untracked_legend_name: "Untracked",
      legend: true,
      legend_all: false,
      unit: "W",
      title: "Power Consumption",
      subtitle: "Glow",
      label: "",
    }
  }
  getCardSize() {
    return null;
  }

  private _setConfig() {
    this.config.min = this.config.min ?? 0;
    this.config.max = this.config.max ?? null;
    this.config.accuracy = this.config.accuracy ?? 0;
    this.config.lower_cutoff = this.config.lower_cutoff ?? 5;
    this.config.font_size = this.config.font_size ?? 2.5;
    this.config.corner = this.config.corner ?? "square";
    this.config.color = this.config.color ?? getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    this.config.background_color = this.config.background_color ?? getComputedStyle(document.documentElement).getPropertyValue('--secondary-background-color').trim();
    this.config.untracked_legend = this.config.untracked_legend ?? true;
    this.config.untracked_legend_name = this.config.untracked_legend_name ?? "Untracked";
    this.config.legend = this.config.legend ?? true;
    this.config.legend_all = this.config.legend_all ?? false;

    if (!this.config.devices) {
      this.config.devices = null;
    } else {
      const device_colors = this.config.devices.map(device => device.color);
      for (const device of this.config.devices) {
        if (!device.color) {
          device.color = COLORS.find(color => !device_colors.includes(color));
          device_colors.push(device.color);
        }
        if (!device.lower_cutoff) {
          device.lower_cutoff = this.config.lower_cutoff;
        }
        if (!device.name) {
          device.name = device.entity;
        }
      }
    }
  }
  public setConfig(config: EnergyLineGaugeConfig): void {
    if (!config) {throw new Error(localize('common.invalid_configuration'));}
    this.config = JSON.parse(JSON.stringify(config));
    this._setConfig();
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected render(): TemplateResult | void {
    if (!this.config || !this.hass) {
      throw new Error(localize('common.invalid_configuration'));
    }

    return html`
      <ha-card 
        .header=${this.config.header}
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
        .label=${this.config.label}
      
      >
        <div class="line-gauge-card" style="--color: ${this.config.color}; --background-color: ${this.config.background_color}" 
             @click="${(event) => {event.stopPropagation();this._showDetails(this.config.entity)}}">
          ${this._createInnerHtml()}
        </div>
      </ha-card>
    `;
  }
  _createLegend() {
    if (!this.config.devices || !this.config.legend) {
      return html``;
    }

    return html`
    <div class="chart-legend">
      <ul>
        ${this.config.devices.map((device: EnergyLineGaugeDeviceConfig) => {
          if (!device.entity) {throw new Error(localize('common.invalid_configuration'));}
          
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
                  entity: `${stateObj.attributes?.friendly_name} (${this.config.entity})`,
                })}
              </ha-card>
            `;
          }
          
          if (parseFloat(stateObj.state) < (device.lower_cutoff??0) && !this.config.legend_all) {
            return html``;
          }
          
          return html`
            <li title="${device.name}" id="legend-${device.entity.replace('.', '-')}" style="display: inline-grid;" 
                @click="${(event) => {event.stopPropagation();this._showDetails(device.entity)}}">
              <div class="bullet" style="background-color:${device.color + "7F"};border-color:${device.color};"></div>
              <div class="label">${device.name}</div>
            </li>`;
        })}  
        ${this.config.untracked_legend ? html`
          <li title="${this.config.untracked_legend_name}" id="legend-untracked" style="display: inline-grid;">
            <div class="bullet" style="background-color:${this.config.color + "7F"};border-color:${this.config.color};"></div>
            <div class="label">${this.config.untracked_legend_name}</div>
          </li>` : html``}
      </ul>
    </div>`
  }
  _createInnerHtml() {
    if (!this.hass.states[this.config.entity]) {
      return html`
        <hui-warning>
          ${this.hass.localize("ui.panel.lovelace.warning.entity_not_found", {
            entity: this.config.entity || "[empty]",
          })}
        </hui-warning>
      `;
    }
    const value = this.hass.states[this.config.entity].state;

    return html`
      ${this.config.title ? html`<div class="gauge-title">${this.config.title}</div>` : ''}
      ${this.config.subtitle ? html`<div class="gauge-subtitle">${this.config.subtitle}</div>` : ''}
      <div class="gauge-frame">
        <div class="gauge-value" style="font-size: ${this.config.font_size}">${this._formatValue(value)}</div>
        <div class="gauge-line">
          <div class="main-line" style="width: ${this._calculateWidth(this.config.entity)};"></div>
          <div class="device-line-container">
          ${this.config.devices ? this.config.devices.map((device) => {
            const stateObj = this.hass.states[device.entity];
            
            if (!stateObj || stateObj.state === "unavailable" || (stateObj.state < this._ce(device.lower_cutoff))) {
              return html``;
            }
            
            return html`<div id="line-${device.entity.replace(".", "-")}" class="device-line" style="background-color: ${device.color}; width: ${this._calculateWidth(stateObj.state)}" 
                             @click=${(event) => {event.stopPropagation();this._showDetails(device.entity)}}></div>`;
          }) : ''}
          </div>
        </div>
      </div>
      ${this.config.devices ? this._createLegend() : ''}
      ${this.config.label ? html`<div class="gauge-label">${this.config.label}</div>` : ''}
    `;
  }

  _showDetails(entity = this.config.entity) {
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      cancelable: false,
      composed: true,
      detail: {
        entityId: entity || this.config.entity,
      }
    });

    this.dispatchEvent(event);
    return event;
  }

  private _formatValue(value) {
    return this.config.unit ? `${parseFloat(value).toFixed(this.config.accuracy)} ${this.config.unit}` : parseFloat(value).toFixed(this.config.accuracy);
  }
  
  private _ce(entity: any): any {
    // Check if entity is an entity_id (configEntity)
    const stateObj = this.hass.states[entity];
    if (!stateObj) {return entity;}

    return parseFloat(stateObj.state);
  }

  // Yes I know using any is bad, but I don't care.
  private _calculateWidth(value: any, min:any=this.config.min, max:any=this.config.max) {
    value = this._ce(value);
    min = this._ce(min);max = this._ce(max);
    const clampValue = Math.min(Math.max(value, min), max);
    return `${((clampValue - min) / (max - min)) * 100}%`;
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  static get styles(): CSSResultGroup {
    // noinspection CssUnresolvedCustomProperty,CssUnusedSymbol
    return css`
      .line-gauge-card {
        --gauge-card-width: 300px;
        --color: var(--primary-color);
        --background-color: var(--secondary-background-color);
          
        width: 90%;
        box-sizing:border-box;
        cursor: pointer;
        /*pointer-events: none;*/
        transition: all 0.3s ease-out;
        
        margin: 6px auto;
        padding: 16px;
      }

      .line-gauge-card div {
        box-sizing:border-box
      }
      
      .gauge-frame {
        width: 100%;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        flex-grow: 1;
        justify-content: center;
        align-items: center;
      }
      
      .gauge-value {
        font-size: 2.5rem;
        text-align: center;
        flex-wrap: nowrap;
        white-space: nowrap;
      }
      .gauge-label {
        margin-top: 1rem;
        font-size: 1.5rem;
        text-align: center;
        flex-wrap: nowrap;
        white-space: nowrap;
      }
      .gauge-title {
        font-size: 2rem;
        text-align: left;
        flex-wrap: nowrap;
        white-space: nowrap;
        margin-bottom: 0.5rem;
      }
      .gauge-subtitle {
        font-size: 1rem;
        text-align: left;
        flex-wrap: nowrap;
        white-space: nowrap;
        color: gray;
        margin-bottom: 0.5rem;
      }

      .gauge-line {
        width: 100%;
        height: 3rem;
        margin-left: 1rem;
        background-color: var(--background-color);
      }
      .main-line {
        width: 0;
        height: 100%;
        background-color: var(--color);
        transition: width 1s ease-out;
      }
      
      
      .device-line-container {
        display: flex;
        position: relative;
        top: -3rem;
        height: 3rem;
        width: 100%;
      }
      .device-line {
        float: left;
        width: var(--line-width);
        height: 100%;
        background-color: var(--color);
        transition: width 1s ease-out;
      }       
      
      .chart-legend {
        text-align: center;
      }
      .chart-legend ul {
        display: inline-block;
        padding: 0;
        margin: 8px 0 0;
        width: 100%;
      }
      .chart-legend li {
        cursor: pointer;
        display: inline-grid;
        grid-auto-flow: column;
        padding: 0 8px;
        box-sizing: border-box;
        align-items: center;
        color: var(--secondary-text-color);
      }
      .chart-legend .label {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }
      .chart-legend .bullet {
        border-width: 1px;
        border-style: solid;
        border-radius: 50%;
        display: inline-block;
        height: 16px;
        margin-right: 6px;
        width: 16px;
        flex-shrink: 0;
        box-sizing: border-box;
        margin-inline-end: 6px;
        margin-inline-start: initial;
        direction: var(--direction);
      }
    `;
  }
}
