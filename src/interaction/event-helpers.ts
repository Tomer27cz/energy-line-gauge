import type { HomeAssistant, ActionConfig } from "../types";

export function hasAction(config?: ActionConfig): boolean {
  return config !== undefined && config.action !== "none";
}

// Updated fireEvent to use CustomEvent for better compatibility
export const fireEvent = <T>(
  node: HTMLElement | Window,
  type: string,
  detail?: T,
  options?: {
    bubbles?: boolean;
    cancelable?: boolean;
    composed?: boolean;
  }
) => {
  options = options || {};
  const event = new CustomEvent(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
    detail: detail === null || detail === undefined ? {} : detail,
  });
  node.dispatchEvent(event);
  return event;
};

export type ActionConfigParams = {
  entity?: string;
  camera_image?: string;
  hold_action?: ActionConfig;
  tap_action?: ActionConfig;
  double_tap_action?: ActionConfig;
};

export const handleAction = (
  node: HTMLElement,
  _hass: HomeAssistant,
  config: ActionConfigParams,
  action: string
): void => {
  fireEvent(node, "hass-action", { config, action });
};

type ActionParams = { config: ActionConfigParams; action: string };

declare global {
  interface HASSDomEvents {
    "hass-action": ActionParams;
  }
}
