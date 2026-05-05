import { z } from "zod";

const domainPattern =
  /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;

function parseDomainList(value: string) {
  return [
    ...new Set(
      value
        .split(/[,\n]/)
        .map((item) => item.trim().toLowerCase().replace(/^@/, ""))
        .filter(Boolean),
    ),
  ];
}

function parseReminderOffsets(value: string) {
  return [
    ...new Set(
      value
        .split(/[,\n]/)
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isInteger(item) && item > 0),
    ),
  ].sort((a, b) => b - a);
}

export const settingsFormSchema = z.object({
  appName: z.string().trim().min(1, "Enter an app name."),
  companyName: z.string().trim(),
  systemContactEmail: z
    .string()
    .trim()
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Enter a valid email address or leave it blank.",
    }),
  registrationEnabled: z.boolean(),
  allowedEmailDomainsText: z
    .string()
    .transform(parseDomainList)
    .refine((domains) => domains.every((domain) => domainPattern.test(domain)), {
      message: "Use valid domains such as example.com, separated by commas.",
    }),
  defaultApprovalRequired: z.boolean(),
  allowFacilityApprovalOverride: z.boolean(),
  defaultTimezone: z.string().trim().min(1, "Enter a default timezone."),
  reminderOffsetsMinutesText: z
    .string()
    .transform(parseReminderOffsets)
    .refine((values) => values.length > 0, {
      message: "Enter at least one positive integer reminder offset.",
    }),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function getCheckboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export function getTextValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function formDataToSettingsValues(formData: FormData) {
  return {
    appName: getTextValue(formData, "appName"),
    companyName: getTextValue(formData, "companyName"),
    systemContactEmail: getTextValue(formData, "systemContactEmail"),
    registrationEnabled: getCheckboxValue(formData, "registrationEnabled"),
    allowedEmailDomainsText: getTextValue(formData, "allowedEmailDomains"),
    defaultApprovalRequired: getCheckboxValue(formData, "defaultApprovalRequired"),
    allowFacilityApprovalOverride: getCheckboxValue(
      formData,
      "allowFacilityApprovalOverride",
    ),
    defaultTimezone: getTextValue(formData, "defaultTimezone"),
    reminderOffsetsMinutesText: getTextValue(
      formData,
      "reminderOffsetsMinutes",
    ),
  };
}

