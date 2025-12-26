import { noChange } from 'lit';
import { AttributePart, directive, Directive, DirectiveParameters } from 'lit/directive.js';

import { deepEqual } from './deep-equal';
import { fireEvent } from './helpers';

export const actions = ['more-info', 'toggle', 'navigate', 'url', 'call-service', 'none'] as const;

export interface ActionHandlerOptions {
  hasHold?: boolean;
  hasDoubleClick?: boolean;
  disabled?: boolean;
}

export const isTouch =
  'ontouchstart' in window ||
  navigator.maxTouchPoints > 0 ||
  // @ts-ignore
  navigator.msMaxTouchPoints > 0;

interface ActionHandlerType extends HTMLElement {
  holdTime: number;
  bind(element: Element, options?: ActionHandlerOptions): void;
}

interface ActionHandlerElement extends HTMLElement {
  actionHandler?: {
    options: ActionHandlerOptions;
    start?: (ev: Event) => void;
    end?: (ev: Event) => void;
    handleKeyDown?: (ev: KeyboardEvent) => void;
  };
}

class ActionHandler extends HTMLElement implements ActionHandlerType {
  public holdTime = 500;
  protected timer?: number;
  protected held = false;
  private cancelled = false;
  private dblClickTimeout?: number;

  public connectedCallback() {
    Object.assign(this.style, {
      position: 'fixed',
      width: isTouch ? '100px' : '50px',
      height: isTouch ? '100px' : '50px',
      transform: 'translate(-50%, -50%) scale(0)',
      pointerEvents: 'none',
      zIndex: '999',
      background: 'var(--primary-color)',
      display: null,
      opacity: '0.2',
      borderRadius: '50%',
      transition: 'transform 180ms ease-in-out',
    });

    [
      'touchcancel',
      'mouseout',
      'mouseup',
      'touchmove',
      'mousewheel',
      'wheel',
      'scroll',
    ].forEach((ev) => {
      document.addEventListener(
        ev,
        () => {
          this.cancelled = true;
          if (this.timer) {
            this._stopAnimation();
            clearTimeout(this.timer);
            this.timer = undefined;
          }
        },
        { passive: true }
      );
    });
  }

  public bind(
    element: ActionHandlerElement,
    options: ActionHandlerOptions = {}
  ) {
    if (
      element.actionHandler &&
      deepEqual(options, element.actionHandler.options)
    ) {
      return;
    }

    if (element.actionHandler) {
      element.removeEventListener('touchstart', element.actionHandler.start!);
      element.removeEventListener('touchend', element.actionHandler.end!);
      element.removeEventListener('touchcancel', element.actionHandler.end!);
      element.removeEventListener('mousedown', element.actionHandler.start!);
      element.removeEventListener('click', element.actionHandler.end!);
      element.removeEventListener('keydown', element.actionHandler.handleKeyDown!);
    }

    element.actionHandler = { options };

    element.actionHandler.start = (ev: Event) => {
      if ((ev as MouseEvent).button === 2) {
        // Ignore right-click for hold
        return;
      }

      if (options.disabled) {
        return;
      }

      this.cancelled = false;
      let x: number;
      let y: number;

      if ((ev as TouchEvent).touches) {
        x = (ev as TouchEvent).touches[0].clientX;
        y = (ev as TouchEvent).touches[0].clientY;
      } else {
        x = (ev as MouseEvent).clientX;
        y = (ev as MouseEvent).clientY;
      }

      if (options.hasHold) {
        this.held = false;
        this.timer = window.setTimeout(() => {
          if (this.cancelled) {return;}
          this._startAnimation(x, y);
          this.held = true;
        }, this.holdTime);
      }
    };

    element.actionHandler.end = (ev: Event) => {
      const target = ev.target as HTMLElement;

      // Ignore right-click
      if ((ev as MouseEvent).button === 2) return;

      if (
        ev.type === 'touchcancel' ||
        (ev.type === 'touchend' && this.cancelled)
      ) {
        return;
      }

      if (ev.cancelable) {
        ev.preventDefault();
      }

      if (options.hasHold) {
        this.cancelled = true;
        clearTimeout(this.timer);
        this._stopAnimation();
        this.timer = undefined;
      }

      if (options.hasHold && this.held) {
        fireEvent(target, 'action', { action: 'hold' });
        return; // Don't fire tap after hold
      }

      if (options.hasDoubleClick) {
        if (
          (ev.type === 'click' && (ev as MouseEvent).detail < 2) ||
          !this.dblClickTimeout
        ) {
          this.dblClickTimeout = window.setTimeout(() => {
            this.dblClickTimeout = undefined;
            fireEvent(target, 'action', { action: 'tap' });
          }, 250);
        } else {
          clearTimeout(this.dblClickTimeout);
          this.dblClickTimeout = undefined;
          fireEvent(target, 'action', { action: 'double_tap' });
        }
      } else {
        fireEvent(target, 'action', { action: 'tap' });
      }
    };

    element.actionHandler.handleKeyDown = (ev: KeyboardEvent) => {
      if (!['Enter', ' '].includes(ev.key)) {
        return;
      }
      (ev.currentTarget as ActionHandlerElement).actionHandler!.end!(ev);
    };

    element.addEventListener('touchstart', element.actionHandler.start, {
      passive: true,
    });
    element.addEventListener('touchend', element.actionHandler.end);
    element.addEventListener('touchcancel', element.actionHandler.end);

    element.addEventListener('mousedown', element.actionHandler.start, {
      passive: true,
    });
    element.addEventListener('click', element.actionHandler.end);
    element.addEventListener('keydown', element.actionHandler.handleKeyDown);
  }

  private _startAnimation(x: number, y: number) {
    Object.assign(this.style, {
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(-50%, -50%) scale(1)',
    });
  }

  private _stopAnimation() {
    Object.assign(this.style, {
      left: null,
      top: null,
      transform: 'translate(-50%, -50%) scale(0)',
    });
  }
}

customElements.define('action-handler-energy-line-gauge', ActionHandler);

const getActionHandler = (): ActionHandlerType => {
  const body = document.body;
  const existing = body.querySelector('action-handler-energy-line-gauge');
  if (existing) return existing as ActionHandlerType;

  const actionhandler = document.createElement('action-handler-energy-line-gauge');
  body.appendChild(actionhandler);

  return actionhandler as ActionHandlerType;
};

export const actionHandlerBind = (
  element: ActionHandlerElement,
  options?: ActionHandlerOptions
) => {
  const actionhandler: ActionHandlerType = getActionHandler();
  if (!actionhandler) return;
  actionhandler.bind(element, options);
};

export const actionHandler = directive(
  class extends Directive {
    update(part: AttributePart, [options]: DirectiveParameters<this>) {
      actionHandlerBind(part.element as ActionHandlerElement, options);
      return noChange;
    }

    render(_options?: ActionHandlerOptions) {}
  }
);
