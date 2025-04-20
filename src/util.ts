import { ELGConfig, ELGEntity } from './types';

export function fireEvent<T>(node: HTMLElement | Window, type: string, detail: T): void {
  const event = new CustomEvent(type, { bubbles: false, composed: false, detail: detail });
  node.dispatchEvent(event);
}

export const computeDomain = (entityId: string): string =>
    entityId.substring(0, entityId.indexOf("."));

const arrayFilter = (
    array: any[],
    conditions: ((value: any) => boolean)[],
    maxSize: number
) => {
  if (!maxSize || maxSize > array.length) {
    maxSize = array.length;
  }

  const filteredArray: any[] = [];

  for (let i = 0; i < array.length && filteredArray.length < maxSize; i++) {
    let meetsConditions = true;

    for (const condition of conditions) {
      if (!condition(array[i])) {
        meetsConditions = false;
        break;
      }
    }

    if (meetsConditions) {
      filteredArray.push(array[i]);
    }
  }

  return filteredArray;
};

export const findEntities = (
    hass: any,
    maxEntities: number,
    entities: string[],
    entitiesFallback: string[],
    includeDomains?: string[],
    entityFilter?: (stateObj: any) => boolean
) => {
  const conditions: ((value: string) => boolean)[] = [];

  if (includeDomains?.length) {
    conditions.push((eid) => includeDomains!.includes(computeDomain(eid)));
  }

  if (entityFilter) {
    conditions.push(
        (eid) => hass.states[eid] && entityFilter(hass.states[eid])
    );
  }

  const entityIds = arrayFilter(entities, conditions, maxEntities);

  if (entityIds.length < maxEntities && entitiesFallback.length) {
    const fallbackEntityIds = findEntities(
        hass,
        maxEntities - entityIds.length,
        entitiesFallback,
        [],
        includeDomains,
        entityFilter
    );

    entityIds.push(...fallbackEntityIds);
  }

  return entityIds;
};

export const COLORS = [
  "#4269d0",
  "#f4bd4a",
  "#ff725c",
  "#6cc5b0",
  "#a463f2",
  "#ff8ab7",
  "#9c6b4e",
  "#97bbf5",
  "#01ab63",
  "#9498a0",
  "#094bad",
  "#c99000",
  "#d84f3e",
  "#49a28f",
  "#048732",
  "#d96895",
  "#8043ce",
  "#7599d1",
  "#7a4c31",
  "#74787f",
  "#6989f4",
  "#ffd444",
  "#ff957c",
  "#8fe9d3",
  "#62cc71",
  "#ffadda",
  "#c884ff",
  "#badeff",
  "#bf8b6d",
  "#b6bac2",
  "#927acc",
  "#97ee3f",
  "#bf3947",
  "#9f5b00",
  "#f48758",
  "#8caed6",
  "#f2b94f",
  "#eff26e",
  "#e43872",
  "#d9b100",
  "#9d7a00",
  "#698cff",
  "#d9d9d9",
  "#00d27e",
  "#d06800",
  "#009f82",
  "#c49200",
  "#cbe8ff",
  "#fecddf",
  "#c27eb6",
  "#8cd2ce",
  "#c4b8d9",
  "#f883b0",
  "#a49100",
  "#f48800",
  "#27d0df",
  "#a04a9b",
];

export const toHEX = (
  color: [number, number, number] | undefined | string
): string | undefined =>{
  if (!color) {return undefined;}
  if (typeof color === "string") {return color;}
  return "#" + ((1 << 24) | (color[0] << 16) | (color[1] << 8) | color[2]).toString(16).slice(1).toUpperCase();
}

export const toRGB = (
  color: [number, number, number] | undefined | string
): [number, number, number] | undefined => {
  if (!color) {return undefined;}
  if (typeof color === "string") {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return [r, g, b];
  }
  return color;
}

export const setConfigDefaults = (
    config: ELGConfig
): ELGConfig => {
  config = JSON.parse(JSON.stringify(config));

  config.min = config.min ?? 0;
  config.max = config.max ?? config.entity;
  config.precision = config.precision ?? 0;
  config.cutoff = config.cutoff ?? 5;
  config.corner = config.corner ?? "square";
  config.position = config.position ?? "left";

  config.color = toRGB(config.color) ?? toRGB(getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim());
  config.color_bg = toRGB(config.color_bg) ?? toRGB(getComputedStyle(document.documentElement).getPropertyValue('--secondary-background-color').trim());

  config.untracked_legend = !!(config.untracked_legend ?? config.entities);
  config.untracked_legend_label = config.untracked_legend_label === "" ? undefined : config.untracked_legend_label;
  config.untracked_state_content = config.untracked_state_content ?? ['name'];

  config.legend_hide = config.legend_hide ?? false;
  config.legend_all = config.legend_all ?? false;
  config.show_delta = config.show_delta ?? false;

  if (Array.isArray(config.entities)) {
    config.entities = setEntitiesDefaults(config.entities);
  }

  return config;
};

export const setEntitiesDefaults = (
  entities: ELGEntity[]
): ELGEntity[] => {
  const entities_copy = entities.map(device => ({ ...device }));
  const device_colors = entities_copy.map(device => toHEX(device.color));

  for (const device of entities_copy) {
    if (!device.color || device.color === "auto") {
      const availableColor = COLORS.find(c => !device_colors.includes(c.toUpperCase()));
      device.color = toRGB(availableColor);
      device_colors.push(availableColor?.toUpperCase());
    }
  }
  return entities_copy;
};










//
//
//
//   if (config.entities) {
//     config.entities = setConfigDefaults(config.entities, stub);
//   }
//
//   return config;
// }
//
// export const setEntitiesDefaults = (
//   entities: ELGEntity[],
//   stub?: boolean
// ): ELGEntity[] => {
//   const device_colors = entities.map(device => toHex(device.color, stub));
//   for (const device of entities) {
//     device.color = toHex(device.color, stub);
//     if (!device.color) {
//       device.color = toHex(COLORS.find(color => !device_colors.includes(color)), stub);
//       device_colors.push(device.color);
//     }
//   }
//   return entities;
// }