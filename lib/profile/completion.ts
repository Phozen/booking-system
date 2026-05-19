export type MissingProfileField = "Full name" | "Department" | "Phone";

export function getMissingProfileFields(profile: {
  full_name?: string | null;
  department?: string | null;
  phone?: string | null;
}) {
  const missingFields: MissingProfileField[] = [];

  if (!profile.full_name?.trim()) {
    missingFields.push("Full name");
  }

  if (!profile.department?.trim()) {
    missingFields.push("Department");
  }

  if (!profile.phone?.trim()) {
    missingFields.push("Phone");
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}
