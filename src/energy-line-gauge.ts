import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { UnsubscribeFunc } from "home-assistant-js-websocket";
import memoizeOne from 'memoize-one';

import { version } from '../package.json';

import {
  HomeAssistant,
  LovelaceCardEditor,
  LovelaceCard,

  ELGConfig,
  ELGEntity,
  ELGEntityState,
  ELGState,
  ELGStyle,

  ELGHistoryOffset,
  ELGHistoryOffsetEntities,
  ELGHistoryOffsetEntry,

  ELGHistoryStatistics,
  ELGHistoryStatisticsBucket,

  HassEntity,
  HassHistory,
  HassStatistics,

  LabelRenderResult,
  PartRenderer,
  RendererContext,
  DeviceRendererContext,

  CSSColor,
  IndicatorType,
  EntityWarning,

  ActionHandlerEvent,
  SeverityType,
  LinePositionType,
} from './types';

import { styles, getTextStyleMap, getOverflowStyle } from './style/styles';
import { getLineTextColor, getBlend } from './style/color';

import { actionHandler } from './interaction/action-handler';
import { hasAction, handleAction } from './interaction/event-helpers';
import { deepEqual } from './interaction/deep-equal';

import { findEntities } from './data/find-entities';
import { setConfigDefaults } from './config/defaults';

import { subscribeRenderTemplate, RenderTemplateResult, isTemplate } from './data/template';

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

// noinspection JSUnusedGlobalSymbols
@customElement('energy-line-gauge')
export class EnergyLineGauge extends LitElement {
  @property() public hass!: HomeAssistant;

  @state() private _config!: ELGConfig;

  @property() private _card!: LovelaceCard;

  @state() private _templateResults: Record<string, string> = {};
  @state() private _unsubRenderTemplates: Map<string, Promise<UnsubscribeFunc>> = new Map();

  private _warnings: EntityWarning[] = [];

  private _mainObject!: ELGEntityState;
  private _untrackedObject!: ELGState;

  private _entitiesObject: Record<string, ELGEntityState> = {};
  private _entitiesTotalObject!: ELGState;

  private _lineSeparatorWidth: number = 0;
  private _resizeObserver!: ResizeObserver;

  @state() private _entitiesHistoryStatistics: ELGHistoryStatistics | undefined = undefined;
  @state() private _entitiesHistoryOffset: ELGHistoryOffset | undefined = undefined;
  private _offsetTime: number | undefined = undefined;
  private _historyWindow: number = 60000;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor/editor');
    return document.createElement('energy-line-gauge-editor') as LovelaceCardEditor;
  }

  public async setConfig(config: ELGConfig): Promise<void> {
    if (!config) {this._invalidConfig()}
    this._config = setConfigDefaults(config);
  }
  public static getStubConfig(hass: HomeAssistant, entities: string[], entitiesFallback: string[]): ELGConfig {
    const includeDomains = ["sensor"];
    const maxEntities = 4;
    const entityFilter = (stateObj: HassEntity): boolean => !isNaN(Number(stateObj.state))
      && stateObj.state !== "unavailable" && stateObj.state !== "unknown"
      && (stateObj.attributes.state_class === "total_increasing" || stateObj.attributes.state_class === "total" || stateObj.attributes.state_class === "measurement");

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

      min: 0,
      max: 100,

      color: 'var(--primary-color)',
      color_bg: 'var(--secondary-background-color)',

      untracked_legend: true,
      untracked_state_content: ["name"],

      entities: [
        { entity: foundEntities[1], state_content: ["name"] },
        { entity: foundEntities[2], state_content: ["name"] },
        { entity: foundEntities[3], state_content: ["name"] },
      ],
    };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this._config) {
      return true;
    }

    if (changedProps.has('_templateResults')) {return true;}
    if (changedProps.has('_entitiesHistoryOffset')) {return true;}
    if (changedProps.has('_entitiesHistoryStatistics')) {return true;}

    if (changedProps.has('_config')) {
      const oldConfig = changedProps.get('_config') as ELGConfig;
      if (!deepEqual(this._config, oldConfig)) {
        return true;
      }
    }

    if (changedProps.has('hass')) {
      if (this._config.statistics) {return false;}
      if (this._config.offset) {return false;}

      const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
      if (!oldHass) {
        return true;
      }

      const entities = this._allConfigEntities();
      for (const entity of entities) {
        if (oldHass.states[entity] !== this.hass.states[entity]) {
          return true;
        }
      }

      return false;
    }

    return true;
  }
  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);

    if (!(['tooltip', 'tooltip-segment'].includes(this._config.line_text_overflow ?? 'tooltip'))) return;

    this._resizeObserver = new ResizeObserver(() => {
      this._checkAllLabelsOverflow();
    });

    const cardElement = this.shadowRoot?.querySelector('.line-gauge-card');
    if (cardElement) {
      this._resizeObserver.observe(cardElement);
    }

    requestAnimationFrame(() => this._checkAllLabelsOverflow());
  }
  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (this.hass && this._card) {this._card.hass = this.hass;}

    this._tryConnect().catch(err => console.error("ELG: Template connect failed:", err));

    if (['tooltip', 'tooltip-segment'].includes(this._config.line_text_overflow ?? 'tooltip'))  {
      requestAnimationFrame(() => this._checkAllLabelsOverflow());
      return;
    }

    requestAnimationFrame(() => this._resetAllLabelsToVisible());
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this._tryConnect().catch(err => console.error("ELG: Template connect failed:", err));
  }
  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._tryDisconnect().catch(err => console.error("ELG: Template disconnect failed:", err));

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html`<ha-card header="Energy Line Gauge"><div class="card-content">Waiting for configuration and Home Assistant.</div></ha-card>`;
    }

    if (!this._validate(this._config.entity)) {return this._renderWarnings();}

    this._sortConfigEntitiesByState()
    this._calculate();

    const style = {
      '--color': this._mainSeverity(),
      '--background-color': this._config.color_bg,
      '--line-height': `${this._config.line_height ?? 3}rem`,
    }

    return html`
      <ha-card
        class="line-gauge-card"
        style=${styleMap(style)}
        .header=${this._getTemplateValue('header', this._config.header)}
        .label=${this._config.label}
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config.hold_action),
          hasDoubleClick: hasAction(this._config.double_tap_action),
        })}
      >
        ${this._createInnerHtml()}
      </ha-card>
    `;
  }

  _createLegendIndicator(device: ELGEntity | undefined): TemplateResult {
    const color = device ? device.color : this._config.color;
    const legendType: IndicatorType = (device ? device.legend_indicator : this._config.untracked_legend_indicator) ?? this._config.legend_indicator ?? 'circle';
    const textSize = (this._config.legend_text_size ?? this._config.text_size ?? 1) * 1.1;

    if (legendType === 'none') {return html``;}
    const textStyle = `color: ${color}; font-size: ${textSize}rem;`;

    switch (legendType) {
      case 'state':
        return html`<div class="indicator-state" style="${textStyle}">${device ? this._formatValueDevice(device) : this._formatValueMain(this._untrackedObject?.state)}</div>`;
      case 'percentage':
        const percentage = device ? this._entitiesObject[device.entity]?.percentage ?? 0 : this._untrackedObject?.percentage ?? 0;
        return html`<div class="indicator-state" style="${textStyle}">${(percentage * 100).toFixed(0)}%</div>`;
      case 'name': {
        return html`<div class="indicator-state" style="${textStyle}">${device ? this._entityName(device) : this._config.untracked_legend_label ?? this.hass.localize('ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption')}</div>`;
      }

      case 'icon':
      // @ts-ignore
      case 'icon-fallback':
        // If no icon is defined, fall through to the default case to render a bullet.
        if (device) {
          if (device.icon) {return this._createIcon(device, textSize, color);}
        } else {
          if (this._config.untracked_legend_icon) {return this._createIcon(undefined, textSize, color);}
        }
        if (legendType === 'icon') {return html``;}
      // fallthrough

      default: {
        const bulletStyle = `
        background: color-mix(in srgb, ${color}, transparent 50%);
        border-color: ${color};
        width: ${textSize}rem;
        height: ${textSize}rem;
      `;
        return html`<div class="bullet" style="${bulletStyle}"></div>`;
      }
    }
  }
  _createLegendItem(device: ELGEntity | undefined, style: ELGStyle): TemplateResult {
    if (!device && !this._config.untracked_legend) {return html``;}
    const hasHold = device ? hasAction(device.hold_action) : hasAction(this._config.hold_action);
    const hasDoubleClick = device ? hasAction(device.double_tap_action) : hasAction(this._config.double_tap_action);

    const labelResult = device ? this._entityLabel(device, false) : this._untrackedLabel(false);

    // noinspection HtmlUnknownAttribute
    return html`
      <li
        @action=${(ev: ActionHandlerEvent) => this._handleAction(ev, device)}
        .actionHandler=${actionHandler({hasHold: hasHold, hasDoubleClick: hasDoubleClick})}
        title="${labelResult?.text}"
        id="${device ? `legend-${device.entity.replace('.', '-')}` : 'legend-untracked'}"
      >
        ${this._createLegendIndicator(device)}
        <div class="label" style="${styleMap(style)}">${labelResult?.template}</div>
      </li>`;
  }
  _createLegend(): TemplateResult {
    if (!this._config.entities || this._config.entities.length === 0 || this._config.legend_hide) {return html``;}

    const textSize = this._config.legend_text_size ?? this._config.text_size ?? 1;
    const textColor = this._config.legend_text_color;
    const textStyle = getTextStyleMap(this._config.legend_text_style, textSize, textColor);

    return html`
    <div class="chart-legend legend-alignment-${this._config.legend_alignment ?? 'center'}">
      <ul>
        ${this._config.entities.map((device: ELGEntity) => {
          if (!this._entitiesObject[device.entity]) {return html``;}
          if (this._entitiesObject[device.entity].width <= 0 && !this._config.legend_all) {return html``;}
          
          const deviceTextStyle = {
            'color': device.legend_text_color ?? textColor,
            ...textStyle,
          }
          
          return this._createLegendItem(device, deviceTextStyle);
        })}
        ${this._createLegendItem(undefined, textStyle)}
      </ul>
    </div>`;
  }

  _createDelta(): TemplateResult {
    return html`
      <div class="gauge-delta">
        <div class="gauge-delta-item">State: <span>${this._formatValueMain(this._mainObject?.state)}</span></div>
        <div class="gauge-delta-item">Sum: <span>${this._formatValueMain(this._entitiesTotalObject?.state)}</span></div>
        <div class="gauge-delta-item delta">Delta: <span>${this._formatValueMain(this._untrackedObject?.state)}</span></div>
      </div>`;
  }
  _createIcon(device: ELGEntity | undefined, textSize?: number, color?: CSSColor): TemplateResult {
    const icon = device ? this._entityIcon(device) : this._config.untracked_legend_icon;
    if (!icon) {return html``;}

    return html`<ha-icon 
      style="
        ${color ? `color: ${color};` : ''}
        ${textSize ? `--mdc-icon-size: ${textSize*1.25}rem;` : ''}
      "
      icon="${icon}"
    ></ha-icon>`;
  }

  _createDeviceLine(device: ELGEntity | undefined, position: LinePositionType, overflowStyle: ELGStyle): TemplateResult {
    const holdAction = hasAction(device ? device.hold_action : this._config.hold_action);
    const doubleClickAction = hasAction(device ? device.double_tap_action : this._config.double_tap_action);

    const lineColor = device ? device.color : this._config.color;
    const lineTextColor = device ?
        getLineTextColor(device.line_text_color ? device.line_text_color : this._config.line_text_color, lineColor) :
        getLineTextColor(this._config.line_text_color, lineColor);

    const lineStyle = {
      background: device ? device.color : undefined, // untracked is transparent
      width: `${device ? this._entitiesObject[device.entity]?.width : this._untrackedObject?.width}%`,
    };
    const labelStyle = {
      ...overflowStyle,
      ...getTextStyleMap(this._config.line_text_style, this._config.line_text_size, lineTextColor)
    }

    const label = device ? this._entityLabel(device, true) : this._untrackedLabel(true);

    // noinspection HtmlUnknownAttribute
    return html`
      <div
        class="${device ? "device-line" : "untracked-line"}"
        id="${device ? `line-${device.entity.replace(".", "-")}` : ''}"
        style="${styleMap(lineStyle)}"
        title="${label?.text}"
        
        @action=${(ev: ActionHandlerEvent) => this._handleAction(ev, device)}
        .actionHandler=${actionHandler({hasHold: holdAction,hasDoubleClick: doubleClickAction})}
        >
        ${position !== 'none' ? html`
          <div class="device-line-label line-text-position-${position}" style="${styleMap(labelStyle)}">
            ${label?.template}
          </div>
        ` : html``}
      </div>`

  }
  _createLines(): TemplateResult {
    if (!this._config.entities) return html``;

    const position = this._config.line_text_position ?? "left";

    const overflowType = this._config.line_text_overflow ?? "tooltip";
    const overflowDir = this._config.overflow_direction ?? "right";
    const overflowStyle = getOverflowStyle(overflowType, overflowDir);

    const separatorTemplate = !(!this._config.line_separator || this._lineSeparatorWidth === 0)
      ? html`
        <div class="device-line-separator" 
          style="
            background: ${this._config.line_separator_color}; 
            width: ${this._lineSeparatorWidth}%;
        "></div>`
      : html``;

    // noinspection JSMismatchedCollectionQueryUpdate
    const lineParts: TemplateResult[] = [];
    const visibleEntities = this._config.entities.filter(device => this._entitiesObject[device.entity] && this._entitiesObject[device.entity].width > 0) ?? [];

    visibleEntities.forEach((device: ELGEntity, index: number) => {
      if (index > 0) {lineParts.push(separatorTemplate)}
      lineParts.push(this._createDeviceLine(device, position, overflowStyle));
    });

    if (this._untrackedObject.width > 0 && visibleEntities.length > 0) {lineParts.push(separatorTemplate)}
    lineParts.push(this._createDeviceLine(undefined, position, overflowStyle));

    return html`
      <div class="device-line-container">
        ${lineParts}
      </div>
    `;
  }

  _createInnerHtml(): TemplateResult {
    const titlePosition = this._config.title_position ?? "top-left";
    const legendPosition = this._config.legend_position ?? "bottom-center";
    const deltaPosition = this._config.delta_position ?? "bottom-center";
    let valuePosition = this._config.position ?? "left";

    const titleTextSize = this._config.title_text_size ?? 2;
    const textSize = this._config.text_size ?? 2.5;

    const displayTitle: boolean = !!((this._config.title || this._config.subtitle) && titlePosition !== 'none');
    const displayLegend: boolean = (this._config.entities && this._config.entities.length > 0 && legendPosition !== 'none');
    const displayDelta: boolean = !!(this._config.show_delta && deltaPosition !== 'none');
    let displayValue: boolean = !!(this._config.entity && valuePosition !== 'none');

    const titleColor = this._config.title_text_color;
    const subtitleColor = this._config.subtitle_text_color;
    const valueColor = this._config.text_color;

    const cornerStyle = this._config.corner ?? "square";
    const titleStyle = getTextStyleMap(this._config.title_text_style, titleTextSize, titleColor);
    const subtitleStyle = getTextStyleMap(this._config.subtitle_text_style, titleTextSize / 2, subtitleColor);
    const valueStyle = {'height': `${textSize}rem`, ...getTextStyleMap(this._config.text_style, textSize, valueColor)};

    const titleText = this._getTemplateValue('title', this._config.title);
    const subtitleText = this._getTemplateValue('subtitle', this._config.subtitle);

    if (["in-title-right", "in-title-left"].includes(valuePosition)) {
      if (!displayTitle) {valuePosition = "left";} else {displayValue = false;}
    }

    const valueTemplate = html`
      <div class="gauge-value" style="${styleMap(valueStyle)}">
        ${this._mainObject?.state.toFixed(this._config.precision)}
        ${this._config.unit ? html`<span class="unit" style="font-size: ${textSize / 2}rem;">${this._getTemplateValue('unit', this._config.unit)}</span>` : ''}
      </div>
    `;
    const titleTemplate = html`
      <div class="title-value-position-${valuePosition == 'in-title-left' ? 'left' : valuePosition == 'in-title-right' ? 'right' : 'none'}">
        ${["in-title-right", "in-title-left"].includes(valuePosition) ? valueTemplate : ''}
        <div>
          ${this._config.title ? html`<div class="gauge-title" style="${styleMap(titleStyle)};">${titleText}</div>` : ''}
          ${this._config.subtitle ? html`<div class="gauge-subtitle" style="${styleMap(subtitleStyle)}">${subtitleText}</div>` : ''}
        </div>
      </div>  
    `;

    return html`
      <div class="gauge-position-frame position-${titlePosition}">
        ${displayTitle ? titleTemplate : ''}
        <div class="gauge-position-frame position-${legendPosition}">
          ${displayLegend ? this._createLegend() : ''}
          <div class="gauge-position-frame position-${deltaPosition}">
            ${displayDelta ? this._createDelta() : ''}
            <div class="gauge-position-frame position-${valuePosition}">
              ${displayValue ? valueTemplate : ''}
              <div class="gauge-line line-corner-${cornerStyle}">
                <div class="main-line" style="width: ${this._mainObject?.width}%;"></div>
                ${this._createLines()}
              </div>
            </div>
          </div>
        </div>
      </div>
      ${this._renderWarnings()}
    `;
  }

  // Warnings ----------------------------------------------------------------------------------------------------------

  private _invalidConfig() {
    if (!this.hass) {throw new Error("Invalid configuration (no hass)");}
    throw new Error(this.hass.localize("ui.panel.lovelace.editor.condition-editor.invalid_config_title"));
  }
  private _entityNotFound(entity: string): string {
    return this.hass.localize("ui.panel.lovelace.warning.entity_not_found", {
      entity: entity || "[empty]"
    });
  }
  private _entityUnavailable(stateObj: HassEntity): string {
    return this.hass.localize("ui.panel.lovelace.warning.entity_unavailable", {
      entity: `${stateObj.attributes?.friendly_name} (${stateObj.entity_id})`
    });
  }
  private _entityNotNumeric(stateObj: HassEntity): string {
    return this.hass.localize("ui.panel.lovelace.warning.entity_non_numeric", {
      entity: `${stateObj.attributes?.friendly_name} (${stateObj.entity_id})`
    });
  }
  private _entityNoStatistics(entityId: string): string {
    return this.hass.localize("ui.components.statistics_charts.no_statistics_found") + `(${entityId}), change function / see docs`;
  }
  private _attributeNotFound(entity: string, attribute: string): string {
    return this.hass.localize("ui.panel.lovelace.warning.attribute_not_found", {
      attribute: attribute || "[empty]",
      entity: entity || "[empty]"
    });
  }
  private _attributeNotNumeric(entity: string, attribute: string): string {
    return this.hass.localize("ui.panel.lovelace.warning.attribute_not_numeric", {
      attribute: attribute || "[empty]",
      entity: entity || "[empty]"
    });
  }

  // ----------------------------------------------------- Entity ------------------------------------------------------

  private _entityName(device: ELGEntity): string {
    if (!device.name) {
      return this._entitiesObject[device.entity].stateObject.attributes.friendly_name || device.entity.split('.')[1];
    }

    if (isTemplate(device.name)) {
      const key = `entity_${this._config.entities.indexOf(device)}_name`;
      if (this._templateResults[key]) return this._templateResults[key];
    }

    return device.name;
  }
  private _entityIcon(device: ELGEntity): string {
    if (device.icon) {return device.icon;}
    return this._entitiesObject[device.entity].stateObject.attributes.icon || '';
  }
  private _entityUnit(device: ELGEntity): string {
    if (device.unit) {
      const index = this._config.entities.indexOf(device);
      if (index !== -1) {
        const key = `entity_${index}_unit`;
        if (this._templateResults[key]) return this._templateResults[key];
        if (device.unit && !isTemplate(device.unit)) return device.unit;
      }
    }
    return this._entitiesObject[device.entity].stateObject.attributes.unit_of_measurement || '';
  }

  // Label -------------------------------------------------------------------------------------------------------------

  private _handleTooltipSegmentLogic(labelElement: HTMLElement): void {
    const parts: HTMLElement[] = [];
    const separators: HTMLElement[] = [];

    for (const node of Array.from(labelElement.childNodes)) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const el = node as HTMLElement;
      if (el.classList.contains('label-part')) {
        parts.push(el);
      } else if (el.classList.contains('label-separator')) {
        separators.push(el);
      }
    }

    parts.forEach(p => p.style.display = 'inline');
    separators.forEach(s => s.style.display = 'inline');

    const containerWidth = labelElement.clientWidth;
    const tolerance = 1;

    if (labelElement.scrollWidth <= containerWidth + tolerance) {
      return;
    }

    const removalIndices = Array.from({ length: parts.length }, (_, i) => i);
    if (this._config.overflow_direction === 'right') {
      removalIndices.reverse();
    }

    for (const i of removalIndices) {
      parts[i].style.display = 'none';

      const isRight = this._config.overflow_direction === 'right';
      const separatorIndex = isRight ? i - 1 : i;

      if (separators[separatorIndex]) {
        separators[separatorIndex].style.display = 'none';
      }

      if (labelElement.scrollWidth <= containerWidth + tolerance) {
        return;
      }
    }
  }
  private _checkLabelOverflow(labelElement: HTMLElement): void {
    if (!['visible', ''].includes(labelElement.style.visibility)) {
      labelElement.style.visibility = 'visible';
    }

    if (this._config.line_text_overflow === 'tooltip-segment') {
      this._handleTooltipSegmentLogic(labelElement);
    } else if (this._config.line_text_overflow === 'tooltip') {
      const tolerance = 3;
      const isOverflowing = labelElement.clientWidth > 0 && labelElement.scrollWidth > labelElement.clientWidth + tolerance;

      if (isOverflowing) {
        labelElement.style.visibility = 'hidden';
      }
    }
  }
  private _checkAllLabelsOverflow(): void {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll<HTMLElement>('.device-line-label').forEach(label => {
      this._checkLabelOverflow(label);
    });
  }
  private _resetAllLabelsToVisible(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.querySelectorAll<HTMLElement>('.device-line-label').forEach(labelElement => {
      if (labelElement.style.visibility !== 'visible') {
        labelElement.style.visibility = 'visible';
      }

      labelElement.querySelectorAll<HTMLElement>('.label-part, .label-separator').forEach(part => {
        if (part.style.display !== 'inline') {
          part.style.display = 'inline';
        }
      });

      const parentContainer = labelElement.closest('.device-line, .untracked-line') as HTMLElement | null;
      if (parentContainer) {
        parentContainer.removeAttribute('title');
      } else {
        labelElement.removeAttribute('title');
      }

    });
  }

  // Label Parts -------------------------------------------------------------------------------------------------------

  private _renderLabelInternal(stateContent: string[] | undefined, line: boolean, partRenderer: PartRenderer, rendererContext: RendererContext | DeviceRendererContext): LabelRenderResult | undefined {
    if (!stateContent?.length) {
      return line ? undefined : { template: rendererContext.defaultLabel, text: rendererContext.defaultLabel };
    }

    const shouldReverse = (
      this._config.overflow_direction === 'left' &&
      ['clip', 'fade', 'ellipsis'].includes(this._config.line_text_overflow ?? '')
    );
    const sortedContent = shouldReverse ? [...stateContent].reverse() : stateContent;

    const templateParts: TemplateResult[] = [];
    const textParts: string[] = [];

    for (let i = 0; i < sortedContent.length; i++) {
      const { template, text } = partRenderer.call(this, sortedContent[i], rendererContext, line);

      if (template !== undefined) {
        if (templateParts.length > 0) { // If not the first template part, add separator before it
          templateParts.push(html`<span class="label-separator">${this._config.state_content_separator ?? ''}</span>`);
        }
        templateParts.push(html`<span class="label-part">${template}</span>`);
      }

      if (text !== undefined && text.trim() !== '') {
        textParts.push(text);
      }
    }

    if (templateParts.length === 0 && textParts.length === 0) {
      return line ? undefined : { template: rendererContext.defaultLabel, text: rendererContext.defaultLabel };
    }

    return {
      template: html`${templateParts}`, // Lit handles rendering an array of TemplateResults
      text: textParts.join(this._config.state_content_separator ?? ''), // Join collected text parts with the separator
    };
  }

  // Entity Label ------------------------------------------------------------------------------------------------------

  private _entityPartRenderer(value: string, context: DeviceRendererContext, line: boolean): LabelRenderResult {
    let template: TemplateResult | string | undefined;
    let text: string;

    const device = context.device;
    const stateObj = this._entitiesObject[device.entity].stateObject;
    const textSize = line ? this._config.line_text_size ?? 1 : this._config.legend_text_size ?? this._config.text_size ?? 1;

    const renderRelativeTime = (datetime: string) => {
      const date = new Date(datetime);
      return {
        template: html`<ha-relative-time .hass=${this.hass} .datetime=${datetime}></ha-relative-time>`,
        text: `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`,
      };
    };

    switch (value) {
      case 'name':
        text = context.defaultLabel;
        template = html`${text}`;
        break;
      case 'state':
        text = this._formatValueDevice(device);
        template = html`${text}`;
        break;
      case 'last_changed':
        ({ template, text } = renderRelativeTime(stateObj.last_changed));
        break;
      case 'last_updated':
        ({ template, text } = renderRelativeTime(stateObj.last_updated));
        break;
      case 'percentage':
        text =`${(this._entitiesObject[device.entity].percentage * 100).toFixed(0)}%`;
        template = html`${text}`;
        break;
      case 'icon':
        template = this._createIcon(device, textSize);
        text = '';
        break;
      default:
        text = '';
        template = html``;
        break;
    }
    return { template, text };
  }
  private _entityLabel(device: ELGEntity, line = false): LabelRenderResult | undefined {
    const stateContent = line ? device.line_state_content : device.state_content;
    const defaultLabel = this._entityName(device);

    return this._renderLabelInternal(
      stateContent,
      line,
      this._entityPartRenderer,
      { device, defaultLabel }
    );
  }

  // Untracked Label ---------------------------------------------------------------------------------------------------

  private _untrackedPartRenderer(value: string, context: RendererContext, line: boolean): LabelRenderResult {
    let template: TemplateResult | string;
    let text: string;

    const textSize = line ? this._config.line_text_size ?? 1 : this._config.legend_text_size ?? this._config.text_size ?? 1;

    switch (value) {
      case 'name':
        text = context.defaultLabel;
        template = html`${text}`;
        break;
      case 'state':
        text = this._formatValueMain(this._untrackedObject?.state);
        template = html`${text}`;
        break;
      case 'percentage':
        text = `${(this._untrackedObject.percentage * 100).toFixed(0)}%`;
        template = html`${text}`;
        break;
      case 'icon':
        template = this._createIcon(undefined, textSize);
        text = '';
        break;
      default:
        text = '';
        template = html``;
        break;
    }
    return { template, text };
  }
  private _untrackedLabel(line = false): LabelRenderResult | undefined {
    const stateContent = line ? this._config.untracked_line_state_content : this._config.untracked_state_content;
    const templateResult = this._getTemplateValue('untracked_legend_label', this._config.untracked_legend_label);

    const defaultLabel = templateResult != "" ?
      templateResult : this.hass.localize('ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption');

    return this._renderLabelInternal(
      stateContent,
      line,
      this._untrackedPartRenderer,
      { defaultLabel }
    );
  }

  // Formatting --------------------------------------------------------------------------------------------------------

  private _formatValue(value: number, precision?: number, unit?: string): string {
    if (!value && value !== 0) return '';
    return `${value.toFixed(precision ?? 0)}${unit ? ` ${unit}` : ''}`;

  }
  private _formatValueMain(value: number): string {
    return this._formatValue(value, this._config.precision, this._getTemplateValue('unit', this._config.unit));
  }
  private _formatValueDevice(device: ELGEntity): string {
    const entityValue = this._entitiesObject[device.entity].state;
    const entityPrecision = device.precision ?? this._config.precision;
    const entityUnit = this._entityUnit(device) ?? this._config.unit;

    return this._formatValue(entityValue, entityPrecision, entityUnit);
  }

  // Validation --------------------------------------------------------------------------------------------------------

  private _validate(entityId: string): boolean {
    const validationResult = this._validateEntityState(entityId);
    if (!validationResult) {return true;}

    this._addWarning(validationResult, entityId);
    return false;
  }
  private _validateEntityState(entityId: string ): string | undefined {
    if (!entityId) {return this._entityNotFound(entityId);}

    const stateObj: HassEntity | undefined = this.hass.states[entityId];
    if (!stateObj) {return this._entityNotFound(entityId);}

    if (stateObj.state === "unavailable" || stateObj.state === "unknown") {return this._entityUnavailable(stateObj);}
    if (isNaN(Number(stateObj.state))) {return this._entityNotNumeric(stateObj);}

    return undefined; // Return undefined if all checks pass
  }
  private _renderWarnings(): TemplateResult | undefined {
    if (this._config.suppress_warnings) {return html``;}
    if (this._warnings.length === 0) {return html``;}

    const warning_templates: TemplateResult[] = [];

    for (const warning of this._warnings) {
      if (warning.entity_id) {
        const config: ELGEntity = {
          entity: warning.entity_id,
          tap_action: {action: 'more-info'},
          hold_action: {action: 'more-info'},
          double_tap_action: {action: 'more-info'},
        }

        warning_templates.push(html`
          <hui-warning @action=${(ev: ActionHandlerEvent) => this._handleAction(ev, config)}>
            ${warning.message}
          </hui-warning>`);

        continue;
      }

      warning_templates.push(html`<hui-warning>${warning.message}</hui-warning>`);
    }

    return html`<div class="warnings">${warning_templates.map(w => w)}</div>`;
  }
  private _addWarning(message: string, entity_id: string): void {
    const warning: EntityWarning = {message, entity_id};
    if (this._warnings.includes(warning)) {return;}
    this._warnings.push(warning);
  }

  // Calculations ------------------------------------------------------------------------------------------------------

  private _calculateTotalSeparatorWidth(configString: string, numberOfSeparators: number): number {
    const firstDigitIndex = configString.search(/\d/);
    if (firstDigitIndex === -1) {
      console.error(`ELG: Invalid config: ${configString}.`);
      return 0;
    }

    const mode = configString.substring(0, firstDigitIndex);
    const value = parseInt(configString.substring(firstDigitIndex), 10) / 10;

    if (isNaN(value)) {
      console.error(`ELG: Invalid value parsed from: ${configString}`);
      return 0;
    }

    switch (mode) {
      case 'total':
        return value;
      case 'each':
        return numberOfSeparators * value;
      default:
        return 5;
    }
  }
  private _calculateSeparatorWidth(renderedLines: number): void {
    if (!this._config.line_separator) {return;}
    if (renderedLines <= 0) {return;}

    const numberOfSeparators = this._untrackedObject.width > 0 ? renderedLines : Math.max(0, renderedLines - 1);
    const totalSeparatorWidth: number = this._calculateTotalSeparatorWidth(this._config.line_separator_width ?? 'total050', numberOfSeparators,);
    const multiplier = 1 - (totalSeparatorWidth * 0.01);

    this._lineSeparatorWidth = totalSeparatorWidth / numberOfSeparators;

    for (const deviceKey in this._entitiesObject) {
      if (this._entitiesObject[deviceKey].width == 0) continue;
      this._entitiesObject[deviceKey].width *= multiplier;
    }

    this._untrackedObject.width *= multiplier;
  }
  private _calculate(): void {
    this._entitiesObject = {};
    this._warnings = [];

    if (this._config.offset) {this._getOffsetHistory();}
    if (this._config.statistics) {this._getStatisticsHistory();}

    const mainState: number = this._calcStateMain();
    const maxValue: number = this._getMax(mainState);
    const minValue: number = this._getMin();

    const min = Math.min(minValue, maxValue);
    const max = Math.max(mainState, Math.max(minValue, maxValue));
    const range: number = (max - min) || 1;

    const clampedMain: number = Math.min(Math.max(mainState, min), max);
    const mainWidth: number = ((clampedMain - min) / range) * 100;
    const mainPercentage: number = clampedMain / max;

    this._mainObject = {
      state: mainState,
      width: mainWidth,
      percentage: mainPercentage,
      stateObject: this.hass.states[this._config.entity],
    };

    let stateSum: number = 0;
    let percentageSum: number = 0;
    let widthSum: number = 0;
    let renderedLines: number = 0;

    for (const device of this._config.entities ?? []) {
      if (!this._validate(device.entity)) continue;

      const stateObj: HassEntity = this.hass.states[device.entity];
      const state: number = this._calcState(stateObj, device.multiplier);
      const cutoff: number = device.cutoff ?? this._config.cutoff ?? 0;

      const percentage: number = state / mainState ?? 0;
      const clampedDevice = Math.min(Math.max(state, min), max);
      const width: number = state <= cutoff ? 0 : ((clampedDevice - min) / range) * 100 ?? 0;

      stateSum += state;
      percentageSum += percentage;
      widthSum += width;

      if (width > 0) {
        renderedLines += 1;
      }

      this._entitiesObject[device.entity] = {
        state: state,
        width: width,
        percentage: percentage,
        stateObject: stateObj,
      };
    }

    this._entitiesTotalObject = {
      state: stateSum,
      width: widthSum,
      percentage: percentageSum,
    };

    this._untrackedObject = {
      state: mainState - stateSum,
      width: mainWidth - widthSum,
      percentage: (mainState - stateSum) / mainState,
    };

    this._calculateSeparatorWidth(renderedLines);
  }

  // State Calculations ------------------------------------------------------------------------------------------------

  private _calcStateMain(): number {
    if (this._config.offset) {return this._getOffsetState(this._config.entity);}
    if (this._config.statistics) {
      const state = this._getStatisticsState(this._config.entity);
      if (state === null || state === undefined) {
        this._addWarning(this._entityNoStatistics(this._config.entity), this._config.entity);
        return 0;
      }
      return state;
    }

    if (this._config.attribute) {
      const attributes = this.hass.states[this._config.entity].attributes;
      if (!attributes || !(this._config.attribute in attributes)) {
        this._addWarning(this._attributeNotFound(this._config.entity, this._config.attribute), this._config.entity);
        return 0;
      }

      const attrValue = attributes[this._config.attribute];
      if (attrValue === undefined || isNaN(Number(attrValue))) {
        this._addWarning(this._attributeNotNumeric(this._config.entity, this._config.attribute), this._config.entity);
        return 0;
      }

      return parseFloat(attrValue);
    }

    return parseFloat(this.hass.states[this._config.entity].state);
  }
  private _calcState(stateObj: HassEntity, multiplier?: number): number {
    const value: number = ((): number => {
      if (this._config.offset) {return this._getOffsetState(stateObj.entity_id);}
      if (this._config.statistics) {
        const state = this._getStatisticsState(stateObj.entity_id);
        if (state === null || state === undefined) {
          this._addWarning(this._entityNoStatistics(stateObj.entity_id), stateObj.entity_id);
          return 0;
        }
        return state;
      }

      const attribute = this._getAttributeConfig(stateObj.entity_id);
      if (attribute) {
        const attributes = stateObj.attributes;
        if (!attributes || !(attribute in attributes)) {
          this._addWarning(this._attributeNotFound(stateObj.entity_id, attribute), stateObj.entity_id);
          return 0;
        }

        const attrValue = attributes[attribute];
        if (attrValue === undefined || isNaN(Number(attrValue))) {
          this._addWarning(this._attributeNotNumeric(stateObj.entity_id, attribute), stateObj.entity_id);
          return 0;
        }

        return parseFloat(attrValue);
      }

      return parseFloat(stateObj?.state);
    })()

    if (isNaN(value)) {
      this._addWarning(this._entityNotNumeric(stateObj), stateObj.entity_id);
      return 0;
    }

    return value * (multiplier ?? 1);
  }

  // History Offset ----------------------------------------------------------------------------------------------------

  private _getOffsetEntryValue(entry: ELGHistoryOffsetEntry, entityID: string): number {
    const attribute = this._getAttributeConfig(entityID);

    const value = parseFloat(attribute ? entry.attributes?.[attribute] : entry.state);
    return isNaN(value) ? 0 : value;
  }
  private _getOffsetState(entityID: string): number {
    if (!this._offsetTime) {return 0;}
    if (!this._entitiesHistoryOffset) {return 0;}
    if (!this._entitiesHistoryOffset.history) {return 0;}

    const history: ELGHistoryOffsetEntry[] = this._entitiesHistoryOffset.history[entityID];
    if (!history || history.length === 0) {return 0;}

    for (let i = history.length - 1; i >= 0; i--) {
      const entry: ELGHistoryOffsetEntry = history[i];
      const lastChangedTime: number = new Date(entry.last_changed).getTime();

      if (lastChangedTime <= this._offsetTime) {
        return this._getOffsetEntryValue(entry, entityID);
      }
    }

    // If no entry is found before the offsetTime, return the earliest state
    const earliestEntry: ELGHistoryOffsetEntry = history[0];
    if (earliestEntry) {return this._getOffsetEntryValue(earliestEntry, entityID);}

    return 0;
  }
  private _getOffsetHistory(): void {
    if (!this._config.offset) {return;}
    const offset = Number(this._config.offset);

    this._offsetTime = Date.now() - offset;

    if (this._entitiesHistoryOffset?.updating) {return;}
    if (this._entitiesHistoryOffset?.end_time && this._entitiesHistoryOffset.end_time - 100 > this._offsetTime) {return;}

    const historyWindow: number = offset >= this._historyWindow ? this._historyWindow : offset;
    const startTime = new Date(this._offsetTime);
    const endTime = new Date(this._offsetTime + historyWindow);

    if (!this._entitiesHistoryOffset) {
      this._entitiesHistoryOffset = {
        start_time: startTime.valueOf(),
        end_time: endTime.valueOf(),
        history: {},
        updating: true,
      };
    }
    this._entitiesHistoryOffset.updating = true;

    this._fetchHistory(this._allConfigEntities(), startTime, endTime).then((history: HassHistory[]) => {
      if (!history || history.length === 0) {
        this._entitiesHistoryOffset = {
          start_time: startTime.valueOf(),
          end_time: endTime.valueOf(),
          history: {},
          updating: false,
        };
        return;
      }

      this._entitiesHistoryOffset = {
        start_time: startTime.valueOf(),
        end_time: endTime.valueOf(),
        history: this._transformOffsetHistory(history),
        updating: false,
      };
    }).catch((err) => {
      console.error("ELG: Failed to fetch history", err);
      if (this._entitiesHistoryOffset) {
        this._entitiesHistoryOffset.updating = false;
      }
    });
  }
  private _transformOffsetHistory(history: HassHistory[]): ELGHistoryOffsetEntities {
    return history.reduce((acc, innerArray: HassHistory) => {
      const entityId: string = innerArray[0].entity_id;
      if (!acc[entityId]) {acc[entityId] = [];}

      innerArray.forEach(item => {
        acc[entityId].push({
          state: item.state,
          last_changed: item.last_changed,
          attributes: item.attributes,
        });
      });
      return acc;
    }, {});
  }

  // Statistics --------------------------------------------------------------------------------------------------------

  private _getStatisticsState(entityID: string): number | null | undefined {
    if (!this._config.statistics) {
      console.error("ELG: _getStatisticsState when !statistics");
      return;
    }
    if (!this._entitiesHistoryStatistics) {
      console.error("ELG: _no _entitiesHistoryStatistics");
      return 0;
    }
    if (!this._entitiesHistoryStatistics.buckets) {
      console.error("ELG: _no buckets");
      return 0;
    }
    if (!this._entitiesHistoryStatistics.buckets[entityID]) {
      console.error(`ELG: no _entitiesHistoryStatistics.buckets[${entityID}]`);
      return 0;
    }

    const buckets: ELGHistoryStatisticsBucket[] = this._entitiesHistoryStatistics.buckets[entityID];
    const currentTimestamp = Date.now() - Number(this._config.statistics_day_offset) * 24 * 60 * 60 * 1000;

    const currentBucket: ELGHistoryStatisticsBucket | undefined = buckets.find((bucket: ELGHistoryStatisticsBucket) => {
      return (
        currentTimestamp >= bucket.start &&
        currentTimestamp <= bucket.end
      );
    });

    if (!currentBucket) {
      console.error("ELG: no bucket found for current timestamp: ", currentTimestamp);
      return;
    }

    switch (this._config.statistics_function) {
      case "mean": return currentBucket.mean;
      case "max": return currentBucket.max;
      case "min": return currentBucket.min;
      case "sum": return currentBucket.sum;
      case "state": return currentBucket.state;
      case "change": return currentBucket.change;
      default: return currentBucket.mean;
    }
  }
  private _getStatisticsHistory(): void {
    if (!this._config.statistics) {return;}
    if (this._entitiesHistoryStatistics?.updating) {return;}

    const today = new Date();
    const offsetDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - Number(this._config.statistics_day_offset)
    );

    if (this._entitiesHistoryStatistics?.date && this._entitiesHistoryStatistics?.date.getTime() === offsetDate.getTime()) {return;}

    const startTime = new Date(offsetDate);
    startTime.setHours(0, 0, 0, 0);

    const endTime = new Date(offsetDate);
    endTime.setHours(23, 59, 59, 999);

    if (!this._entitiesHistoryStatistics) {
      this._entitiesHistoryStatistics = {
        updating: true,
        date: offsetDate,
        buckets: {},
      };
    }
    this._entitiesHistoryStatistics.updating = true;

    this._fetchStatistics(this._allConfigEntities(), startTime, endTime, this._config.statistics_period).then((statistics: HassStatistics) => {
      if (!statistics) {
        this._entitiesHistoryStatistics = {
          updating: false,
          date: offsetDate,
          buckets: {},
        };
        return;
      }

      this._entitiesHistoryStatistics = {
        updating: false,
        date: offsetDate,
        buckets: statistics,
      };
    }).catch((err) => {
      console.error("ELG: Failed to fetch statistics", err);
      if (this._entitiesHistoryStatistics) {
        this._entitiesHistoryStatistics.updating = false;
      }
    });
  }

  // Fetching Data -----------------------------------------------------------------------------------------------------

  private async _fetchStatistics(entityIds: string[], start: Date | undefined, end: Date | undefined, period: string='hour'): Promise<HassStatistics> {
    const payload = {
      type: 'recorder/statistics_during_period',
      start_time: start?.toISOString(),
      end_time: end?.toISOString(),
      statistic_ids: entityIds,
      period: period,
    }
    return this.hass?.callWS(payload);
  }
  private async _fetchHistory(entityIDs: string[], start: Date | string, end: Date | string): Promise<HassHistory[]> {
    const startTime = typeof start === 'string' ? start : start.toISOString();
    const endTime = typeof end === 'string' ? end : end.toISOString();

    const attributeFilter = this._anyHasAttributesConfig(entityIDs) ? '' : '&no_attributes';

    let url = `history/period/${startTime}?` +
      `filter_entity_id=${entityIDs.join(',')}` +
      `&end_time=${endTime}` +
      `&significant_changes_only` +
      `&minimal_response` +
      attributeFilter;

    return this.hass?.callApi('GET', url);
  }

  // Templates ---------------------------------------------------------------------------------------------------------

  private async _tryConnect(): Promise<void> {
    if (!this.hass || !this._config) return;

    // Subscribe to templates in config
    const templateFields = ['title', 'subtitle', 'header', 'unit', 'untracked_legend_label']
    templateFields.forEach((key) => {
      if (this._config[key] && isTemplate(this._config[key])) {
        this._subscribeToTemplate(key, this._config[key]);
      }
    });

    this._config.entities?.forEach((entity, index) => {
      if (entity.name && isTemplate(entity.name)) { // Subscribe to entity name template
        this._subscribeToTemplate(`entity_${index}_name`, entity.name);
      }

      if (entity.unit && isTemplate(entity.unit)) { // Subscribe to entity unit template
        this._subscribeToTemplate(`entity_${index}_unit`, entity.unit);
      }
    });
  }
  private async _subscribeToTemplate(key: string, template: string): Promise<void> {
    if (this._unsubRenderTemplates.has(key)) {
      return;
    }

    try {
      const sub = subscribeRenderTemplate(
        this.hass.connection,
        (result: RenderTemplateResult) => {
          this._templateResults = {
            ...this._templateResults,
            [key]: result.result,
          };
        },
        {
          template: template,
          variables: {
            config: this._config,
            user: this.hass.user!.name,
            entity: this._config.entity,
          },
          strict: true,
        }
      );
      this._unsubRenderTemplates.set(key, sub);
      await sub;
    } catch (e) {
      console.error("ELG: Error subscribing to template", e);
      this._templateResults = {
        ...this._templateResults,
        [key]: template, // Fallback to raw string
      };
      this._unsubRenderTemplates.delete(key);
    }
  }
  private async _tryDisconnect(): Promise<void> {
    for (const key of this._unsubRenderTemplates.keys()) {
      await this._tryDisconnectKey(key);
    }
  }
  private async _tryDisconnectKey(key: string): Promise<void> {
    const unsubPromise = this._unsubRenderTemplates.get(key);
    if (!unsubPromise) return;

    try {
      const unsub = await unsubPromise;
      unsub();
    } catch (err: any) {
      if (err.code !== "not_found" && err.code !== "template_error") {
        console.error(`ELG: Unexpected error unsubscribing template [${key}]:`, err);
      }
    } finally {
      this._unsubRenderTemplates.delete(key);
    }
  }
  private _getTemplateValue(key: string, fallback: string | undefined): string {
    if (this._templateResults[key] !== undefined) {return this._templateResults[key];}
    if (fallback && !isTemplate(fallback)) {return fallback;}
    return fallback ?? "";
  }

  // Entities ----------------------------------------------------------------------------------------------------------

  private _memoizedEntities = memoizeOne((config: ELGConfig): string[] => {
    const entityIDs = [config.entity].concat(config.entities?.map((device: ELGEntity) => device.entity) ?? []);

    // add max, min if they are an entityId - technically not all-config entities, but all allowed entities
    const otherEntities = [
      config.min,
      config.max,
    ]

    for (const entity of otherEntities) {
      if (entity && entity !== config.entity && typeof entity === 'string' && !entityIDs.includes(entity)) {
        entityIDs.push(entity);
      }
    }

    return entityIDs;
  });
  private _allConfigEntities(): string[] {
    return this._memoizedEntities(this._config);
  }
  private _sortConfigEntitiesByState(): void {
    if (!this._config.entities) return;

    const value_ascending = (a: ELGEntity, b: ELGEntity): number => {
      return (this._entitiesObject[a.entity]?.state ?? 0) - (this._entitiesObject[b.entity]?.state ?? 0);
    }

    const alphabetic_ascending = (a: ELGEntity, b: ELGEntity): number => {
      const nameA = this._entityName(a).toUpperCase();
      const nameB = this._entityName(b).toUpperCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    }

    switch (this._config.sorting) {
      case 'value-asc':
        this._config.entities.sort(value_ascending);
        break;
      case 'value-desc':
        this._config.entities.sort((a, b) => value_ascending(b, a));
        break;
      case 'alpha-asc':
        this._config.entities.sort(alphabetic_ascending);
        break;
      case 'alpha-desc':
        this._config.entities.sort((a, b) => alphabetic_ascending(b, a));
        break;
      default:break;
    }
  }

  private _getAttributeConfig(entityID: string): any | undefined {
    if (entityID === this._config.entity) {return this._config.attribute;}

    const device = this._config.entities?.find(
      (device: ELGEntity) => device.entity === entityID
    );

    return device?.attribute;
  }
  private _anyHasAttributesConfig(entityIDs: string[]): boolean {
    return entityIDs.some(id => this._getAttributeConfig(id) !== undefined);
  }

  // MIN / MAX ---------------------------------------------------------------------------------------------------------

  private _getMax(defaultValue: number = 100): number {
    if (!this._config.max) {return defaultValue;}

    if (typeof this._config.max === 'string') {
      return this._calcState(this.hass.states[this._config.max]);
    }

    return this._config.max;
  }
  private _getMin(defaultValue: number = 0): number {
    if (!this._config.min) {return defaultValue;}

    if (typeof this._config.min === 'string') {
      return this._calcState(this.hass.states[this._config.min]);
    }

    return this._config.min;
  }

  // Severity ----------------------------------------------------------------------------------------------------------

  private _mainSeverity(): CSSColor {
  if (!this._config.severity) return this._config.color;

  const severities = this._config.severity_levels;
  if (severities) {
    for (const [index, severity] of severities.entries()) {
      if (this._mainObject.state >= severity.from) {
        if (this._config.severity_blend && index !== 0) {
          const previous: SeverityType = severities[index-1];

          return getBlend(severity, previous, this._mainObject.state);
        }

        return severity.color!;
      }
    }
  }

  return this._config.color;
}

  // Action Handling ---------------------------------------------------------------------------------------------------

  private _handleAction(ev: ActionHandlerEvent, device?: ELGEntity): void {
    ev.stopPropagation();
    handleAction(this, this.hass!, device ?? this._config!, ev.detail.action!);
  }

  // Styles ------------------------------------------------------------------------------------------------------------

  public static get styles(): CSSResultGroup {
    return styles;
  }
}
