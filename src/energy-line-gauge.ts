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

import {
  ELGConfig,
  ELGEntity,
  ELGEntityState,
  ELGState,

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
  DeviceRendererContext, RGBColor,
} from './types';
import { styles, getTextStyle } from './styles';
import { actionHandler } from './action-handler';
import { findEntities } from './find-entities';
import { CONFIG_DEFAULTS, setConfigDefaults } from './defaults';
import { toRGB, getTextColor } from './color';

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

  private _warnings: string[] = [];

  private _mainObject!: ELGEntityState;
  private _untrackedObject!: ELGState;

  private _entitiesObject: Record<string, ELGEntityState> = {};
  private _entitiesTotalObject!: ELGState;

  private _lineSeparatorWidth: number = 0;
  private _resizeObserver!: ResizeObserver;

  private _entitiesHistoryStatistics: ELGHistoryStatistics | undefined = undefined;
  private _entitiesHistoryOffset: ELGHistoryOffset | undefined = undefined;
  private _offsetTime: number | undefined = undefined;
  private _historyWindow: number = 60000;

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

    const rootStyle = getComputedStyle(document.documentElement);
    const defaultColor = toRGB(rootStyle.getPropertyValue('--primary-color').trim());
    const defaultBgColor = toRGB(rootStyle.getPropertyValue('--secondary-background-color').trim());

    return {
      type: "custom:energy-line-gauge",
      entity: foundEntities[0],
      title: "Energy Line Gauge",

      min: 0,
      max: 100,

      color: defaultColor,
      color_bg: defaultBgColor,

      untracked_legend: true,
      untracked_state_content: ["name"],

      entities: [
        { entity: foundEntities[1], state_content: ["name"] },
        { entity: foundEntities[2], state_content: ["name"] },
        { entity: foundEntities[3], state_content: ["name"] },
      ],
    };
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

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }

  protected updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (this.hass && this._card) {this._card.hass = this.hass;}

    if (['tooltip', 'tooltip-segment'].includes(this._config.line_text_overflow ?? 'tooltip'))  {
      requestAnimationFrame(() => this._checkAllLabelsOverflow());
      return;
    }

    requestAnimationFrame(() => this._resetAllLabelsToVisible());
  }

  private _checkAllLabelsOverflow(): void {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll<HTMLElement>('.device-line-label').forEach(label => {
      this._checkLabelOverflow(label);
    });
  }

  public static get styles(): CSSResultGroup {
    return styles;
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html`<ha-card header="Energy Line Gauge"><div class="card-content">Waiting for configuration and Home Assistant.</div></ha-card>`;
    }

    this._entitiesObject = {};
    this._warnings = [];

    if (!this._validate(this._config.entity)) {return this._renderWarnings();}

    if (this._config.offset) {this._getOffsetHistory();}
    if (this._config.statistics) {this._getStatisticsHistory();}

    const mainState: number = this._calcStateMain();

    let max: number = this._getMax(mainState);
    let min: number = this._getMin();

    if (mainState > max) {max = mainState;}
    const range: number = max - min;

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

      const percentage: number = (state / mainState) ?? 0;
      const clampedDevice = Math.min(Math.max(state, min), max);
      const width: number = state <= cutoff ? 0 : (((clampedDevice - min) / range) * 100 ) ?? 0;

      stateSum += state;
      percentageSum += percentage;
      widthSum += width;

      if (width > 0) {renderedLines += 1;}

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
    }

    this._untrackedObject = {
      state: mainState - stateSum,
      width: mainWidth - widthSum,
      percentage: (mainState - stateSum) / mainState,
    };

    if (this._config.line_separator && renderedLines > 0) {
      const calculateTotalSeparatorWidth = (configString: string, numberOfSeparators: number): number => {
        const firstDigitIndex = configString.search(/\d/);
        if (firstDigitIndex === -1) {console.error(`Invalid config: ${configString}.`); return 0}

        const mode = configString.substring(0, firstDigitIndex);
        const value = parseInt(configString.substring(firstDigitIndex), 10) / 10;

        if (isNaN(value)) {console.error(`Invalid value parsed from: ${configString}`); return 0}

        switch (mode) {
          case "total":
            return value;
          case "each":
            return numberOfSeparators * value;
          default:
            return 5;
        }
      };

      const numberOfSeparators = this._untrackedObject.width > 0 ? renderedLines : Math.max(0, renderedLines - 1);
      const totalSeparatorWidth: number = calculateTotalSeparatorWidth(this._config.line_separator_width??"total050", numberOfSeparators);

      this._lineSeparatorWidth = totalSeparatorWidth / numberOfSeparators;

      for (const deviceKey in this._entitiesObject) {
        if (this._entitiesObject[deviceKey].width == 0) continue;
        this._entitiesObject[deviceKey].width *= 1-(totalSeparatorWidth*0.01);
      }
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
        <div class="line-gauge-card" style="--color: rgba(${toRGB(this._config.color)}); --background-color: rgba(${toRGB(this._config.color_bg)})"">
          ${this._createInnerHtml()}
        </div>
      </ha-card>
    `;
  }

  _createDelta() {
    return html`
      <div class="gauge-delta">
        <div class="gauge-delta-item">State: <span>${this._formatValueMain(this._mainObject?.state)}</span></div>
        <div class="gauge-delta-item">Sum: <span>${this._formatValueMain(this._entitiesTotalObject?.state)}</span></div>
        <div class="gauge-delta-item delta">Delta: <span>${this._formatValueMain(this._untrackedObject?.state)}</span></div>
      </div>`;
  }
  _createUntrackedLegend(style: string, size: number, textColor?: RGBColor): TemplateResult {
    if (!this._config.untracked_legend) {return html``;}
    const untrackedLabelResult = this._untrackedLabel();
    const color = toRGB(this._config.color);
    const backgroundColor = color ? `rgba(${color.slice(0, 3).join(',')}, 0.5)` : 'transparent';

    return html`
      <li title="${this._config.untracked_legend_label || untrackedLabelResult?.text}" id="legend-untracked" style="display: inline-grid;">
        ${this._config.untracked_legend_icon ?
          html`<ha-icon style="color: rgba(${toRGB(this._config.color)})" icon="${this._config.untracked_legend_icon}"></ha-icon>` :
          html`<div class="bullet" style="background-color: ${backgroundColor};border-color: rgba(${color});"></div>`
        }
        <div class="label" style="font-size: ${size}rem; ${style}; color: rgba(${textColor})">
          ${untrackedLabelResult?.template}
        </div>
      </li>`
  }
  _createLegendIndicator(device: ELGEntity, color: RGBColor | undefined): TemplateResult {
    const legendType = device.legend_indicator ?? this._config.legend_indicator ?? "circle";
    const hasIcon = !!device.icon;

    if (legendType === 'none') return html``;

    if (legendType === 'icon') {
      if (!hasIcon) return html``;
      return html`<ha-icon style="color: rgba(${color})" icon="${device.icon}"></ha-icon>`;
    }

    if (legendType === 'icon-fallback' && hasIcon) {
      return html`<ha-icon style="color: rgba(${color})" icon="${device.icon}"></ha-icon>`;
    }

    const backgroundColor = color ? `rgba(${color.slice(0, 3).join(',')}, 0.5)` : 'transparent';

    return html`<div class="bullet" style="background-color: ${backgroundColor};border-color: rgba(${color});"></div>`;
  }
  _createLegend() {
    if (!this._config.entities || this._config.entities.length === 0 || this._config.legend_hide) {return html``;}

    const textSize = this._config.legend_text_size ?? this._config.text_size ?? 1;
    const textColor = getTextColor(this._config.legend_text_color, CONFIG_DEFAULTS.legend_text_color);
    const textStyle = getTextStyle(this._config.legend_text_style, textSize, textColor);

    return html`
    <div class="chart-legend">
      <ul style="justify-content: ${this._config.legend_alignment ?? "center"}">
        ${this._config.entities.map((device: ELGEntity) => {
          if (!this._entitiesObject[device.entity]) {return html``;}
          if (this._entitiesObject[device.entity].width <= 0 && !this._config.legend_all) {return html``;}
          
          const labelResult = this._entityLabel(device, false);
          
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
              ${this._createLegendIndicator(device, toRGB(device.color))}
              <div class="label" style="font-size: ${textSize}rem; ${textStyle}; color: rgba(${textColor})">
                ${labelResult?.template}
              </div>
            </li>`;
        })}
        ${this._createUntrackedLegend(textStyle, textSize, textColor)}
      </ul>
    </div>`;
  }
  _createDeviceLines() {
    if (!this._config.entities) return html``;

    const getOverflowStyle = (type: string, direction: string) => {
      const dirStyle = `direction: ${direction === 'right' ? 'ltr' : 'rtl'};`;
      switch (type) {
        case "ellipsis":
          return `overflow: hidden; text-overflow: ellipsis; ${dirStyle}`;
        case "clip":
          return `overflow: hidden; text-overflow: clip; ${dirStyle}`;
        case "fade":
          const fadeDir = direction === 'left' ? 'left' : 'right';
          return `mask-image: linear-gradient(to ${fadeDir}, black 85%, transparent 98%, transparent 100%);
                -webkit-mask-image: linear-gradient(to ${fadeDir}, black 85%, transparent 98%, transparent 100%);
                ${dirStyle}`;
        default:
          return `overflow: hidden;`;
      }
    };

    const renderLabel = (
      template: any,
      color: RGBColor | undefined,
      size: number,
      overflowStyle: string,
      textStyle: string,
      position: string
    ) => html`
    <div
      class="device-line-label line-text-position-${position}"
      style="color: rgba(${color}); font-size: ${size}rem; ${overflowStyle} ${textStyle}">
      ${template}
    </div>
  `;

    const position = this._config.line_text_position ?? "left";
    const overflowType = this._config.line_text_overflow ?? "tooltip";
    const overflowDir = this._config.overflow_direction ?? "right";

    // noinspection JSMismatchedCollectionQueryUpdate
    const lineParts: TemplateResult[] = [];

    // noinspection CssUnresolvedCustomProperty
    const separatorTemplate = !this._config.line_separator || this._lineSeparatorWidth === 0
      ? html``
      : html`<div class="device-line-separator" style="background-color: var(--background-color); width: ${this._lineSeparatorWidth}%;"></div>`;

    const visibleEntities = this._config.entities.filter(device =>
      this._entitiesObject[device.entity] && this._entitiesObject[device.entity].width > 0
    );

    visibleEntities.forEach((device: ELGEntity, index: number) => {
      if (index > 0) {lineParts.push(separatorTemplate)}

      const entityState = this._entitiesObject[device.entity];
      const width = entityState.width;
      const showLabel = position !== "none";
      const lineColor = toRGB(device.color);
      const lineTextColor = getTextColor(this._config.line_text_color, CONFIG_DEFAULTS.line_text_color, device.color);
      const textStyle = getTextStyle(this._config.line_text_style, this._config.line_text_size, lineColor);
      const label = this._entityLabel(device, true);
      const overflowStyle = getOverflowStyle(overflowType, overflowDir);

      // noinspection HtmlUnknownAttribute
      lineParts.push(html`
      <div
        id="line-${device.entity.replace(".", "-")}"
        class="device-line"
        style="background-color: rgba(${lineColor}); width: ${width}%"
        title="${label?.text}"
        @action=${(ev: ActionHandlerEvent) => this._handleAction(ev, device)}
        .actionHandler=${actionHandler({
          hasHold: hasAction(device.hold_action),
          hasDoubleClick: hasAction(device.double_tap_action),
      })}
      >
        ${showLabel && label ? renderLabel(
        label.template,
        lineTextColor,
        this._config.line_text_size ?? 1,
        overflowStyle,
        textStyle,
        position
      ) : html``}
      </div>
      `);
    });

    // Untracked Line
    const untrackedWidth = this._untrackedObject?.width ?? 0;
    const showUntracked = untrackedWidth > 0 && (this._config.untracked_line_state_content?.length ?? 0) > 0;
    const untrackedTextColor = getTextColor(this._config.line_text_color, CONFIG_DEFAULTS.line_text_color, this._config.color)
    const untrackedLabel = this._untrackedLabel(true);

    if (untrackedWidth > 0 && visibleEntities.length > 0) {lineParts.push(separatorTemplate)}

    if (showUntracked && untrackedLabel) {
      lineParts.push(html`
        <div
          class="untracked-line"
          style="width: ${untrackedWidth}%"
          title="${untrackedLabel.text}">
          ${renderLabel(
            untrackedLabel.template,
            untrackedTextColor,
            this._config.line_text_size ?? 1,
            overflowType === 'tooltip-segment' ? 'overflow: hidden;' : '',
            getTextStyle(this._config.line_text_style, this._config.line_text_size, untrackedTextColor),
            position
          )}
        </div>
      `);}

    return html`
      <div class="device-line-container">
        ${lineParts}
      </div>
    `;
  }
  _createInnerHtml() {
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

    const titleColor = getTextColor(this._config.title_text_color, CONFIG_DEFAULTS.title_text_color);
    const valueColor = getTextColor(this._config.text_color, CONFIG_DEFAULTS.text_color);

    const cornerStyle = this._config.corner ?? "square";
    const titleStyle = getTextStyle(this._config.title_text_style, titleTextSize, titleColor);
    const valueStyle = getTextStyle(this._config.text_style, textSize, valueColor);

    if (!displayTitle) {valuePosition = "left";}
    if (["in-title-right", "in-title-left"].includes(valuePosition)) {displayValue = false;}

    const valueTemplate = html`
      <div class="gauge-value" style="font-size: ${textSize}rem; height: ${textSize}rem; ${valueStyle}; color: rgba(${valueColor})">
        ${this._calcStateMain().toFixed(this._config.precision)}
        ${this._config.unit ? html`<span class="unit" style="font-size: ${textSize / 2}rem;">${this._config.unit}</span>` : ''}
      </div>
    `;
    const titleTemplate = html`
      <div class="title-value-position-${valuePosition == 'in-title-left' ? 'left' : valuePosition == 'in-title-right' ? 'right' : 'none'}">
        ${["in-title-right", "in-title-left"].includes(valuePosition) ? valueTemplate : ''}
        <div>
          ${this._config.title ? html`<div class="gauge-title" style="font-size: ${titleTextSize}rem; ${titleStyle}; color: rgba(${titleColor})">${this._config.title}</div>` : ''}
          ${this._config.subtitle ? html`<div class="gauge-subtitle" style="font-size: ${titleTextSize/2}rem; ${titleStyle}">${this._config.subtitle}</div>` : ''}
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
                ${this._createDeviceLines()}
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

  // ----------------------------------------------------- Entity ------------------------------------------------------

  private _entityName(device: ELGEntity): string {
    if (device.name) {return device.name;}
    return this._entitiesObject[device.entity].stateObject.attributes.friendly_name || device.entity.split('.')[1];
  }
  private _entityIcon(device: ELGEntity): string {
    if (device.icon) {return device.icon;}
    return this._entitiesObject[device.entity].stateObject.attributes.icon || '';
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
      const { template, text } = partRenderer.call(this, sortedContent[i], rendererContext);

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

  private _entityPartRenderer(value: string, context: DeviceRendererContext): LabelRenderResult {
    let template: TemplateResult | string | undefined;
    let text: string;

    const device = context.device;
    const stateObj = this._entitiesObject[device.entity].stateObject;

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
        const icon = this._entityIcon(device);
        template = html`<ha-icon icon="${icon}"></ha-icon>`;
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

  private _untrackedPartRenderer(value: string, context: RendererContext): LabelRenderResult {
    let template: TemplateResult | string;
    let text: string;

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
      default:
        text = '';
        template = html``;
        break;
    }
    return { template, text };
  }
  private _untrackedLabel(line = false): LabelRenderResult | undefined {
    const stateContent = line ? this._config.untracked_line_state_content : this._config.untracked_state_content;
    const defaultLabel = this._config.untracked_legend_label ?? this.hass.localize('ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption');

    return this._renderLabelInternal(
      stateContent,
      line,
      this._untrackedPartRenderer,
      { defaultLabel }
    );
  }

  // Formatting --------------------------------------------------------------------------------------------------------

  private _formatValue(value: any, precision?: number, unit?: string): string {
    if (!value && value !== 0) return '';
    return `${parseFloat(value).toFixed(precision??0)}${unit ? ` ${unit}` : ''}`;
  }
  private _formatValueMain(value: any): string {
    return this._formatValue(value, this._config.precision, this._config.unit);
  }
  private _formatValueDevice(device: ELGEntity): string {
    return this._formatValue(this._entitiesObject[device.entity].state, device.precision ?? this._config.precision, device.unit);
  }

  // Validation --------------------------------------------------------------------------------------------------------

  private _validate(entityId: string): boolean {
    const validationResult = this._validateEntityState(entityId);
    if (!validationResult) {return true;}

    this._addWarning(validationResult);
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

    return html`
      <div class="warnings">
        ${this._warnings.map((warning: string) => html`<hui-warning>${warning}</hui-warning>`)}
      </div>`;
  }
  private _addWarning(warning: string): void {
    if (this._warnings.includes(warning)) {return;}
    this._warnings.push(warning);
  }

  // State Calculations ------------------------------------------------------------------------------------------------

  private _calcStateMain(): number {
    if (this._config.offset) {return this._getOffsetState(this._config.entity);}
    if (this._config.statistics) {
      const state = this._getStatisticsState(this._config.entity);
      if (state === null || state === undefined) {
        this._addWarning(this._entityNoStatistics(this._config.entity));
        return 0;
      }
      return state;
    }

    return parseFloat(this.hass.states[this._config.entity].state);
  }
  private _calcState(stateObj: HassEntity, multiplier?: number): number {
    const value: number = ((): number => {
      if (this._config.offset) {return this._getOffsetState(stateObj.entity_id);}
      if (this._config.statistics) {
        const state = this._getStatisticsState(stateObj.entity_id);
        if (state === null || state === undefined) {
          this._addWarning(this._entityNoStatistics(stateObj.entity_id));
          return 0;
        }
        return state;
      }
      return parseFloat(stateObj?.state);
    })()
    return isNaN(value) ? 0 : value * (multiplier ?? 1);
  }

  // History Offset ----------------------------------------------------------------------------------------------------

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
        // Found the state at or before the requested time
        const stateValue = parseFloat(entry.state);
        return isNaN(stateValue) ? 0 : stateValue;
      }
    }
    // If no entry is found before the offsetTime, return the earliest state
    const earliestEntry: ELGHistoryOffsetEntry = history[0];
    if (earliestEntry) {
      const stateValue: number = parseFloat(earliestEntry.state);
      return isNaN(stateValue) ? 0 : stateValue;
    }

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
        });
      });
      return acc;
    }, {});
  }

  // Statistics --------------------------------------------------------------------------------------------------------

  private _getStatisticsState(entityID: string): number | null | undefined {
    if (!this._config.statistics) {return 0;}
    if (!this._entitiesHistoryStatistics) {return 0;}
    if (!this._entitiesHistoryStatistics.buckets) {return 0;}
    if (!this._entitiesHistoryStatistics.buckets[entityID]) {return 0;}

    const buckets: ELGHistoryStatisticsBucket[] = this._entitiesHistoryStatistics.buckets[entityID];
    const currentTimestamp = Date.now() - Number(this._config.statistics_day_offset) * 24 * 60 * 60 * 1000;

    const currentBucket: ELGHistoryStatisticsBucket | undefined = buckets.find((bucket: ELGHistoryStatisticsBucket) => {
      return (
        currentTimestamp >= bucket.start &&
        currentTimestamp <= bucket.end
      );
    });

    if (!currentBucket) {return 0;}

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

    let url = `history/period/${startTime}?` +
      `filter_entity_id=${entityIDs.join(',')}` +
      `&end_time=${endTime}` +
      `&significant_changes_only` +
      `&minimal_response` +
      `&no_attributes`;

    return this.hass?.callApi('GET', url);
  }
  private _allConfigEntities(): string[] {
    const entityIDs = [this._config.entity].concat(this._config.entities?.map((device: ELGEntity) => device.entity) ?? []);

    // add max, min if they are an entityId - technically not all-config entities, but all allowed entities
    const otherEntities = [
      this._config.min,
      this._config.max,
    ]

    for (const entity of otherEntities) {
      if (entity && entity !== this._config.entity && typeof entity === 'string') {
        if (!this._validate(entity)) {continue;}
        if (entityIDs.includes(entity)) {continue;}
        entityIDs.push(entity);
      }
    }

    return entityIDs;
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

  // Action Handling ---------------------------------------------------------------------------------------------------

  private _handleAction(ev: ActionHandlerEvent, device?: ELGEntity): void {
    ev.stopPropagation();
    handleAction(this, this.hass!, device ?? this._config!, ev.detail.action!);
  }
}
