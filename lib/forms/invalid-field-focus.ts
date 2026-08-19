export function getFirstInvalidFieldName(
  errors: Record<string, string | null | undefined>,
): string | undefined {
  return Object.keys(errors).find((key) => Boolean(errors[key]?.trim()));
}

function isProgrammaticallyFocusable(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element.hasAttribute("disabled")) {
    return false;
  }

  if (element instanceof HTMLInputElement && element.type === "hidden") {
    return false;
  }

  return true;
}

export function findFocusableInvalidField(
  fieldName: string,
  root: Document | HTMLElement = document,
): HTMLElement | null {
  const byId = root.querySelector(`#${cssEscape(fieldName)}`);
  if (byId && isProgrammaticallyFocusable(byId)) {
    return byId;
  }

  const byName = root.querySelector(`[name="${cssEscape(fieldName)}"]`);
  if (byName && isProgrammaticallyFocusable(byName)) {
    return byName;
  }

  if (fieldName === "facilityId") {
    const option = root.querySelector('[role="listbox"] [role="option"]');
    if (option && isProgrammaticallyFocusable(option)) {
      return option;
    }

    const listbox = root.querySelector('[role="listbox"]');
    if (listbox && isProgrammaticallyFocusable(listbox)) {
      return listbox;
    }
  }

  return null;
}

export function focusFirstInvalidField(
  errors: Record<string, string | null | undefined>,
) {
  if (typeof document === "undefined") {
    return;
  }

  const fieldName = getFirstInvalidFieldName(errors);
  if (!fieldName) {
    return;
  }

  const focusField = () => {
    const element = findFocusableInvalidField(fieldName);
    if (!element) {
      return;
    }

    if (element.tabIndex < 0 && !element.matches("input, select, textarea, button, [href]")) {
      element.tabIndex = -1;
    }

    element.focus();
    element.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(focusField);
  });
}

function cssEscape(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}
