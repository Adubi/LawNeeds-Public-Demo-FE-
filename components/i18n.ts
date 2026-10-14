// i18n.ts
import i18n from 'i18next';
import * as Localization from 'expo-localization';

import {initReactI18next} from 'react-i18next';

// Load translation JSONs
import en from '../constants/locales/en.json';
import fr from '../constants/locales/fr.json';
import es from '../constants/locales/es.json';
import hi from '../constants/locales/hi.json';
import pa from '../constants/locales/pa.json';
import bn from '../constants/locales/bn.json';
import de from '../constants/locales/de.json';
import ps from '../constants/locales/ps.json';
import pl from '../constants/locales/pl.json';
import am from '../constants/locales/am.json';
import ar from '../constants/locales/ar.json';
import ro from '../constants/locales/ro.json';
import ru from '../constants/locales/ru.json';
import som from '../constants/locales/som.json';
import ur from '../constants/locales/ur.json';
import ta from '../constants/locales/ta.json';
import pt from '../constants/locales/pt.json';
import tr from '../constants/locales/tr.json';
import zh from '../constants/locales/zh.json';
import uk from '../constants/locales/uk.json';

import gu from '../constants/locales/gu.json';
import it from '../constants/locales/it.json';
import dari from '../constants/locales/fa-AF.json';
import fa from '../constants/locales/fa-IR.json';
import ti from '../constants/locales/ti.json';
import sq from '../constants/locales/sq.json';
import lt from '../constants/locales/lt.json';
import bg from '../constants/locales/bg.json';
import sr from '../constants/locales/sr.json';
import sw from '../constants/locales/sw.json';
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_KEY = 'user-language';

const resources = {
    en: { translation: en },
    bn: { translation: bn },
    pl: { translation: pl },
    am: { translation: am },
    ar: { translation: ar },
    de: { translation: de },
    es: { translation: es },
    fr: { translation: fr },
    hi: { translation: hi },
    pa: { translation: pa },
    ps: { translation: ps },
    ro: { translation: ro },
    so: { translation: som },
    ur: { translation: ur },
    ru: { translation: ru },
    ta: { translation: ta },
    pt: { translation: pt },
    tr: { translation: tr },
    zh: { translation: zh },
    uk: { translation: uk },

    // ✅ New Languages
    gu: { translation: gu },
    it: { translation: it },
    "fa-AF": { translation: dari },     // Dari
    fa: { translation: fa },       // Farsi (Persian)
    ti: { translation: ti },
    sq: { translation: sq },
    lt: { translation: lt },
    bg: { translation: bg },
    sr: { translation: sr },
    sw: { translation: sw }
};


export const languageDataList = [
    { id: 1, name: "English", code: "en", fullCode: "en-GB" },
    { id: 2, name: "German", code: "de", fullCode: "de-DE" },
    { id: 3, name: "Arabic", code: "ar", fullCode: "ar-SA" },
    { id: 4, name: "Polish", code: "pl", fullCode: "pl-PL" },
    { id: 5, name: "Urdu", code: "ur", fullCode: "ur-PK" },
    { id: 6, name: "Romanian", code: "ro", fullCode: "ro-RO" },
    { id: 7, name: "Somali", code: "so", fullCode: "so-SO" }, // ✅ fixed
    { id: 8, name: "Pashto", code: "ps", fullCode: "ps-AF" },
    { id: 9, name: "Amharic", code: "am", fullCode: "am-ET" },
    { id: 10, name: "Spanish", code: "es", fullCode: "es-ES" },
    { id: 11, name: "French", code: "fr", fullCode: "fr-FR" },
    { id: 12, name: "Hindi", code: "hi", fullCode: "hi-IN" },
    { id: 13, name: "Punjabi", code: "pa", fullCode: "pa-IN" },
    { id: 14, name: "Bengali", code: "bn", fullCode: "bn-BD" },
    { id: 15, name: "Russian", code: "ru", fullCode: "ru-RU" },
    { id: 16, name: "Tamil", code: "ta", fullCode: "ta-IN" },
    { id: 17, name: "Portuguese", code: "pt", fullCode: "pt-PT" },
    { id: 18, name: "Turkish", code: "tr", fullCode: "tr-TR" },
    { id: 19, name: "Chinese", code: "zh", fullCode: "zh-CN" },
    { id: 20, name: "Ukrainian", code: "uk", fullCode: "uk-UA" },

    { id: 21, name: "Gujarati", code: "gu", fullCode: "gu-IN" },
    { id: 22, name: "Italian", code: "it", fullCode: "it-IT" },
    { id: 23, name: "Dari", code: "fa-AF", fullCode: "fa-AF" }, // ✅ fixed
    { id: 24, name: "Farsi (Persian)", code: "fa", fullCode: "fa-IR" },
    { id: 25, name: "Tigrinya", code: "ti", fullCode: "ti-ER" },
    { id: 26, name: "Albanian", code: "sq", fullCode: "sq-AL" },
    { id: 27, name: "Lithuanian", code: "lt", fullCode: "lt-LT" },
    { id: 28, name: "Bulgarian", code: "bg", fullCode: "bg-BG" },
    { id: 29, name: "Serbian", code: "sr", fullCode: "sr-RS" },
    { id: 30, name: "Swahili", code: "sw", fullCode: "sw-KE" }
];

/*export const remainingList = [
    { id: 1, name: "Japanese", code: "ja" },
    { id: 2, name: "Korean", code: "ko" },
    { id: 3, name: "Dutch", code: "nl" },
    { id: 4, name: "Vietnamese", code: "vi" },
    { id: 5, name: "Thai", code: "th" },
    { id: 6, name: "Tagalog", code: "tl" },
    { id: 9, name: "Kurdish", code: "ku" },
    { id: 13, name: "Hungarian", code: "hu" },
    { id: 14, name: "Czech", code: "cs" },
    { id: 15, name: "Nepali", code: "ne" },
    { id: 17, name: "Azerbaijani", code: "az" },
    { id: 18, name: "Croatian", code: "hr" },
    { id: 19, name: "Hebrew", code: "he" },
    { id: 20, name: "Slovak", code: "sk" },
    { id: 21, name: "Malay", code: "ms" },
    { id: 22, name: "Bosnian", code: "bs" },
    { id: 23, name: "Burmese", code: "my" },
    { id: 24, name: "Khmer", code: "km" },
    { id: 25, name: "Central Kurdish", code: "ckb" },
    { id: 26, name: "Sinhala", code: "si" },
    { id: 27, name: "Malayalam", code: "ml" },
];*/

export const initI18n = async () => {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);


   let fallbackLang = 'en';
   if(Localization.getLocales().length > 0) {
       fallbackLang = Localization.getLocales()[0].languageCode || 'en'
   }

    await i18n
        .use(initReactI18next)
        .init({
            debug:true,
            compatibilityJSON: 'v3',
            resources,
            lng: savedLang,
            fallbackLng: fallbackLang || 'en',
            interpolation: {
                escapeValue: false,
            },
            supportedLngs: false
        } as any);
};

/* const setAppDirection = async (language: string) => {
    const isRTL = RTL_LANGUAGES.includes(language);

    if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
        I18nManager.allowRTL(isRTL);

        // You must reload the app for a direction to apply
        if (Updates?.reloadAsync) {
            await Updates.reloadAsync();
        } else {
            console.warn('Please restart the app manually to apply direction.');
        }
    }
};*/

export const changeAppLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  //  setAppDirection(lang);

};

export const getAppSelectedLanguage = async () => {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
    let fallbackLang = 'en';
    if(Localization.getLocales().length > 0) {
        fallbackLang = Localization.getLocales()[0].languageCode || 'en'
    }

    return savedLang || fallbackLang;
}

export default i18n;
