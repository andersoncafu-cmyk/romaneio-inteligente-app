
import { Manifest, AppSettings } from '../types';

const MANIFESTS_KEY = 'romaneio_manifests';
const SETTINGS_KEY = 'romaneio_settings';

export const storageService = {
  getManifests: (): Manifest[] => {
    const data = localStorage.getItem(MANIFESTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveManifests: (manifests: Manifest[]): void => {
    localStorage.setItem(MANIFESTS_KEY, JSON.stringify(manifests));
  },

  getSettings: (): AppSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { defaultFreightRate: 2 };
  },

  saveSettings: (settings: AppSettings): void => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};
