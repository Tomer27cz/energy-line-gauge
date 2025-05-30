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
  ELGDelta,

  ELGHistoryOffset,
  ELGHistoryOffsetEntities,
  ELGHistoryOffsetEntry,

  ELGHistoryStatistics,
  ELGHistoryStatisticsBucket,

  HassEntity,
  HassHistory,
  HassStatistics,

  LabelRenderResult,
} from './types';
import { styles, getTextStyle } from './styles';
import { actionHandler } from './action-handler';
import { findEntities } from './find-entities';
import { setConfigDefaults } from './defaults';
import { toRGB, toHEX, textColor } from './color';

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
  private _deltaValue: ELGDelta | undefined = undefined;

  private _entitiesObject: Record<string, ELGEntityState> = {};
  private _entitiesTotalWidth: number = 0;
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
  public static getStubConfig(
    hass: HomeAssistant,
    entities: string[],
    entitiesFallback: string[]
  ): ELGConfig {
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

  private _handleTooltipSegmentLogic(labelElement: HTMLElement): void {
    const childNodes = Array.from(labelElement.childNodes);
    const parts: HTMLElement[] = [];
    const separators: HTMLElement[] = [];

    childNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.classList.contains('label-part')) {
          parts.push(el);
        } else if (el.classList.contains('label-separator')) {
          separators.push(el);
        }
      }
    });

    if (parts.length === 0) {
      labelElement.style.visibility = labelElement.scrollWidth > labelElement.clientWidth ? 'hidden' : 'visible';
      return;
    }

    parts.forEach(p => p.style.display = 'inline');
    separators.forEach(s => s.style.display = 'inline');

    const containerWidth = labelElement.clientWidth;
    const tolerance = 1;

    if (labelElement.scrollWidth <= containerWidth + tolerance) {
      return;
    }

    const removalOrderIndices = Array.from({ length: parts.length }, (_, i) => i);
    if (this._config.overflow_direction === 'right') {
      removalOrderIndices.reverse();
    }

    for (const indexToRemove of removalOrderIndices) {
      parts[indexToRemove].style.display = 'none';

      if (this._config.overflow_direction === 'right') {
        if (indexToRemove > 0 && separators[indexToRemove - 1]) {
          separators[indexToRemove - 1].style.display = 'none';
        }
      } else {
        if (separators[indexToRemove]) {
          separators[indexToRemove].style.display = 'none';
        }
      }

      if (labelElement.scrollWidth <= containerWidth + tolerance) {
        return;
      }
    }
  }

  private _checkLabelOverflow(labelElement: HTMLElement): void {
    const parentContainer = labelElement.closest('.device-line, .untracked-line') as HTMLElement | null;
    const fullText = labelElement.dataset.fullText || labelElement.textContent?.trim() || "";

    if (parentContainer) {
      parentContainer.setAttribute('title', fullText);
    } else {
      labelElement.setAttribute('title', fullText);
    }

    labelElement.style.visibility = 'visible';

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
      labelElement.style.visibility = 'visible';
      labelElement.querySelectorAll<HTMLElement>('.label-part, .label-separator').forEach(part => {
        part.style.display = 'inline';
      });
      const parentContainer = labelElement.closest('.device-line, .untracked-line') as HTMLElement | null;
      if (parentContainer) {
        parentContainer.removeAttribute('title');
      } else {
        labelElement.removeAttribute('title');
      }
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
    this._entitiesTotalWidth = 0;
    this._warnings = [];

    if (!this._validate(this._config.entity)) {return this._renderWarnings();}

    if (this._config.offset) {this._getOffsetHistory();}
    if (this._config.statistics) {this._getStatisticsHistory();}

    if (
      this._config.show_delta ||
      this._config.untracked_state_content?.includes("state") ||
      this._config.untracked_line_state_content?.includes("state")
    ) {
      this._deltaValue = this._delta();
    }

    for (const device of this._config.entities ?? []) {
      if (!this._validate(device.entity)) {continue;}

      const stateObj: HassEntity = this.hass.states[device.entity];
      const state: number = this._calcState(stateObj, device.multiplier);
      const cutoff: number = device.cutoff ?? this._config.cutoff ?? 0;

      const width: number = state <= cutoff ? 0 : this._calculateDeviceWidth(state);
      if (width > 0) {this._entitiesTotalWidth += width;}

      this._entitiesObject[device.entity] = {
        state: state,
        width: width,
        stateObject: stateObj,
      };
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
    if (!this._deltaValue) {
      if (!this._config.suppress_warnings) {this._addWarning("Delta could not be calculated");}
      return html``;
    }
    return html`
      <div class="gauge-delta">
        <div class="gauge-delta-item">State: <span>${this._formatValueMain(this._deltaValue.state)}</span></div>
        <div class="gauge-delta-item">Sum: <span>${this._formatValueMain(this._deltaValue.sum)}</span></div>
        <div class="gauge-delta-item delta">Delta: <span>${this._formatValueMain(this._deltaValue.delta)}</span></div>
      </div>`;
  }
  _createUntrackedLegend(style: string, size: number) {
    if (!this._config.untracked_legend) {return html``;}
    const untrackedLabelResult = this._untrackedLabel();

    return html`
      <li title="${this._config.untracked_legend_label || untrackedLabelResult?.fullText}" id="legend-untracked" style="display: inline-grid;">
        ${this._config.untracked_legend_icon ?
          html`<ha-icon style="color:${toHEX(this._config.color)}" icon="${this._config.untracked_legend_icon}"></ha-icon>` :
          html`<div class="bullet" style="background-color:${toHEX(this._config.color) + "7F"};border-color:${toHEX(this._config.color)};"></div>`
        }
        <div class="label" style="font-size: ${size}rem; ${style}">
          ${untrackedLabelResult?.template}
        </div>
      </li>`
  }
  _createLegendIndicator(device: ELGEntity, hexColor: string | undefined): TemplateResult {
    const legendType = device.legend_indicator ?? this._config.legend_indicator ?? "circle";
    const hasIcon = !!device.icon;

    if (legendType === 'none') return html``;

    if (legendType === 'icon') {
      if (!hasIcon) return html``;
      return html`<ha-icon style="color:${hexColor}" icon="${device.icon}"></ha-icon>`;
    }

    if (legendType === 'icon-fallback' && hasIcon) {
      return html`<ha-icon style="color:${hexColor}" icon="${device.icon}"></ha-icon>`;
    }

    return html`<div class="bullet" style="background-color:${hexColor + "7F"};border-color:${hexColor};"></div>`;
  }
  _createLegend() {
    if (!this._config.entities || this._config.entities.length === 0 || this._config.legend_hide) {return html``;}

    const textSize = this._config.legend_text_size ?? this._config.text_size ?? 1;
    const textStyle = getTextStyle(this._config.legend_text_style, textSize);

    return html`
    <div class="chart-legend">
      <ul style="justify-content: ${this._config.legend_alignment ?? "center"}">
        ${this._config.entities.map((device: ELGEntity) => {
          const entityObject: ELGEntityState = this._entitiesObject[device.entity];
          if (entityObject.width <= 0 && !this._config.legend_all) {return html``;}

          const hexColor = toHEX(device.color);
          const labelResult = this._entityLabel(device, entityObject.stateObject, false, entityObject.state);
          
          // noinspection HtmlUnknownAttribute
          return html`
            <li
              @action=${(ev: ActionHandlerEvent) => this._handleAction(ev, device)}
              .actionHandler=${actionHandler({
                hasHold: hasAction(device.hold_action),
                hasDoubleClick: hasAction(device.double_tap_action),
              })}
              title="${this._entityName(device, entityObject.stateObject)}"
              id="legend-${device.entity.replace('.', '-')}"
            >
              ${this._createLegendIndicator(device, hexColor)}
              <div class="label" style="font-size: ${textSize}rem; ${textStyle}">
                ${labelResult?.template}
              </div>
            </li>`;
        })}
        ${this._createUntrackedLegend(textStyle, textSize)}
      </ul>
    </div>`;
  }
  _createDeviceLines() {
    if (!this._config.entities) return html``;
    const deviceLines = this._config.entities.map((device: ELGEntity) => {
      const entityObject: ELGEntityState = this._entitiesObject[device.entity];

      const width: number = entityObject.width;
      const displayLineState: boolean = width > 0 && this._config.line_text_position !== "none";
      const lineTextColor = textColor(device.color);
      const textStyle: string = getTextStyle(this._config.line_text_style, this._config.line_text_size, toHEX(lineTextColor));

      const labelResult = this._entityLabel(device, entityObject.stateObject, true, entityObject.state);

      let overflowStyle = "";
      const currentOverflowType = this._config.line_text_overflow ?? "tooltip";
      const overflowDirectionStyle = this._config.overflow_direction === 'right' ? 'direction: ltr;' : 'direction: rtl;';

      switch(currentOverflowType) {
        case "ellipsis":
          overflowStyle = `overflow: hidden; text-overflow: ellipsis; ${overflowDirectionStyle}`;
          break;
        case "clip":
          overflowStyle = `overflow: hidden; text-overflow: clip; ${overflowDirectionStyle}`;
          break;
        case "fade":
          const fadeDirection = this._config.overflow_direction === 'left' ? 'left' : 'right';
          overflowStyle = `mask-image: linear-gradient(to ${fadeDirection}, black 85%, transparent 98%, transparent 100%); -webkit-mask-image: linear-gradient(to ${fadeDirection}, black 85%, transparent 98%, transparent 100%); ${overflowDirectionStyle}`;
          break;
        case "tooltip":
        case "tooltip-segment":
          overflowStyle = `overflow: hidden;`;
          break;
      }

      // noinspection HtmlUnknownAttribute
      return html`
      <div
        id="line-${device.entity.replace(".", "-")}"
        class="device-line"
        style="background-color: ${toHEX(device.color)}; width: ${width}%;"
        @action=${(ev: ActionHandlerEvent) => this._handleAction(ev, device)}
        .actionHandler=${actionHandler({
        hasHold: hasAction(device.hold_action),
        hasDoubleClick: hasAction(device.double_tap_action),
      })}
      >
        ${displayLineState && labelResult ? html`
          <div
            class="device-line-label line-text-position-${this._config.line_text_position ?? "left"}"
            data-full-text="${labelResult.fullText}"
            style="color: rgba(${lineTextColor}); font-size: ${this._config.line_text_size ?? 1}rem; ${overflowStyle} ${textStyle}">
            ${labelResult.template}
          </div>
        ` : html``}
      </div>
    `;
    });

    const untrackedWidth = this._calculateMainWidth() - this._entitiesTotalWidth;
    const displayUntrackedLine: boolean = untrackedWidth > 0 && (this._config.untracked_line_state_content?.length ?? 0) > 0;
    const untrackedTextColor = textColor(this._config.color);
    const untrackedTextStyle = getTextStyle(this._config.line_text_style, this._config.line_text_size, toHEX(untrackedTextColor));
    const untrackedLabelResult = this._untrackedLabel(true, untrackedWidth);

    return html`
    <div class="device-line-container">
      ${deviceLines}
      ${displayUntrackedLine && untrackedLabelResult ? html`
        <div class="untracked-line" style="width: ${untrackedWidth}%">
          <div
            class="device-line-label line-text-position-${this._config.line_text_position ?? "left"}"
            data-full-text="${untrackedLabelResult.fullText}"
            style="color: rgba(${untrackedTextColor}); font-size: ${this._config.line_text_size ?? 1}rem; ${untrackedTextStyle} ${this._config.line_text_overflow === 'tooltip-segment' ? 'overflow: hidden;' : ''}">
            ${untrackedLabelResult.template}
          </div>
        </div>
      ` : html``}
    </div>
  `;
  }
  _createInnerHtml() {
    const titlePosition = this._config.title_position ?? "top-left";
    const legendPosition = this._config.legend_position ?? "bottom-center";
    const deltaPosition = this._config.delta_position ?? "bottom-center";
    const valuePosition = this._config.position ?? "left";

    const cornerStyle = this._config.corner ?? "square";

    const titleTextSize = this._config.title_text_size ?? 2;
    const textSize = this._config.text_size ?? 2.5;

    const displayTitle: boolean = !!((this._config.title || this._config.subtitle) && titlePosition !== 'none');
    const displayLegend: boolean = (this._config.entities && this._config.entities.length > 0 && legendPosition !== 'none');
    const displayDelta: boolean = !!(this._config.show_delta && deltaPosition !== 'none');
    const displayValue: boolean = !!(this._config.entity && valuePosition !== 'none');

    const titleStyle = getTextStyle(this._config.title_text_style, titleTextSize);
    const valueStyle = getTextStyle(this._config.text_style, textSize);

    // gauge-position-frame - First div is moved around the second div based on the position-* class
    // delta is currently always at the bottom of the line
    return html`
      <div class="gauge-position-frame position-${titlePosition}">
        ${displayTitle ? html`
          <div>
            ${this._config.title ? html`<div class="gauge-title" style="font-size: ${titleTextSize}rem; ${titleStyle}">${this._config.title}</div>` : ''}
            ${this._config.subtitle ? html`<div class="gauge-subtitle" style="font-size: ${titleTextSize/2}rem; ${titleStyle}">${this._config.subtitle}</div>` : ''}
          </div>
        ` : ''}
        <div class="gauge-position-frame position-${legendPosition}">
          ${displayLegend ? this._createLegend() : ''}
          <div class="gauge-position-frame position-${deltaPosition}">
            ${displayDelta ? this._createDelta() : ''}
            <div class="gauge-position-frame position-${valuePosition}">
              ${displayValue ? html`
                <div class="gauge-value" style="font-size: ${textSize}rem; height: ${textSize}rem; ${valueStyle}">
                  ${this._calcStateMain().toFixed(this._config.precision)}
                  ${this._config.unit ? html`<span class="unit" style="font-size: ${textSize / 2}rem;">${this._config.unit}</span>` : ''}
                </div>
              ` : ''}
              <div class="gauge-line line-corner-${cornerStyle}">
                <div class="main-line" style="width: ${this._calculateMainWidth()}%;"></div>
                ${this._createDeviceLines()}
              </div>
            </div>
          </div>
        </div>
      </div>
      ${this._renderWarnings()}
    `;
  }

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

  private _entityName(device: ELGEntity, stateObj: HassEntity): string {
    if (device.name) {return device.name;}
    return stateObj.attributes.friendly_name || device.entity.split('.')[1];
  }
  private _entityIcon(device: ELGEntity, stateObj: HassEntity): string {
    if (device.icon) {return device.icon;}
    return stateObj.attributes.icon || '';
  }

  private _entityLabel(device: ELGEntity, stateObj: HassEntity, line = false, calculatedState?: number): LabelRenderResult | undefined {
    const stateContent = line ? device.line_state_content : device.state_content;
    const defaultLabel = this._entityName(device, stateObj);

    if (!stateContent?.length) {
      return line ? undefined : { template: defaultLabel, fullText: defaultLabel };
    }

    const shouldReverse = (this._config.overflow_direction === 'left' && ['clip', 'fade', 'ellipsis'].includes(this._config.line_text_overflow ?? 'tooltip'));
    const sortedContent = shouldReverse ? [...stateContent].reverse() : stateContent;

    const contentTemplates: TemplateResult[] = [];
    const textParts: string[] = [];

    for (let i = 0; i < sortedContent.length; i++) {
      const value = sortedContent[i];
      let templatePart: TemplateResult | string | undefined;
      let textPart = '';

      const renderRelativeTime = (datetime: string) => {
        const date = new Date(datetime);
        return {
          template: html`<ha-relative-time .hass=${this.hass} .datetime=${datetime}></ha-relative-time>`,
          text: `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`,
        };
      };

      switch (value) {
        case 'name':
          textPart = this._entityName(device, stateObj);
          templatePart = html`${textPart}`;
          break;

        case 'state':
          textPart = this._formatValueDevice(calculatedState, device);
          templatePart = html`${textPart}`;
          break;

        case 'last_changed':
          ({ template: templatePart, text: textPart } = renderRelativeTime(stateObj.last_changed));
          break;

        case 'last_updated':
          ({ template: templatePart, text: textPart } = renderRelativeTime(stateObj.last_updated));
          break;

        case 'percentage':
          const entityObj = this._entitiesObject[device.entity];
          textPart = entityObj ? `${entityObj.width.toFixed(0)}%` : '0%';
          templatePart = html`${textPart}`;
          break;

        case 'icon':
          const icon = this._entityIcon(device, stateObj);
          templatePart = html`<ha-icon icon="${icon}"></ha-icon>`;
          textPart = `[icon:${icon}]`;
          break;
      }

      if (templatePart !== undefined) {
        contentTemplates.push(html`<span class="label-part">${templatePart}</span>`);
        textParts.push(textPart);

        if (i < sortedContent.length - 1) {
          const separator = this._config.state_content_separator ?? '';
          contentTemplates.push(html`<span class="label-separator">${separator}</span>`);
          textParts.push(separator);
        }
      }
    }

    if (contentTemplates.length === 0) {
      return line ? undefined : { template: defaultLabel, fullText: defaultLabel };
    }

    return {
      template: html`${contentTemplates}`,
      fullText: textParts.join(''),
    };
  }

  private _untrackedLabel(line = false, untrackedWidth?: number): LabelRenderResult | undefined {
    const stateContent = line ? this._config.untracked_line_state_content : this._config.untracked_state_content;
    const defaultLabel = this._config.untracked_legend_label ?? this.hass.localize('ui.panel.lovelace.cards.energy.energy_devices_detail_graph.untracked_consumption');

    if (!stateContent?.length) {
      return line ? undefined : { template: defaultLabel, fullText: defaultLabel };
    }

    const shouldReverse = (this._config.overflow_direction === 'left' && ['clip', 'fade', 'ellipsis'].includes(this._config.line_text_overflow ?? 'tooltip'));
    const sortedContent = shouldReverse ? [...stateContent].reverse() : stateContent;

    const percentage = untrackedWidth ?? (this._calculateMainWidth() - this._entitiesTotalWidth);

    const contentTemplates: TemplateResult[] = [];
    const textParts: string[] = [];

    sortedContent.forEach((value, i) => {
      let templatePart: TemplateResult | string | undefined;
      let textPart = '';

      switch (value) {
        case 'name':
          textPart = defaultLabel;
          templatePart = html`${textPart}`;
          break;

        case 'state':
          textPart = this._formatValueMain(this._deltaValue?.delta);
          templatePart = html`${textPart}`;
          break;

        case 'percentage':
          textPart = `${percentage.toFixed(0)}%`;
          templatePart = html`${textPart}`;
          break;
      }

      if (templatePart !== undefined) {
        contentTemplates.push(html`<span class="label-part">${templatePart}</span>`);
        textParts.push(textPart);

        if (i < sortedContent.length - 1) {
          const separator = this._config.state_content_separator ?? '';
          contentTemplates.push(html`<span class="label-separator">${separator}</span>`);
          textParts.push(separator);
        }
      }
    });

    if (contentTemplates.length === 0) {
      return line ? undefined : { template: defaultLabel, fullText: defaultLabel };
    }

    return {
      template: html`${contentTemplates}`,
      fullText: textParts.join(''),
    };
  }

  private _formatValue(value: any, precision?: number, unit?: string): string {
    if (!value && value !== 0) return '';
    return `${parseFloat(value).toFixed(precision??0)}${unit ? ` ${unit}` : ''}`;
  }
  private _formatValueMain(value: any): string {
    return this._formatValue(value, this._config.precision, this._config.unit);
  }
  private _formatValueDevice(value: any, device: ELGEntity): string {
    return this._formatValue(value, device.precision ?? this._config.precision, device.unit);
  }

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

  private _calculateMainWidth(): number {
    return this._calculateWidth(this._calcStateMain());
  }
  private _calculateDeviceWidth(value: number): number {
    return this._calculateWidth(value, this._calculateMainWidth(), this._calcStateMain())
  }
  private _calculateWidth(value: number, multiplier: number=100, maxDefault?: number): number {
    const max: number = ((): number => {
      if (!this._config.max) {
        if (maxDefault === undefined) {return value;} // if no max is set, return the value (should only happen if Main width)
        return maxDefault;
      }

      if (typeof this._config.max === 'string') {
        return this._calcState(this.hass.states[this._config.max])
      }

      return this._config.max
    })()

    const min: number = ((): number => {
      if (!this._config.min) {return 0}

      if (typeof this._config.min === 'string') {
        return this._calcState(this.hass.states[this._config.min])
      }

      return this._config.min
    })()

    const clampValue = Math.min(Math.max(value, min), max);
    if (max === min) {return 0;} // Avoid division by zero
    return ((clampValue - min) / (max - min)) * multiplier;
  }

  private _devicesSum(): number {
    if (!this._config.entities) {return 0;}
    return (this._config.entities ?? []).reduce((sum: number, device: ELGEntity) => {
      if (!this._validate(device.entity)) {return sum;}
      return sum + this._calcState(this.hass.states[device.entity], device.multiplier);
    }, 0);
  }
  private _delta(): ELGDelta | undefined {
    let sum: number = this._devicesSum();
    let state: number = this._calcStateMain();
    let delta: number = state - sum;

    return {
      state: state,
      sum: sum,
      delta: delta,
    };
  }

  private _handleAction(ev: ActionHandlerEvent, device?: ELGEntity): void {
    ev.stopPropagation();
    handleAction(this, this.hass!, device ?? this._config!, ev.detail.action!);
  }
}
