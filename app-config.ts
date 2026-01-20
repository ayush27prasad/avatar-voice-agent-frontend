import type { AppConfig } from './lib/types';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'SuperBryn',
  pageTitle: 'Booking Assistant',
  pageDescription: 'A booking assistant',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,

  logo: '/sb_logo.png',
  accent: '#002cf2',
  logoDark: '/sb_logo.png',
  accentDark: '#1fd5f9',
  startButtonText: 'Start a call',
};
