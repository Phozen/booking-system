import "server-only";

export type EmailAppUrlConfig = {
  appUrl: string | null;
  validationError: string | null;
};

export function getEmailAppUrlConfig(
  env: NodeJS.ProcessEnv = process.env,
): EmailAppUrlConfig {
  const configuredUrl = env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredUrl) {
    return {
      appUrl: null,
      validationError: "NEXT_PUBLIC_APP_URL is required before Qbook can send booking emails.",
    };
  }

  try {
    const url = new URL(configuredUrl);
    const isProduction = env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
    const isLocalHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("unsupported protocol");
    }

    if (isProduction && (url.protocol !== "https:" || isLocalHost)) {
      return {
        appUrl: null,
        validationError:
          "NEXT_PUBLIC_APP_URL must be a public HTTPS Qbook URL in production; localhost links are blocked.",
      };
    }

    return { appUrl: url.origin, validationError: null };
  } catch {
    return {
      appUrl: null,
      validationError: "NEXT_PUBLIC_APP_URL must be a valid absolute HTTP(S) URL.",
    };
  }
}
