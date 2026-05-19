export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export type RecurrenceInput = {
  startsOn: string;
  frequency: RecurrenceFrequency;
  intervalCount: number;
  endsOn?: string | null;
  occurrenceCount?: number | null;
  maxOccurrences?: number;
};

export type RecurrenceOccurrence = {
  sequence: number;
  date: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function toDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function addMonthsClamped(date: Date, months: number) {
  const day = date.getUTCDate();
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 12));
  const lastDay = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}

function addInterval(date: Date, frequency: RecurrenceFrequency, interval: number) {
  if (frequency === "monthly") {
    return addMonthsClamped(date, interval);
  }

  const days = frequency === "weekly" ? interval * 7 : interval;
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function generateRecurrenceOccurrences({
  startsOn,
  frequency,
  intervalCount,
  endsOn,
  occurrenceCount,
  maxOccurrences = 50,
}: RecurrenceInput): RecurrenceOccurrence[] {
  const cappedCount = Math.min(occurrenceCount ?? maxOccurrences, maxOccurrences);
  const endDate = endsOn ? parseDateKey(endsOn) : null;
  const occurrences: RecurrenceOccurrence[] = [];
  let current = parseDateKey(startsOn);

  while (occurrences.length < cappedCount) {
    if (endDate && current > endDate) {
      break;
    }

    occurrences.push({
      sequence: occurrences.length + 1,
      date: toDateKey(current),
    });
    current = addInterval(current, frequency, intervalCount);
  }

  return occurrences;
}
