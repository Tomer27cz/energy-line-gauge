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

import { ELGConfig, ELGEntity, ELGHistory, HassEntity, HassHistory, HassHistoryEntry } from './types';
import { styles } from './styles';
import { actionHandler } from './action-handler';
import { findEntities, setConfigDefaults, COLORS, toRGB, toHEX, textColor, parseDurationToMilliseconds } from './util';

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

  @property() private _entitiesWidth: Record<string, number> = {};

  @property() private _entitiesHistory: ELGHistory | undefined = undefined;

  @property() private _offsetTime: number | undefined = undefined;

  private readonly HISTORY_WINDOW_MS = 60000;

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
    const entityFilter = (stateObj: HassEntity): boolean => !isNaN(Number(stateObj.state));

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
        { entity: foundEntities[1], color: toRGB(COLORS[0]) },
        { entity: foundEntities[2], color: toRGB(COLORS[1]) },
        { entity: foundEntities[3], color: toRGB(COLORS[2]) },
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
    if (!delta) {return this._config.suppress_warnings ? html`` : html`<hui-warning>Delta could not be calculated</hui-warning>`;}
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
    if (!this._config.entities || this._config.legend_hide) {return html``;}

    return html`
    <div class="chart-legend">
      <ul>
        ${this._config.entities.map((device: ELGEntity) => {
          const validationResult = this._validateEntityState(device.entity);
          if (validationResult) {return this._config.suppress_warnings ? html`` : validationResult;}

          const stateObj: HassEntity = this.hass.states[device.entity];
          const state = this._calcState(stateObj, device);

          if (state < (device.cutoff ?? this._config.cutoff ?? 0) && !this._config.legend_all) {
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
              title="${this._entityName(device, stateObj)}" 
              id="legend-${device.entity.replace('.', '-')}"
            >
              ${device.icon ? 
                  html`<ha-icon style="color:${toHEX(device.color)}" icon="${device.icon}"></ha-icon>` : 
                  html`<div class="bullet" style="background-color:${toHEX(device.color) + "7F"};border-color:${toHEX(device.color)};"></div>`
              }
              <div class="label">${this._entityLabel(device, stateObj, false, state)}</div>
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
          const validationResult = this._validateEntityState(device.entity);
          if (validationResult) {return this._config.suppress_warnings ? html`` : validationResult;}
          
          const stateObj: HassEntity = this.hass.states[device.entity];
          const state = this._calcState(stateObj, device);

          this._entitiesWidth[device.entity] = (state <= (device.cutoff ?? this._config.cutoff ?? 0)) ? 0 : this._calculateDeviceWidth(state);

          // The div is still created even if the width is 0,
          // so when the width is suddenly more than 0, the transition is smooth from 0 to the new width
          // (not just appearing without transition)
  
          // noinspection HtmlUnknownAttribute
          return html`
            <div 
              id="line-${device.entity.replace(".", "-")}" 
              class="device-line" 
              style="background-color: ${toHEX(device.color)}; width: ${this._entitiesWidth[device.entity]}%;"
              @action=${(ev: ActionHandlerEvent) => this._handleAction(ev, device)}
              .actionHandler=${actionHandler({ 
                hasHold: hasAction(device.hold_action), 
                hasDoubleClick: hasAction(device.double_tap_action), 
              })}
            >
              ${this._entitiesWidth[device.entity] > 0 ? html`
                <div 
                  class="device-line-label line-text-position-${this._config.line_text_position??"left"}" 
                  style="color: rgba(${textColor(device.color)}, 0.6); font-size: ${this._config.line_text_size??1}rem;"
                >
                  ${this._entityLabel(device, stateObj, true, state)}
                </div>
              ` : html``}
            </div>`;
        }) : ''}
      </div>`;
  }
  _createInnerHtml() {
    const validationResult = this._validateEntityState(this._config.entity);
    if (validationResult) {return this._config.suppress_warnings ? html`` : validationResult;}

    if (this._config.offset) {this._getHistory();}

    const value = String(this._calcStateMain());
    this._entitiesWidth = {};

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
          <div class="main-line" style="width: ${this._calculateMainWidth()}%;"></div>
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
  private _entityNotFound(entity: string): TemplateResult {
    return html`<hui-warning>
      ${this.hass.localize("ui.panel.lovelace.warning.entity_not_found", { 
        entity: entity || "[empty]", 
      })}
    </hui-warning>`;
  }
  private _entityUnavailable(stateObj: HassEntity): TemplateResult {
    return html`
      <hui-warning>
        ${this.hass.localize("ui.panel.lovelace.warning.entity_unavailable", {
          entity: `${stateObj.attributes?.friendly_name} (${stateObj.entity_id})`,
        })}
      </ha-card>
    `;
  }
  private _entityNotNumeric(stateObj: HassEntity): TemplateResult {
    return html`
      <hui-warning>
        ${this.hass.localize("ui.panel.lovelace.warning.entity_non_numeric", {
          entity: `${stateObj.attributes?.friendly_name} (${stateObj.entity_id})`,
        })}
      </hui-warning>
    `;
  }

  private _entityName(device: ELGEntity, stateObj: HassEntity): string {
    if (device.name) {return device.name;}
    return stateObj.attributes.friendly_name || device.entity.split('.')[1];
  }
  private _entityLabel(device: ELGEntity, stateObj: HassEntity, line?: boolean, calculatedState?: number,): TemplateResult | string | undefined {
    if (line) {
      if (!device.line_state_content || device.line_state_content.length === 0) {return;}
    } else {
      if (!device.state_content || device.state_content.length === 0) {return this._entityName(device, stateObj);}
    }

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
          case "name": return html`${this._entityName(device, stateObj)}${dot}`;
          case "state": return html`${this._formatValueDevice(calculatedState, device)}${dot}`;
          case "last_changed": return timeTemplate(stateObj.last_changed);
          case "last_updated": return timeTemplate(stateObj.last_updated);
          case "percentage": return html`${this._entitiesWidth[device.entity].toFixed(0)}%${dot}`;
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

  private _validateEntityState(entityId: string ): TemplateResult | undefined {
    if (!entityId) {return this._entityNotFound(entityId);}

    const stateObj: HassEntity | undefined = this.hass.states[entityId];
    if (!stateObj) {return this._entityNotFound(entityId);}

    if (stateObj.state === "unavailable") {return this._entityUnavailable(stateObj);}
    if (isNaN(Number(stateObj.state))) {return this._entityNotNumeric(stateObj);}

    return undefined; // Return undefined if all checks pass
  }

  private _calcStateMain(): number {
    return (this._config.offset) ? this._getHistoryState(this._config.entity) : parseFloat(this.hass.states[this._config.entity].state)
  }
  private _calcState(stateObj: HassEntity, device: ELGEntity): number {
    const value = (this._config.offset) ? this._getHistoryState(device.entity) : parseFloat(stateObj?.state);
    return isNaN(value) ? 0 : value * (device.multiplier ?? 1);
  }

  private _getHistoryState(entityID: string): number {
    if (!this._offsetTime) {return 0;}
    if (!this._entitiesHistory) {return 0;}
    if (!this._entitiesHistory.history) {return 0;}

    const history: HassHistory = this._entitiesHistory.history[entityID];
    if (!history || history.length === 0) {return 0;}

    for (let i = history.length - 1; i >= 0; i--) {
      const entry: HassHistoryEntry = history[i];
      const lastUpdatedTime: number = new Date(entry.last_updated).getTime();

      if (lastUpdatedTime <= this._offsetTime) {
        // Found the state at or before the requested time
        const stateValue = parseFloat(entry.state);
        return isNaN(stateValue) ? 0 : stateValue;
      }
    }

    // If no entry is found before the offsetTime, return the earliest state
    const earliestEntry: HassHistoryEntry = history[0];
    if (earliestEntry) {
      const stateValue: number = parseFloat(earliestEntry.state);
      return isNaN(stateValue) ? 0 : stateValue;
    }

    return 0;
  }
  private _getHistory(): void {
    this._calculateOffsetTime();
    if (!this._offsetTime) {return;}
    if (this._entitiesHistory?.updating) {return;}
    if (this._entitiesHistory?.end_time && this._entitiesHistory.end_time - 100 > this._offsetTime) {return;}

    if (!this._entitiesHistory) {
      this._entitiesHistory = {
        start_time: this._offsetTime,
        end_time: this._offsetTime + this.HISTORY_WINDOW_MS,
        history: {},
        updating: true
      }
    }
    this._entitiesHistory.updating = true;

    const startTime = new Date(this._offsetTime);
    const endTime = new Date(this._offsetTime + this.HISTORY_WINDOW_MS);
    const entityIDs = (this._config.entities?.map((device: ELGEntity) => device.entity) ?? []).concat(this._config.entity);

    this._fetchHistory(entityIDs, startTime, endTime, true).then((history: HassHistory[]) => {
      if (!history || history.length === 0) {
        if (this._entitiesHistory) {
          this._entitiesHistory.updating = false;
        }
        return;
      }

      const transformedData = history.reduce((acc, innerArray) => {
        innerArray.forEach(item => {
          const entityId = item.entity_id;
          acc[entityId] = acc[entityId] || [];
          acc[entityId].push(item);
        });
        return acc;
      }, {});

      this._entitiesHistory = {
        start_time: startTime.valueOf(),
        end_time: endTime.valueOf(),
        history: transformedData,
        updating: false,
      };
    });
  }
  private async _fetchHistory(entityIDs: string[], start: Date, end: Date, skipInitialState: boolean,): Promise<HassHistory[]> {
    let url = `history/period/${start.toISOString()}?filter_entity_id=${entityIDs.join(',')}&end_time=${end.toISOString()}`;
    if (skipInitialState) url += '&skip_initial_state';
    url += '&significant_changes_only=0';
    return this.hass?.callApi('GET', url);
  }
  private _calculateOffsetTime() {
    if (!this._config.offset) {return;}

    const offset = parseDurationToMilliseconds(this._config.offset);
    if (offset === null) {throw new Error(`Invalid offset: ${this._config.offset}`);}

    this._offsetTime = Date.now() - offset;
  }

  private _calculateMainWidth(): number {
    if (!this._config.max) {return 100;}

    const min: number = this._config.min??0;
    const max: number = this._config.max;
    const value: number = this._calcStateMain();

    const clampValue = Math.min(Math.max(value, min), max);
    return ((clampValue - min) / (max - min)) * 100;
  }
  private _calculateDeviceWidth(value: number): number {
    const mainWidth: number = this._calculateMainWidth();

    const min: number = this._config.min??0;
    const max: number = this._config.max??this._calcStateMain();

    const clampValue = Math.min(Math.max(value, min), max);
    return ((clampValue - min) / (max - min)) * mainWidth;
  }

  private _devicesSum(): number {
    return (this._config.entities ?? []).reduce((sum: number, device: ELGEntity) => {
      const validationResult = this._validateEntityState(device.entity);
      if (validationResult) {return sum;}
      return sum + this._calcState(this.hass.states[device.entity], device);
    }, 0);
  }
  private _delta(): [number, number, number] | undefined {
    let sum = this._devicesSum();
    let state = this._calcStateMain();
    let delta = state - sum;

    return [state, sum, delta];
  }

  private _handleAction(ev: ActionHandlerEvent, device?: ELGEntity): void {
    ev.stopPropagation();
    handleAction(this, this.hass!, device ?? this._config!, ev.detail.action!);
  }
}
