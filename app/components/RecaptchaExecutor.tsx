import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
} from "react";

export interface RecaptchaExecutorHandle {
  execute: (action: string) => Promise<string | null>;
}

const RecaptchaExecutor = forwardRef<RecaptchaExecutorHandle>((_props, ref) => {
  const execute = useCallback(async () => null, []);

  useImperativeHandle(ref, () => ({ execute }), [execute]);

  return null;
});

RecaptchaExecutor.displayName = "RecaptchaExecutor";

export default RecaptchaExecutor;
