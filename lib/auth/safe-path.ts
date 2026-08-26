export function getSafeInternalPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(value, "https://qbook.invalid");
    const decodedPath = decodeURIComponent(url.pathname);

    if (
      url.origin !== "https://qbook.invalid" ||
      decodedPath.startsWith("//") ||
      decodedPath.includes("\\")
    ) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
