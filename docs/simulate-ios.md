# Run on the iOS Simulator

This guide explains how to run **penny.ai** on the Apple iOS Simulator on your Mac. No physical iPhone or paid Apple Developer account is required.

## Prerequisites

- Mac with [Xcode](https://apps.apple.com/us/app/xcode/id497799835) installed (includes the Simulator)
- This repository cloned and dependencies installed (`npm install`)

## 1. Open the Simulator app

Press **Cmd + Space** to open Spotlight Search, type **Simulator**, and press Enter. This launches the Simulator directly without opening the full Xcode interface.

## 2. Select iPhone 17

1. In the Simulator menu bar, click **File → Open Simulator**.
2. Select the latest iOS version.
3. Choose **iPhone 17** from the device list.
4. Wait a few seconds for the virtual device to finish booting.

## 3. Navigate to your project

Open Terminal and change into the directory where you cloned **penny.ai**:

```bash
cd ~/path/to/penny.ai
```

Replace the path with your actual clone location.

## 4. Start the app (Expo Go method)

Best for standard Expo projects without custom native code.

From the project root, run:

```bash
npm start
```

or:

```bash
npx expo start
```

When the dev server starts and you see the QR code in the terminal, press **`i`** on your keyboard. Expo installs **Expo Go** on the simulator (if needed) and opens **penny.ai**.

> **Note:** **penny.ai** includes `expo-dev-client` and Firebase. If Expo Go fails to load the app or reports missing native modules, use the dev build method in step 5 instead.

## 5. Start the app (dev build method)

Use this when the project requires custom native code that Expo Go cannot provide—for example, certain Firebase native setups or other native dependencies bundled via `expo-dev-client`.

With the iPhone 17 simulator open, run:

```bash
npx expo run:ios
```

You can also use the npm script:

```bash
npm run ios:run
```

This compiles the native app and launches it directly on the open simulator. The first build may take several minutes.

After the dev build is installed, start the Metro bundler with the dev client:

```bash
npm run start:dev
```

or:

```bash
npx expo start --dev-client
```

Then open the **penny.ai** app on the simulator if it does not connect automatically.

## Troubleshooting

| Issue | What to try |
| --- | --- |
| Simulator not listed when pressing `i` | Open Simulator first (steps 1–2), then press `i` again. |
| `expo run:ios` fails | Install CocoaPods: `sudo gem install cocoapods`, then run `npx expo prebuild --platform ios` and retry. |
| `fmt` / `FMT_STRING` / `consteval` build errors (Xcode 26+) | React Native 0.81 ships fmt 11.0.2, which fails on Xcode 26. Run `cd ios && pod install` (the project patches fmt automatically), then retry `npm run ios:run`. If you regenerated `ios/` with prebuild, the config plugin in `plugins/withXcode26FmtFix.js` re-applies the fix. |
| App opens but shows a connection error | Ensure Metro is running (`npm start` or `npm run start:dev` for dev builds). |
| Wrong simulator device | In Simulator, use **File → Open Simulator** to switch to iPhone 17, then rerun the launch command. |

## Related

- [Export and run on a physical iPhone](./export-ios-app.md) — install on a real device with a free Apple ID
