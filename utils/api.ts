export const compactParams = (params?: object | null | void) =>
  Object.fromEntries(
    Object.entries(params || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, String(value)])
  );

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  const apiError = error as {
    data?: {
      body?: string;
      message?: string;
    };
    message?: string;
  };

  return apiError?.data?.body || apiError?.data?.message || apiError?.message || fallback;
};
