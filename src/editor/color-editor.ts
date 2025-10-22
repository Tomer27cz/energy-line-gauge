import { LitElement, html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { HomeAssistant, fireEvent } from 'custom-card-helpers';
import { mdiClose } from '@mdi/js';

import { EditorTarget, ELGColorSelector, RGBColor, ELGConfig } from '../types';
import { toRGB } from '../color'
import { setConfigDefaults } from '../defaults';

@customElement('ha-selector-color_elg')
export class ColorEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public selector!: ELGColorSelector;

  @property() public name?: string;
  @property() public value?: string
  @property() public label?: string;

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('selector')) {
      return true;
    }

    if (changedProps.has('value')) {
      const oldValue = changedProps.get('value') as string | undefined;
      if (oldValue !== this.value) {
        return true;
      }
    }

    return false;
  }

  protected render() {
    if (!this.name) {return html``}

    const color = toRGB(setConfigDefaults({ [this.name]: this.value } as ELGConfig)[this.name] as RGBColor | undefined);

    const bulletStyle = `
        background-color: rgba(${color});
        width: 1rem;
        height: 1rem;
      `;

    return html`
      <div style="${bulletStyle}"></div>


      <ha-icon-button
        .label=${this.hass!.localize('ui.common.clear')}
        .path=${mdiClose}
        class="remove-icon"
        @click=${this._clear}
      ></ha-icon-button>
    `;
  }

  private _clear(ev: Event): void {
    ev.stopPropagation();
    const value = undefined
    fireEvent(this, 'value-changed', value);

    console.info("name: ", this.name);
    console.info("value: ", this.value);
    console.info("label: ", this.label);
  }

  private _valueChanged(ev: CustomEvent) {
    const value = (ev.target as any).value;
    fireEvent(this, "value-changed", {
      value: value,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-selector-color_elg": ColorEditor;
  }
}




// import type { PropertyValues } from "lit";
// import { css, html, LitElement, nothing } from "lit";
// import { customElement, property } from "lit/decorators";
// import { classMap } from "lit/directives/class-map";
// import { fireEvent } from "../../common/dom/fire_event";
// import type { NumberSelector } from "../../data/selector";
// import type { HomeAssistant } from "../../types";
// import "../ha-input-helper-text";
// import "../ha-slider";
// import "../ha-textfield";
//
// @customElement("ha-selector-number")
// export class HaNumberSelector extends LitElement {
//   @property({ attribute: false }) public hass!: HomeAssistant;
//
//   @property({ attribute: false }) public selector!: NumberSelector;
//
//   @property({ type: Number }) public value?: number;
//
//   @property({ type: Number }) public placeholder?: number;
//
//   @property() public label?: string;
//
//   @property() public helper?: string;
//
//   @property({ type: Boolean }) public required = true;
//
//   @property({ type: Boolean }) public disabled = false;
//
//   private _valueStr = "";
//
//   protected willUpdate(changedProps: PropertyValues) {
//     if (changedProps.has("value")) {
//       if (this._valueStr === "" || this.value !== Number(this._valueStr)) {
//         this._valueStr =
//           this.value == null || isNaN(this.value) ? "" : this.value.toString();
//       }
//     }
//   }
//
//   protected render() {
//     const isBox =
//       this.selector.number?.mode === "box" ||
//       this.selector.number?.min === undefined ||
//       this.selector.number?.max === undefined;
//
//     let sliderStep;
//
//     if (!isBox) {
//       sliderStep = this.selector.number!.step ?? 1;
//       if (sliderStep === "any") {
//         sliderStep = 1;
//         // divide the range of the slider by 100 steps
//         const step =
//           (this.selector.number!.max! - this.selector.number!.min!) / 100;
//         // biggest step size is 1, round the step size to a division of 1
//         while (sliderStep > step) {
//           sliderStep /= 10;
//         }
//       }
//     }
//
//     return html`
//       ${this.label && !isBox
//       ? html`${this.label}${this.required ? "*" : ""}`
//       : nothing}
//       <div class="input">
//         ${!isBox
//       ? html`
//               <ha-slider
//                 labeled
//                 .min=${this.selector.number!.min}
//                 .max=${this.selector.number!.max}
//                 .value=${this.value ?? ""}
//                 .step=${sliderStep}
//                 .disabled=${this.disabled}
//                 .required=${this.required}
//                 @change=${this._handleSliderChange}
//                 .ticks=${this.selector.number?.slider_ticks}
//               >
//               </ha-slider>
//             `
//       : nothing}
//         <ha-textfield
//           .inputMode=${this.selector.number?.step === "any" ||
//     (this.selector.number?.step ?? 1) % 1 !== 0
//       ? "decimal"
//       : "numeric"}
//           .label=${!isBox ? undefined : this.label}
//           .placeholder=${this.placeholder}
//           class=${classMap({ single: isBox })}
//           .min=${this.selector.number?.min}
//           .max=${this.selector.number?.max}
//           .value=${this._valueStr ?? ""}
//           .step=${this.selector.number?.step ?? 1}
//           helperPersistent
//           .helper=${isBox ? this.helper : undefined}
//           .disabled=${this.disabled}
//           .required=${this.required}
//           .suffix=${this.selector.number?.unit_of_measurement}
//           type="number"
//           autoValidate
//           ?no-spinner=${!isBox}
//           @input=${this._handleInputChange}
//         >
//         </ha-textfield>
//       </div>
//       ${!isBox && this.helper
//       ? html`<ha-input-helper-text>${this.helper}</ha-input-helper-text>`
//       : nothing}
//     `;
//   }
//
//   private _handleInputChange(ev) {
//     ev.stopPropagation();
//     this._valueStr = ev.target.value;
//     const value =
//       ev.target.value === "" || isNaN(ev.target.value)
//         ? undefined
//         : Number(ev.target.value);
//     if (this.value === value) {
//       return;
//     }
//     fireEvent(this, "value-changed", { value });
//   }
//
//   private _handleSliderChange(ev) {
//     ev.stopPropagation();
//     const value = Number(ev.target.value);
//     if (this.value === value) {
//       return;
//     }
//     fireEvent(this, "value-changed", { value });
//   }
//
//   static styles = css`
//     .input {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       direction: ltr;
//     }
//     ha-slider {
//       flex: 1;
//       margin-right: 16px;
//       margin-inline-end: 16px;
//       margin-inline-start: 0;
//     }
//     ha-textfield {
//       --ha-textfield-input-width: 40px;
//     }
//     .single {
//       --ha-textfield-input-width: unset;
//       flex: 1;
//     }
//   `;
// }
//
// declare global {
//   interface HTMLElementTagNameMap {
//     "ha-selector-number": HaNumberSelector;
//   }
// }
