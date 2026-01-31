import { LitElement, html, css, CSSResultGroup, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { mdiDelete, mdiPlus } from '../../config/const';
import { HomeAssistant, EditorTarget, SeverityType } from '../../types';
import { fireEvent } from '../../interaction/event-helpers';
import { configElementStyle } from '../../style/styles';

@customElement('energy-line-gauge-severity-editor')
export class SeverityEditor extends LitElement {
  @property({ attribute: false }) severity_levels?: SeverityType[];

  @property({ attribute: false }) hass?: HomeAssistant;

  protected render() {
    if (!this.hass) {return nothing;}
    if (!this.severity_levels) {
      this.severity_levels = [];
    }

    return html`
      <div class="severity_levels">
        ${repeat(
          this.severity_levels,
          (_severityConf, index) => index,
          (severityConf, index) => html`
            <div class="severity_level">
              <ha-selector-number
                class="severity-value"
                .hass=${this.hass}
                .value=${severityConf.from}
                .selector=${{number:{mode: "box", step: 1}}}
                .index=${index}
                @value-changed=${this._valueChanged}
              ></ha-selector-number>
              <ha-selector-color_elg
                class="severity-color"
                .hass=${this.hass}
                .value=${severityConf.color}
                .name=${"color"}
                .label=${"Severity Color"}
                .selector=${{color_elg:{mode: "severity"}}}
                .index=${index}
                @value-changed=${this._colorChanged}
              ></ha-selector-color_elg>
              <ha-icon-button
                .label=${this.hass!.localize('ui.common.remove')}
                .path=${mdiDelete}
                class="remove-icon"
                .index=${index}
                @click=${this._removeRow}
              ></ha-icon-button>
            </div>
          `,
        )}
      </div>
      <div class="add-item row">
        <ha-button
          .appearance=${"outlined"}
          class="add-preset"
          @click=${this._addRow}
        >
          <ha-svg-icon
            .path=${mdiPlus}
            slot="start"
          ></ha-svg-icon>
          ${this.hass.localize('ui.components.todo.item.add')}
        </ha-button>
      </div>
    `;
  }

  private _removeRow(ev: Event): void {
    ev.stopPropagation();
    const index = (ev.currentTarget as EditorTarget).index;
    if (index != undefined) {
      const severity_levels = this.severity_levels!.concat();
      severity_levels.splice(index, 1);
      fireEvent(this, 'config-changed', severity_levels);
    }
  }
  private _addRow(ev: CustomEvent): void {
    ev.stopPropagation();
    if (!this.hass) {return;}

    const severity: SeverityType = {
      from: 0,
      color: 'var(--primary-color)',
    };

    fireEvent(this, 'config-changed', [...this.severity_levels ?? [], severity]);
  }

  private _configChanged(ev: any, valueType: 'color' | 'value'): void {
    ev.stopPropagation();
    const index = (ev.target as EditorTarget).index;
    const value = ev.detail.value;

    if (index != undefined && this.severity_levels) {
      const levels = [...this.severity_levels];
      levels[index] = {
        ...levels[index],
        [valueType === 'color' ? 'color' : 'from']: valueType === 'color' ? value : Number(value),
      };
      fireEvent(this, 'config-changed', levels);
    }
  }
  private _colorChanged(ev: any): void {
    this._configChanged(ev, 'color');
  }
  private _valueChanged(ev: any): void {
    this._configChanged(ev, 'value');
  }

  static get styles(): CSSResultGroup {
    // noinspection CssUnresolvedCustomProperty,CssInvalidHtmlTagReference,CssUnusedSymbol
    return [
        configElementStyle,
        css`
          .severity_level {
            display: flex;
            align-items: center;
          }
          .severity-value {
            flex: 1;
            padding: 0.2rem 0.5rem;
          }
          .severity-color {
            flex: 3;
            padding: 0.2rem 0.5rem;
          }
          .remove-icon {
            flex: 0
          }
          .add-preset {
            padding-right: 8px;
            max-width: 130px;
          }
          .remove-icon,
          .add-icon {
            --mdc-icon-button-size: 36px;
            color: var(--secondary-text-color);
          }
        `
    ];
  }
}