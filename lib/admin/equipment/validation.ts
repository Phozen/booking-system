import { z } from "zod";

export const equipmentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter an equipment name.")
    .max(120, "Equipment name must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1,000 characters or fewer."),
  iconName: z
    .string()
    .trim()
    .max(80, "Icon name must be 80 characters or fewer."),
});

export const equipmentIdSchema = z.string().uuid();

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

export function formDataToEquipmentValues(formData: FormData) {
  const getValue = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };

  return {
    name: getValue("name"),
    description: getValue("description"),
    iconName: getValue("iconName"),
  };
}
