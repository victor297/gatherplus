type AppEnvironment = "development" | "preview" | "production";

const PRODUCTION_CORE_API_URL = "https://gather-plus-backend-core.onrender.com/api/v1";
const PRODUCTION_PAYMENT_API_URL =
  "https://gather-plus-backend-event.onrender.com/api/v1/payment";
const PRODUCTION_PROVIDER_API_URL =
  "https://gather-plus-backend-event.onrender.com/api/v1/provider";
const PRODUCTION_WEB_URL = "https://www.gatherplux.com";

const DEVELOPMENT_CORE_API_URL = "http://localhost:3000/api/v1";
const DEVELOPMENT_PAYMENT_API_URL = "http://localhost:3002/api/v1/payment";
const DEVELOPMENT_PROVIDER_API_URL = "http://localhost:3002/api/v1/provider";
const DEVELOPMENT_WEB_URL = "http://localhost:3000";

const FALLBACK_STRIPE_PUBLISHABLE_KEY =
  "pk_test_51Nk1wiFLuyhBQgukGDJJb5uq2EKd8olb2Yy6Bbm9m2GiXsObMKJEcZ4M88KKwSOYcPylFlfCz0RHwiov5U0F6ykv00TMcLXTUJ";
const FALLBACK_RECAPTCHA_SITE_KEY = "6Lef2wwtAAAAABKg6M0vjzHkV7nmjpblwy1KQyw3";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const readEnvironment = (): AppEnvironment => {
  const value = process.env.EXPO_PUBLIC_APP_ENV;

  if (value === "preview" || value === "production" || value === "development") {
    return value;
  }

  return __DEV__ ? "development" : "production";
};

const resolveUrl = (explicitValue: string | undefined, devValue: string, prodValue: string) => {
  const defaultValue = appEnvironment === "development" || __DEV__ ? devValue : prodValue;
  return trimTrailingSlash(explicitValue?.trim() || defaultValue);
};

const appEnvironment = readEnvironment();
const isDevelopmentRuntime = appEnvironment === "development" || __DEV__;
const allowProductionApiInDev =
  process.env.EXPO_PUBLIC_ALLOW_PRODUCTION_API_IN_DEV === "true";

const coreApiUrl = resolveUrl(
  process.env.EXPO_PUBLIC_CORE_API_URL,
  DEVELOPMENT_CORE_API_URL,
  PRODUCTION_CORE_API_URL
);
const providerApiUrl = resolveUrl(
  process.env.EXPO_PUBLIC_PROVIDER_API_URL,
  DEVELOPMENT_PROVIDER_API_URL,
  PRODUCTION_PROVIDER_API_URL
);
const paymentApiUrl = resolveUrl(
  process.env.EXPO_PUBLIC_PAYMENT_BASE_URL,
  DEVELOPMENT_PAYMENT_API_URL,
  PRODUCTION_PAYMENT_API_URL
);

const assertSafeDevelopmentUrl = (label: string, url: string, envName: string) => {
  if (!isDevelopmentRuntime || allowProductionApiInDev || !/render\.com|gatherplux\.com/i.test(url)) {
    return;
  }

  throw new Error(
    `GatherPlux mobile is running in development with a production ${label} URL. ` +
      `Set ${envName} to a local/staging backend, or set ` +
      "EXPO_PUBLIC_ALLOW_PRODUCTION_API_IN_DEV=true if this is intentional."
  );
};

assertSafeDevelopmentUrl("core API", coreApiUrl, "EXPO_PUBLIC_CORE_API_URL");
assertSafeDevelopmentUrl("payment API", paymentApiUrl, "EXPO_PUBLIC_PAYMENT_BASE_URL");
assertSafeDevelopmentUrl("provider API", providerApiUrl, "EXPO_PUBLIC_PROVIDER_API_URL");

export const appConfig = {
  apiEnv: appEnvironment,
  coreApiUrl,
  isDevelopment: isDevelopmentRuntime,
  isProduction: appEnvironment === "production",
  paymentApiUrl,
  providerApiUrl,
  recaptchaOriginUrl: resolveUrl(
    process.env.EXPO_PUBLIC_RECAPTCHA_ORIGIN_URL,
    PRODUCTION_WEB_URL,
    PRODUCTION_WEB_URL
  ),
  recaptchaSiteKey:
    process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY?.trim() || FALLBACK_RECAPTCHA_SITE_KEY,
  stripeMerchantIdentifier:
    process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER || "merchant.REPLACE_ME",
  stripePublishableKey:
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || FALLBACK_STRIPE_PUBLISHABLE_KEY,
  webUrl: resolveUrl(process.env.EXPO_PUBLIC_WEB_URL, DEVELOPMENT_WEB_URL, PRODUCTION_WEB_URL),
};

export type AppConfig = typeof appConfig;
