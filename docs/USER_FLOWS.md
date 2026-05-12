Paste this into:

```txt
docs/USER_FLOWS.md
```

````md
# User Flows

## 1. Purpose

This document describes the main user flows for the internal Booking System.

The system supports two primary user groups:

1. Employees
2. Admins

Employees use the system to view facilities, create bookings, manage their own bookings, and receive booking notifications.

Admins manage facilities, users, bookings, approvals, blocked periods, maintenance closures, reports, exports, audit logs, and system settings.

---

## 2. User Roles

## 2.1 Employee

An employee can:

- Log in using email and password
- View available facilities
- View facility details
- Create bookings
- View their own bookings
- Cancel their own bookings
- Receive booking emails
- View booking status

## 2.2 Admin

An admin can:

- Do everything an employee can do
- Manage all facilities
- Manage all users
- Manage all bookings
- Approve bookings when approval mode is enabled
- Reject bookings when approval mode is enabled
- Cancel any booking
- Create bookings on behalf of users
- Manage blocked periods
- Manage maintenance closures
- View reports
- Export reports
- View audit logs
- Manage system settings

---

## 3. Global Navigation Flow

## 3.1 Unauthenticated User

Unauthenticated users may access:

```txt
/login
/register, if registration is enabled
/reset-password
````

Unauthenticated users must not access:

```txt
/dashboard
/facilities
/bookings
/my-bookings
/profile
/admin/*
```

If an unauthenticated user attempts to access a protected page, redirect to:

```txt
/login
```

After successful login, redirect based on role:

| Role     | Redirect                                                                  |
| -------- | ------------------------------------------------------------------------- |
| Employee | `/dashboard`                                                              |
| Admin    | `/admin/dashboard` or `/dashboard` depending on implementation preference |

Recommended behavior:

* Admins should be taken to `/admin/dashboard`.
* Employees should be taken to `/dashboard`.

---

## 4. Authentication Flows

## 4.1 Login Flow

### Actor

Employee or Admin

### Entry Point

```txt
/login
```

### Steps

1. User opens the login page.
2. User enters email.
3. User enters password.
4. User clicks `Log In`.
5. System validates the input.
6. System submits login request to Supabase Auth.
7. If credentials are valid, system checks the user profile.
8. If profile status is `active`, user is allowed in.
9. System redirects user based on role.
10. Audit log may record login event.

### Success Result

User is authenticated and redirected to the correct dashboard.

### Failure Cases

| Case                      | Behavior                                                  |
| ------------------------- | --------------------------------------------------------- |
| Invalid email or password | Show generic login error                                  |
| User profile missing      | Show account setup error or create profile if appropriate |
| User disabled             | Show disabled account message                             |
| Supabase error            | Show generic login error                                  |

---

## 4.2 Registration Flow

### Actor

Employee

### Entry Point

```txt
/register
```

### Configuration

Registration can be enabled or disabled using system settings.

Allowed email domains can also be configured.

### Steps

1. User opens registration page.
2. System checks whether registration is enabled.
3. If disabled, system shows a message that registration is not available.
4. User enters:

   * Full name
   * Email
   * Password
   * Confirm password
5. System validates:

   * Required fields
   * Valid email format
   * Password rules
   * Password confirmation match
   * Allowed email domain, if configured
6. System creates user using Supabase Auth.
7. System creates profile with default role `employee`.
8. User is redirected to login or dashboard, depending on auth configuration.

### Success Result

New employee account is created.

### Failure Cases

| Case                     | Behavior                            |
| ------------------------ | ----------------------------------- |
| Registration disabled    | Prevent registration                |
| Email domain not allowed | Show domain restriction message     |
| Email already exists     | Show account already exists message |
| Password invalid         | Show password requirements          |
| Supabase error           | Show generic registration error     |

---

## 4.3 Password Reset Flow

### Actor

Employee or Admin

### Entry Point

```txt
/reset-password
```

### Steps

1. User opens reset password page.
2. User enters email.
3. System requests password reset through Supabase Auth.
4. User receives reset email.
5. User follows reset link.
6. User enters new password.
7. System updates password.
8. User logs in with new password.

### Success Result

User can log in using the new password.

### Failure Cases

| Case               | Behavior                                                |
| ------------------ | ------------------------------------------------------- |
| Email not found    | Show generic reset message without confirming existence |
| Reset link expired | Show expired link message                               |
| Password invalid   | Show password rules                                     |

---

## 4.4 Logout Flow

### Actor

Employee or Admin

### Steps

1. User clicks logout.
2. System signs out from Supabase Auth.
3. User is redirected to `/login`.
4. Audit log may record logout event.

---

## 5. Employee Dashboard Flow

## 5.1 View Employee Dashboard

### Actor

Employee

### Entry Point

```txt
/dashboard
```

### Steps

1. Employee logs in.
2. System loads employee dashboard.
3. Dashboard displays:

   * Upcoming bookings
   * Recent booking activity
   * Quick link to create booking
   * Quick link to facilities
   * Quick link to My Bookings
4. Employee chooses next action.

### Success Result

Employee can quickly understand upcoming bookings and access core booking actions.

---

## 6. Facility Browsing Flows

## 6.1 View Facility List

### Actor

Employee or Admin

### Entry Point

```txt
/facilities
```

### Steps

1. User opens facility list.
2. System loads active facilities.
3. System displays each facility with:

   * Name
   * Level
   * Type
   * Capacity
   * Equipment summary
   * Photo thumbnail
   * Status
   * Availability indicator
4. User filters or searches facilities, if implemented.
5. User selects a facility.

### Success Result

User can browse available bookable facilities.

### Facility List Should Include

Default facilities:

| Facility       | Level   | Type         |
| -------------- | ------- | ------------ |
| Meeting Room 1 | Level 5 | Meeting Room |
| Meeting Room 2 | Level 5 | Meeting Room |
| Meeting Room 1 | Level 6 | Meeting Room |
| Meeting Room 2 | Level 6 | Meeting Room |
| Event Hall     | Level 1 | Event Hall   |

---

## 6.2 View Facility Details

### Actor

Employee or Admin

### Entry Point

```txt
/facilities/[slug]
```

### Steps

1. User opens a facility detail page.
2. System loads facility details.
3. System displays:

   * Facility name
   * Level
   * Type
   * Capacity
   * Equipment
   * Photos
   * Description
   * Status
   * Booking calendar or availability section
   * Book button
4. User selects `Book this facility`.

### Success Result

User can understand facility details and start a booking.

### Failure Cases

| Case                       | Behavior                                      |
| -------------------------- | --------------------------------------------- |
| Facility not found         | Show not found page                           |
| Facility archived          | Hide from regular users, admin may still view |
| Facility inactive          | Show unavailable status                       |
| Facility under maintenance | Show maintenance status                       |

---

## 7. Booking Creation Flow

## 7.1 Create Booking Without Approval

### Actor

Employee

### Entry Points

```txt
/facilities/[slug]
/bookings/new
```

### Preconditions

* User is logged in.
* User status is `active`.
* Facility is `active`.
* Approval is not required.
* Selected time does not conflict.

### Steps

1. Employee opens booking form.
2. Employee selects facility.
3. Employee selects date.
4. Employee selects start time.
5. Employee selects end time.
6. Employee enters booking title or purpose.
7. Employee optionally enters:

   * Description
   * Attendee count
   * Remarks
8. System validates required fields.
9. System checks selected time range.
10. System checks facility status.
11. System checks existing booking conflicts.
12. System checks blocked periods.
13. System checks maintenance closures.
14. If available, system creates booking with status `confirmed`.
15. System creates audit log entry.
16. System creates or sends booking confirmation email.
17. Employee sees booking success screen.

### Success Result

Booking is created with status:

```txt
confirmed
```

### Email Sent

```txt
booking_confirmation
```

### Audit Log

```txt
booking create
```

---

## 7.2 Create Booking With Approval Required

### Actor

Employee

### Preconditions

Approval is required globally or for the selected facility.

### Steps

1. Employee opens booking form.
2. Employee selects facility.
3. Employee selects date and time.
4. Employee enters booking details.
5. System validates booking request.
6. System confirms there is no conflict.
7. System creates booking with status `pending`.
8. System creates approval record with status `pending`.
9. System creates audit log entry.
10. System creates or sends notification email if configured.
11. Employee sees pending approval message.

### Success Result

Booking is created with status:

```txt
pending
```

### Employee Message

```txt
Your booking request has been submitted and is pending approval.
```

### Admin Visibility

The booking appears in:

```txt
/admin/approvals
/admin/bookings
```

---

## 7.3 Booking Conflict Flow

### Actor

Employee or Admin

### Trigger

User attempts to create a booking that overlaps an existing active booking.

### Conflict Definition

A conflict exists when:

* Same facility
* Time range overlaps
* Existing booking status is `pending` or `confirmed`

### Example

Existing booking:

```txt
Meeting Room 1, Level 5
10:00 AM - 11:00 AM
```

New attempted booking:

```txt
Meeting Room 1, Level 5
10:30 AM - 11:30 AM
```

This is a conflict.

### Steps

1. User enters booking details.
2. System checks availability.
3. System finds an overlapping active booking.
4. System prevents booking submission.
5. System shows conflict warning.

### Warning Message Example

```txt
This facility is already booked for the selected time. Please choose another time or facility.
```

### Optional Admin-Level Details

Admins may see more conflict details, such as:

* Existing booking owner
* Existing booking title
* Existing booking status

Employees should only see limited information unless configured otherwise.

### Success Result

No duplicate booking is created.

### Critical Rule

The frontend should warn users, but the database must also reject overlapping active bookings.

---

## 7.4 Booking During Blocked Period Flow

### Actor

Employee or Admin

### Trigger

User attempts to book during an admin-created blocked period.

### Steps

1. User selects facility and time.
2. System checks blocked periods.
3. System finds matching blocked period.
4. System prevents booking.
5. System shows unavailable message.

### Message Example

```txt
This facility is unavailable during the selected time due to a blocked period.
```

### Success Result

Booking is not created.

---

## 7.5 Booking During Maintenance Closure Flow

### Actor

Employee or Admin

### Trigger

User attempts to book during a maintenance closure.

### Steps

1. User selects facility and time.
2. System checks maintenance closures.
3. System finds active maintenance closure.
4. System prevents booking.
5. System shows maintenance message.

### Message Example

```txt
This facility is under maintenance during the selected time.
```

### Success Result

Booking is not created.

---

## 8. Employee Booking Management Flows

## 8.1 View My Bookings

### Actor

Employee

### Entry Point

```txt
/my-bookings
```

### Steps

1. Employee opens My Bookings.
2. System loads bookings where `user_id` is the current user.
3. System displays bookings grouped or filtered by:

   * Upcoming
   * Past
   * Cancelled
   * Pending
4. Employee can open booking details.

### Booking Card Should Show

* Facility name
* Level
* Date
* Start time
* End time
* Status
* Title or purpose

### Success Result

Employee can view their own booking history.

---

## 8.2 View Booking Detail

### Actor

Employee

### Entry Point

```txt
/bookings/[id]
```

### Steps

1. Employee opens booking detail page.
2. System verifies booking belongs to the employee.
3. System loads booking details.
4. System displays:

   * Facility
   * Date
   * Start time
   * End time
   * Status
   * Title
   * Description
   * Approval status, if applicable
   * Cancellation status, if applicable
5. Employee may cancel booking if allowed.

### Failure Cases

| Case                            | Behavior                        |
| ------------------------------- | ------------------------------- |
| Booking does not belong to user | Show not found or access denied |
| Booking not found               | Show not found                  |
| Booking already cancelled       | Disable cancel action           |
| Booking completed               | Disable cancel action           |

---

## 8.3 Cancel Own Booking

### Actor

Employee

### Preconditions

* Booking belongs to employee.
* Booking status is `pending` or `confirmed`.
* Booking has not started or cancellation is still allowed.

### Steps

1. Employee opens booking detail.
2. Employee clicks `Cancel Booking`.
3. System asks for confirmation.
4. Employee optionally enters cancellation reason.
5. System updates booking status to `cancelled`.
6. System records:

   * Cancelled by
   * Cancelled at
   * Cancellation reason
7. System creates audit log.
8. System creates or sends cancellation email.
9. Booking appears as cancelled.

### Success Result

Booking status becomes:

```txt
cancelled
```

### Email Sent

```txt
booking_cancellation
```

### Audit Log

```txt
booking cancel
```

---

## 9. Admin Dashboard Flow

## 9.1 View Admin Dashboard

### Actor

Admin

### Entry Point

```txt
/admin/dashboard
```

### Steps

1. Admin logs in.
2. System verifies admin role.
3. Admin dashboard loads.
4. Dashboard displays:

   * Total bookings
   * Upcoming bookings
   * Pending approvals
   * Facilities unavailable
   * Recent activity
   * Basic utilization summary
5. Admin selects an admin task.

### Success Result

Admin can quickly monitor system activity.

---

## 10. Admin User Management Flows

## 10.1 View Users

### Actor

Admin

### Entry Point

```txt
/admin/users
```

### Steps

1. Admin opens users page.
2. System loads user list.
3. Admin can search and filter by:

   * Name
   * Email
   * Role
   * Status
4. Admin opens user detail or edits user.

### Success Result

Admin can view system users.

---

## 10.2 Change User Role

### Actor

Admin

### Steps

1. Admin opens user detail or edit page.
2. Admin changes user role.
3. System validates admin permission.
4. System updates profile role.
5. System creates audit log.
6. System shows success message.

### Available Roles

```txt
employee
admin
```

### Audit Log

```txt
user role_change
```

---

## 10.3 Disable User

### Actor

Admin

### Steps

1. Admin opens user detail.
2. Admin selects `Disable User`.
3. System asks for confirmation.
4. System updates profile status to `disabled`.
5. System creates audit log.
6. Disabled user can no longer access protected pages.

### Success Result

User status becomes:

```txt
disabled
```

---

## 11. Admin Facility Management Flows

## 11.1 View Facilities in Admin

### Actor

Admin

### Entry Point

```txt
/admin/facilities
```

### Steps

1. Admin opens facilities page.
2. System loads all non-deleted facilities.
3. Admin can search and filter by:

   * Name
   * Level
   * Type
   * Status
4. Admin selects a facility to edit.

### Success Result

Admin can manage facilities.

---

## 11.2 Create Facility

### Actor

Admin

### Steps

1. Admin clicks `New Facility`.
2. Admin enters:

   * Name
   * Code
   * Slug
   * Level
   * Type
   * Capacity
   * Description
   * Status
   * Requires approval setting
3. Admin optionally adds equipment.
4. Admin optionally uploads photos.
5. System validates fields.
6. System creates facility.
7. System creates audit log.
8. Facility appears in facility list if active.

### Success Result

New facility is created.

---

## 11.3 Edit Facility

### Actor

Admin

### Steps

1. Admin opens facility edit page.
2. Admin updates facility details.
3. System validates fields.
4. System saves changes.
5. System creates audit log.
6. Updated details appear to employees.

### Editable Fields

* Name
* Code
* Slug
* Level
* Type
* Capacity
* Description
* Status
* Requires approval
* Equipment
* Photos

---

## 11.4 Archive Facility

### Actor

Admin

### Steps

1. Admin opens facility edit page.
2. Admin selects archive.
3. System asks for confirmation.
4. System sets facility status to `archived` and `is_archived` to true.
5. System hides facility from employee booking views.
6. Existing booking history remains preserved.
7. System creates audit log.

### Success Result

Facility is no longer bookable but booking history remains.

---

## 11.5 Upload Facility Photos

### Actor

Admin

### Steps

1. Admin opens facility photos section.
2. Admin selects image files.
3. System uploads images to Supabase Storage.
4. System creates facility photo records.
5. Admin can mark one image as primary.
6. System displays uploaded images.
7. System creates audit log.

### Success Result

Facility photos appear on employee-facing facility pages.

---

## 12. Admin Booking Management Flows

## 12.1 View All Bookings

### Actor

Admin

### Entry Point

```txt
/admin/bookings
```

### Steps

1. Admin opens bookings page.
2. System loads booking records.
3. Admin can filter by:

   * Date range
   * Facility
   * User
   * Status
   * Level
4. Admin can open booking detail.

### Success Result

Admin can view and manage all bookings.

---

## 12.2 Create Booking on Behalf of User

### Actor

Admin

### Steps

1. Admin opens admin booking creation page.
2. Admin selects user.
3. Admin selects facility.
4. Admin selects date and time.
5. Admin enters booking details.
6. System validates booking.
7. System checks conflicts, blocked periods, and maintenance closures.
8. System creates booking.
9. System records admin as `created_by`.
10. System creates audit log.
11. System sends or queues confirmation email to selected user.

### Success Result

Booking is created for the selected user.

---

## 12.3 Cancel Any Booking

### Actor

Admin

### Preconditions

Booking status is usually `pending` or `confirmed`.

### Steps

1. Admin opens booking detail.
2. Admin selects `Cancel Booking`.
3. Admin enters cancellation reason.
4. System updates booking status to `cancelled`.
5. System records:

   * Cancelled by
   * Cancelled at
   * Cancellation reason
6. System creates audit log.
7. System sends or queues cancellation email.

### Success Result

Booking is cancelled.

---

## 13. Approval Flows

## 13.1 View Pending Approvals

### Actor

Admin

### Entry Point

```txt
/admin/approvals
```

### Steps

1. Admin opens approvals page.
2. System loads bookings with status `pending`.
3. Admin reviews:

   * User
   * Facility
   * Date
   * Start time
   * End time
   * Purpose
   * Conflict status
4. Admin chooses approve or reject.

### Success Result

Admin can process pending booking requests.

---

## 13.2 Approve Booking

### Actor

Admin

### Preconditions

Booking status is `pending`.

### Steps

1. Admin opens pending booking.
2. Admin clicks `Approve`.
3. System verifies the booking still does not conflict.
4. System updates booking status to `confirmed`.
5. System updates approval record to `approved`.
6. System stores:

   * Reviewed by
   * Reviewed at
   * Remarks, if provided
7. System creates audit log.
8. System sends or queues approval email.

### Success Result

Booking status becomes:

```txt
confirmed
```

### Email Sent

```txt
booking_approval
```

### Important Note

The system must re-check conflicts at approval time because another booking may have been confirmed while this booking was pending.

---

## 13.3 Reject Booking

### Actor

Admin

### Preconditions

Booking status is `pending`.

### Steps

1. Admin opens pending booking.
2. Admin clicks `Reject`.
3. Admin enters optional rejection reason.
4. System updates booking status to `rejected`.
5. System updates approval record to `rejected`.
6. System stores:

   * Reviewed by
   * Reviewed at
   * Remarks
7. System creates audit log.
8. System sends or queues rejection email.

### Success Result

Booking status becomes:

```txt
rejected
```

### Email Sent

```txt
booking_rejection
```

---

## 14. Blocked Period Flows

## 14.1 View Blocked Periods

### Actor

Admin

### Entry Point

```txt
/admin/blocked-dates
```

### Steps

1. Admin opens blocked dates page.
2. System loads blocked periods.
3. Admin can filter by:

   * Date range
   * Facility
   * Active status
4. Admin can create, edit, or deactivate blocked periods.

### Success Result

Admin can manage unavailable periods.

---

## 14.2 Create Blocked Period

### Actor

Admin

### Steps

1. Admin clicks `New Blocked Period`.
2. Admin enters:

   * Title
   * Reason
   * Start date/time
   * End date/time
   * Scope
3. Admin selects scope:

   * All facilities
   * Selected facilities
4. If selected facilities, admin chooses one or more facilities.
5. System validates time range.
6. System creates blocked period.
7. System creates facility mappings if needed.
8. System creates audit log.

### Success Result

Users cannot book affected facilities during blocked period.

---

## 14.3 Edit Blocked Period

### Actor

Admin

### Steps

1. Admin opens blocked period.
2. Admin updates details.
3. System validates time range.
4. System saves changes.
5. System creates audit log.

### Success Result

Updated blocked period affects future availability checks.

---

## 14.4 Deactivate Blocked Period

### Actor

Admin

### Steps

1. Admin opens blocked period.
2. Admin clicks deactivate or delete.
3. System sets `is_active` to false, or deletes if implementation allows.
4. System creates audit log.

### Recommended Behavior

Prefer deactivation over deletion to preserve history.

---

## 15. Maintenance Closure Flows

## 15.1 View Maintenance Closures

### Actor

Admin

### Entry Point

```txt
/admin/maintenance
```

### Steps

1. Admin opens maintenance page.
2. System loads maintenance closures.
3. Admin can filter by:

   * Facility
   * Date range
   * Status
4. Admin can create, edit, complete, or cancel maintenance closures.

### Success Result

Admin can manage maintenance-related unavailability.

---

## 15.2 Create Maintenance Closure

### Actor

Admin

### Steps

1. Admin clicks `New Maintenance Closure`.
2. Admin selects facility.
3. Admin enters:

   * Title
   * Reason
   * Start date/time
   * End date/time
4. System validates time range.
5. System creates maintenance closure.
6. Facility becomes unavailable during the closure period.
7. System creates audit log.

### Success Result

Users cannot book facility during maintenance period.

---

## 15.3 Complete Maintenance Closure

### Actor

Admin

### Steps

1. Admin opens maintenance closure.
2. Admin clicks `Mark Completed`.
3. System updates status to `completed`.
4. System records:

   * Completed by
   * Completed at
5. System creates audit log.

### Success Result

Maintenance closure no longer blocks future bookings if its time is complete.

---

## 15.4 Cancel Maintenance Closure

### Actor

Admin

### Steps

1. Admin opens maintenance closure.
2. Admin clicks `Cancel`.
3. System updates status to `cancelled`.
4. System creates audit log.

### Success Result

Maintenance closure no longer blocks bookings.

---

## 16. Email Notification Flows

## 16.1 Booking Confirmation Email Flow

### Trigger

A booking is automatically confirmed, or a pending booking is approved.

### Steps

1. Booking status becomes `confirmed`.
2. System creates email notification record.
3. Email service sends confirmation email.
4. Email notification is marked `sent`.
5. If sending fails, status becomes `failed`.

### Email Includes

* Booking title
* Facility name
* Level
* Date
* Start time
* End time
* Status
* Link to booking details

---

## 16.2 Booking Rejection Email Flow

### Trigger

Admin rejects pending booking.

### Steps

1. Booking status becomes `rejected`.
2. System creates email notification record.
3. Email service sends rejection email.
4. Email notification status is updated.

### Email Includes

* Booking title
* Facility name
* Date
* Start time
* End time
* Rejection reason, if provided
* Link to booking details

---

## 16.3 Booking Cancellation Email Flow

### Trigger

Employee or admin cancels booking.

### Steps

1. Booking status becomes `cancelled`.
2. System creates email notification record.
3. Email service sends cancellation email.
4. Email notification status is updated.

### Email Includes

* Booking title
* Facility name
* Date
* Start time
* End time
* Cancelled by
* Cancellation reason, if provided

---

## 16.4 Booking Reminder Email Flow

### Trigger

Booking reminder is due.

Default reminder offsets:

```txt
24 hours before booking
1 hour before booking
```

### Steps

1. Reminder process finds confirmed bookings with upcoming reminder times.
2. System creates reminder email notification records.
3. Email service sends reminders.
4. Notification records are updated.

### Email Includes

* Booking title
* Facility name
* Date
* Start time
* End time
* Link to booking details

---

## 17. Reports and Export Flows

## 17.1 View Reports

### Actor

Admin

### Entry Point

```txt
/admin/reports
```

### Steps

1. Admin opens reports page.
2. System displays available reports:

   * Booking history
   * Facility utilization
   * User booking report
   * Cancelled bookings
   * Approval report
   * Maintenance closure report
   * Blocked date report
   * Audit log report
3. Admin selects a report.
4. Admin applies filters.
5. System displays report results.

### Success Result

Admin can view operational booking data.

---

## 17.2 Export CSV Report

### Actor

Admin

### Steps

1. Admin opens report.
2. Admin applies filters.
3. Admin clicks `Export CSV`.
4. System validates admin permission.
5. System generates CSV.
6. System creates export log.
7. System creates audit log.
8. Browser downloads CSV file.

### Success Result

CSV report is downloaded.

### Audit Log

```txt
report export
```

---

## 18. Audit Log Flows

## 18.1 View Audit Logs

### Actor

Admin

### Entry Point

```txt
/admin/audit-logs
```

### Steps

1. Admin opens audit logs page.
2. System loads audit logs.
3. Admin can filter by:

   * Date range
   * Actor
   * Action
   * Entity type
4. Admin reviews log entries.

### Success Result

Admin can review system activity.

### Important Rules

* Audit logs are read-only.
* Employees cannot view audit logs.
* Audit logs should not be editable in the application UI.

---

## 19. System Settings Flows

## 19.1 View System Settings

### Actor

Admin

### Entry Point

```txt
/admin/settings
```

### Steps

1. Admin opens settings page.
2. System loads current settings.
3. Admin reviews configurable behavior.

### Settings Include

* App name
* Company name
* System contact email
* Registration enabled
* Allowed email domains
* Default approval required
* Facility approval override enabled
* Reminder email timing
* Default timezone

---

## 19.2 Update System Settings

### Actor

Admin

### Steps

1. Admin opens settings page.
2. Admin changes one or more settings.
3. System validates values.
4. System saves settings.
5. System creates audit log.
6. New settings affect future app behavior.

### Success Result

System behavior is updated.

### Audit Log

```txt
system_setting settings_change
```

---

## 20. Common Error Flows

## 20.1 Access Denied

### Trigger

User tries to access a page or action they are not allowed to use.

### Examples

* Employee opens `/admin/users`
* Employee tries to cancel another user’s booking
* Disabled user tries to access dashboard

### Behavior

System should show:

```txt
You do not have permission to access this page.
```

or redirect appropriately.

---

## 20.2 Not Found

### Trigger

Requested entity does not exist or user is not allowed to view it.

### Examples

* Facility does not exist
* Booking does not exist
* Employee opens another employee’s booking

### Behavior

Show not found page or access denied page.

For privacy, it is acceptable to show not found instead of revealing that the record exists.

---

## 20.3 Booking No Longer Available

### Trigger

Time slot was available when the page loaded but became unavailable before submission.

### Steps

1. User submits booking.
2. Database rejects booking due to conflict.
3. System catches conflict error.
4. System shows availability error.
5. User can choose another time.

### Message Example

```txt
This time slot is no longer available. Please choose another time.
```

---

## 20.4 Email Sending Failure

### Trigger

Email provider fails to send email.

### Behavior

* Booking action should still remain completed.
* Email notification status should become `failed`.
* Error should be recorded.
* Admin may view failed email records.

### Important Rule

A successful booking should not be rolled back only because an email failed.

---

## 21. Booking Status Lifecycle

## 21.1 Automatic Confirmation Mode

```txt
created -> confirmed -> completed
created -> confirmed -> cancelled
```

## 21.2 Approval Required Mode

```txt
created -> pending -> confirmed -> completed
created -> pending -> rejected
created -> pending -> cancelled
```

## 21.3 Cancelled Bookings

```txt
confirmed -> cancelled
pending -> cancelled
```

## 21.4 Expired Bookings

Optional future behavior:

```txt
pending -> expired
```

This may happen when a pending booking is not approved before the booking start time.

---

## 22. Facility Status Behavior

## 22.1 Active

Users can book the facility if:

* No active booking conflict exists
* No blocked period exists
* No maintenance closure exists

## 22.2 Inactive

Users cannot book the facility.

The facility may be hidden from employee facility lists.

## 22.3 Under Maintenance

Users cannot book the facility.

The system should show the maintenance state.

## 22.4 Archived

Users cannot book the facility.

The facility is hidden from employee views.

Existing booking history is preserved.

---

## 23. Main Page Map

## 23.1 Public/Auth Pages

```txt
/login
/register
/reset-password
```

## 23.2 Employee Pages

```txt
/dashboard
/facilities
/facilities/[slug]
/bookings/new
/bookings/[id]
/my-bookings
/profile
```

## 23.3 Admin Pages

```txt
/admin/dashboard
/admin/users
/admin/bookings
/admin/bookings/[id]
/admin/facilities
/admin/facilities/new
/admin/facilities/[id]
/admin/approvals
/admin/reports
/admin/audit-logs
/admin/blocked-dates
/admin/maintenance
/admin/settings
```

---

## 24. Notification Matrix

| Event                      | Recipient    | Email Type           |
| -------------------------- | ------------ | -------------------- |
| Booking auto-confirmed     | Booking user | Booking confirmation |
| Booking approved           | Booking user | Booking approval     |
| Booking rejected           | Booking user | Booking rejection    |
| Booking cancelled by user  | Booking user | Booking cancellation |
| Booking cancelled by admin | Booking user | Booking cancellation |
| Booking reminder due       | Booking user | Booking reminder     |

Optional future notifications:

| Event                       | Recipient              |
| --------------------------- | ---------------------- |
| New pending booking         | Admins                 |
| Maintenance closure created | Affected booking users |
| Blocked period created      | Affected booking users |
| Failed email notification   | Admins                 |

---

## 25. Audit Log Matrix

| Action                        | Actor          | Entity              |
| ----------------------------- | -------------- | ------------------- |
| User registers                | User/System    | User                |
| User logs in                  | User           | Auth                |
| User role changed             | Admin          | User                |
| User disabled                 | Admin          | User                |
| Facility created              | Admin          | Facility            |
| Facility updated              | Admin          | Facility            |
| Facility archived             | Admin          | Facility            |
| Facility photo uploaded       | Admin          | Facility            |
| Booking created               | Employee/Admin | Booking             |
| Booking approved              | Admin          | Booking             |
| Booking rejected              | Admin          | Booking             |
| Booking cancelled             | Employee/Admin | Booking             |
| Blocked period created        | Admin          | Blocked Period      |
| Blocked period updated        | Admin          | Blocked Period      |
| Blocked period deactivated    | Admin          | Blocked Period      |
| Maintenance closure created   | Admin          | Maintenance Closure |
| Maintenance closure updated   | Admin          | Maintenance Closure |
| Maintenance closure completed | Admin          | Maintenance Closure |
| Maintenance closure cancelled | Admin          | Maintenance Closure |
| Report exported               | Admin          | Report              |
| System setting changed        | Admin          | System Setting      |

---

## 26. Recommended UX Details

## 26.1 Booking Form UX

The booking form should:

* Show selected facility clearly.
* Use date and time inputs.
* Validate start time before end time.
* Show availability errors before submission if possible.
* Show database conflict errors after submission if a race condition occurs.
* Disable submit while saving.
* Show success message after booking.

## 26.2 Booking Status Labels

Recommended labels:

| Status      | Label            |
| ----------- | ---------------- |
| `pending`   | Pending Approval |
| `confirmed` | Confirmed        |
| `rejected`  | Rejected         |
| `cancelled` | Cancelled        |
| `completed` | Completed        |
| `expired`   | Expired          |

## 26.3 Admin Table UX

Admin tables should support:

* Search
* Filters
* Pagination
* Sort by date
* Status badges
* Row actions
* Empty states
* Loading states

## 26.4 Error Message Style

Error messages should be:

* Clear
* Short
* Actionable
* Non-technical where possible

Example:

```txt
This room is already booked at that time. Please choose another time.
```

Avoid exposing raw database errors to end users.

---

## 27. Manual Flow Testing Checklist

Use this checklist after implementation.

### Authentication

* [ ] User can register when registration is enabled.
* [ ] User cannot register when registration is disabled.
* [ ] User can log in.
* [ ] User can log out.
* [ ] Disabled user cannot access protected pages.
* [ ] Employee cannot access admin pages.
* [ ] Admin can access admin pages.

### Facility Browsing

* [ ] Employee can view facility list.
* [ ] Employee can view facility details.
* [ ] Facility photos display.
* [ ] Equipment displays.
* [ ] Inactive facilities are not bookable.
* [ ] Archived facilities are hidden from employee views.

### Booking

* [ ] Employee can create a valid booking.
* [ ] Booking is confirmed when approval is disabled.
* [ ] Booking is pending when approval is enabled.
* [ ] Booking conflict is blocked.
* [ ] Back-to-back bookings are allowed.
* [ ] Booking during blocked period is blocked.
* [ ] Booking during maintenance closure is blocked.
* [ ] Employee can view own bookings.
* [ ] Employee cannot view another user’s booking.
* [ ] Employee can cancel own booking.

### Admin

* [ ] Admin can view all bookings.
* [ ] Admin can create booking on behalf of user.
* [ ] Admin can cancel any booking.
* [ ] Admin can create facility.
* [ ] Admin can edit facility.
* [ ] Admin can upload facility photos.
* [ ] Admin can archive facility.
* [ ] Admin can change user role.
* [ ] Admin can disable user.

### Approvals

* [ ] Admin can view pending approvals.
* [ ] Admin can approve booking.
* [ ] Admin can reject booking.
* [ ] Approval email is created or sent.
* [ ] Rejection email is created or sent.

### Blocked Periods and Maintenance

* [ ] Admin can create blocked period for all facilities.
* [ ] Admin can create blocked period for selected facilities.
* [ ] Admin can edit blocked period.
* [ ] Admin can deactivate blocked period.
* [ ] Admin can create maintenance closure.
* [ ] Admin can complete maintenance closure.
* [ ] Admin can cancel maintenance closure.

### Reports and Logs

* [ ] Admin can view reports.
* [ ] Admin can filter reports.
* [ ] Admin can export CSV.
* [ ] Export creates audit log.
* [ ] Admin can view audit logs.
* [ ] Employee cannot view audit logs.

### Emails

* [ ] Confirmation email record is created or sent.
* [ ] Approval email record is created or sent.
* [ ] Rejection email record is created or sent.
* [ ] Cancellation email record is created or sent.
* [ ] Reminder email record is created or sent.

---

## 28. Definition of Done

The user flows are implemented when:

1. Employees can authenticate and use employee pages.
2. Admins can authenticate and use admin pages.
3. Employees can browse facilities.
4. Employees can create valid bookings.
5. Conflicting bookings are blocked.
6. Blocked periods prevent bookings.
7. Maintenance closures prevent bookings.
8. Employees can manage their own bookings.
9. Admins can manage all bookings.
10. Admins can manage facilities.
11. Admins can manage users.
12. Admins can approve and reject bookings when approval mode is enabled.
13. Required email notifications are created or sent.
14. Reports and CSV exports work.
15. Audit logs are created for important actions.
16. Access control prevents users from seeing or modifying unauthorized data.

```
```
