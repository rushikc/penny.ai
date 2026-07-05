# Firebase secrets (gitignored)

Place your Firebase Admin service account JSON here:

```
firebase-sa.json
```

## How to get the file

1. Open [Firebase Console](https://console.firebase.google.com) → project **finance-rushi-gd4sh**
2. **Project settings** (gear) → **Service accounts**
3. Click **Generate new private key** and confirm
4. Save the downloaded JSON as `secrets/firebase-sa.json`

Then in `.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-sa.json
PENNY_DEVICE_TOKEN_SECRET=your-long-random-secret
```

Run:

```bash
npm run mint:ios-token
```
