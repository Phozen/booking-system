# Qbook-only booking channel boundary

## Enforced by this repository

- All authenticated Qbook access requires the configured Microsoft tenant, an exact active pre-provisioned email, and an active approved role.
- Authenticated users cannot insert or update booking or approval tables directly after migration `0032`.
- Booking creation, edit, catering, cancellation, usage, recurrence, and review operations use guarded database functions that recheck ownership, role, facility, capacity, block, maintenance, conflict, approval, and state invariants.
- Approval-required bookings cannot begin as confirmed, and approval/rejection updates the booking and approval record in one database transaction.

These controls make Qbook the only supported mutation channel for the Qbook database. They cannot stop an employee from sending an Outlook invitation to an Exchange room mailbox.

## Microsoft 365 control required from IT

Current repository evidence shows `facility_calendars` is not implemented; configured calendar sync targets a central or booking-owner calendar and does not establish Qbook as the exclusive Exchange room-booking principal. Therefore Exchange administrators must choose and verify one of these external policies:

1. Temporary strict boundary: disable automatic processing on each room mailbox with `Set-CalendarProcessing -Identity ROOM@COMPANY -AutomateProcessing None`, while Qbook remains the authoritative operational ledger.
2. Integrated exclusive boundary (requires a separately approved integration change): use a dedicated company-controlled Qbook booking principal, set `-AutomateProcessing AutoAccept -AllBookInPolicy $false -AllRequestInPolicy $false -AllRequestOutOfPolicy $false -BookInPolicy QBOOK_PRINCIPAL`, remove other delegates/mailbox permissions, and make Qbook submit the resource request as that principal.

Do not apply option 2 until the application actually books the room resource as the dedicated principal; applying it now could block Qbook and Outlook equally.

IT must first capture:

```powershell
Get-Mailbox -RecipientTypeDetails RoomMailbox |
  Select-Object DisplayName,PrimarySmtpAddress

Get-CalendarProcessing -Identity ROOM@COMPANY |
  Format-List AutomateProcessing,AllBookInPolicy,AllRequestInPolicy,AllRequestOutOfPolicy,BookInPolicy,RequestInPolicy,RequestOutOfPolicy,ResourceDelegates,AllowConflicts
```

Official Microsoft references: [Set-CalendarProcessing](https://learn.microsoft.com/en-us/powershell/module/exchangepowershell/set-calendarprocessing?view=exchange-ps) and [Manage resource mailboxes in Exchange Online](https://learn.microsoft.com/en-us/exchange/recipients-in-exchange-online/manage-resource-mailboxes).

For each room, the change ticket needs the before/after output, mailbox-permission/delegate inventory, an Outlook direct-booking negative test, a Qbook approved-booking positive test, conflict rejection evidence, rollback commands containing the captured prior values, and the Exchange audit event. Owner: Exchange Online Administrator. Prerequisites: approved service-account/integration design, emergency room-booking process, and a maintenance window.

Microsoft documents these settings in `Set-CalendarProcessing` and its resource-mailbox booking scenarios. The company Exchange administrator remains responsible for validating policy semantics in the tenant before rollout.
