import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rushup.pos',
  appName: 'RUSH UP POS',
  webDir: 'out',
  server: {
    url: 'https://101-blush.vercel.app',
    cleartext: true,
    allowNavigation: ['access.line.me', 'api.line.me', '*.line.me', 'profile.line-scdn.net']
  }
};

export default config;
