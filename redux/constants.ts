export const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL ?? "https://gather-plus-backend-core.onrender.com/api/v1";
export const PROVIDER_URL = process.env.EXPO_PUBLIC_PROVIDER_URL ?? "https://gather-plus-backend-event.onrender.com/api/v1/provider";
export const FILE_UPLOAD_URL = process.env.EXPO_PUBLIC_FILE_UPLOAD_URL ?? "https://gather-plus-backend-core.onrender.com/api/v1/file";
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "https://www.gatherplux.com";
export const USER_URL = "/account";
export const PROFILE_URL = "/profile";

// --- Stripe ---
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
export const STRIPE_MERCHANT_IDENTIFIER = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER ?? "merchant.REPLACE_ME";
