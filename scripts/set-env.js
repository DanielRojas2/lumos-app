const fs = require('fs');
const path = require('path');

// Project paths
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const envDir = path.join(rootDir, 'src', 'environments');
const targetDev = path.join(envDir, 'environment.ts');
const targetProd = path.join(envDir, 'environment.prod.ts');

// Function to parse .env file manually without external dependency
function parseEnvFile(filePath) {
  const envVars = {};
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx !== -1) {
        const key = trimmed.slice(0, equalsIdx).trim();
        let value = trimmed.slice(equalsIdx + 1).trim();
        // Remove enclosing quotes if any
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        envVars[key] = value;
      }
    }
  }
  return envVars;
}

const fileVars = parseEnvFile(envPath);

function getVar(key, defaultValue = '') {
  return process.env[key] || fileVars[key] || defaultValue;
}

const config = {
  apiKey: getVar('FIREBASE_API_KEY', 'AIzaSyB_4ShS_ImjN-sn66ymCJyeAKoa_F0ZUk8'),
  authDomain: getVar('FIREBASE_AUTH_DOMAIN', 'lumos-agenda-app.firebaseapp.com'),
  projectId: getVar('FIREBASE_PROJECT_ID', 'lumos-agenda'),
  storageBucket: getVar('FIREBASE_STORAGE_BUCKET', 'lumos-agenda.firebasestorage.app'),
  messagingSenderId: getVar('FIREBASE_MESSAGING_SENDER_ID', '160633031688'),
  appId: getVar('FIREBASE_APP_ID', '1:160633031688:web:1f14ec696475b1f6ae55bd'),
  googleWebClientId: getVar('GOOGLE_WEB_CLIENT_ID', '160633031688-8dcn55vbug7s0ei3p3b7ekk89b4coqq5.apps.googleusercontent.com')
};

function generateContent(isProd) {
  return `// Archivo autogenerado a partir de .env por scripts/set-env.js
// NO EDITAR MANUALMENTE ESTE ARCHIVO. Modifica el archivo .env en la raíz del proyecto.
export const environment = {
  production: ${isProd},
  firebase: {
    apiKey: ${JSON.stringify(config.apiKey)},
    authDomain: ${JSON.stringify(config.authDomain)},
    projectId: ${JSON.stringify(config.projectId)},
    storageBucket: ${JSON.stringify(config.storageBucket)},
    messagingSenderId: ${JSON.stringify(config.messagingSenderId)},
    appId: ${JSON.stringify(config.appId)}
  },
  googleWebClientId: ${JSON.stringify(config.googleWebClientId)}
};
`;
}

if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

fs.writeFileSync(targetDev, generateContent(false), 'utf-8');
fs.writeFileSync(targetProd, generateContent(true), 'utf-8');

console.log('✅ [Lumos] Archivos environment.ts y environment.prod.ts generados exitosamente desde .env');
