# Export and Run on a Physical iPhone (Free Apple ID)

This guide explains how to build and install **penny.ai** on a physical iPhone using a **free Apple ID** and a local Xcode build. This is the recommended path when you do not have a paid Apple Developer account.

## Why not EAS cloud builds?

Apple does not allow installing apps directly to a device using [EAS](https://expo.dev/eas) (Expo Application Services) cloud builds without a paid Developer account. You **can**, however, build and install the app locally using Xcode and a free Apple ID.

## Prerequisites

- Mac with Xcode installed
- iPhone connected via USB-C
- Free Apple ID (personal team)
- This repository cloned and dependencies installed (`npm install`)

## 1. Set up your local environment

Install the tools below on your Mac before you start.

### Install Xcode

Download and install [Xcode](https://apps.apple.com/us/app/xcode/id497799835) from the Mac App Store. It is a large download and may take a while.

### Install CocoaPods

If you do not already have CocoaPods:

```bash
sudo gem install cocoapods
```

### Install `expo-dev-client`

From the project root:

```bash
npx expo install expo-dev-client
```

This library is required for custom development builds. **penny.ai** already includes `expo-dev-client` in `app.json`; run the command above if your local install is out of date.

## 2. Prebuild the native code

Expo projects usually hide the native `ios` and `android` folders. To build locally with Xcode, generate the iOS project:

```bash
npx expo prebuild --platform ios
```

This creates an `ios` directory containing the Xcode workspace for bundle ID `com.rushikc.pennyai`.

## 3. Add your free Apple ID to Xcode

1. Open **Xcode**.
2. Go to **Xcode → Settings → Accounts** (or **Preferences → Accounts** on older versions).
3. Click the **+** button at the bottom left, select **Apple ID**, and sign in with your regular, free Apple ID.

## 4. Configure signing in Xcode

1. In your project folder, open the `ios` directory and double-click the **`.xcworkspace`** file (not the `.xcodeproj` file).
2. In the left navigator pane, click the project name at the top.
3. Select the **penny.ai** app target under **Targets**.
4. Open the **Signing & Capabilities** tab.
5. Check **Automatically manage signing**.
6. In the **Team** dropdown, select your personal Apple ID (it will likely show as `[Your Name] (Personal Team)`).

## 5. Trust the developer on your iPhone

Apps signed with a free account require explicit trust on the device.

1. Connect your iPhone to your Mac via USB-C.
2. Unlock your iPhone and, if prompted, choose **Trust This Computer**.
3. In Xcode, use the device selector at the top center (it may say **Any iOS Device** or a simulator name). Select your physical iPhone.
4. Click the **Play** button (Build and Run) in the top-left corner of Xcode.

## 6. Approve the app on your device

The app will compile and install, but it may not open until you trust the developer certificate.

1. On your iPhone, open **Settings**.
2. Go to **General → VPN & Device Management** (or **Device Management** on some iOS versions).
3. Under **Developer App**, tap the Apple ID you used to sign the app.
4. Tap **Trust "[Your Apple ID]"** and confirm.

## 7. Start the Expo dev server

With the native shell installed on your phone, serve the JavaScript bundle from your machine:

1. In a terminal at the project root, run:

   ```bash
   npx expo start
   ```

2. Open the **penny.ai** app on your iPhone. It should connect to your local development server so you can test changes.

## Important: 7-day certificate expiry

With a **free** Apple account, the provisioning profile expires after **7 days**. When the app stops launching:

1. Reconnect your iPhone to your Mac.
2. Open the `.xcworkspace` in Xcode.
3. Click **Play** to rebuild and reinstall, which refreshes the certificate.

## Troubleshooting

| Issue | What to try |
| --- | --- |
| Build fails in Xcode | Run `cd ios && pod install && cd ..`, then prebuild again if needed. |
| Device not listed in Xcode | Unlock the phone, trust the computer, and ensure a cable/data connection. |
| App installed but won't open | Complete step 6 (trust the developer in Settings). |
| Cannot connect to Metro | Ensure Mac and iPhone are on the same Wi‑Fi network, or use tunnel mode: `npx expo start --tunnel`. |
