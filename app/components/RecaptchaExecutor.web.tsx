import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
} from "react";
import { appConfig } from "@/config/env";

export interface RecaptchaExecutorHandle {
  execute: (action: string) => Promise<string | null>;
}

const RECAPTCHA_SCRIPT_ID = "gatherplux-mobile-recaptcha-script";

declare global {
  interface Window {
    grecaptcha?: {
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}

const loadRecaptchaScript = (siteKey: string) =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve();
      return;
    }

    if (window.grecaptcha?.execute) {
      resolve();
      return;
    }

    const scriptSrc = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
      siteKey
    )}`;
    const existingScript = document.getElementById(
      RECAPTCHA_SCRIPT_ID
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (existingScript.src !== scriptSrc) {
        existingScript.remove();
      } else {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Security check failed to load")),
          { once: true }
        );
        return;
      }
    }

    const script = document.createElement("script");
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = scriptSrc;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Security check failed to load"));
    document.head.appendChild(script);
  });

const RecaptchaExecutor = forwardRef<RecaptchaExecutorHandle>((_props, ref) => {
  const execute = useCallback(async (action: string) => {
    const siteKey = appConfig.recaptchaSiteKey;
    if (!siteKey) return null;

    await loadRecaptchaScript(siteKey);

    return new Promise<string>((resolve, reject) => {
      if (!window.grecaptcha?.ready || !window.grecaptcha?.execute) {
        reject(new Error("Security check is not ready"));
        return;
      }

      window.grecaptcha.ready(() => {
        window.grecaptcha
          ?.execute(siteKey, { action })
          .then(resolve)
          .catch(() => reject(new Error("Security check failed")));
      });
    });
  }, []);

  useImperativeHandle(ref, () => ({ execute }), [execute]);

  return null;
});

RecaptchaExecutor.displayName = "RecaptchaExecutor";

export default RecaptchaExecutor;
