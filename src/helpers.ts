import type { HomeAssistant, ActionConfig } from "./types";

export function hasAction(config?: ActionConfig): boolean {
  return config !== undefined && config.action !== "none";
}

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
  // @ts-ignore
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed
  });
  (event as any).detail = detail;
  node.dispatchEvent(event);
  return event;
};

export const handleAction = (
  node: HTMLElement,
  hass: HomeAssistant,
  config: {
    entity?: string;
    camera_image?: string;
    hold_action?: ActionConfig;
    tap_action?: ActionConfig;
    double_tap_action?: ActionConfig;
  },
  action: string
): void => {
  let actionConfig: ActionConfig | undefined;

  if (action === "double_tap" && config.double_tap_action) {
    actionConfig = config.double_tap_action;
  } else if (action === "hold" && config.hold_action) {
    actionConfig = config.hold_action;
  } else if (action === "tap" && config.tap_action) {
    actionConfig = config.tap_action;
  }

  if (!actionConfig) {
    actionConfig = {
      action: "more-info",
    };
  }

  if (
    actionConfig.confirmation &&
    (!actionConfig.confirmation.exemptions ||
      !actionConfig.confirmation.exemptions.some(
        (e) => e.user === hass!.user!.id
      ))
  ) {
    fireEvent(window, "haptic", "warning");

    if (
      !confirm(
        actionConfig.confirmation.text ||
        `Are you sure you want to ${actionConfig.action}?`
      )
    ) {
      return;
    }
  }

  switch (actionConfig.action) {
    case "more-info":
      if (config.entity || config.camera_image) {
        fireEvent(node, "hass-more-info", {
          entityId: config.entity ? config.entity : config.camera_image!,
        });
      }
      break;
    case "navigate":
      if (actionConfig.navigation_path) {
        history.pushState(null, "", actionConfig.navigation_path);
        fireEvent(window, "location-changed", {
          replace: false,
        });
      }
      break;
    case "url":
      if (actionConfig.url_path) {
        window.open(actionConfig.url_path);
      }
      break;
    case "toggle":
      if (config.entity) {
        const entityId = config.entity;
        const stateDomain = entityId.split(".")[0];
        const serviceDomain = stateDomain === "group" ? "homeassistant" : stateDomain;
        const turnOn = ["closed", "locked", "off"].includes(hass.states[entityId].state);
        let service;
        switch (stateDomain) {
          case "lock":
            service = turnOn ? "unlock" : "lock";
            break;
          case "cover":
            service = turnOn ? "open_cover" : "close_cover";
            break;
          default:
            service = turnOn ? "turn_on" : "turn_off";
        }
        hass.callService(serviceDomain, service, { entity_id: entityId });
        fireEvent(window, "haptic", "success");
      }
      break;
    case "call-service": {
      if (!actionConfig.service) {
        fireEvent(window, "haptic", "failure");
        return;
      }
      const [domain, service] = actionConfig.service.split(".", 2);
      hass.callService(
        domain,
        service,
        actionConfig.service_data,
        actionConfig.target
      );
      fireEvent(window, "haptic", "success");
      break;
    }
    case "fire-dom-event": {
      fireEvent(node, "ll-custom", actionConfig);
    }
  }
};