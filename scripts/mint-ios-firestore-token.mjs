#!/usr/bin/env node
/**
 * Mint a Firebase custom auth token for iOS Firestore access.
 *
 * Prerequisites:
 *   1. Download service account JSON from Firebase Console:
 *      Project settings → Service accounts → Generate new private key
 *   2. Save as ./secrets/firebase-sa.json (this folder is gitignored)
 *   3. Set in .env (or export):
 *        FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-sa.json
 *        PENNY_DEVICE_TOKEN_SECRET=your-long-random-secret
 *   4. Run: npm run mint:ios-token
 */

import {existsSync, readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const IOS_DEVICE_UID = 'penny-ios-device';

function loadDotEnv() {
  const envPath = resolve(projectRoot, '.env');
  if (!existsSync(envPath)) {
    return;
  }
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const raw = trimmed.slice(eq + 1).trim();
    const value = raw.replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const serviceAccountPathRaw =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS;

const deviceTokenSecret = process.env.PENNY_DEVICE_TOKEN_SECRET?.trim();

if (!serviceAccountPathRaw) {
  console.error(`
Missing FIREBASE_SERVICE_ACCOUNT_PATH.

Add to .env:
  FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-sa.json

Then download the key file:
  Firebase Console → Project settings → Service accounts → Generate new private key
  Save the downloaded JSON as: secrets/firebase-sa.json
`);
  process.exit(1);
}

if (!deviceTokenSecret) {
  console.error(`
Missing PENNY_DEVICE_TOKEN_SECRET.

Add to .env (pick a long random string — same value goes in firestore.rules):
  PENNY_DEVICE_TOKEN_SECRET=your-long-random-secret
`);
  process.exit(1);
}

const serviceAccountPath = resolve(projectRoot, serviceAccountPathRaw);

if (!existsSync(serviceAccountPath)) {
  console.error(`
Service account file not found:
  ${serviceAccountPath}

Download it from Firebase Console:
  1. Open https://console.firebase.google.com → your project (finance-rushi-gd4sh)
  2. Project settings (gear) → Service accounts
  3. Click "Generate new private key" → save the JSON file
  4. Move/rename it to:
       secrets/firebase-sa.json

Or set FIREBASE_SERVICE_ACCOUNT_PATH in .env to wherever you saved the file.
`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

try {
  await admin.auth().getUser(IOS_DEVICE_UID);
} catch (error) {
  if (error.code === 'auth/user-not-found') {
    await admin.auth().createUser({
      uid: IOS_DEVICE_UID,
      displayName: 'penny.ai iOS device',
    });
    console.error(`Created Firebase user: ${IOS_DEVICE_UID}`);
  } else {
    throw error;
  }
}

const customToken = await admin.auth().createCustomToken(IOS_DEVICE_UID, {
  penny_device_token: deviceTokenSecret,
});

console.log('\nAdd to .env:\n');
console.log(`EXPO_PUBLIC_IOS_FIRESTORE_CUSTOM_TOKEN=${customToken}\n`);
console.log(
  'Also ensure firestore.rules uses the same PENNY_DEVICE_TOKEN_SECRET in isIosDeviceTokenUser(), then publish rules.\n',
);
