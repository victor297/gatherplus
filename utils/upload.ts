import { appConfig } from "@/config/env";

type UploadInput = {
  mimeType?: string;
  name?: string;
  uri: string;
};

export interface UploadResponse {
  body?: Array<{
    secure_url?: string;
    url?: string;
    [key: string]: unknown;
  }>;
  code?: number;
  message?: string;
  [key: string]: unknown;
}

const inferFileName = (uri: string) => uri.split("/").pop() || `upload-${Date.now()}.jpg`;

const inferMimeType = (fileName: string, fallback?: string) => {
  if (fallback) {
    return fallback;
  }

  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  if (extension === "gif") {
    return "image/gif";
  }

  return "image/jpeg";
};

export const createUploadFormData = (files: UploadInput[]) => {
  const formData = new FormData();

  files.forEach((file) => {
    const name = file.name || inferFileName(file.uri);

    formData.append("files", {
      name,
      type: inferMimeType(name, file.mimeType),
      uri: file.uri,
    } as any);
  });

  return formData;
};

export const getFirstUploadedFileUrl = (response: UploadResponse) =>
  response.body?.[0]?.secure_url || response.body?.[0]?.url || "";

export const uploadFiles = async (files: UploadInput[]) => {
  const response = await fetch(`${appConfig.coreApiUrl}/file`, {
    method: "POST",
    body: createUploadFormData(files),
  });

  const data = (await response.json()) as UploadResponse;

  if (!response.ok || (data.code && data.code >= 400)) {
    throw new Error(data.message || "Failed to upload file");
  }

  return data;
};

export const uploadSingleFile = async (uri: string, options: Omit<UploadInput, "uri"> = {}) => {
  const response = await uploadFiles([{ uri, ...options }]);
  const uploadedUrl = getFirstUploadedFileUrl(response);

  if (!uploadedUrl) {
    throw new Error("Upload completed but no file URL was returned");
  }

  return uploadedUrl;
};
