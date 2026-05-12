export const defaultCalendarTimeZone =
  process.env.APP_TIMEZONE || "Asia/Kuala_Lumpur";

const monthPattern = /^(\d{4})-(\d{2})$/;

export type CalendarMonth = {
  year: number;
  month: number;
  value: string;
  label: string;
};

export type CalendarDateRange = {
  month: CalendarMonth;
  startsAt: string;
  endsAt: string;
};

export type CalendarDay = {
  key: string;
  dateNumber: number;
  weekdayIndex: number;
  weekdayLabel: string;
  shortLabel: string;
  isCurrentMonth: boolean;
  isToday: boolean;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getDateParts(date: Date, timeZone = defaultCalendarTimeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone = defaultCalendarTimeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const asUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second),
  );

  return asUtc - date.getTime();
}

function getWeekdayIndex(date: Date, timeZone = defaultCalendarTimeZone) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone,
  }).format(date);

  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    weekday,
  );

  return weekdayIndex >= 0 ? weekdayIndex : date.getUTCDay();
}

export function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  timeZone = defaultCalendarTimeZone,
) {
  const utcGuess = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second),
  );
  const firstPass = new Date(
    utcGuess.getTime() - getTimeZoneOffsetMs(utcGuess, timeZone),
  );

  return new Date(
    utcGuess.getTime() - getTimeZoneOffsetMs(firstPass, timeZone),
  );
}

export function formatCalendarDateKey(
  date: Date,
  timeZone = defaultCalendarTimeZone,
) {
  const parts = getDateParts(date, timeZone);

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function getCurrentCalendarMonth(
  now = new Date(),
  timeZone = defaultCalendarTimeZone,
): CalendarMonth {
  const parts = getDateParts(now, timeZone);

  return toCalendarMonth(parts.year, parts.month, timeZone);
}

export function toCalendarMonth(
  year: number,
  month: number,
  timeZone = defaultCalendarTimeZone,
): CalendarMonth {
  const monthDate = zonedDateTimeToUtc(year, month, 1, 12, 0, 0, timeZone);

  return {
    year,
    month,
    value: `${year}-${pad(month)}`,
    label: new Intl.DateTimeFormat("en-MY", {
      month: "long",
      year: "numeric",
      timeZone,
    }).format(monthDate),
  };
}

export function parseCalendarMonth(
  value: string | string[] | undefined,
  timeZone = defaultCalendarTimeZone,
) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const match = rawValue?.match(monthPattern);

  if (!match) {
    return getCurrentCalendarMonth(new Date(), timeZone);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (year < 2000 || year > 2100 || month < 1 || month > 12) {
    return getCurrentCalendarMonth(new Date(), timeZone);
  }

  return toCalendarMonth(year, month, timeZone);
}

export function shiftCalendarMonth(
  month: CalendarMonth,
  offset: number,
  timeZone = defaultCalendarTimeZone,
) {
  const monthIndex = month.year * 12 + (month.month - 1) + offset;
  const shiftedYear = Math.floor(monthIndex / 12);
  const shiftedMonth = (monthIndex % 12) + 1;

  return toCalendarMonth(shiftedYear, shiftedMonth, timeZone);
}

export function getCalendarMonthRange(
  month: CalendarMonth,
  timeZone = defaultCalendarTimeZone,
): CalendarDateRange {
  const nextMonth = shiftCalendarMonth(month, 1, timeZone);

  return {
    month,
    startsAt: zonedDateTimeToUtc(
      month.year,
      month.month,
      1,
      0,
      0,
      0,
      timeZone,
    ).toISOString(),
    endsAt: zonedDateTimeToUtc(
      nextMonth.year,
      nextMonth.month,
      1,
      0,
      0,
      0,
      timeZone,
    ).toISOString(),
  };
}

export function doesDateRangeOverlap(
  startsAt: string,
  endsAt: string,
  range: Pick<CalendarDateRange, "startsAt" | "endsAt">,
) {
  return startsAt < range.endsAt && endsAt > range.startsAt;
}

export function getCalendarMonthDays(
  month: CalendarMonth,
  timeZone = defaultCalendarTimeZone,
) {
  const daysInMonth = new Date(
    Date.UTC(month.year, month.month, 0, 12),
  ).getUTCDate();
  const todayKey = formatCalendarDateKey(new Date(), timeZone);

  return Array.from({ length: daysInMonth }, (_, index): CalendarDay => {
    const dayNumber = index + 1;
    const date = zonedDateTimeToUtc(
      month.year,
      month.month,
      dayNumber,
      12,
      0,
      0,
      timeZone,
    );
    const parts = getDateParts(date, timeZone);
    const key = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;

    return {
      key,
      dateNumber: parts.day,
      weekdayIndex: getWeekdayIndex(date, timeZone),
      weekdayLabel: new Intl.DateTimeFormat("en-MY", {
        weekday: "long",
        timeZone,
      }).format(date),
      shortLabel: new Intl.DateTimeFormat("en-MY", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone,
      }).format(date),
      isCurrentMonth: parts.year === month.year && parts.month === month.month,
      isToday: key === todayKey,
    };
  });
}
