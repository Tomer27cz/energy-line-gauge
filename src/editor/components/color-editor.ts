import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import { mdiClose, mdiMenuDown, mdiMenuUp, mdiPalette } from '../../config/const';

import { HomeAssistant, ELGColorSelector, RGBColor, ELGConfig } from '../../types';
import { fireEvent } from '../../interaction/event-helpers';
import { toRGB, rgbToHex } from '../../style/color'
import { setConfigDefaults, setEntitiesDefaults } from '../../config/defaults';
import { setupLocalize } from '../../localize/localize';

type ColorMode = undefined | 'automatic' | 'custom_rgb' | 'custom_css' | 'text_primary' | 'text_secondary' | 'text_disabled' | 'line_primary' | 'line_accent' | 'line_primary_bg' | 'line_secondary_bg' | 'line_card_bg';

interface ColorOption {
  mode: ColorMode;
  value?: string; // The CSS variable
  category?: 'text' | 'line';
}

const COLOR_OPTIONS: ColorOption[] = [
  { mode: 'text_primary',      value: 'var(--primary-text-color)',         category: 'text' },
  { mode: 'text_secondary',    value: 'var(--secondary-text-color)',       category: 'text' },
  { mode: 'text_disabled',     value: 'var(--disabled-text-color)',        category: 'text' },
  { mode: 'line_primary',      value: 'var(--primary-color)',              category: 'line' },
  { mode: 'line_accent',       value: 'var(--accent-color)',               category: 'line' },
  { mode: 'line_primary_bg',   value: 'var(--primary-background-color)',   category: 'line' },
  { mode: 'line_secondary_bg', value: 'var(--secondary-background-color)', category: 'line' },
  { mode: 'line_card_bg',      value: 'var(--card-background-color)',      category: 'line' },
];

@customElement('ha-selector-color_elg')
export class ColorEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public selector!: ELGColorSelector;

  @property() public name?: string;
  @property() public value?: string
  @property() public label?: string;

  @property({ type: Boolean }) public disabled = false;
  @property({ type: Boolean }) public required = false;

  @state() private _menuOpen = false;
  @state() private _mode: ColorMode = undefined;

  @query('.elg_color_container') private _container!: HTMLElement;

  // protected shouldUpdate(changedProps: PropertyValues): boolean {
  //   const propertiesToCheck = [
  //     '_mode',
  //     '_menuOpen',
  //     'selector',
  //     'value',
  //   ];
  //
  //   return propertiesToCheck.some(prop => changedProps.has(prop));
  // }

  protected render() {
    if (!this.name) {return html``;}
    if (!this._mode) {this._determineInitialMode();}

    const sl = setupLocalize(this.hass);

    const { currentColorString, currentColor, automaticColor } = this._calculateEntityColors();

    const currentOption = COLOR_OPTIONS.find(opt => opt.mode === this._mode);
    let modeLabel = currentOption ? sl(`colorOptions.${currentOption.mode}`) : sl(`colorOptions.automatic`);

    if (this._mode === 'custom_rgb') modeLabel = '';
    if (this._mode === 'custom_css') modeLabel = '';

    return html`
      <div class="elg_color_container">
        
        <div class="selector">
          <div class="content">
            <div class="label">${this.label ? this.label : this.name}${this.required ? '*' : ''}</div>
            <div class="input">${this._renderInput(currentColor, modeLabel)}</div>
          </div>
          
          <ha-icon-button
            .path=${this._menuOpen ? mdiMenuUp : mdiMenuDown}
            style="${this.value === undefined && this._mode === 'automatic' ? 'margin-right: 0.75rem;' : ''}"
            class="menu-icon"
            @click=${this._openMenu}
          ></ha-icon-button>
          
          <ha-menu
            .anchor=${this._container}
            .fixed=${true}
            
            corner="BOTTOM_START"
            menuCorner="START"
            
            naturalMenuWidth
            
            ?open=${this._menuOpen}
            @closed=${this._closeMenu}
            @selected=${this._handleMenuSelected}
          >
            <ha-list-item value="automatic" ?selected=${this._mode === 'automatic'}>
              ${this._renderColorPreview(automaticColor)}
              <span>${sl(`colorOptions.automatic`)}</span>
            </ha-list-item>
            
            ${this._renderMenuOptions(sl)}
  
            <ha-list-item value="custom_rgb" ?selected=${this._mode === 'custom_rgb'}>
              ${this._renderColorPreview(this._mode === 'custom_rgb' ? currentColor : undefined)}
              <span>${sl(`colorOptions.custom_rgb`)}</span>
            </ha-list-item>
  
            <ha-list-item value="custom_css" ?selected=${this._mode === 'custom_css'}>
              ${this._renderColorPreview(this._mode === 'custom_css' ? currentColor : undefined)}
              <span>${sl(`colorOptions.custom_css`)}</span>
            </ha-list-item>
          </ha-menu>
  
          ${this.value === undefined && this._mode === 'automatic' ? html`` : html`
            <ha-icon-button
              .label=${this.hass!.localize('ui.common.clear')}
              .path=${mdiClose}
              class="remove-icon"
              @click=${this._clear}
            ></ha-icon-button>
          `}
        </div>
        <div class="color-display" style="background: ${currentColorString};"></div>
      </div>
    `;
  }

  private _renderColorPreview(color: RGBColor | undefined) {
    if (!color) {
      return html`<ha-svg-icon .path=${mdiPalette} class="color-preview undefined-color"></ha-svg-icon>`;
    }
    return html`
      <div
        class="color-preview"
        style="background-color: rgb(${color[0]}, ${color[1]}, ${color[2]});"
      ></div>
    `;
  }

  private _renderMenuOptions(localizeFunc: (key: string) => string) {
    const mode = this.selector.color_elg?.mode;
    const includeText = mode === 'text' || mode === 'all';
    const includeLine = mode === 'line' || mode === 'all';

    const visibleOptions = COLOR_OPTIONS.filter(opt => {
      if (opt.category === 'text') return includeText;
      if (opt.category === 'line') return includeLine;
      return false;
    });

    return map(visibleOptions, (opt) => html`
      <ha-list-item value="${opt.mode}" ?selected=${this._mode === opt.mode}>
        ${this._renderColorPreview(toRGB(opt.value))}
        <span>${localizeFunc(`colorOptions.${opt.mode}`)}</span>
      </ha-list-item>
    `);
  }

  private _renderInput(currentColor: RGBColor | undefined, label: string) {
    if (this._mode === 'custom_rgb') {
      // noinspection HtmlUnknownAttribute
      return html`
        <input
          class="custom-rgb-input"
          type="color"
          .value=${rgbToHex(currentColor) ?? ''}
          .disabled=${this.disabled}
          .required=${this.required}
          @change=${this._valueChanged}
        />`;
    }
    if (this._mode === 'custom_css') {
      // noinspection HtmlUnknownAttribute
      return html`
        <input
          class="custom-css-input"
          .value=${this.value ?? ''}
          .disabled=${this.disabled}
          .required=${this.required}
          @input=${this._valueChanged}
        />`;
    }

    return html`<span>${label}</span>`;
  }

  private _calculateEntityColors() {
    const config = this.selector.color_elg!;

    if (config.entity && config.entities && config.entities.length > 0) {
      const defaults = setEntitiesDefaults(config.entities);
      const currentEntityConfig = defaults.find(e => e.entity === config.entity);

      // Create a list excluding the color of the current entity to find the "automatic" default
      const entitiesWithoutColor = config.entities.map(e =>
        e.entity === config.entity ? { ...e, color: undefined } : e
      );

      return {
        currentColorString: currentEntityConfig?.color,
        currentColor: toRGB(currentEntityConfig?.color),
        automaticColor: toRGB(setEntitiesDefaults(entitiesWithoutColor).find(e => e.entity === config.entity)?.color)
      };
    }

    // No specific entity config, use generic defaults
    const defaultConfig = setConfigDefaults({ [this.name!]: this.value } as ELGConfig);
    const automaticConfig = setConfigDefaults({ [this.name!]: undefined } as ELGConfig);

    return {
      currentColorString: defaultConfig[this.name!],
      currentColor: toRGB(defaultConfig[this.name!]),
      automaticColor: toRGB(automaticConfig[this.name!] as RGBColor | undefined)
    };
  }

  private _determineInitialMode(): void {
    if (this.value === undefined) {
      this._mode = 'automatic';
      return;
    }

    const matchedOption = COLOR_OPTIONS.find(opt => opt.value === this.value);
    if (matchedOption) {
      this._mode = matchedOption.mode;
      return;
    }

    if (String(this.value).startsWith('rgb(')) {
      this._mode = 'custom_rgb';
      return;
    }

    this._mode = 'custom_css';
  }

  private _openMenu(ev: Event) {
    ev.stopPropagation();
    this._menuOpen = true;
  }

  private _closeMenu(ev: Event) {
    ev.stopPropagation();
    this._menuOpen = false;
  }

  private _handleMenuSelected(ev: CustomEvent) {
    const index = ev.detail.index;
    const menu = ev.target as any;

    const selectedItem = menu.items[index];
    if (!selectedItem) return;

    this._mode = selectedItem.value;
    if (this._mode === 'automatic') {
      this._clear(ev);
      return;
    }

    const colorValue = COLOR_OPTIONS.find(opt => opt.mode === this._mode)?.value;
    if (colorValue) {
      this._setValue(colorValue);
      return;
    }
  }

  private _clear(ev: Event): void {
    ev.stopPropagation();
    fireEvent(this, 'value-changed', { value: undefined });
    this._mode = 'automatic';
  }

  private _setValue(value: string) {
    fireEvent(this, 'value-changed', { value: value });
  }

  private _valueChanged(ev: CustomEvent) {
    const value = (ev.target as any).value;
    fireEvent(this, "value-changed", {
      value: value,
    });
  }

  // noinspection CssUnresolvedCustomProperty,CssUnusedSymbol,CssInvalidHtmlTagReference
  static styles = css`
    .elg_color_container {
      background-color: var(--mdc-text-field-fill-color, #f5f5f5);
      height: 4rem;
      width: 100%;
      display: flex;
      flex-direction: column;
      
      border-top-left-radius: var(--mdc-shape-small, 4px);
      border-top-right-radius: var(--mdc-shape-small, 4px);
    }
  
    .selector {
      flex: 1;
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    .content {
      display: flex;
      flex-direction: column;
      text-align: left;
      flex: 1;
      height: 100%;
      min-width: 0;
    }
    
    .input {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .input span {
      line-height: 2rem;
      margin: 0 1rem;
    }
    .input:has(.custom-css-input) {
      margin: 0 0.6rem;
    }
    .input:has(.custom-rgb-input) {
      margin-left: 0.6rem;
    }
    
    .label {
      font-size: 0.7rem;
      line-height: 1.25rem;
      padding-top: 0.25rem;
      padding-left: 1rem;
      color: var(--mdc-text-field-label-ink-color,rgba(0,0,0,.6));
    }
    .color-display {
      flex: 0 0 0.3rem;
      border: 0.1rem solid var(--divider-color);
    }
  
    .color-preview {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      box-sizing: border-box;
      margin-right: 1rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
      vertical-align: middle;
      border: 0.1rem solid var(--divider-color);
    }
    .undefined-color {
      border: unset;
    }
    
    .remove-icon {
      margin-right: 0.2rem;
      --mdc-icon-size: 1.25rem;
      --mdc-icon-button-size: 2rem;
    }
    .menu-icon {
      margin-left: 0.2rem;
      --mdc-icon-size: 1.75rem;
      --mdc-icon-button-size: 2rem;
    }
    
    .custom-css-input {
      height: auto;
      width: 100%;
      border: 0;
      outline: 0;
      border-radius: var(--mdc-shape-small, 4px);
      padding: 0.3rem;
      background-color: unset;
    }
    .custom-css-input:hover {
      background-color: var(--mdc-text-field-fill-color, #e0e0e0);
    }
    
    .custom-rgb-input {
      width: 100%;
      border: 0;
      outline: 0;
      background-color: unset;
    }
    
  `;
}

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface HTMLElementTagNameMap {
    "ha-selector-color_elg": ColorEditor;
  }
}
