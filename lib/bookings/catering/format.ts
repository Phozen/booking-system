export const cateringTypeOptions = [
  "water",
  "coffee_tea",
  "light_refreshments",
  "snacks",
  "packed_meals",
  "buffet_catering",
  "vip_catering",
  "other",
] as const;

export const cateringServingTimeOptions = [
  "before_meeting",
  "during_meeting",
  "lunch_break",
  "after_meeting",
  "custom",
] as const;

export type CateringType = (typeof cateringTypeOptions)[number];
export type CateringServingTime = (typeof cateringServingTimeOptions)[number];

export type BookingCateringDetails = {
  required: boolean;
  type: CateringType | null;
  pax: number | null;
  servingTime: CateringServingTime | null;
  dietaryNotes: string | null;
  notes: string | null;
};

export function emptyCateringDetails(): BookingCateringDetails {
  return {
    required: false,
    type: null,
    pax: null,
    servingTime: null,
    dietaryNotes: null,
    notes: null,
  };
}

export function formatCateringType(type: string | null | undefined) {
  const labels: Record<CateringType, string> = {
    water: "Drinking water only",
    coffee_tea: "Coffee / tea",
    light_refreshments: "Light refreshments",
    snacks: "Snacks",
    packed_meals: "Packed meals",
    buffet_catering: "Buffet / catering",
    vip_catering: "VIP / management meeting catering",
    other: "Other / custom",
  };

  return labels[type as CateringType] ?? "Not specified";
}

export function formatCateringServingTime(
  servingTime: string | null | undefined,
) {
  const labels: Record<CateringServingTime, string> = {
    before_meeting: "Before meeting",
    during_meeting: "During meeting",
    lunch_break: "Lunch break",
    after_meeting: "After meeting",
    custom: "Custom",
  };

  return labels[servingTime as CateringServingTime] ?? "Not specified";
}

export function formatCateringRequired(required: boolean) {
  return required ? "Yes" : "No";
}

export function normalizeCateringDetails(
  details: BookingCateringDetails,
): BookingCateringDetails {
  if (!details.required) {
    return emptyCateringDetails();
  }

  return {
    required: true,
    type: details.type,
    pax: details.pax,
    servingTime: details.servingTime,
    dietaryNotes: details.dietaryNotes?.trim() || null,
    notes: details.notes?.trim() || null,
  };
}
