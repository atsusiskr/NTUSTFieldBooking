import { useCallback, useSyncExternalStore } from "react";
import { zhTWDictionary } from "./zh-TW/translate";

export const DEFAULT_LOCALE = "zh-TW";
const STORAGE_KEY = "app.locale";
const dictionaries = { "zh-TW": zhTWDictionary };
const listeners = new Set();

const readSavedLocale = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const savedLocale = readSavedLocale();
let currentLocale = dictionaries[savedLocale] ? savedLocale : DEFAULT_LOCALE;
if (typeof document !== "undefined") document.documentElement.lang = currentLocale;

export const getLocale = () => currentLocale;
export const getAvailableLocales = () => Object.keys(dictionaries);
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function registerLocale(locale, dictionary) {
  dictionaries[locale] = dictionary;
  if (savedLocale === locale && currentLocale !== locale) setLocale(locale);
  else listeners.forEach((listener) => listener());
}

export function setLocale(locale) {
  if (!dictionaries[locale] || locale === currentLocale) return false;
  currentLocale = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Private browsing may prevent storage; switching still works for this session.
  }
  if (typeof document !== "undefined") document.documentElement.lang = locale;
  listeners.forEach((listener) => listener());
  return true;
}

const lookup = (dictionary, key) => {
  if (Object.prototype.hasOwnProperty.call(dictionary.ui || {}, key)) return dictionary.ui[key];
  return key.split(".").reduce((value, segment) => value?.[segment], dictionary);
};

export function translate(key, params = {}, locale = currentLocale) {
  if (key == null) return "";
  if (typeof key !== "string") return String(key);
  const message = lookup(dictionaries[locale] || {}, key) ?? lookup(dictionaries[DEFAULT_LOCALE], key) ?? key;
  if (typeof message !== "string") return key;
  return message.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  );
}

export function useTranslation() {
  const locale = useSyncExternalStore(subscribe, getLocale, () => DEFAULT_LOCALE);
  return useCallback((key, params) => translate(key, params, locale), [locale]);
}
