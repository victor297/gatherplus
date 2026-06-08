import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { appConfig } from "@/config/env";

export interface RecaptchaExecutorHandle {
  execute: (action: string) => Promise<string | null>;
}

type PendingRequest = {
  reject: (error: Error) => void;
  resolve: (token: string) => void;
  timeout: ReturnType<typeof setTimeout>;
};

const RECAPTCHA_TIMEOUT_MS = 10000;

const buildRecaptchaHtml = (siteKey: string) => `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(
      siteKey
    )}" async defer></script>
  </head>
  <body>
    <script>
      var siteKey = ${JSON.stringify(siteKey)};

      function send(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function executeRecaptcha(action, requestId) {
        if (!window.grecaptcha || !window.grecaptcha.ready || !window.grecaptcha.execute) {
          send({ type: "error", requestId: requestId, message: "reCAPTCHA is not ready" });
          return;
        }

        window.grecaptcha.ready(function () {
          window.grecaptcha
            .execute(siteKey, { action: action })
            .then(function (token) {
              send({ type: "token", requestId: requestId, token: token });
            })
            .catch(function () {
              send({ type: "error", requestId: requestId, message: "Security check failed" });
            });
        });
      }

      function receive(event) {
        try {
          var data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          if (data && data.type === "execute") {
            executeRecaptcha(data.action || "submit", data.requestId);
          }
        } catch (error) {
          send({ type: "error", message: "Security check message failed" });
        }
      }

      window.addEventListener("message", receive);
      document.addEventListener("message", receive);

      var readyTimer = setInterval(function () {
        if (window.grecaptcha && window.grecaptcha.ready && window.grecaptcha.execute) {
          clearInterval(readyTimer);
          send({ type: "ready" });
        }
      }, 200);
    </script>
  </body>
</html>
`;

const RecaptchaExecutor = forwardRef<RecaptchaExecutorHandle>((_props, ref) => {
  const siteKey = appConfig.recaptchaSiteKey;
  const webViewRef = useRef<WebView>(null);
  const pendingRef = useRef<Record<string, PendingRequest>>({});
  const readyWaitersRef = useRef<Array<() => void>>([]);
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);

  const html = useMemo(
    () => (siteKey ? buildRecaptchaHtml(siteKey) : ""),
    [siteKey]
  );

  const markReady = useCallback(() => {
    readyRef.current = true;
    setReady(true);
    readyWaitersRef.current.splice(0).forEach((resolve) => resolve());
  }, []);

  const waitForReady = useCallback(() => {
    if (!siteKey) return Promise.resolve();
    if (readyRef.current) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        readyWaitersRef.current = readyWaitersRef.current.filter(
          (waiter) => waiter !== resolve
        );
        reject(new Error("Security check failed to load"));
      }, RECAPTCHA_TIMEOUT_MS);

      readyWaitersRef.current.push(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }, [siteKey]);

  const execute = useCallback(
    async (action: string) => {
      if (!siteKey) return null;

      await waitForReady();

      return new Promise<string>((resolve, reject) => {
        const requestId = `${action}-${Date.now()}-${Math.random()}`;
        const timeout = setTimeout(() => {
          delete pendingRef.current[requestId];
          reject(new Error("Security check timed out"));
        }, RECAPTCHA_TIMEOUT_MS);

        pendingRef.current[requestId] = { reject, resolve, timeout };
        webViewRef.current?.postMessage(
          JSON.stringify({ type: "execute", action, requestId })
        );
      });
    },
    [siteKey, waitForReady]
  );

  useImperativeHandle(ref, () => ({ execute }), [execute]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === "ready") {
          markReady();
          return;
        }

        const pending = pendingRef.current[data.requestId];
        if (!pending) return;

        clearTimeout(pending.timeout);
        delete pendingRef.current[data.requestId];

        if (data.type === "token" && data.token) {
          pending.resolve(data.token);
        } else {
          pending.reject(new Error(data.message || "Security check failed"));
        }
      } catch {
        // Ignore malformed WebView messages.
      }
    },
    [markReady]
  );

  if (!siteKey) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        height: 1,
        opacity: 0,
        overflow: "hidden",
        position: "absolute",
        width: 1,
      }}
    >
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        javaScriptEnabled
        onMessage={handleMessage}
        onLoadEnd={() => {
          if (!ready) {
            webViewRef.current?.injectJavaScript(`
              if (window.grecaptcha && window.grecaptcha.ready && window.grecaptcha.execute) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ready" }));
              }
              true;
            `);
          }
        }}
        source={{
          html,
          baseUrl: appConfig.recaptchaOriginUrl,
        }}
      />
    </View>
  );
});

RecaptchaExecutor.displayName = "RecaptchaExecutor";

export default RecaptchaExecutor;
