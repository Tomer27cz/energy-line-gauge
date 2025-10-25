import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

import { HomeAssistant, fireEvent } from 'custom-card-helpers';
import { mdiClose, mdiMenuDown, mdiMenuUp, mdiPalette } from '@mdi/js';

import { ELGColorSelector, RGBColor, ELGConfig } from '../types';
import { toRGB, rgbToHex } from '../color'
import { setConfigDefaults } from '../defaults';

type ColorMode = undefined | 'automatic' | 'custom_rgb' | 'custom_css' | 'text_primary' | 'text_secondary' | 'text_disabled' | 'line_primary' | 'line_accent' | 'line_card_bg';

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

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    const propertiesToCheck = [
      '_mode',
      '_menuOpen',
      'selector',
      'value',
    ];

    return propertiesToCheck.some(prop => changedProps.has(prop));
  }

  protected render() {
    if (!this.name) {return html``;}
    if (!this._mode) {this.getInitialMode();}

    const selectorMode = this.selector.color_elg?.mode;

    const selectorModes: string[] = [];
    if (selectorMode === 'text') {selectorModes.push('text');}
    if (selectorMode === 'line') {selectorModes.push('line');}
    if (selectorMode === 'all') {selectorModes.push('text', 'line');}

    const currentColorString = setConfigDefaults({ [this.name]: this.value } as ELGConfig)[this.name] as RGBColor | undefined;
    const currentColor = toRGB(currentColorString);
    const automaticColor = toRGB(setConfigDefaults({ [this.name]: undefined } as ELGConfig)[this.name] as RGBColor | undefined);

    // noinspection HtmlUnknownAttribute
    const valueTemplate = {
      'automatic': html`<span>Automatic</span>`,
      'text_primary': html`<span>Primary Text</span>`,
      'text_secondary': html`<span>Secondary Text</span>`,
      'text_disabled': html`<span>Disabled Text</span>`,
      'line_primary': html`<span>Primary</span>`,
      'line_accent': html`<span>Accent</span>`,
      'line_card_bg': html`<span>Card Background</span>`,

      'custom_rgb': html`
        <input
          class="custom-rgb-input"
          type="color"
          .value=${rgbToHex(currentColor) ?? ''}
          .disabled=${this.disabled}
          .required=${this.required}
          @change=${this._valueChanged}
        />`,
      'custom_css': html`
        <input
          class="custom-css-input"
          .value=${this.value ?? ''}
          .disabled=${this.disabled}
          .required=${this.required}
          @input=${this._valueChanged}
        />`,
    };


    return html`
      <div class="elg_color_container">
        
        <div class="selector">
          <div class="content">
            <div class="label">${this.label ? this.label : this.name}${this.required ? '*' : ''}</div>
            <div class="input">${valueTemplate[this._mode as keyof typeof valueTemplate]}</div>
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
              <span>Automatic</span>
            </ha-list-item>
            
            ${selectorModes.includes('text') ? html`
              <ha-list-item value="text_primary" ?selected=${this._mode === 'text_primary'}>
                ${this._renderColorPreview(toRGB('var(--primary-text-color)'))}
                <span>Primary Text</span>
              </ha-list-item>
              
              <ha-list-item value="text_secondary" ?selected=${this._mode === 'text_secondary'}>
                ${this._renderColorPreview(toRGB('var(--secondary-text-color)'))}
                <span>Secondary Text</span>
              </ha-list-item>
              
              <ha-list-item value="text_disabled" ?selected=${this._mode === 'text_disabled'}>
                ${this._renderColorPreview(toRGB('var(--disabled-text-color)'))}
                <span>Disabled Text</span>
              </ha-list-item>
            ` : html``}
  
            ${selectorModes.includes('line') ? html`
              <ha-list-item value="line_primary" ?selected=${this._mode === 'line_primary'}>
                ${this._renderColorPreview(toRGB('var(--primary-color)'))}
                <span>Primary</span>
              </ha-list-item>  
              
              <ha-list-item value="line_accent" ?selected=${this._mode === 'line_accent'}>
                ${this._renderColorPreview(toRGB('var(--accent-color)'))}
                <span>Accent</span>
              </ha-list-item>  
              
              <ha-list-item value="line_card_bg" ?selected=${this._mode === 'line_card_bg'}>
                ${this._renderColorPreview(toRGB('var(--card-background-color)'))}
                <span>Card Background</span>
              </ha-list-item>  
            ` : html``}
  
            <ha-list-item value="custom_rgb" ?selected=${this._mode === 'custom_rgb'}>
              ${this._renderColorPreview(this._mode === 'custom_rgb' ? currentColor : undefined)}
              <span>Color Picker</span>
            </ha-list-item>
  
            <ha-list-item value="custom_css" ?selected=${this._mode === 'custom_css'}>
              ${this._renderColorPreview(this._mode === 'custom_css' ? currentColor : undefined)}
              <span>Custom CSS</span>
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
      return html`<ha-svg-icon .path=${mdiPalette} class="color-preview undefined"></ha-svg-icon>`;
    }
    return html`
      <div
        class="color-preview"
        style="background-color: rgb(${color[0]}, ${color[1]}, ${color[2]});"
      ></div>
    `;
  }

  private getInitialMode(): void {
    switch (this.value) {
      case undefined:
        this._mode = 'automatic';
        return;
      case 'var(--primary-text-color)':
        this._mode = 'text_primary';
        return;
      case 'var(--secondary-text-color)':
        this._mode = 'text_secondary';
        return;
      case 'var(--disabled-text-color)':
        this._mode = 'text_disabled';
        return;
      case 'var(--primary-color)':
        this._mode = 'line_primary';
        return;
      case 'var(--accent-color)':
        this._mode = 'line_accent';
        return;
      case 'var(--card-background-color)':
        this._mode = 'line_card_bg';
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
    if (this.selector.color_elg?.mode === 'text') {
      switch (ev.detail.index) {
        case 0: this._mode = 'automatic'; break;
        case 1: this._mode = 'text_primary'; break;
        case 2: this._mode = 'text_secondary'; break;
        case 3: this._mode = 'text_disabled'; break;
        case 4: this._mode = 'custom_rgb'; break;
        case 5: this._mode = 'custom_css'; break;
      }
    } else if (this.selector.color_elg?.mode === 'line') {
      switch (ev.detail.index) {
        case 0: this._mode = 'automatic'; break;
        case 1: this._mode = 'line_primary'; break;
        case 2: this._mode = 'line_accent'; break;
        case 3: this._mode = 'line_card_bg'; break;
        case 4: this._mode = 'custom_rgb'; break;
        case 5: this._mode = 'custom_css'; break;
      }
    } else {
      switch (ev.detail.index) {
        case 0: this._mode = 'automatic'; break;
        case 1: this._mode = 'custom_rgb'; break;
        case 2: this._mode = 'custom_css'; break;
      }
    }

    switch (this._mode) {
      case 'automatic':this._clear(ev);break;
      case 'text_primary':this._setValue('var(--primary-text-color)');break;
      case 'text_secondary':this._setValue('var(--secondary-text-color)');break;
      case 'text_disabled':this._setValue('var(--disabled-text-color)');break;
      case 'line_primary':this._setValue('var(--primary-color)');break;
      case 'line_accent':this._setValue('var(--accent-color)');break;
      case 'line_card_bg':this._setValue('var(--card-background-color)');break;
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
    }
    
    .input {
      flex: 1;
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
      color: var(--mdc-text-field-label-ink-color,rgba(0,0,0,.6))
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
