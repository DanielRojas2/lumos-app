import type { CapacitorConfig } from '@capacitor/cli';
import * as fs from 'fs';
import * as path from 'path';

let googleWebClientId = '';
try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/GOOGLE_WEB_CLIENT_ID\s*=\s*([^\r\n]+)/);
    if (match) {
      googleWebClientId = match[1].trim().replace(/^['"]|['"]$/g, '');
    }
  }
} catch {}

const config: CapacitorConfig = {
  appId: 'com.lumos.agenda',
  appName: 'Lumos',
  webDir: 'dist/lumos-agenda/browser',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: googleWebClientId || process.env['GOOGLE_WEB_CLIENT_ID'] || '160633031688-8dcn55vbug7s0ei3p3b7ekk89b4coqq5.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_notification',
      iconColor: '#FF3300'
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true
    }
  }
};

export default config;
