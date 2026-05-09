<div align="center">
  <br/>
  <img src="assets/logo_low_res.png" alt="penny.ai Logo" width="150px" />
  <h1>penny.ai</h1>
  <h3>Track, Analyze, and Master Your Personal Finances</h3>
</div>

<p align="center">
  <a href="#license">License</a> •
  <a href="#overview">Overview</a> •
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#Security-and-Cost">Security and Cost</a> •
  <a href="#technology-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#Future-Roadmap">Future Roadmap</a> •
  <a href="#support-the-project">Support Project</a>
</p>

---
> **Disclaimer:** penny.ai is under active development. Still in a early phase
> * Currently not accespting any contributions
> * Contributions will be made available after version 2 is released
>
> Using **Google Gemini** for tagging and descriptions requires API access and may incur usage costs. Review your `.env` and provider quotas before relying on it in production.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

## Overview

**penny.ai** is an open-source personal finance app built with [Expo](https://expo.dev/) and React Native. It helps you track expenses, categorize spending, and see patterns—with a mobile-first experience and a deeper take on transaction email context than parsing a single message in isolation.

Inspired from my old project — [pennywise](https://github.com/rushikc/pennywise).

For each transaction, the app can look at **N emails before and after** the alert to gather context, then use **Google Gemini** to suggest **automatic tags** and a clearer **description** of the expense.

## Features

* 📱 **Mobile-first**: Native-style UI with Expo Router, tabs for home, stats, budget, and profile.
* 📊 **Expense tracking**: Add, edit, merge, and filter expenses; visualize spending with charts.
* 📧 **Email-aware imports**: Bring in expenses from bank or wallet mail (integration and coverage depend on your setup).
* 🏷️ **Tagging**: Organize spending with custom tags and vendor–tag mappings.
* 🤖 **AI-assisted tagging**: Gemini proposes tags and human-readable descriptions using multi-email context—not only the lone transaction email.
* 📅 **Time filters**: Focus analysis on days, weeks, or custom ranges.
* 🔒 **Google sign-in**: OAuth-friendly flows via Expo Auth Session for account access.
* ☁️ **Firebase**: Firestore and related services for sync and backend data (as configured in your project).

## Demo

A hosted demo is not published yet. Run the app locally with [Getting Started](#getting-started) (Expo Go or a dev client build). Screenshots can be added here once a stable public build exists.

## Getting Started

Clone the repository, install dependencies, and start the Metro bundler:

```bash
npm install
npm start
```

Then open on a simulator or device (`npm run ios`, `npm run android`) or on the web (`npm run web`). For device builds with native modules, use Expo dev client / EAS—see [`eas.json`](eas.json) and the [Expo EAS](https://docs.expo.dev/eas/) documentation.

**Configuration:** copy `.env.example` to `.env`, add Firebase and Gemini (and any Gmail-related) keys. Do not commit `.env`.

## Security and Cost

penny.ai is built so you stay in control of your data and spend:

* **🔒 Your data**: Financial records live in **your** Firebase project (and local device storage) when you configure the app that way—not on penny.ai-owned servers.
* **☁️ Your cloud bill**: You pay Google Cloud / Firebase and Gemini usage according to your own project’s quotas and pricing.
* **🚫 No ads in this repo**: The open-source app does not embed third-party ads; what you ship is up to you.
* **📖 Open source**: Inspect the code for how auth, email, and AI calls behave.
* **🔐 OAuth**: Sign-in flows use standard OAuth patterns; you manage client IDs and secrets in your developer consoles.
* **🔑 Scope minimization**: When integrating Gmail or similar, request only the scopes needed for transaction discovery.
* **🤖 Gemini**: Sending email snippets to Gemini is optional and configurable; treat prompts and retention per Google’s AI terms and your privacy needs.

## Technology Stack

penny.ai uses a modern mobile stack:

### Mobile app

* **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (~54)
* **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
* **Type safety**: [TypeScript](https://www.typescriptlang.org/)
* **UI**: [React Native Paper](https://callstack.github.io/react-native-paper/), [react-native-gifted-charts](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts)

### State management

* **Redux Toolkit**: [Redux Toolkit](https://redux-toolkit.js.org/) with [React Redux](https://react-redux.js.org/)

### Data & sync

* **Cloud**: [Firebase](https://firebase.google.com/) (e.g. Firestore) as wired in your config
* **On-device**: [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/)

### Authentication

* **OAuth**: [expo-auth-session](https://docs.expo.dev/guides/authentication/), [expo-web-browser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)

### Utilities

* **Dates**: [dayjs](https://day.js.org/)
* **HTTP**: [axios](https://axios-http.com/)

### AI

* **Google Gemini**: Used (or planned) for contextual tagging and expense descriptions from multi-email context—configure via environment / backend as implemented.

## Project Structure

```
penny.ai/
├── app/                    # Expo Router screens & layouts
│   ├── (tabs)/             # Tab routes: home, budget, stats, profile
│   ├── login.tsx
│   ├── config.tsx
│   └── ...                 # Settings flows, reload, tag tools, etc.
├── assets/                 # Icons, logos, splash art
├── src/                    # Shared app logic (API, store, pages, Firebase)
│   ├── api/
│   ├── components/
│   ├── firebase/
│   ├── hooks/
│   ├── pages/
│   ├── store/
│   └── utility/
├── app.json                # Expo configuration
├── eas.json                # EAS Build profiles
├── index.ts                # Entry (expo-router/entry)
└── package.json
```

## Architecture

### Overview

1. **User authentication**  
   Users sign in with Google (or as implemented) via Expo Auth Session; tokens feed your backend/Firebase rules.

2. **Data loading**  
   Expenses and tags load from Firestore (and/or local persistence); Redux holds working state for lists, filters, and charts.

3. **User interactions**  
   Tabs and stack screens support listing expenses, editing, tagging, budgets, and stats; settings screens manage tags and automation.

4. **Email + AI pipeline**  
   Transaction detection can use **N surrounding emails** for context; **Gemini** proposes tags and descriptions before persisting to your store.

5. **Persistence**  
   Writes go to Firebase and local storage according to your implementation, with sync when online.

### Architecture diagram

_Add a diagram under `assets/` or `docs/` and link it here when available._

## Application Sections

* **Home**: Recent transactions, add/edit expenses, tagging, filters, and grouping.
* **Stats**: Charts and breakdowns by tags and time ranges to spot spending patterns.
* **Budget**: Monthly (or per-category) budgets and progress toward limits.
* **Profile**: Account, sign-out, and entry points to configuration and tag management.
* **Stack screens**: Login, app configuration, auto-tag rules, vendor–tag maps, data reload utilities, and related settings flows.


## Support the Project

<a href="https://www.buymeacoffee.com/arcticfoxrc"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=arcticfoxrc&button_colour=5F7FFF&font_colour=ffffff&font_family=Lato&outline_colour=000000&coffee_colour=FFDD00" /></a>

---
<div align="center">
  <p>Created with ❤️ by <a href="https://github.com/rushikc"> rushikc </a> & <a href="https://cursor.com/">Cursor</a></p>
  <p>rushikc.dev@gmail.com</p>
</div>
