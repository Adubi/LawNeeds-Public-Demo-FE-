# LawNeeds Frontend

LawNeeds is a legal services platform connecting clients with legal professionals. This repository contains the mobile application source for account management, legal enquiries, professional discovery, referrals, consultations, and casework.

Built with React Native and Expo, the application communicates with the LawNeeds backend through HTTP APIs and WebSocket connections. It includes client and professional workflows, reusable interface components, and multilingual content.

## Features

- **Accounts and profiles:** registration, sign-in, onboarding, profile management, and professional information.
- **Legal assistance:** conversational enquiries, voice input, document attachments, and responses from the backend's legal assistance services.
- **Professional discovery:** search, filtering, professional profiles, and service requests.
- **Referrals and casework:** request details, consultation categories, budgets, and professional fee proposals.
- **Consultations:** booking interfaces, session status, timers, extension requests, and consultation communication.
- **Messaging:** inboxes, conversation screens, attachments, and real-time updates.
- **Payments and subscriptions:** Stripe payment interfaces, subscription management, and usage limits.
- **Identity and notifications:** identity verification flows, push notification handling, and account status prompts.
- **Localisation:** translated interface content and language selection.

## Technology

| Area | Implementation |
| --- | --- |
| Mobile framework | React Native 0.81, React 19 |
| Application tooling | Expo SDK 54 |
| Navigation | Expo Router and React Navigation |
| Language | TypeScript and JavaScript |
| State | React context and Zustand |
| API communication | Axios and WebSocket integrations |
| Local storage | AsyncStorage |
| Localisation | i18next and react-i18next |
| Payments | Stripe React Native SDK |
| Subscriptions | RevenueCat |
| Notifications and analytics | Firebase integrations |
| Identity verification | Persona |

## Repository structure

```text
app/             Expo Router screens, layouts, and navigation
components/      Shared interface and feature components
constants/       Translations, themes, and application constants
contexts/        Shared React context providers
helpers/         Feature helpers
hooks/           Reusable React hooks
plugins/         Expo native configuration plugins
services/        API clients and integration logic
store/           Application state
types/          Shared TypeScript definitions
utils/           Utility functions
app.json         Expo application and plugin configuration
eas.json         Development build configuration
.env.example     Local environment template
```

## Requirements

- Node.js compatible with Expo SDK 54 and npm
- A configured LawNeeds backend
- Android Studio and Android SDK tools for Android development
- macOS and Xcode for iOS development
- Replacement images, icons, splash assets, and fonts
- Service configuration for the integrations included in the build

## Source snapshot

This repository contains application source and Expo configuration. Bundled assets and the native `ios/` and `android/` directories are intentionally omitted. Asset imports and configuration references remain in the source and must be supplied or updated before building.

The application requires a native development build because it uses native integrations such as Firebase, Stripe, and Persona. Expo Go does not provide the complete runtime required by this app.

## Local installation

From the repository root:

```sh
npm ci
cp .env.example .env
```

Before generating native projects:

1. Supply replacement files for the asset paths referenced by screens, components, and `app.json`, or update those references to the replacement paths.
2. Configure application identifiers, URL schemes, OAuth settings, and provider configuration for the demo in `app.json` and the relevant service modules.
3. Add Firebase configuration at `setup/google-services.json` and `setup/GoogleService-Info.plist`, matching the paths in `app.json`.
4. Configure the backend API and WebSocket addresses in `.env`.
5. Configure sandbox credentials for payment, subscription, and identity verification features as needed.

Generate the native projects:

```sh
npm run prebuild
```

Build and run on Android:

```sh
npm run android
```

Build and run on iOS from macOS:

```sh
npm run ios
```

For subsequent JavaScript development with the native app installed:

```sh
npm start
```

## Environment configuration

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_APP_ENV` | Selects the API environment; use `local` for the demo. |
| `EXPO_PUBLIC_LOCAL_API_URL` | HTTP address of the local backend. |
| `EXPO_PUBLIC_LOCAL_WS_URL` | WebSocket address of the local backend. |
| `EXPO_PUBLIC_PUBLISHABLE_KEY` | Stripe sandbox publishable key. |

The supplied environment template targets port 8000 on `localhost`. For an Android emulator, the host computer is typically reachable at `10.0.2.2`. A physical device requires the computer's reachable LAN address, and the backend must listen on an interface accessible to that device.

The environment selector in `services/environment.ts` defaults to local when no recognised environment is supplied. It also retains development and production configurations; review those addresses before selecting another environment.

Values prefixed with `EXPO_PUBLIC_` are included in the app bundle. Backend secrets, Stripe secret keys, and service-account private keys do not belong in these variables.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm start` | Starts the Expo development server for a development client. |
| `npm run prebuild` | Generates native iOS and Android projects from Expo configuration. |
| `npm run android` | Builds and runs the Android application. |
| `npm run ios` | Builds and runs the iOS application. |
| `npm run typecheck` | Runs TypeScript checks without emitting files. |
| `npm run build:dev` | Starts a local EAS development build. |

The EAS configuration includes an internal development profile using the local API environment. Builds installed on other devices require a reachable backend address. No TestFlight or production distribution profile is included in this demo configuration.

## Backend integration

The frontend depends on the LawNeeds backend for authentication, legal assistance, referrals, session management, messaging, and payment operations. The backend must be configured with its own database and provider credentials.

Stripe frontend and backend keys must belong to the same sandbox account. Subscription, notification, identity verification, and other provider-dependent features also require matching application and backend configuration.

## Demo scope

The repository retains the main application screens, reusable components, translations, and service clients. Unused starter components, sample data, tests, bundled assets, and native projects are omitted.

This is an integration-based application, not an offline mock. Native builds and end-to-end workflows have not been verified for this reduced source snapshot. Restoring assets and completing provider configuration are required before a runnable demo can be produced.
