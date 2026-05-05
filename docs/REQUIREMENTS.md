Paste this into:

```txt
docs/REQUIREMENTS.md
```

````md
# Booking System Requirements

## 1. Project Overview

The Booking System is an internal web application for managing bookings of company building facilities.

The system will allow employees to book available meeting rooms and an event hall, while giving administrators tools to manage rooms, users, bookings, approvals, blocked dates, maintenance closures, reports, logs, and exports.

The system will be developed using:

- Next.js
- TypeScript
- Supabase
- PostgreSQL
- Tailwind CSS
- shadcn/ui

The application will be hosted on Cloudflare Pages and connected to a custom domain purchased from Exabytes.

---

## 2. Primary Goals

The system must:

1. Allow employees to book company rooms and facilities.
2. Prevent overlapping bookings for the same room or hall.
3. Provide configurable booking behavior, including user access and approval settings.
4. Send email notifications for booking-related events.
5. Provide admin tools for managing rooms, users, bookings, approvals, reports, blocked dates, and maintenance closures.
6. Store booking history and audit logs.
7. Support reporting and export functionality.
8. Be internal-only and not intended for public access.

---

## 3. Facilities Available for Booking

The system must support the following bookable facilities by default:

| Facility ID | Facility Name | Level | Type |
|---|---|---:|---|
| MR-L5-01 | Meeting Room 1 | Level 5 | Meeting Room |
| MR-L5-02 | Meeting Room 2 | Level 5 | Meeting Room |
| MR-L6-01 | Meeting Room 1 | Level 6 | Meeting Room |
| MR-L6-02 | Meeting Room 2 | Level 6 | Meeting Room |
| EH-L1-01 | Event Hall | Level 1 | Event Hall |

Admins must be able to manage these facilities through the system.

Facilities must support the following information:

- Name
- Level
- Facility type
- Capacity
- Equipment list
- Photos
- Status
- Availability
- Maintenance state
- Description or notes

---

## 4. User Types and Roles

The system must support role-based access.

### 4.1 Employee

Employees are regular users who can:

- Log in using email and password.
- View available rooms and halls.
- View room details.
- Check booking availability.
- Create bookings.
- View their own bookings.
- Cancel their own bookings, subject to system configuration.
- Receive booking-related email notifications.
- View booking status.

### 4.2 Admin

Admins can manage the whole system.

Admins can:

- Manage rooms and halls.
- Manage users.
- Manage bookings.
- Approve or reject bookings if approval mode is enabled.
- Cancel bookings.
- Create bookings on behalf of users.
- Manage blocked dates.
- Manage maintenance closures.
- View reports.
- Export reports.
- View audit logs.
- Configure system settings.

### 4.3 Configurable Access

The system must make employee access configurable.

Configuration should support:

- Allow all employees to register.
- Restrict registration by approved email domains.
- Restrict access to manually created users only.
- Enable or disable user self-registration.
- Enable or disable specific users.

---

## 5. Authentication Requirements

The system must use email and password authentication.

### 5.1 Required Authentication Features

The system must support:

- User registration, if enabled.
- Login.
- Logout.
- Password reset.
- Email verification, if enabled.
- Protected authenticated routes.
- Role-based page and action access.

### 5.2 Authentication Provider

Supabase Auth should be used for authentication unless a better project-specific reason is identified during implementation.

### 5.3 Internal-Only Access

The system is internal-only.

The application must not allow anonymous users to access booking, room, admin, or reporting pages.

Unauthenticated users should only be able to access:

- Login page
- Registration page, if registration is enabled
- Password reset page

---

## 6. Booking Requirements

### 6.1 Booking Creation

Employees must be able to create bookings by selecting:

- Facility
- Date
- Start time
- End time
- Purpose or title
- Optional description
- Optional attendees or expected participants
- Optional remarks

### 6.2 Booking Statuses

The system must support these booking statuses:

| Status | Description |
|---|---|
| Pending | Booking is waiting for approval, if approval mode is enabled |
| Confirmed | Booking is approved or automatically confirmed |
| Rejected | Booking was rejected by an admin |
| Cancelled | Booking was cancelled |
| Completed | Booking date/time has passed |
| Expired | Booking was not approved before its scheduled time, if applicable |

### 6.3 Automatic Confirmation

By default, bookings should be automatically confirmed.

However, this behavior must be configurable.

The system must support:

- Automatic confirmation mode
- Approval-required mode
- Optional per-facility approval configuration

Example:

- Meeting rooms may be automatically confirmed.
- Event hall bookings may require approval.

This should be configurable by admins.

### 6.4 No Specific Booking Rule Limits

There are currently no specific limits for:

- Maximum booking duration
- Minimum booking duration
- Advance booking window
- Recurring bookings
- Business-hour-only bookings
- Buffer times

However, the system should be designed so these rules can be added later through configuration.

### 6.5 Booking Conflict Prevention

The system must strictly prevent overlapping bookings for the same facility.

A booking conflict exists when:

- The same facility is already booked.
- Existing booking status is Pending or Confirmed.
- New booking start/end time overlaps an existing booking start/end time.

The system must not allow two active bookings for the same facility at the same overlapping time.

The UI should show a clear warning when a conflict is detected.

The backend/database must also enforce conflict prevention. The system must not rely only on frontend validation.

### 6.6 Conflict Warning

When a user attempts to create a conflicting booking, the system must show:

- Facility name
- Existing booking date
- Existing booking start time
- Existing booking end time
- Conflict explanation

The system should not expose sensitive details of other users’ bookings unless allowed by admin configuration.

### 6.7 Booking Cancellation

Users should be able to cancel their own bookings.

Admins should be able to cancel any booking.

When a booking is cancelled:

- Booking status changes to Cancelled.
- Cancellation reason may be recorded.
- Cancellation email is sent.
- Audit log entry is created.

### 6.8 Booking History

The system must keep booking history.

Users should be able to view their own past and current bookings.

Admins should be able to view all bookings.

Booking history should include:

- Facility
- Date
- Start time
- End time
- Created by
- Status
- Purpose/title
- Approval information, if applicable
- Cancellation information, if applicable
- Created date
- Updated date

---

## 7. Room and Facility Management

Admins must be able to manage all bookable facilities.

### 7.1 Facility Fields

Each facility should include:

- Name
- Slug or unique identifier
- Level
- Type
- Capacity
- Equipment
- Photos
- Description
- Status
- Requires approval setting
- Availability setting
- Created date
- Updated date

### 7.2 Facility Statuses

Facilities should support these statuses:

| Status | Description |
|---|---|
| Active | Available for booking |
| Inactive | Hidden or unavailable |
| Under Maintenance | Temporarily unavailable |
| Archived | No longer used but retained for history |

### 7.3 Equipment

Admins should be able to define equipment for each facility.

Examples:

- Projector
- TV screen
- Whiteboard
- Video conferencing system
- Microphone
- Speaker system
- HDMI cable
- Air conditioning
- Tables
- Chairs

Equipment may be stored as structured records or as a list, depending on implementation complexity.

### 7.4 Photos

Facilities must support photos.

Photo requirements:

- Admins can upload facility photos.
- Facility detail pages display photos.
- Photos should be stored in Supabase Storage or an equivalent configured storage provider.
- Each facility can have multiple photos.
- One photo can be marked as the primary photo.

---

## 8. Approval Requirements

Approval is configurable.

### 8.1 Approval Modes

The system must support:

- Global automatic confirmation
- Global approval-required mode
- Per-facility approval-required mode

### 8.2 Approval Workflow

When approval is required:

1. Employee submits booking.
2. Booking status becomes Pending.
3. Admin receives or can view pending booking request.
4. Admin approves or rejects the request.
5. User receives approval or rejection email.
6. Audit log entry is created.

### 8.3 Approval Actions

Admins must be able to:

- View pending bookings.
- Approve bookings.
- Reject bookings.
- Add approval or rejection remarks.
- Filter bookings by approval status.

### 8.4 Approval Result

If approved:

- Booking status becomes Confirmed.
- Approval timestamp is saved.
- Approving admin is saved.
- Approval notification email is sent.

If rejected:

- Booking status becomes Rejected.
- Rejection timestamp is saved.
- Rejecting admin is saved.
- Rejection reason is saved.
- Rejection notification email is sent.

---

## 9. Blocked Dates and Maintenance Closures

Admins must be able to block facility availability.

### 9.1 Blocked Dates

Blocked dates are dates or time ranges when a facility cannot be booked.

Blocked dates may apply to:

- One facility
- Multiple facilities
- All facilities

Examples:

- Company-wide event
- Public holiday
- Cleaning schedule
- Private management event
- Renovation

### 9.2 Maintenance Closures

Maintenance closures are periods when a facility is unavailable because of maintenance.

Maintenance closure records should include:

- Facility
- Start date/time
- End date/time
- Reason
- Created by
- Created date
- Status

### 9.3 Booking Behavior During Blocked Dates

Users must not be able to create bookings during blocked or maintenance periods.

The system must show a clear message when a selected facility and time is unavailable due to:

- Existing booking
- Blocked date
- Maintenance closure
- Facility inactive status

---

## 10. Email Notification Requirements

The system must send email notifications for important booking events.

### 10.1 Required Emails

The system must send emails for:

- Booking confirmation
- Booking approval
- Booking rejection
- Booking cancellation
- Booking reminder

### 10.2 Booking Confirmation Email

Triggered when:

- Booking is created and automatically confirmed.
- Booking is approved by admin.

Email should include:

- Booking title/purpose
- Facility name
- Level
- Date
- Start time
- End time
- Status
- User name
- Link to booking details

### 10.3 Booking Rejection Email

Triggered when an admin rejects a booking.

Email should include:

- Booking title/purpose
- Facility name
- Date
- Start time
- End time
- Rejection reason, if provided
- Link to booking details

### 10.4 Booking Cancellation Email

Triggered when a booking is cancelled.

Email should include:

- Booking title/purpose
- Facility name
- Date
- Start time
- End time
- Cancelled by
- Cancellation reason, if provided

### 10.5 Reminder Email

Triggered before a confirmed booking starts.

Reminder timing should be configurable.

Default reminder timing:

- 24 hours before booking
- 1 hour before booking

The system should be designed so reminder timing can be changed later.

### 10.6 Email Provider

The email provider is not finalized.

Implementation should support a configurable email provider.

Potential providers:

- Resend
- SendGrid
- Mailgun
- SMTP provider
- Supabase Edge Function with SMTP integration

Email provider settings must be stored securely in environment variables.

---

## 11. Admin Management Requirements

Admins must have a dedicated admin dashboard.

### 11.1 Admin Dashboard

The admin dashboard should show:

- Total bookings
- Upcoming bookings
- Pending approvals
- Facilities currently unavailable
- Recent booking activity
- Basic utilization summary

### 11.2 User Management

Admins must be able to:

- View users
- Search users
- Filter users by role/status
- Create users, if needed
- Disable users
- Change user roles
- View user booking history

### 11.3 Booking Management

Admins must be able to:

- View all bookings
- Search bookings
- Filter by facility
- Filter by date range
- Filter by status
- Filter by user
- Create booking on behalf of a user
- Cancel bookings
- Approve bookings, if approval mode is enabled
- Reject bookings, if approval mode is enabled

### 11.4 Facility Management

Admins must be able to:

- Create facilities
- Edit facilities
- Upload facility photos
- Update facility equipment
- Change facility status
- Set facility approval requirement
- Archive facilities

### 11.5 Blocked Date Management

Admins must be able to:

- Create blocked periods
- Edit blocked periods
- Delete blocked periods
- Assign blocked periods to facilities
- Add reason for blocking

### 11.6 Maintenance Closure Management

Admins must be able to:

- Create maintenance closures
- Edit maintenance closures
- Complete maintenance closures
- Cancel maintenance closures
- Add maintenance notes

---

## 12. Reporting Requirements

The system must support admin reports.

### 12.1 Required Reports

Reports should include:

- Booking history report
- Facility utilization report
- User booking report
- Cancelled bookings report
- Approval report
- Maintenance closure report
- Blocked date report
- Audit log report

### 12.2 Report Filters

Reports should support filters such as:

- Date range
- Facility
- Facility type
- User
- Booking status
- Approval status
- Level

### 12.3 Export Requirements

Admins must be able to export report data.

Supported export formats:

- CSV
- PDF, optional if practical
- Excel, optional if practical

CSV export should be prioritized first.

### 12.4 Report Metrics

Reports should include metrics such as:

- Total bookings
- Confirmed bookings
- Cancelled bookings
- Rejected bookings
- Pending bookings
- Total hours booked
- Facility utilization by room
- Most frequently booked facilities
- Most active users

---

## 13. Audit Log Requirements

The system must keep audit logs for important actions.

### 13.1 Logged Actions

The system should log:

- User login, optional
- User creation
- User role changes
- Facility creation
- Facility updates
- Facility status changes
- Booking creation
- Booking approval
- Booking rejection
- Booking cancellation
- Blocked date creation
- Blocked date updates
- Blocked date deletion
- Maintenance closure creation
- Maintenance closure updates
- Maintenance closure completion
- System setting changes
- Export actions

### 13.2 Audit Log Fields

Audit logs should include:

- Action type
- Entity type
- Entity ID
- Actor user ID
- Actor email
- Timestamp
- Previous values, where applicable
- New values, where applicable
- IP address, if practical
- User agent, if practical

### 13.3 Audit Access

Only admins should be able to view audit logs.

Audit logs should be read-only from the application UI.

---

## 14. System Settings Requirements

The system must support configurable settings.

### 14.1 Required Settings

The system should allow admins to configure:

- Whether registration is enabled
- Allowed email domains
- Default booking confirmation mode
- Whether approval is required globally
- Whether facilities can override approval settings
- Reminder email timing
- Cancellation rules, future enhancement
- Booking duration rules, future enhancement
- Advance booking rules, future enhancement
- App name
- Company name
- System contact email

### 14.2 Settings Storage

Settings should be stored in the database.

Settings should be editable by admins only.

Sensitive settings such as API keys must not be stored in normal database settings.

Sensitive settings must be stored in environment variables.

---

## 15. User Interface Requirements

The system must be a web application.

### 15.1 General UI Requirements

The UI should be:

- Clean
- Responsive
- Mobile-friendly
- Easy to use
- Accessible where practical
- Built with Tailwind CSS and shadcn/ui

### 15.2 Employee Pages

Employee-facing pages should include:

- Login page
- Registration page, if enabled
- Dashboard
- Facility list
- Facility detail page
- Booking calendar
- Create booking page or modal
- My bookings page
- Booking detail page
- Profile page

### 15.3 Admin Pages

Admin pages should include:

- Admin dashboard
- Bookings management
- Facilities management
- Users management
- Pending approvals
- Reports
- Audit logs
- Blocked dates
- Maintenance closures
- System settings

### 15.4 Calendar View

The booking interface should provide a calendar-style view.

Preferred views:

- Day view
- Week view
- Month view, optional
- Facility timeline view, optional

The system should make it easy to see whether a facility is available before booking.

### 15.5 Facility List

The facility list should show:

- Facility name
- Level
- Type
- Capacity
- Equipment summary
- Photo thumbnail
- Status
- Availability indicator

### 15.6 Facility Detail Page

The facility detail page should show:

- Facility photos
- Name
- Level
- Type
- Capacity
- Equipment
- Description
- Current availability
- Booking calendar
- Book button

---

## 16. Data and Database Requirements

The system must use PostgreSQL through Supabase.

### 16.1 Core Data Entities

The database should support these main entities:

- Users / profiles
- Roles
- Facilities
- Facility photos
- Equipment
- Facility equipment
- Bookings
- Booking approvals
- Blocked dates
- Maintenance closures
- Email notifications
- Audit logs
- System settings

### 16.2 Data Integrity

The database must enforce:

- Required fields
- Valid booking statuses
- Valid facility statuses
- Valid user roles
- Non-overlapping active bookings for the same facility
- Valid date/time ranges
- Referential integrity between bookings and facilities/users

### 16.3 Time Handling

The system should store timestamps in UTC.

The UI should display times in the configured local timezone.

Default timezone should be configurable.

Recommended default timezone:

- Asia/Kuala_Lumpur

---

## 17. Security Requirements

### 17.1 Authentication Security

The system must:

- Require authentication for protected pages.
- Use Supabase Auth securely.
- Protect admin routes.
- Prevent unauthorized access to user and admin data.

### 17.2 Authorization

Authorization must be enforced on both:

- Frontend route level
- Backend/database level

Supabase Row Level Security should be enabled where applicable.

### 17.3 Role-Based Access Control

The system must ensure:

- Employees can only manage their own bookings.
- Employees cannot access admin pages.
- Admins can manage system-wide data.
- Only admins can change system settings.
- Only admins can view audit logs.

### 17.4 Data Protection

The system must not expose:

- Passwords
- Auth tokens
- API keys
- Private environment variables
- Sensitive user information to unauthorized users

### 17.5 Internal Access

Since the system is internal-only, access should be restricted using one or more of:

- Authentication
- Approved email domains
- Admin-created accounts
- Cloudflare Access, optional future enhancement

---

## 18. Deployment Requirements

The system will be hosted on Cloudflare Pages.

### 18.1 Hosting

Deployment target:

- Cloudflare Pages

### 18.2 Domain

The system will use a custom domain purchased from Exabytes.

Domain setup should include:

- DNS configuration
- Cloudflare Pages custom domain connection
- HTTPS enabled
- Redirect rules if needed

### 18.3 Environment Variables

The project must support environment variables for:

- Supabase URL
- Supabase anon key
- Supabase service role key, server-only
- Email provider API key
- Email sender address
- App URL
- App timezone
- Other provider-specific secrets

### 18.4 Production Build

The project must support:

- Local development
- Preview deployment
- Production deployment

The app should build successfully with:

```bash
npm run build
````

---

## 19. Non-Functional Requirements

### 19.1 Performance

The system should:

* Load core pages quickly.
* Paginate large admin tables.
* Avoid unnecessary database reads.
* Use indexes for booking date and facility queries.
* Optimize facility photo loading.

### 19.2 Reliability

The system should:

* Avoid double-booking.
* Handle failed email sending gracefully.
* Preserve booking records even if notification sending fails.
* Log important errors where practical.

### 19.3 Maintainability

The codebase should:

* Use TypeScript.
* Use clear folder structure.
* Separate UI, data access, validation, and business logic.
* Use reusable components.
* Use clear naming conventions.
* Include comments for complex logic.

### 19.4 Accessibility

The UI should follow basic accessibility practices:

* Keyboard-accessible forms.
* Proper labels.
* Clear error messages.
* Sufficient contrast.
* Semantic HTML where practical.

---

## 20. Validation Requirements

### 20.1 Booking Validation

The system must validate:

* Facility is active.
* Facility is not under maintenance.
* Selected time range is valid.
* Start time is before end time.
* Booking does not overlap an active booking.
* Booking does not overlap blocked periods.
* User is authenticated.
* User is allowed to book.

### 20.2 Admin Validation

Admin forms must validate:

* Required fields
* Valid capacity numbers
* Valid date/time ranges
* Valid user roles
* Valid facility statuses
* Valid email addresses
* Valid settings values

### 20.3 Frontend and Backend Validation

Validation must happen on both:

* Frontend, for user experience
* Backend/database, for data integrity and security

---

## 21. Suggested MVP Scope

The first working version should include:

1. Email/password authentication.
2. Employee dashboard.
3. Facility list and facility details.
4. Booking creation.
5. Strict conflict prevention.
6. My bookings page.
7. Admin booking management.
8. Admin facility management.
9. Basic approval configuration.
10. Basic email notifications.
11. Booking history.
12. Basic audit logs.
13. CSV export for bookings.
14. Cloudflare Pages deployment.

---

## 22. Future Enhancements

The system should be designed so the following can be added later:

* Google Calendar or Outlook integration
* Recurring bookings
* QR code check-in
* Room display screens
* Mobile app
* Advanced analytics
* Cloudflare Access integration
* SSO login
* Department-based booking permissions
* Booking quotas
* Auto-release if no check-in
* Waitlist for fully booked facilities
* Catering or equipment requests
* Visitor registration
* Multi-building support

---

## 23. Assumptions

The following assumptions are used for this requirement document:

1. All employees may use the system, but access must be configurable.
2. Authentication will use email and password.
3. Bookings are automatically confirmed by default.
4. Approval behavior must be configurable.
5. The system must prevent overlapping bookings.
6. The system is internal-only.
7. Calendar integration is not required.
8. Email notifications are required.
9. Cloudflare Pages will be used for hosting.
10. Supabase will be used for auth, database, and likely storage.
11. PostgreSQL will be the primary database.
12. CSV export is required.
13. PDF and Excel export are optional unless later prioritized.
14. The initial timezone should be Asia/Kuala_Lumpur unless changed.

---

## 24. Out of Scope for Initial Version

The following are not required for the initial version unless later requested:

* Public booking pages
* Payment handling
* External guest self-service bookings
* Native mobile apps
* Google Calendar sync
* Outlook Calendar sync
* SSO
* Hardware room displays
* QR check-in
* Catering management
* Visitor management
* Multi-tenant support
* Multi-building support

---

## 25. Definition of Done

The requirements are considered satisfied when:

1. Employees can log in and create room bookings.
2. Employees can view available facilities.
3. Employees can view and cancel their own bookings.
4. The system prevents overlapping bookings.
5. Admins can manage facilities.
6. Admins can manage users.
7. Admins can manage bookings.
8. Admins can approve or reject bookings when approval mode is enabled.
9. Admins can create blocked dates and maintenance closures.
10. Email notifications are sent for confirmation, approval, rejection, cancellation, and reminders.
11. Booking history is stored.
12. Audit logs are created for key actions.
13. Admins can view reports.
14. Admins can export booking data to CSV.
15. The application is deployed successfully to Cloudflare Pages.
16. The application uses the custom domain.
17. Internal-only access is enforced.

```
```
