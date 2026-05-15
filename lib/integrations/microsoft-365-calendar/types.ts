export type MicrosoftCalendarSyncStatus =
  | "pending"
  | "synced"
  | "failed"
  | "skipped"
  | "cancelled";

export type MicrosoftCalendarSyncResult = {
  status: MicrosoftCalendarSyncStatus;
  message: string;
  bookingId: string;
  syncId?: string;
  externalEventId?: string | null;
};

export type MicrosoftGraphEventPayload = {
  subject: string;
  body: {
    contentType: "HTML";
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location: {
    displayName: string;
  };
  showAs: "busy";
};

export type MicrosoftGraphEventResponse = {
  id?: string;
  webLink?: string;
};
