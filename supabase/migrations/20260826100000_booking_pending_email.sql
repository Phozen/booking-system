-- Requester acknowledgement when a booking is waiting for approval.
alter type public.email_notification_type
  add value if not exists 'booking_pending';

alter table public.app_notifications
  drop constraint if exists app_notifications_type_check;

alter table public.app_notifications
  add constraint app_notifications_type_check check (
    type in (
      'booking_confirmation',
      'booking_approval',
      'booking_rejection',
      'booking_cancellation',
      'booking_invitation',
      'booking_invitation_accepted',
      'booking_invitation_declined',
      'booking_pending'
    )
  );
