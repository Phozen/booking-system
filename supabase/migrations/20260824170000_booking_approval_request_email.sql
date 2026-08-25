-- Allow emailing admins when a booking is waiting for approval.
alter type public.email_notification_type
  add value if not exists 'booking_approval_request';
