# LawNeeds frontend demo

Expo / React Native application source with native iOS and Android projects. Tests, development utilities, and excess documentation have been removed.

## Local setup

```sh
npm ci
cp .env.example .env
```

Start the backend demo on port 8000. The app defaults to the local API. For a physical device, replace localhost in both URLs with your computer's LAN IP; Android emulators normally use 10.0.2.2.

Provide your own Firebase configuration in `setup/google-services.json`, `setup/GoogleService-Info.plist`, `android/app/google-services.json`, and `ios/LawNeeds/GoogleService-Info.plist`. Review `app.json` and native configuration for your own app identifiers, OAuth settings, service keys, and signing. Credential files were intentionally excluded. Set the Stripe sandbox publishable key if demonstrating payments.

```sh
npm run android
# Or, on macOS with Xcode:
npm run ios
```

Use `npm start` for the development server after installing the native app. This app requires a native development build, not Expo Go. Native projects, plugins, and assets are retained because the app uses Firebase, Stripe, Persona, and other native integrations. The EAS configuration includes only a local-API development profile; configure a reachable demo API for builds used away from your computer.

This is not an offline mock: full features require the backend and your own sandbox integrations. Builds have not been verified. Review remaining source and assets before public publication.
