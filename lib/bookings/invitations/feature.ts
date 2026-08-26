/**
 * QBook internal staff invitations (Invites page, RSVP, invite pickers).
 * When false: UI is hidden and create/invite/respond actions are no-ops.
 * Outlook calendar sync still reads any existing invitation rows.
 * Confirmed invitees also receive booking_confirmation and booking_reminder emails.
 */
export const INTERNAL_INVITES_ENABLED = true;

export function assertInternalInvitesEnabled() {
  return INTERNAL_INVITES_ENABLED;
}
