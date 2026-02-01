import { LitElement, html, css, CSSResultGroup, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { mdiDelete, mdiPencil } from '../config/const';
import { HomeAssistant, EditorTarget, ELGEntity } from '../types';
import { configElementStyle,sortableStyle } from '../style/styles';
import { fireEvent } from '../interaction/event-helpers';

import { Sortable, OnSpill, AutoScroll } from 'sortablejs/modular/sortable.core.esm';
import type { SortableEvent } from 'sortablejs/modular/sortable.core.esm';
Sortable.mount(OnSpill, new AutoScroll());

@customElement('energy-line-gauge-items-editor')
export class ItemsEditor extends LitElement {
  @property({ attribute: false }) entities?: ELGEntity[];

  @property({ attribute: false }) entity_id?: string;

  @property({ attribute: false }) hass?: HomeAssistant;

  private _sortable?: Sortable;

  private _entityKeys = new WeakMap<ELGEntity, string>();

  private _getKey(action: ELGEntity) {
    if (!this._entityKeys.has(action)) {
      this._entityKeys.set(action, Math.random().toString());
    }

    return this._entityKeys.get(action)!;
  }

  public disconnectedCallback() {
    this._destroySortable();
  }

  private _destroySortable() {
    this._sortable?.destroy();
    this._sortable = undefined;
  }

  protected async firstUpdated(): Promise<void> {
    this._createSortable();
  }

  private _createSortable(): void {
    this._sortable = new Sortable(this.shadowRoot!.querySelector('.entities')!, {
      animation: 150,
      fallbackClass: 'sortable-fallback',
      handle: '.handle',
      onChoose: (evt: SortableEvent) => {
        (evt.item as any).placeholder = document.createComment('sort-placeholder');
        evt.item.after((evt.item as any).placeholder);
      },
      onEnd: (evt: SortableEvent) => {
        if ((evt.item as any).placeholder) {
          (evt.item as any).placeholder.replaceWith(evt.item);
          delete (evt.item as any).placeholder;
        }
        this._rowMoved(evt);
      },
    });
  }

  protected render() {
    if (!this.hass) {return nothing;}
    if (!this.entities) {
      this.entities = [];
    }

    const isValidEntity = (entityConf: ELGEntity): boolean => {
      return !(
        entityConf.entity === undefined ||
        entityConf.entity === null ||
        entityConf.entity === '' ||
        entityConf.entity === 'none' ||
        entityConf.entity === 'null' ||
        entityConf.entity === 'undefined'
      );
    }

    return html`
      <div class="entities">
        ${repeat(
          this.entities,
          (entityConf) => this._getKey(entityConf),
          (entityConf, index) => html`
            <div class="entity">
              <div class="handle">
                <ha-icon icon="mdi:drag"></ha-icon>
              </div>
              <div class="entity-name">
                <span>${isValidEntity(entityConf) ? this._entityName(entityConf) : 'Unknown'}</span>
              </div>
              ${isValidEntity(entityConf) ? html`
              <ha-icon-button
                .label=${this.hass!.localize('ui.common.edit')}
                .path=${mdiPencil}
                class="edit-icon"
                .index=${index}
                @click="${this._editRow}"
              ></ha-icon-button>
              ` : nothing}
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
        <ha-entity-picker
          class="add-entity"
          .hass=${this.hass}
          .includeDomains=${["sensor", "input_number", "number", "counter"]}
          @value-changed=${this._addRow}
        ></ha-entity-picker>
      </div>
    `;
  }

  private _entityName(device: ELGEntity): string {
    // if (device.name) {return device.name;}
    return this.hass!.states[device.entity].attributes.friendly_name || device.entity.split('.')[1];
  }

  private _removeRow(ev: Event): void {
    ev.stopPropagation();
    const index = (ev.currentTarget as EditorTarget).index;
    if (index != undefined) {
      const entities = this.entities!.concat();
      entities.splice(index, 1);
      fireEvent(this, 'config-changed', entities);
    }
  }

  private _editRow(ev: Event): void {
    ev.stopPropagation();

    const index = (ev.target as EditorTarget).index;
    if (index != undefined) {
      fireEvent<number>(this, 'edit-item', index);
    }
  }

  private _addRow(ev: CustomEvent): void {
    ev.stopPropagation();
    if (!this.hass) {return;}

    const entity_id = ev.detail.value;
    if (entity_id === "") {return;}

    const stateObj = this.hass.states[entity_id];

    const units = {
      'TW': 1_000_000_000_000,
      'GW': 1_000_000_000,
      'MW': 1_000_000,
      'kW': 1_000,
      'W': 1,
      'mW': 0.001,
    };

    let multiplier: number | undefined = undefined;
    let unit: string | undefined = undefined;

    const unit_of_measurement = stateObj?.attributes?.unit_of_measurement;
    const main_unit = this.entity_id
      ? this.hass.states[this.entity_id]?.attributes?.unit_of_measurement || 'W'
      : 'W';

    if (
      unit_of_measurement &&
      main_unit &&
      unit_of_measurement in units &&
      main_unit in units
    ) {
      multiplier = units[unit_of_measurement] / units[main_unit];
      unit = unit_of_measurement;
    }

    const entity: ELGEntity = {
      entity: entity_id,
      state_content: ['name'],
      ...(multiplier !== undefined && { multiplier }),
      ...(unit && { unit }),
    };

    fireEvent<ELGEntity[]>(this, 'config-changed', [...this.entities ?? [], entity]);
  }

  private _rowMoved(ev: SortableEvent): void {
    ev.stopPropagation();
    if (ev.oldIndex === ev.newIndex || !this.entities) return;

    const newEntities = this.entities.concat();
    newEntities.splice(ev.newIndex!, 0, newEntities.splice(ev.oldIndex!, 1)[0]);

    fireEvent<ELGEntity[]>(this, 'config-changed', newEntities);
  }

  static get styles(): CSSResultGroup {
    // noinspection CssUnresolvedCustomProperty,CssInvalidHtmlTagReference,CssUnusedSymbol
    return [
        configElementStyle,
        sortableStyle,
        css`
          .entity,
          .add-item {
            display: flex;
            align-items: center;
          }
          .entity-name {
            flex-grow: 1;
            margin-left: 16px;
          }
          .entity {
            display: flex;
            align-items: center;
          }
          .entity .handle {
            padding-right: 8px;
            cursor: move;
            padding-inline-end: 8px;
            padding-inline-start: initial;
            direction: var(--direction);
          }
          .entity .handle > * {
            pointer-events: none;
          }
          .entity ha-entity-picker,
          .add-item ha-entity-picker {
            flex-grow: 1;
          }
          .entities {
            margin-bottom: 8px;
          }
          .add-preset {
            padding-right: 8px;
            max-width: 130px;
          }
          .remove-icon,
          .edit-icon,
          .add-icon {
            --mdc-icon-button-size: 36px;
            color: var(--secondary-text-color);
          }
        `
    ];
  }
}
