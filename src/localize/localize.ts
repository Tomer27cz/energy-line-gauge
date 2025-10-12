import { HomeAssistant } from 'custom-card-helpers';

import * as en from './languages/en.json';
import * as cs from './languages/cs.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const languages: any = {
  cs: cs,
  en: en,
};

function getTranslatedString(key: string, lang: string): string | undefined {
  try {
    return key.split('.').reduce((o, i) => o[i], languages[lang]);
  } catch (e) {
    return undefined;
  }
}

export function localize(key: string, hass: HomeAssistant): string {
  if (!key) return '';

  const language: string = hass.locale.language ?? 'en';

  const userTranslation: string | undefined = getTranslatedString(key, language);
  if (userTranslation) {
    return userTranslation;
  }

  const fallbackTranslation: string | undefined = getTranslatedString(key, 'en');
  if (fallbackTranslation) {
    return fallbackTranslation;
  }

  return key;
}

export function setupLocalize(hass: HomeAssistant) {
  return function (key: string) {
    return localize(key, hass);
  };
}