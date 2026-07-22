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
  isOnlineMeeting?: true;
  onlineMeetingProvider?: "teamsForBusiness";
  attendees?: {
    emailAddress: {
      address: string;
      name?: string;
    };
    type: "required";
  }[];
};

export type MicrosoftGraphEventResponse = {
  id?: string;
  webLink?: string;
};
