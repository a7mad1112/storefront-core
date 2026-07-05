import 'server-only';

const dictionaries = {
  ar: () => import('./dictionaries/ar.json').then((module) => module.default),
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  he: () => import('./dictionaries/he.json').then((module) => module.default),
};

export const locales = ['ar', 'en', 'he'];
export const defaultLocale = 'ar';

/** RTL locales */
export const rtlLocales = ['ar', 'he'];

export const hasLocale = (locale) => locale in dictionaries;

export const getDictionary = async (locale) => {
  if (!hasLocale(locale)) {
    return dictionaries[defaultLocale]();
  }
  return dictionaries[locale]();
};

export const getDirection = (locale) => rtlLocales.includes(locale) ? 'rtl' : 'ltr';
