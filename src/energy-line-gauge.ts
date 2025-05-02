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
import { findEntities, setConfigDefaults, COLORS, toRGB, toHEX, textColor } from './util';

import './editor/editor';

console.info(
  `%c ENERGY LINE GAUGE %c ${version} `,
  `font-weight: 700; color: #000000; background: #03a9f4;`,
  `font-weight: 700; color: #000000; background: #ffa600;`,
);

window.customCards.push({
  type: 'energy-line-gauge',
  name: 'Energy Line Gauge',
  description: "A customizable line gauge with a legend, optionally showing device power use as a percentage of a main entity.",
  preview: true,
});

@customElement('energy-line-gauge')
export class EnergyLineGauge extends LitElement {

  @property() public hass!: HomeAssistant;

  @state() private _config!: ELGConfig;

  @property() private _card!: LovelaceCard;

  private _deviceWidths: Record<string, number> = {};

  // noinspection JSUnusedGlobalSymbols
  public async setConfig(config: ELGConfig): Promise<void> {
    if (!config) {this._invalidConfig()}
    this._config = setConfigDefaults(config);
  }

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

    return setConfigDefaults({
      type: "custom:energy-line-gauge",
      entity: foundEntities[0],
      title: "Energy Line Gauge",
      min: 0,
      max: 100,
      entities: [
        {entity: foundEntities[1], color: toRGB(COLORS[0])},
        {entity: foundEntities[2], color: toRGB(COLORS[1])},
        {entity: foundEntities[3], color: toRGB(COLORS[2])},
      ],
    });
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
        <div class="line-gauge-card" style="--color: ${toHEX(this._config.color)}; --background-color: ${toHEX(this._config.color_bg)}"">
          ${this._createInnerHtml()}
        </div>
      </ha-card>
    `;
  }

  _createDelta() {
    const delta = this._delta();
    if (!delta) {return html`<hui-warning>Delta could not be calculated</hui-warning>`;}
    const [state, sum, deltaValue] = delta;
    return html`
      <div class="gauge-delta">
        <div class="gauge-delta-item">State: <span>${this._formatValueMain(state)}</span></div>
        <div class="gauge-delta-item">Sum: <span>${this._formatValueMain(sum)}</span></div>
        <div class="gauge-delta-item delta">Delta: <span>${this._formatValueMain(deltaValue)}</span></div>
      </div>`;
  }
  _createUntrackedLegend() {
    if (!this._config.untracked_legend) {return html``;}

    return html`
      <li title="${this._config.untracked_legend_label}" id="legend-untracked" style="display: inline-grid;">
        ${this._config.untracked_legend_icon ?
          html`<ha-icon style="color:${toHEX(this._config.color)}" icon="${this._config.untracked_legend_icon}"></ha-icon>` :
          html`<div class="bullet" style="background-color:${toHEX(this._config.color) + "7F"};border-color:${toHEX(this._config.color)};"></div>`
        }
        <div class="label">
          ${this._untrackedLabel()}
        </div>
      </li>`
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
    
          if (this._calcMlt(stateObj, device) < (device.cutoff??this._config.cutoff??0) && !this._config.legend_all) {
            return html``;
          }
    
          // noinspection HtmlUnknownAttribute
          return html`
            <li
              @action=${(ev: ActionHandlerEvent) => this._handleAction(ev, device)}
              .actionHandler=${actionHandler({
                hasHold: hasAction(device.hold_action),
                hasDoubleClick: hasAction(device.double_tap_action),
              })}
              title="${this._entityName(device)}" 
              id="legend-${device.entity.replace('.', '-')}"
            >
              ${device.icon ? 
                  html`<ha-icon style="color:${toHEX(device.color)}" icon="${device.icon}"></ha-icon>` : 
                  html`<div class="bullet" style="background-color:${toHEX(device.color) + "7F"};border-color:${toHEX(device.color)};"></div>`
              }
              <div class="label">${this._entityLabel(device)}</div>
            </li>`;
        })}  
        ${this._createUntrackedLegend()}
      </ul>
    </div>`
  }
  _createDeviceLines() {
    if (!this._config.entities) {return html``;}
    return html`
      <div class="device-line-container">
        ${this._config.entities ? this._config.entities.map((device: ELGEntity) => {
          const stateObj = this.hass.states[device.entity];
          this._deviceWidths[device.entity] = (!stateObj || stateObj.state === "unavailable"
            || (this._calcMlt(stateObj, device) < this._ce(device.cutoff??this._config.cutoff))
          ) ? 0 : this._calculateDeviceWidth(this._calcMlt(stateObj, device));
  
          // noinspection HtmlUnknownAttribute
          return html`
            <div 
              id="line-${device.entity.replace(".", "-")}" 
              class="device-line" 
              style="background-color: ${toHEX(device.color)}; width: ${this._deviceWidths[device.entity]}%;"
              @action=${(ev: ActionHandlerEvent) => this._handleAction(ev, device)}
              .actionHandler=${actionHandler({ 
                hasHold: hasAction(device.hold_action), 
                hasDoubleClick: hasAction(device.double_tap_action), 
              })}
            >
              ${this._deviceWidths[device.entity] > 0 ? html`
                <div 
                  class="device-line-label line-text-position-${this._config.line_text_position??"left"}" 
                  style="color: rgba(${textColor(device.color)}, 0.6); font-size: ${this._config.line_text_size??1}rem;"
                >
                  ${this._entityLabel(device, true)}
                </div>
              ` : html``}
            </div>`;
        }) : ''}
      </div>`;
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
    this._deviceWidths = {};

    return html`
      ${this._config.title || this._config.subtitle ? html`
        <div class="gauge-header">
          ${this._config.title ? html`<div class="gauge-title">${this._config.title}</div>` : ''}
          ${this._config.subtitle ? html`<div class="gauge-subtitle">${this._config.subtitle}</div>` : ''}
        </div>` : ''}
      <div class="gauge-frame position-${this._config.position??"left"}">
        <div class="gauge-value">
          ${parseFloat(value).toFixed(this._config.precision)}
          ${this._config.unit ? html`<span class="unit">${this._config.unit}</span>` : ''}
        </div>
        <div class="gauge-line line-corner-${this._config.corner??"square"}">
          <div class="main-line" style="width: ${this._calculateWidth(this._config.entity)}%;"></div>
          ${this._createDeviceLines()}
        </div>
      </div>
      ${this._config.show_delta ? this._createDelta() : ''}
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
  private _entityLabel(device: ELGEntity, line?: boolean): TemplateResult | string | undefined {
    if (!device.entity) {this._invalidConfig()}
    if (line) {
      if (!device.line_state_content || device.line_state_content.length === 0) {return;}
    } else {
      if (!device.state_content || device.state_content.length === 0) {return this._entityName(device);}
    }
    const stateObj = this.hass.states[device.entity];

    return html`
      ${(line ? device.line_state_content : device.state_content)?.map((value, i, arr) => {
        const dot = i < arr.length - 1 ? " ⸱ " : '';
        const timeTemplate = (datetime: string) => html`
        <ha-relative-time
          .hass=${this.hass}
          .datetime=${datetime}
          capitalize
        ></ha-relative-time>${dot}
      `;
  
        switch (value) {
          case "name": return html`${this._entityName(device)}${dot}`;
          case "state": return html`${this._formatValueDevice(this._calcMlt(stateObj, device), device)}${dot}`;
          case "last_changed": return timeTemplate(stateObj.last_changed);
          case "last_updated": return timeTemplate(stateObj.last_updated);
          case "percentage": return html`${this._deviceWidths[device.entity].toFixed(0)}%${dot}`;
          default: return html`${value}${dot}`;
        }
      })
    }`;
  }
  private _untrackedLabel() {
    if (!this._config.untracked_state_content || this._config.untracked_state_content.length === 0) {
      return this._config.untracked_legend_label ?? this.hass.localize("ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption");
    }
    return html`
      ${this._config.untracked_state_content?.map((value, i, arr) => {
        const dot = i < arr.length - 1 ? " ⸱ " : '';

        switch (value) {
          case "name": return html`${this._config.untracked_legend_label ?? this.hass.localize("ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption")}${dot}`;
          case "state": {
            const [, , delta] = this._delta() ?? [0, 0, undefined];
            return delta === undefined ? html`` : html`${this._formatValueMain(delta)}${dot}`;
          }
          default: return html`${value}${dot}`;
        }
      })}`;
  }

  private _formatValue(value: any, precision?: number, unit?: string): string {
    if (!value) return '';
    return `${parseFloat(value).toFixed(precision??0)}${unit ? ` ${unit}` : ''}`;
  }
  private _formatValueMain(value: any): string {
    return this._formatValue(value, this._config.precision, this._config.unit);
  }
  private _formatValueDevice(value: any, device: ELGEntity): string {
    return this._formatValue(value, device.precision ?? this._config.precision, device.unit);
  }

  private _ce(entity: any): number {
    const state = this.hass.states[entity]?.state;
    return state !== undefined ? parseFloat(state) : entity;
  }
  private _calcMlt(stateObj: any, device: ELGEntity): number {
    const value = parseFloat(stateObj?.state);
    return isNaN(value) ? 0 : value * (device.multiplier ?? 1);
  }

  private _calculateWidth(value: any, min?: any, max?: any) {
    value = this._ce(value);min = this._ce(min??this._config.min);max = this._ce(max??this._config.max);
    const clampValue = Math.min(Math.max(value, min), max);
    return ((clampValue - min) / (max - min)) * 100;
  }
  private _calculateDeviceWidth(value: any) {
    value = this._ce(value);
    let min = this._ce(this._config.min);
    let max = this._ce(this._config.entity);
    const clampValue = Math.min(Math.max(value, min), max);
    return ((clampValue - min) / (max - min)) * this._calculateWidth(this._config.entity);
  }

  private _devicesSum(): number {
    return (this._config.entities ?? []).reduce((sum: number, device: ELGEntity) => {
      const stateObj = this.hass.states[device.entity];
      return stateObj?.state !== 'unavailable' ? sum + this._calcMlt(stateObj, device) : sum;
    }, 0);
  }
  private _delta(): [number, number, number] | undefined {
    const stateObj = this.hass.states[this._config.entity];
    if (!stateObj || stateObj.state === "unavailable") {return undefined;}

    let sum = this._devicesSum();
    let state = parseFloat(stateObj.state);
    let delta = state - sum;

    return [state, sum, delta];
  }

  private _handleAction(ev: ActionHandlerEvent, device?: ELGEntity): void {
    ev.stopPropagation();
    handleAction(this, this.hass!, device ?? this._config!, ev.detail.action!);
  }
}
