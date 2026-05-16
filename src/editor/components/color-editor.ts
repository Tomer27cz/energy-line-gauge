import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import { mdiClose, mdiMenuDown, mdiMenuUp, mdiPalette } from '../../config/const';

import { HomeAssistant, ELGColorSelector, RGBColor, ELGConfig, ColorEditorOption, ColorEditorMode, CSSColor } from '../../types';
import { fireEvent } from '../../interaction/event-helpers';
import { toRGB, rgbToHex } from '../../style/color'
import { setConfigDefaults, setEntitiesDefaults } from '../../config/defaults';
import { setupLocalize } from '../../localize/localize';

const COLOR_OPTIONS: ColorEditorOption[] = [
  { mode: 'text_primary',      value: 'var(--primary-text-color)',         categories: ['text'] },
  { mode: 'text_secondary',    value: 'var(--secondary-text-color)',       categories: ['text'] },
  { mode: 'text_disabled',     value: 'var(--disabled-text-color)',        categories: ['text'] },
  { mode: 'line_primary',      value: 'var(--primary-color)',              categories: ['line', 'severity'] },
  { mode: 'line_accent',       value: 'var(--accent-color)',               categories: ['line', 'severity'] },
  { mode: 'line_primary_bg',   value: 'var(--primary-background-color)',   categories: ['line'] },
  { mode: 'line_secondary_bg', value: 'var(--secondary-background-color)', categories: ['line'] },
  { mode: 'line_card_bg',      value: 'var(--card-background-color)',      categories: ['line'] },
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
  @state() private _mode: ColorEditorMode = undefined;

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

  protected render() {
    if (!this.name) {return html``;}
    if (!this._mode) {this._determineInitialMode();}

    const sl = setupLocalize(this.hass);

    const { currentColor, automaticColor } = this._calculateEntityColors();

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

          <ha-dropdown
              placement="bottom-end"
              @wa-select=${this._handleMenuSelected}
              @wa-show=${this._openMenu}
              @wa-hide=${this._closeMenu}
          >
            <ha-icon-button
                slot="trigger"
                .path=${this._menuOpen ? mdiMenuUp : mdiMenuDown}
                style="${this.value === undefined && this._mode === 'automatic' ? 'margin-right: 0.75rem;' : ''}"
                class="menu-icon"
            ></ha-icon-button>

            <ha-dropdown-item .value=${'automatic'} ?selected=${this._mode === 'automatic'}>
              ${this._renderColorPreview(automaticColor)}
              <span>${sl(`colorOptions.automatic`)}</span>
            </ha-dropdown-item>

            ${this._renderMenuOptions(sl)}

            <ha-dropdown-item .value=${'custom_rgb'} ?selected=${this._mode === 'custom_rgb'}>
              ${this._renderColorPreview(this._mode === 'custom_rgb' ? currentColor : undefined)}
              <span>${sl(`colorOptions.custom_rgb`)}</span>
            </ha-dropdown-item>

            <ha-dropdown-item .value=${'custom_css'} ?selected=${this._mode === 'custom_css'}>
              ${this._renderColorPreview(this._mode === 'custom_css' ? currentColor : undefined)}
              <span>${sl(`colorOptions.custom_css`)}</span>
            </ha-dropdown-item>
          </ha-dropdown>

          ${this.value === undefined && this._mode === 'automatic' ? html`` : html`
            <ha-icon-button
              .label=${this.hass!.localize('ui.common.clear')}
              .path=${mdiClose}
              class="remove-icon"
              @click=${this._clear}
            ></ha-icon-button>
          `}
        </div>
        <div class="color-display" style="background: ${currentColor};"></div>
      </div>
    `;
  }

  private _renderColorPreview(color: CSSColor) {
    if (!color) {
      return html`<ha-svg-icon .path=${mdiPalette} class="color-preview undefined-color"></ha-svg-icon>`;
    }
    return html`
      <div
        class="color-preview"
        style="background: ${color};"
      ></div>
    `;
  }

  private _renderMenuOptions(localizeFunc: (key: string) => string) {
    const mode = this.selector.color_elg?.mode;
    const visibleOptions = COLOR_OPTIONS.filter(opt => {
      if (mode == 'all') return true;
      return opt.categories.includes(mode as any);
    });

    return map(visibleOptions, (opt) => html`
      <ha-dropdown-item .value=${opt.mode} ?selected=${this._mode === opt.mode}>
        ${this._renderColorPreview(opt.value)}
        <span>${localizeFunc(`colorOptions.${opt.mode}`)}</span>
      </ha-dropdown-item>
    `);
  }

  private _renderInput(currentColor: CSSColor, label: string) {
    if (this._mode === 'custom_rgb') {
      // noinspection HtmlUnknownAttribute
      return html`
        <input
          class="custom-rgb-input"
          type="color"
          .value=${rgbToHex(toRGB(currentColor)) ?? ''}
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
        currentColor: currentEntityConfig?.color,
        automaticColor: setEntitiesDefaults(entitiesWithoutColor).find(e => e.entity === config.entity)?.color
      };
    }

    // No specific entity config, use generic defaults
    const defaultConfig = setConfigDefaults({ [this.name!]: this.value } as ELGConfig);
    const automaticConfig = setConfigDefaults({ [this.name!]: undefined } as ELGConfig);

    return {
      currentColor: defaultConfig[this.name!],
      automaticColor: automaticConfig[this.name!]
    };
  }

  private _clear(ev: Event): void {
    ev.stopPropagation();
    fireEvent(this, 'value-changed', { value: undefined });
    this._mode = 'automatic';
  }
  private _setValue(value: string) {
    fireEvent(this, 'value-changed', { value: value });
  }

  private _openMenu() {
    this._menuOpen = true;
  }

  private _closeMenu() {
    this._menuOpen = false;
  }
  private _valueChanged(ev: CustomEvent) {
    const value = (ev.target as any).value;
    fireEvent(this, "value-changed", {
      value: value,
    });
  }

  private _handleMenuSelected(ev: CustomEvent) {
    ev.stopPropagation();
    const value = ev.detail.item.value;
    if (!value) return;

    this._mode = value;
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

  // noinspection CssUnresolvedCustomProperty,CssUnusedSymbol,CssInvalidHtmlTagReference
  static styles = css`
    .elg_color_container {
      background-color: var(--ha-color-form-background, #f5f5f5);
      height: 4rem;
      width: 100%;
      display: flex;
      flex-direction: column;
      
      border-top-left-radius: var(--ha-border-radius-sm, 4px);
      border-top-right-radius: var(--ha-border-radius-sm, 4px);
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
      color: var(--secondary-text-color,rgba(0,0,0,.6));
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
      border-radius: var(--ha-border-radius-sm, 4px);
      padding: 0.3rem;
      background-color: unset;
    }
    .custom-css-input:hover {
      background-color: var(--ha-color-form-background-hover, #e0e0e0);
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
