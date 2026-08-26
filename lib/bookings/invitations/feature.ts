/**
 * QBook internal attendees (add people to a booking, Invites inbox list).
 * When false: pickers, Invites nav, and invite actions are off.
 * Attendees get booking_confirmation / booking_reminder emails when confirmed.
 * There is no accept/decline RSVP flow.
 */
export const INTERNAL_INVITES_ENABLED = true;

export function assertInternalInvitesEnabled() {
  return INTERNAL_INVITES_ENABLED;
}
