# GatherPlux Mobile

Expo/React Native mobile app for GatherPlux.

## Local Setup

Run commands from this folder:

```bash
cd C:/Users/kriss/gatherplux/gatherplux_mobile/gatherplus
npm install
```

Create a local env file:

```bash
cp .env.example .env
```

For a physical phone, set `EXPO_PUBLIC_CORE_API_URL` in `.env` to your computer LAN IP, for example:

```bash
EXPO_PUBLIC_CORE_API_URL=http://192.168.1.50:3000/api/v1
EXPO_PUBLIC_PROVIDER_API_URL=http://192.168.1.50:3002/api/v1/provider
EXPO_PUBLIC_PAYMENT_BASE_URL=http://192.168.1.50:3002/api/v1/payment
```

Login and signup use Google reCAPTCHA v3 when `EXPO_PUBLIC_RECAPTCHA_SITE_KEY`
is set. The site key is public; keep `RECAPTCHA_SECRET_KEY` only on the backend.

The development default is local backend URLs, not the live Render backend. Only set
`EXPO_PUBLIC_ALLOW_PRODUCTION_API_IN_DEV=true` when you intentionally want a dev bundle to hit production.

## Start The App

For the dev-client build:

```bash
npm run start:dev-client
```

This app uses native modules, so Expo Go is not expected to be enough for full testing.

## Development Builds

Android physical device:

```bash
npx eas build --profile development-device --platform android
```

iPhone physical device:

```bash
npx eas build --profile development-device --platform ios
```

The existing `development` profile still targets the iOS simulator. Use `development-device` for a real phone.

## Checks

```bash
npm run typecheck
npm run lint
```

## Production Safety

Do not run production OTA updates while testing:

```bash
# Do not run this during mobile parity work:
eas update --channel production
```

Production builds should use the `production` EAS profile, which points at the live backend URLs.
