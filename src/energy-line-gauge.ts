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
import { findEntities, setConfigDefaults, COLORS, toRGB, toHEX } from './util';

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

@customElement('energy-line-gauge')
export class EnergyLineGauge extends LitElement {

  @property() public hass!: HomeAssistant;

  @state() private _config!: ELGConfig;

  @property() private _card!: LovelaceCard;

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
        <div class="gauge-delta-item">State: <span>${this._formatValue(state)}</span></div>
        <div class="gauge-delta-item">Sum: <span>${this._formatValue(sum)}</span></div>
        <div class="gauge-delta-item delta">Delta: <span>${this._formatValue(deltaValue)}</span></div>
      </div>`;
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
    
          // noinspection HtmlUnknownAttribute
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
                  html`<ha-icon style="color:${toHEX(device.color)}" icon="${device.icon}"></ha-icon>` : 
                  html`<div class="bullet" style="background-color:${toHEX(device.color) + "7F"};border-color:${toHEX(device.color)};"></div>`
              }
              <div class="label">${this._entityName(device)}</div>
            </li>`;
        })}  
        ${this._config.untracked_legend ? html`
          <li title="${this._config.untracked_legend_label}" id="legend-untracked" style="display: inline-grid;">
            ${this._config.untracked_legend_icon ? 
                html`<ha-icon style="color:${toHEX(this._config.color)}" icon="${this._config.untracked_legend_icon}"></ha-icon>` : 
                html`<div class="bullet" style="background-color:${toHEX(this._config.color) + "7F"};border-color:${toHEX(this._config.color)};"></div>`
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
      <div class="gauge-frame position-${this._config.position??"left"}">
        <div class="gauge-value">${this._formatValue(value)}</div>
        <div class="gauge-line line-corner-${this._config.corner??"square"}">
          <div class="main-line" style="width: ${this._calculateWidth(this._config.entity)};"></div>
          <div class="device-line-container">
          ${this._config.entities ? this._config.entities.map((device: ELGEntity) => {
            const stateObj = this.hass.states[device.entity];
      
            // noinspection HtmlUnknownAttribute
            return html`
              <div 
                  id="line-${device.entity.replace(".", "-")}" 
                  class="device-line" 
                  style="background-color: ${toHEX(device.color)}; width: ${
                    (!stateObj || stateObj.state === "unavailable" 
                      || (stateObj.state < this._ce(device.cutoff??this._config.cutoff))
                    ) ? 0 : this._calculateWidth(stateObj.state)
                  }"
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

  private _formatValue(value: any) {
    return this._config.unit ? `${parseFloat(value).toFixed(this._config.precision)} ${this._config.unit}` : parseFloat(value).toFixed(this._config.precision);
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

  private _devicesSum() {
    if (!this._config.entities) {return 0;}
    let sum = 0;
    for (const device of this._config.entities) {
      const stateObj = this.hass.states[device.entity];
      if (!stateObj || stateObj.state === "unavailable") {continue;}
      sum += parseFloat(stateObj.state);
    }
    return sum;
  }

  private _delta(): [number, number, number] | undefined {
    const stateObj = this.hass.states[this._config.entity];
    if (!stateObj || stateObj.state === "unavailable") {return undefined;}

    let sum = this._devicesSum();
    let state = parseFloat(stateObj.state);
    let delta = state - sum;

    return [state, sum, delta];
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    handleAction(this, this.hass!, this._config!, ev.detail.action!);
  }
}
