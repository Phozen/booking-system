# Frontend UX/UI Specification

This document is the source of truth for future frontend polish and UI implementation for the internal Booking System.

It is based on:

- `docs/REQUIREMENTS.md`
- `docs/DEVELOPMENT_PLAN.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/USER_FLOWS.md`
- `docs/SECURITY_CHECKLIST.md`
- `docs/QA_CHECKLIST.md`
- `docs/TEST_DATA_GUIDE.md`
- Current app routes and component structure

This specification does not change product behavior, database schema, or implementation scope. It defines the desired frontend shape for future incremental work.

## 1. Frontend Goals

The Booking System should feel like a calm internal operations tool: quick to understand, predictable, and forgiving when users make mistakes.

Primary UX goals:

- Simple: common actions should be visible without explanation.
- Internal-company friendly: professional, plain language, no marketing tone.
- Fast to understand: employees should be able to book a facility without learning an admin-style system.
- Mobile-friendly: employee booking flows must be comfortable on phones; admin flows must remain usable on tablets and small laptops.
- Accessible: keyboard, screen reader, color contrast, and form-error behavior must be considered in every component.
- Consistent: page titles, forms, tables, filters, buttons, badges, and alerts should follow shared patterns.
- Clearly separated roles: employee pages and admin pages should use different layout shells and navigation.
- Low-friction booking: facility selection, date/time entry, availability feedback, and success recovery should be direct and obvious.
- Secure by design: UI hiding is helpful, but server-side authorization remains mandatory and should be reflected in access-denied states.

Design personality:

- Quiet, utilitarian, and work-focused.
- Dense enough for repeated admin use.
- Friendly enough for employees who only book rooms occasionally.
- Avoid decorative-heavy layouts, oversized marketing heroes inside the app, and visual complexity that competes with operational tasks.

## 2. Information Architecture

### Public And Auth Pages

| Route | Purpose | Current status | Notes |
| --- | --- | --- | --- |
| `/` | Public entry and app introduction | Exists | Should become a concise internal landing/redirect surface, not a marketing page. |
| `/login` | Email/password login | Exists | Should be the primary unauthenticated entry. |
| `/register` | Employee registration, if enabled | Exists | Must reflect registration settings and allowed domain messaging. |
| `/reset-password` | Password reset request | Exists | Reset link behavior uses this route. |

### Employee Pages

| Route | Purpose | Current status | Notes |
| --- | --- | --- | --- |
| `/dashboard` | Employee overview and quick actions | Exists | Needs shared employee shell and stronger upcoming booking preview. |
| `/facilities` | Browse active facilities | Exists | Good foundation; needs filters/search eventually. |
| `/facilities/[slug]` | Facility details and booking entry | Exists | Good booking entry point; needs richer availability messaging later. |
| `/calendar` | Personal booking calendar | Exists | Shows the employee's own past, current, and upcoming bookings by month. |
| `/bookings/new` | Create booking | Exists | Needs stronger availability feedback and form error UX. |
| `/bookings/[id]` | Employee booking detail | Exists | Should keep privacy-safe not-found/access-denied behavior. |
| `/my-bookings` | Current user's bookings | Exists | Good grouping foundation. |
| `/profile` | User profile | Planned in navigation, not implemented | Should be added later or removed from visible nav until implemented. |

### Admin Pages

| Route | Purpose | Current status | Notes |
| --- | --- | --- | --- |
| `/admin/dashboard` | Admin overview | Exists | Currently foundational; needs metrics and recent activity polish. |
| `/admin/calendar` | All-bookings calendar | Exists | Admin-only calendar for reviewing bookings across facilities and users. |
| `/admin/facilities` | Facility list and management | Exists | Needs shared admin shell and filters. |
| `/admin/facilities/new` | Create facility | Exists | Form foundation exists. |
| `/admin/facilities/[id]` | Edit facility | Exists | Form foundation exists; photo/equipment management deferred. |
| `/admin/bookings` | All bookings | Exists | Status/facility filters exist; needs broader filters and responsive pattern. |
| `/admin/bookings/[id]` | Admin booking detail/actions | Exists | Needs consistent destructive confirmation UX. |
| `/admin/approvals` | Pending approvals | Exists | Should emphasize time-sensitive pending work. |
| `/admin/blocked-dates` | Blocked period list | Exists | Needs consistent table/filter treatment. |
| `/admin/blocked-dates/new` | Create blocked period | Exists | Form foundation exists. |
| `/admin/blocked-dates/[id]` | Edit/deactivate blocked period | Exists | Needs clear active/inactive status messaging. |
| `/admin/maintenance` | Maintenance closure list | Exists | Needs consistent status and filters. |
| `/admin/maintenance/new` | Create closure | Exists | Form foundation exists. |
| `/admin/maintenance/[id]` | Edit/complete/cancel closure | Exists | Needs confirmation pattern for state changes. |
| `/admin/email-notifications` | Email queue management | Exists | Needs clear retry/process affordances and status treatment. |
| `/admin/reports` | Report views and CSV exports | Exists | Needs consistent export placement and responsive data display. |
| `/admin/audit-logs` | Audit log list | Exists | Needs JSON preview/detail polish and filters. |
| `/admin/audit-logs/[id]` | Audit log detail | Exists | Should preserve read-only treatment. |
| `/admin/settings` | System settings | Exists | Needs clear grouping and success feedback. |
| `/admin/users` | User management | Planned in docs/navigation, not implemented | Keep out of visible nav until implemented or show "not available yet" intentionally. |

## 3. Global Layout

### Auth Layout

Purpose: keep login/register/reset pages focused and low-distraction.

Recommended structure:

- Centered auth panel with max width around `420px`.
- Left/top brand area: app name, company name if configured, short internal-use line.
- Main form card using shadcn `Card`.
- Secondary links below form:
  - Login page: Register, reset password.
  - Register page: Login.
  - Reset password page: Login.
- No employee/admin navigation while logged out.
- Show registration-disabled state in the page body, not as a broken form.

Behavior:

- On desktop: centered panel, subtle full-page background using `background` and `muted`, no illustration required.
- On mobile: full-width page with comfortable `px-4`, card can become visually unframed if width is tight.
- Error alerts should be near the form submit area and also tied to fields where possible.

### Employee App Layout

Purpose: help employees move between dashboard, facilities, new booking, and their bookings quickly.

Recommended structure:

- Top header for employee app:
  - App name or compact logo text.
  - Primary nav: Dashboard, Facilities, New Booking, My Bookings.
  - Account menu: signed-in email, role, logout.
- Mobile header:
  - App name.
  - Menu button.
  - Sheet/dropdown nav with the same links.
- Main content:
  - `max-w-6xl` for browse/detail pages.
  - `max-w-4xl` for focused forms.
  - `max-w-5xl` for dashboard and booking lists.
- Page header:
  - Eyebrow text such as "Employee area".
  - H1.
  - One short description only where useful.
  - Primary action on the right on desktop.
- Breadcrumbs:
  - Use for detail and form pages: Facilities > Facility detail > Create booking.
  - Do not overuse on the dashboard.

Required employee nav links:

- Dashboard: `/dashboard`
- Facilities: `/facilities`
- New Booking: `/bookings/new`
- My Bookings: `/my-bookings`
- Profile: only when `/profile` exists.

### Admin Layout

Purpose: support repeated operational work with stable navigation and dense content.

Recommended structure:

- Desktop:
  - Left sidebar, `240px` wide.
  - Admin label visibly distinct from employee area.
  - Main content region with page header and content.
  - Account/logout area pinned at bottom or top of sidebar.
- Tablet:
  - Collapsible sidebar or top horizontal admin nav.
- Mobile:
  - Top admin bar with menu button.
  - Drawer navigation.
  - Tables can become horizontally scrollable or card-list summaries.

Admin sidebar groups:

- Overview: Dashboard
- Operations: Bookings, Approvals, Facilities
- Availability: Blocked Dates, Maintenance
- Monitoring: Email Notifications, Reports, Audit Logs
- Configuration: Settings
- Users: show only once `/admin/users` exists.

Admin page header:

- H1 plus short operational description.
- Primary action button on the right.
- Optional filter summary below.
- Breadcrumbs for new/edit/detail routes.

### Empty, Loading, And Error States

Every major page should define:

- Empty state: what happened, what the user can do next.
- Loading state: short skeleton or "Loading..." with screen-reader text.
- Error state: plain message and retry/back action where possible.

Examples:

- Facility empty: "No active facilities are available. Contact an admin if this looks wrong."
- My Bookings empty: "No bookings yet. Browse facilities to create your first booking."
- Admin table empty: "No records match these filters. Clear filters or adjust the date range."
- Access denied: "You do not have permission to access this page."

## 4. Visual Design Direction

### Overall Tone

- Clean internal dashboard style.
- Neutral base palette using existing Tailwind/shadcn tokens.
- Use color as a status accent, not as a decorative theme.
- Prefer clear spacing, borders, and hierarchy over gradients or visual effects.
- Keep cards at `rounded-lg` or smaller, matching current components.

### Card Style

- Use cards for repeated items, forms, detail panels, and tables.
- Avoid nesting cards inside cards.
- Page sections should be unframed or simple bordered panels.
- Card padding:
  - Compact table panels: `p-4`.
  - Forms/detail panels: `p-5` or `p-6`.
  - Mobile: `p-4`.

### Button Hierarchy

- Primary button: one per main workflow section.
- Outline button: secondary navigation/actions.
- Ghost button: back links, low emphasis reset/cancel actions.
- Destructive button: cancellation, rejection, deactivation, completing irreversible state transitions when appropriate.
- Icon usage:
  - Use lucide icons when the action benefits from recognition.
  - Icons should be paired with visible text except very familiar compact actions.
  - Icon-only buttons require accessible labels and tooltips.

### Form Style

- Use vertical label/input stacks.
- Two-column form grids on desktop where fields are short.
- Full-width fields for descriptions, domain lists, and JSON-like content.
- Use `Label`, `Input`, `Button`, `Alert`, and future shared `FormFieldError`.
- Native date/time inputs are acceptable for MVP but must have clear labels.
- Textareas should use the same border, radius, focus, and disabled treatment as inputs.

### Table Style

- Table panels use bordered `bg-card` containers.
- Header area includes table title, count, and primary action if any.
- Filters sit above table in a bordered filter bar.
- Table headers use small uppercase muted text.
- Rows use `border-t`, clear row actions, and hover state where clickable.
- All table actions should have visible text and icon where useful.
- Wide tables should support horizontal scrolling, but important summary data should remain visible on mobile through card alternatives.

### Badge And Status Colors

Status badges must use both label text and color. Color should be consistent across the app.

Suggested intent:

- Pending/waiting: amber.
- Confirmed/active/sent/completed success: emerald.
- Rejected/failed/destructive: rose.
- Cancelled/inactive/archived: slate or zinc.
- Maintenance/in progress/scheduled: sky or amber depending urgency.
- Queued/sending: amber or sky.

### Spacing Scale

Use existing Tailwind scale:

- Page padding: `px-4` mobile, `px-6` default, `px-8` or `px-10` wide desktop.
- Page vertical rhythm: `py-8` to `py-10`.
- Section gaps: `gap-6` to `gap-8`.
- Form gaps: `gap-4` to `gap-6`.
- Table cell padding: `px-4 py-3`.

### Typography Hierarchy

- H1: `text-3xl font-semibold tracking-normal`.
- H2 section title: `text-lg font-semibold`.
- H3/card title: `font-medium` or `text-base font-semibold`.
- Body: `text-sm` for operational surfaces, `text-base` for employee explanatory copy.
- Muted helper text: `text-sm text-muted-foreground`.
- Avoid negative letter spacing.
- Do not scale font sizes with viewport width.

### Responsive Breakpoints

- Mobile: `<640px`
- Tablet: `640px-1023px`
- Desktop: `1024px+`

Use:

- `sm:` for two-column simple layouts.
- `md:` for form/filter grid expansion.
- `lg:` for employee detail split and admin sidebar.

### Photo Placeholder Style

Facility photos should:

- Keep a stable aspect ratio: `4/3` for cards, `16/9` for detail hero.
- Show a neutral placeholder with building/photo icon if missing.
- Include alt text or `role="img"` with an accessible label when rendered as background.
- Avoid dark blurred stock-like placeholders.
- Do not block booking comprehension if photos are missing.

## 5. Accessibility Requirements

### Keyboard Navigation

- All links, buttons, form controls, filters, and row actions must be reachable with Tab.
- Focus order should match visual order.
- Do not use clickable `div`s where a `button` or `a` is appropriate.
- Back/cancel buttons should not trap focus.

### Visible Focus States

- Preserve existing `focus-visible:ring` treatment.
- Do not remove outlines.
- Focus indicators must be visible against light and dark backgrounds.

### Forms

- Every input/select/textarea must have a visible label.
- Required fields should be indicated in label text or helper text.
- Field-specific errors should be adjacent to the field.
- Errors should be associated with controls using `aria-describedby` and `aria-invalid` where practical.
- Submit errors should also appear in an alert region.

### Button Text Clarity

- Use action-specific text:
  - "Create booking", not "Submit".
  - "Cancel booking", not "Cancel" when destructive.
  - "Approve booking", "Reject booking", "Deactivate blocked period".
- Loading text should describe work: "Creating...", "Saving...", "Processing emails...".

### ARIA Usage

- Use `aria-live="polite"` for success messages and non-destructive async state updates.
- Use `role="alert"` or shadcn Alert semantics for error messages.
- Icon-only controls require `aria-label`.
- Disabled pagination links should use `aria-disabled` and non-interactive styling.

### Dialog And Modal Behavior

- Destructive confirmations should use an accessible dialog component when added.
- Focus must move into the dialog when opened.
- Escape closes non-critical dialogs.
- Confirmation button text must name the action.
- Cancel/close must be available and obvious.
- State-changing forms should keep data entry outside the dialog where practical, then use the shared confirmation dialog as the final step before submitting the existing server action.

### Table Accessibility

- Use semantic `table`, `thead`, `tbody`, `th`, `td`.
- Header cells should describe columns.
- Empty table row must span all columns.
- If sortable columns are added, use `aria-sort`.
- If horizontal scroll is used, preserve keyboard access and visible focus.

### Color Contrast And Status

- Text and critical controls should meet WCAG AA contrast.
- Status badges must not rely only on color.
- Warnings/errors should include text and, where helpful, an icon.

### Date/Time Inputs

- Date and time inputs must have visible labels.
- Use helper text for timezone where ambiguity matters:
  - "Times are shown in Asia/Kuala_Lumpur."
- Show selected start/end as a readable summary before submit where practical.

### Mobile Tap Targets

- Primary controls should be at least `40px` high on mobile where practical.
- Avoid tiny adjacent action links.
- Keep destructive and non-destructive buttons visually separated.

### Reduced Motion

- Avoid non-essential animation.
- If transitions are used, keep them short and non-blocking.
- Respect `prefers-reduced-motion` for future animated menus or skeletons.

### Screen Reader States

- Empty, loading, success, and error states should be readable as text.
- Do not communicate availability only with icons or color.

## 6. Employee User Experience

### Ideal Employee Flow

1. User logs in.
2. User lands on `/dashboard`.
3. Dashboard shows upcoming bookings and quick actions.
4. User browses `/facilities`.
5. User opens a facility detail page.
6. User clicks "Book this facility".
7. Booking form preselects facility.
8. User selects date/time and enters purpose.
9. App validates form and checks availability.
10. Successful booking redirects to `/my-bookings?created=1`.
11. User sees status and can open booking detail.
12. User can cancel eligible own booking with confirmation.

### `/dashboard`

Purpose:

- Provide a quick snapshot of the employee's booking activity.

Primary actions:

- New booking.
- View My Bookings.
- Browse Facilities.

Secondary actions:

- Logout through account menu.
- Open upcoming booking detail.

Key components:

- Employee shell.
- Page header.
- Upcoming bookings preview.
- Quick action group.
- Optional status summary cards: pending, confirmed, cancelled.

Empty state:

- "No upcoming bookings yet. Browse facilities or create a booking."

Error state:

- "Bookings could not be loaded. Try again."

Mobile behavior:

- Quick actions stack.
- Upcoming bookings render as cards.

### `/facilities`

Purpose:

- Let employees find a suitable facility.

Primary action:

- Open facility detail.

Secondary actions:

- Start booking if a direct card action is added later.
- Filter/search by level, type, capacity, status.

Key components:

- FacilityCard.
- Facility photo/placeholder.
- Status badge.
- Equipment summary.

Empty state:

- "No active facilities are available."

Error state:

- "Facilities could not be loaded."

Mobile behavior:

- Single-column cards.
- Image above details.
- Details button full width or easy to tap.

### `/facilities/[slug]`

Purpose:

- Help user decide whether this facility is appropriate and start booking.

Primary action:

- Book this facility.

Secondary actions:

- Back to facilities.

Key components:

- Facility image.
- Facility facts: type, level, capacity, status, approval requirement.
- Equipment list.
- Photo gallery.
- Future availability preview.

Empty state:

- Missing equipment/description/photos should show calm placeholders.

Error state:

- Facility not found should show privacy-safe not found.

Mobile behavior:

- Image, facts, and booking CTA stack.
- Booking CTA should be visible near top after facts.

### `/bookings/new`

Purpose:

- Create a booking with minimum friction.

Primary action:

- Create booking.

Secondary actions:

- Back/cancel to facilities.

Key components:

- BookingForm.
- Facility selector.
- Date and time inputs.
- Purpose/title input.
- Description.
- Attendee count.
- Availability feedback.
- Alert for success/error.

Empty state:

- No facilities available should disable submit and explain why.

Error states:

- Existing booking conflict.
- Blocked period conflict.
- Maintenance conflict.
- Facility inactive/archived.
- Invalid date/time.
- Capacity exceeded.

Mobile behavior:

- All fields stack.
- Date/time fields are grouped but not cramped.
- Submit and cancel buttons stack with primary action first or last consistently.

### `/my-bookings`

Purpose:

- Let employees review current and historical bookings.

Primary action:

- New booking.

Secondary actions:

- Open booking detail.

Key components:

- Booking sections:
  - Pending approval.
  - Upcoming confirmed.
  - Past/history.
  - Cancelled.
- BookingCard.
- BookingStatusBadge.

Empty states:

- Each section gets its own empty message.
- If all empty, show stronger first-booking CTA.

Error state:

- "Your bookings could not be loaded."

Mobile behavior:

- Cards only.
- Avoid dense tables for employees.

### `/bookings/[id]`

Purpose:

- Show booking details and allow cancellation when eligible.

Primary action:

- Cancel booking, only when status allows.

Secondary actions:

- Back to My Bookings.
- Create another booking.

Key components:

- BookingDetail.
- BookingStatusBadge.
- CancelBookingForm.
- Approval/cancellation sections.

Empty/error state:

- Use not found or access denied without revealing other users' bookings.

Mobile behavior:

- Details stack into definition-list sections.
- Cancel form appears after core details.

## 7. Admin User Experience

### Ideal Admin Flow

1. Admin logs in and lands on `/admin/dashboard`.
2. Admin sees high-level activity and urgent pending approvals.
3. Admin uses sidebar navigation for operational sections.
4. Admin filters/scans tables, opens detail pages, performs actions.
5. Admin gets confirmation feedback and can verify audit logs.

### `/admin/dashboard`

Purpose:

- Operational overview.

Primary actions:

- Review pending approvals.
- View bookings.

Secondary actions:

- Manage facilities.
- View reports.

Key components:

- AdminShell.
- Summary metric cards.
- Pending approvals preview.
- Upcoming bookings preview.
- Facility unavailable preview.
- Recent audit activity.

Empty state:

- Show "No pending approvals" and "No upcoming bookings" individually.

Mobile behavior:

- Metric cards in one column.
- Previews as cards.

### `/admin/facilities`

Purpose:

- Manage facility records.

Primary action:

- New facility.

Table columns:

- Code.
- Name.
- Level.
- Type.
- Capacity.
- Status.
- Approval.
- Display order.
- Actions.

Filters:

- Search by name/code.
- Level.
- Type.
- Status.

Empty state:

- "No facilities found."

Mobile behavior:

- Card list alternative should show code, name, level, status, approval, edit action.

### `/admin/facilities/new` And `/admin/facilities/[id]`

Purpose:

- Create or update facility details.

Form fields:

- Code.
- Name.
- Slug.
- Level.
- Type.
- Capacity.
- Description.
- Status.
- Requires approval.
- Display order.

Primary action:

- Create facility or Save facility.

Secondary actions:

- Cancel/back to facilities.

Error states:

- Duplicate code/slug.
- Invalid capacity.
- Invalid status/type.

Mobile behavior:

- One-column form.
- Sticky or repeated save button is optional later.

### `/admin/bookings`

Purpose:

- Review and manage all bookings.

Primary action:

- Open booking detail.

Table columns:

- Title.
- Facility.
- User.
- Date.
- Start/end time.
- Status.
- Approval required.
- Created date.
- Actions.

Filters:

- Status.
- Facility.
- Date range.
- User/email search.
- Level.

Empty state:

- "No bookings match these filters."

Mobile behavior:

- Card list summary is preferred over forcing `min-w-[1120px]`.
- If horizontal table remains, add visible "scroll horizontally" affordance.

### `/admin/bookings/[id]`

Purpose:

- Show complete booking context and admin actions.

Primary actions:

- Approve booking when pending.
- Reject booking when pending.
- Cancel pending/confirmed booking.

Secondary actions:

- Back to bookings.
- View user/facility context if routes exist later.

Key components:

- AdminBookingDetail.
- ApprovalActionForm.
- AdminCancelBookingForm.
- BookingStatusBadge.
- Confirmation dialog for destructive actions.

Error states:

- Conflict on approval re-check.
- Booking no longer actionable.

Mobile behavior:

- Actions stack below details.
- Destructive actions should not be adjacent to approve without spacing.

### `/admin/approvals`

Purpose:

- Let admins process pending approval-required bookings quickly.

Primary actions:

- Approve.
- Reject.
- Open detail.

Table columns:

- Booking title.
- Facility.
- User.
- Date/time.
- Requested date.
- Conflict/availability status if checked.
- Actions.

Filters:

- Facility.
- Date range.
- User/email.

Empty state:

- "No pending approvals."

Mobile behavior:

- Cards with approve/reject/detail actions.

### `/admin/blocked-dates`

Purpose:

- Manage all-facility or selected-facility blocked periods.

Primary action:

- New blocked period.

Table columns:

- Title.
- Reason.
- Scope.
- Affected facilities.
- Start.
- End.
- Active state.
- Created date.
- Actions.

Filters:

- Active/inactive.
- Scope.
- Facility.
- Date range.

Forms:

- Title.
- Reason.
- Date/time range.
- Scope.
- Facility multiselect for selected scope.
- Active state.

Mobile behavior:

- List cards with status and affected facilities summary.

### `/admin/maintenance`

Purpose:

- Manage facility maintenance closures.

Primary action:

- New maintenance closure.

Table columns:

- Facility.
- Title.
- Reason.
- Status.
- Start.
- End.
- Created date.
- Actions.

Filters:

- Facility.
- Status.
- Date range.

Forms:

- Facility.
- Title.
- Reason.
- Date/time range.
- Status on edit.

Mobile behavior:

- Card list; state-change actions stack.

### `/admin/email-notifications`

Purpose:

- Monitor and manually process queued/failed email notifications.

Primary actions:

- Process queued emails.
- Retry failed notifications.

Table columns:

- Type.
- Status.
- Recipient.
- Subject.
- Related booking.
- Attempts.
- Scheduled.
- Sent.
- Last error.
- Created.

Filters:

- Status.
- Type.
- Date range.
- Recipient search, later.

Empty state:

- "No email notifications found."

Mobile behavior:

- Cards with status, recipient, subject, attempts, and error preview.

### `/admin/reports`

Purpose:

- Show operational metrics and allow CSV export.

Primary actions:

- Apply filters.
- Export CSV.

Reports:

- Booking history.
- Facility utilization.
- User booking summary.
- Cancelled bookings.
- Audit logs.
- Lower priority: approval, maintenance, blocked date report views.

Filters:

- Date range.
- Facility.
- Booking status.
- Later: type, level, user, approval status.

CSV export placement:

- Export buttons should live in the report filter/header area.
- Button labels must specify report type.

Mobile behavior:

- Summary cards stack.
- Report tables may scroll horizontally, but summary remains readable.

### `/admin/audit-logs`

Purpose:

- Review read-only audit activity.

Primary actions:

- Apply filters.
- Open detail.
- Export CSV via reports export route if linked.

Table columns:

- Created.
- Action.
- Entity.
- Actor.
- Summary.
- IP.
- User agent.
- Metadata preview.
- Changes preview.
- Actions.

Filters:

- Date range.
- Actor email.
- Action.
- Entity type.

Mobile behavior:

- Audit cards showing created, action/entity, actor, summary, view action.
- Hide large metadata previews until detail page.

### `/admin/audit-logs/[id]`

Purpose:

- Read full audit entry.

Key components:

- AuditLogDetail.
- Pretty JSON blocks.
- Back to audit logs.

Accessibility:

- JSON blocks should be keyboard-scrollable if horizontally wide.

### `/admin/settings`

Purpose:

- Configure non-secret system behavior.

Primary action:

- Save settings.

Form groups:

- Identity.
- Registration.
- Booking behavior.
- Time and reminders.

Error states:

- Invalid email.
- Invalid domain list.
- Invalid timezone.
- Invalid reminder offsets.

Mobile behavior:

- One-column sections.
- Checkbox cards remain tap-friendly.

## 8. Booking Flow UX

### Facility Selection

- From facility detail, preselect the facility using `facilityId`.
- In `/bookings/new`, facility selector should show name, level, type, and capacity.
- If selected facility becomes unavailable, show an alert and require another selection.

### Date Selection

- Use native date input for MVP.
- Display timezone helper: "Times are shown in Asia/Kuala_Lumpur."
- Later enhancement: add availability preview or calendar/timeline.

### Time Selection

- Start time and end time must be visible together.
- Validate start before end before submit.
- Show readable summary: "Booking MR-L5-01 on 12 May, 10:00-11:00."

### Purpose, Description, Attendee Count

- Purpose/title is required and should be framed as "Purpose".
- Description is optional.
- Attendee count is optional but must be `0` or greater.
- If attendee count exceeds capacity, show: "Attendee count exceeds this facility's capacity of 8."

### Availability Feedback

Recommended levels:

- Neutral before selection: "Choose a facility, date, and time to check availability."
- Checking: "Checking availability..."
- Available: "This time is available."
- Conflict: "This facility is already booked for the selected time. Please choose another time or facility."
- Blocked: "This facility is unavailable during the selected time because of a blocked period."
- Maintenance: "This facility is under maintenance during the selected time."
- Inactive/archived: "This facility is not available for booking."

### Overlapping Booking Errors

- Employee message must not expose another user's private booking details.
- Admin detail views may show richer conflict details if implemented.
- Race-condition database errors should map to the same friendly conflict message.

### Back-To-Back Clarity

- Help text may say: "Back-to-back bookings are allowed. For example, 10:00-11:00 and 11:00-12:00 do not conflict."
- Do not imply buffer times exist.

### Approval-Required Facilities

- Facility detail should show "Approval may be required" or "Uses system approval setting".
- Booking form should show pre-submit message when approval is required:
  - "This booking will be submitted for admin approval."
- Success message:
  - Pending: "Booking request submitted. It is pending admin approval."
  - Confirmed: "Booking confirmed."

### Disabled Or Inactive Facilities

- Employee list should hide inactive/archived facilities.
- If user reaches a stale booking link, show "Facility is not available for booking" and disable submit.

### Returning To My Bookings

- Successful creation should redirect to `/my-bookings?created=1`.
- My Bookings should show success alert and make the new/most recent booking easy to spot where practical.

## 9. Status And Messaging System

### Booking Statuses

| Value | Label | Explanation | Badge intent | Message example |
| --- | --- | --- | --- | --- |
| `pending` | Pending Approval | Waiting for admin review. | Amber | "Your booking request is pending approval." |
| `confirmed` | Confirmed | Booking is approved or auto-confirmed. | Emerald | "Your booking is confirmed." |
| `rejected` | Rejected | Admin rejected the request. | Rose | "This booking request was rejected." |
| `cancelled` | Cancelled | Booking was cancelled. | Slate | "This booking has been cancelled." |
| `completed` | Completed | Booking time has passed. | Sky or neutral | "This booking is complete." |
| `expired` | Expired | Pending request passed without approval. | Zinc | "This booking request has expired." |

### Facility Statuses

| Value | Label | Explanation | Badge intent | Message example |
| --- | --- | --- | --- | --- |
| `active` | Active | Facility can be booked if available. | Emerald | "Available for booking when no conflicts exist." |
| `inactive` | Inactive | Facility is not currently bookable. | Slate | "This facility is not available for booking." |
| `under_maintenance` | Under Maintenance | Facility is unavailable due to maintenance state. | Amber/Sky | "This facility is under maintenance." |
| `archived` | Archived | Facility is retained for history only. | Zinc | "This facility is archived and cannot be booked." |

### Maintenance Statuses

| Value | Label | Explanation | Badge intent | Message example |
| --- | --- | --- | --- | --- |
| `scheduled` | Scheduled | Upcoming or planned closure that blocks booking. | Amber | "Maintenance is scheduled for this time." |
| `in_progress` | In Progress | Active maintenance that blocks booking. | Sky/Amber | "Maintenance is currently in progress." |
| `completed` | Completed | Closure no longer blocks booking. | Emerald | "Maintenance closure is completed." |
| `cancelled` | Cancelled | Closure no longer applies. | Slate | "Maintenance closure was cancelled." |

### Email Statuses

| Value | Label | Explanation | Badge intent | Message example |
| --- | --- | --- | --- | --- |
| `queued` | Queued | Waiting for processing. | Amber | "Email is queued for sending." |
| `sending` | Sending | Processing attempt in progress. | Sky | "Email is being sent." |
| `sent` | Sent | Provider accepted/sent email. | Emerald | "Email sent successfully." |
| `failed` | Failed | Max attempts reached or send failed. | Rose | "Email failed. Review the error and retry if appropriate." |
| `cancelled` | Cancelled | Email will not be sent. | Slate | "Email notification was cancelled." |

### Blocked Period State

| Value | Label | Explanation | Badge intent | Message example |
| --- | --- | --- | --- | --- |
| `is_active=true` | Active | Blocks matching booking times. | Rose/Amber | "This blocked period is active." |
| `is_active=false` | Inactive | No longer blocks bookings. | Slate | "This blocked period is inactive." |

## 10. Forms And Validation UX

Form standards:

- Required fields must be visible in label or helper text.
- Use inline validation where feasible before submit.
- Use server action errors for authoritative validation.
- Keep raw database/provider errors out of user-facing text.
- Disable submit while pending.
- Loading text should replace submit button label.
- Success state should be visible and actionable.
- Error state should explain what to change.
- Destructive actions require confirmation.

Validation messages:

- Time range: "Start time must be before end time."
- Capacity: "Attendee count exceeds the selected facility capacity."
- Conflict: "This facility is already booked for the selected time."
- Blocked: "This facility is unavailable during the selected time."
- Maintenance: "This facility is under maintenance during the selected time."
- Required: "Enter a booking purpose."
- Registration disabled: "Registration is currently disabled. Contact an administrator for access."

Admin form standards:

- Keep create/edit forms consistent across facilities, blocked periods, maintenance, settings.
- Use section headers for longer forms.
- Preserve entered values after validation errors when possible.
- For status-changing forms, explain operational impact:
  - "Inactive facilities cannot be booked."
  - "Active blocked periods prevent bookings in this time range."

## 11. Tables And Data Display UX

Admin table standards:

- Search/filter bar above table.
- Filter state persists in query string.
- Table title and record count in panel header.
- Default sort by most operationally relevant date:
  - Bookings: newest or upcoming first depending view.
  - Approvals: oldest pending first.
  - Audit logs: newest first.
  - Email notifications: queued/failed and scheduled time first.
- Pagination for audit logs and any potentially large table.
- Row actions on the right.
- Status badges in dedicated status columns.
- Empty state includes filter guidance.
- CSV export buttons live in report/filter header, not inside table rows.

Responsive table standards:

- For admin MVP, horizontal scroll is acceptable.
- For production polish, provide mobile card alternatives for:
  - Admin bookings.
  - Approvals.
  - Facilities.
  - Audit logs.
  - Email notifications.
- Keep row action buttons accessible inside scroll containers.

## 12. Navigation And Permissions UX

### Logged-Out Users

- Can access `/`, `/login`, `/register` if enabled, `/reset-password`.
- Protected routes redirect to `/login?auth=required`.
- Login page should explain required auth in a calm alert when `auth=required`.

### Employees

- See employee shell only.
- Do not see admin nav.
- If they attempt admin route, redirect to dashboard or show access denied.
- Cannot see other users' booking details.

### Admins

- See admin shell on `/admin/*`.
- May still access employee facility browsing and booking pages if needed.
- Account menu should clearly show admin role.

### Disabled Or Pending Users

- Show a clear blocked-account state:
  - "Your account is not active. Contact an administrator."
- Do not show protected app navigation.

### Access Denied

- Message: "You do not have permission to access this page."
- Include link to dashboard.
- Do not reveal private record existence.

### Not Found

- Message: "This record could not be found."
- For employee booking detail, not found is acceptable for unauthorized records.

### Missing Profile

- Message: "Your account profile is not ready. Contact an administrator."
- Avoid letting missing-profile users reach booking/admin flows.

## 13. Responsive And Mobile UX

### Desktop

- Employee pages use centered content widths.
- Admin pages use sidebar plus wide content.
- Tables may use full-width layouts with horizontal scroll only when data is very wide.

### Tablet

- Admin sidebar can collapse into icon rail or top drawer.
- Forms can remain two-column if width supports it.
- Tables should still scroll horizontally if needed.

### Mobile

- Employee flows must be first-class.
- Header uses menu button.
- Forms stack in one column.
- Primary actions should be easy to reach.
- Booking date/time inputs should not be cramped.
- Facility cards stack image above content.
- Booking cards replace tables for employee pages.
- Admin tables should prefer cards for critical workflows; horizontal scroll is acceptable as a fallback.

### Sidebar Behavior

- Desktop admin: persistent sidebar.
- Mobile admin: hidden drawer opened by menu button.
- Active nav item must be visually marked and textually clear.

### Calendar/Date/Time Usability

- Native date/time is acceptable.
- Calendar pages are additive navigation surfaces; they do not replace My Bookings, booking detail pages, or admin booking management.
- Employee calendar route: `/calendar`. It shows only the signed-in employee's own bookings.
- Admin calendar route: `/admin/calendar`. It shows all bookings and must remain admin-only.
- Desktop calendar can use a month grid with compact booking links inside date cells.
- Mobile calendar should use an agenda/list grouped by date instead of cramped month cells.
- Booking items must be real links to the correct detail page and must include readable status text.
- Calendar controls for previous month, next month, current month, and filters must be keyboard accessible.
- Empty days and empty months need clear text states; do not rely on blank cells alone.

## 14. Component Inventory

### Employee Components

- `FacilityCard`: card for employee facility list.
- `FacilityDetail`: detail layout and booking CTA.
- `BookingForm`: create booking form.
- `BookingCalendar`: employee month grid and mobile agenda for personal bookings.
- `BookingCalendarEvent`: linked booking item with facility, time, and status.
- `BookingCard`: employee booking list item.
- `BookingDetail`: employee booking details.
- `BookingStatusBadge`: current booking badge, should become a shared status badge wrapper.
- `EmptyState`: missing, should be added.
- `PageHeader`: missing, should be added.

### Admin Components

- `AdminShell`: missing, should be added.
- `AdminSidebar`: missing, should be added.
- `AdminPageHeader`: missing, should be added.
- `DataTable`: missing reusable table pattern.
- `FilterBar`: partially exists per feature, should be standardized.
- `FacilityForm`: exists.
- `BookingAdminDetail`: current component is `AdminBookingDetail`.
- `AdminBookingCalendar`: admin month grid and mobile agenda for all bookings.
- `ApprovalActionForm`: current action form exists as admin booking action form; may need split.
- `BlockedPeriodForm`: exists.
- `MaintenanceForm`: exists.
- `EmailNotificationsTable`: exists.
- `ReportsTables`: report-specific tables exist.
- `AuditLogDetail`: exists.
- `SettingsForm`: exists.

### Shared Components

- `StatusBadge`: missing; should unify booking/facility/email/maintenance statuses.
- `ConfirmDialog`: missing.
- `FormFieldError`: missing.
- `LoadingState`: missing.
- `ErrorState`: missing.
- `SuccessAlert`: missing.
- `SectionCard`: pattern exists through repeated markup, should be componentized only if it reduces repetition.
- `Breadcrumbs`: missing.
- `UserMenu`: missing.

### Existing UI Primitives

- `Alert`
- `Button`
- `Card`
- `Input`
- `Label`

Potential shadcn/ui additions later:

- Dialog/AlertDialog.
- Select.
- Checkbox.
- Dropdown Menu.
- Sheet.
- Separator.
- Table.
- Badge.
- Skeleton.
- Tooltip.

Add only when needed and keep dependency impact low.

## 15. Frontend Improvement Backlog

### P0: Must Fix Before Production

- Add consistent employee and admin layout shells.
- Render real employee/admin navigation from `config/navigation.ts`.
- Hide or defer nav links for unimplemented routes such as `/profile` and `/admin/users`.
- Add shared page header pattern.
- Add shared status badge system for all statuses.
- Add confirm dialogs for destructive actions: booking cancel, reject, deactivate blocked period, complete/cancel maintenance.
- Improve form validation accessibility with field-level errors and `aria-invalid`.
- Ensure mobile employee booking flow is clean and fully usable.
- Ensure admin pages have access-denied/not-found states that do not leak private data.
- Keep generated `.open-next` output out of lint/source review.

### P1: Should Improve Before Production

- Mobile-friendly admin table card alternatives.
- Shared filter bar component.
- Better booking success state highlighting on My Bookings.
- Availability feedback before booking submit.
- Breadcrumbs for detail/form pages.
- Loading and error state components.
- Dashboard polish for employee and admin.
- Better empty states with next-action buttons.
- Settings page success/error polish.
- Email notification retry/process feedback.
- Audit log JSON readability improvements.

### P2: Nice To Have After Launch

- Facility photo upload UX.
- Facility search and filters for employees.
- Availability timeline view that shows open time slots before booking.
- Admin user management UI.
- Advanced report charts.
- Saved report filters.
- Export progress feedback for large CSVs.
- Optional dark mode toggle if there is real user demand.
- Cloudflare Access-specific internal access messaging.

## 16. Implementation Plan For Frontend Polish

### Step 1: Create Shared Layout Shells

Goal:

- Establish consistent employee/admin/auth page frames.

Files likely affected:

- `app/(auth)/layout.tsx`
- `app/(app)/layout.tsx`
- `app/admin/layout.tsx`
- `components/shared/*`
- `components/admin/*`
- `config/navigation.ts`

Acceptance criteria:

- Auth pages share centered layout.
- Employee pages share header/nav/account menu.
- Admin pages share sidebar/header/account menu.
- Logout is consistently available.
- Existing pages still render and build.

Manual tests:

- Visit `/login`, `/dashboard`, `/facilities`, `/admin/dashboard`, `/admin/bookings`.
- Confirm mobile menu works once implemented.

### Step 2: Standardize Page Headers And Navigation

Goal:

- Use one page header structure for title, description, breadcrumbs, actions.

Files likely affected:

- Employee and admin page files.
- New `PageHeader`, `AdminPageHeader`, `Breadcrumbs`.

Acceptance criteria:

- Detail pages have breadcrumbs/back links.
- Primary action placement is consistent.
- Active nav state is visible.

Manual tests:

- Check facility detail, booking detail, admin edit pages.

### Step 3: Standardize Status Badges And Alerts

Goal:

- Use consistent labels, colors, and screen-reader-friendly text.

Files likely affected:

- `components/bookings/booking-status-badge.tsx`
- New `components/shared/status-badge.tsx`
- Admin table/detail components.

Acceptance criteria:

- Booking, facility, maintenance, email, blocked period statuses use shared mapping.
- Badges include readable labels.
- Color is not the only signal.

Manual tests:

- Check My Bookings, admin bookings, maintenance, email notifications.

### Step 4: Improve Employee Booking Flow

Goal:

- Make booking creation and recovery clear.

Files likely affected:

- `components/bookings/booking-form.tsx`
- `app/(app)/bookings/new/page.tsx`
- `components/bookings/my-bookings-list.tsx`
- Facility detail CTA.

Acceptance criteria:

- Preselected facility is obvious.
- Timezone helper is visible.
- Friendly conflict/blocked/maintenance messages appear.
- Success redirects to My Bookings and highlights status.

Manual tests:

- Valid booking.
- Overlap rejection.
- Back-to-back allowed.
- Approval-required pending.

### Step 5: Improve Admin Tables And Filters

Goal:

- Make admin data easier to scan and usable on smaller screens.

Files likely affected:

- Admin table components.
- New `DataTable`, `FilterBar` if useful.

Acceptance criteria:

- Tables have consistent header/count/filter/action layout.
- Empty states mention filters.
- Mobile card alternatives exist for high-use admin tables.

Manual tests:

- Admin bookings filters.
- Facilities list.
- Audit logs pagination.
- Reports export buttons.

### Step 6: Improve Forms And Validation States

Goal:

- Make errors actionable and accessible.

Files likely affected:

- Auth forms.
- Booking form.
- Facility form.
- Blocked period form.
- Maintenance form.
- Settings form.
- New `FormFieldError`.

Acceptance criteria:

- Required fields are indicated.
- Inline errors are associated with fields.
- Submit loading and success states are consistent.
- Destructive actions require confirmation.

Manual tests:

- Invalid registration.
- Invalid booking time.
- Invalid facility capacity.
- Invalid settings values.

### Step 7: Improve Responsive Behavior

Goal:

- Ensure major employee and admin flows fit on mobile.

Files likely affected:

- Layout shell components.
- Facility cards/detail.
- Booking form/list/detail.
- Admin tables.

Acceptance criteria:

- No clipped button text.
- No overlapping UI.
- Admin tables have either horizontal scroll affordance or card alternatives.

Manual tests:

- QA checklist mobile pages at narrow viewport.

### Step 8: Accessibility Pass

Goal:

- Catch keyboard, focus, label, and screen-reader issues.

Files likely affected:

- All forms.
- Navigation.
- Dialogs.
- Tables.
- Alerts.

Acceptance criteria:

- Keyboard-only flow works.
- Visible focus states remain.
- Form errors are announced/readable.
- Dialogs trap and restore focus.

Manual tests:

- Tab through login, booking form, admin booking actions, settings.

### Step 9: Final QA Pass

Goal:

- Validate frontend polish against this spec and existing QA checklist.

Files likely affected:

- No planned implementation files unless fixes are found.

Acceptance criteria:

- `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, and `npm.cmd run qa` pass.
- Manual responsive/accessibility checklist is completed.

Manual tests:

- Use `docs/QA_CHECKLIST.md` and this spec's route list.

## 17. Current UI Audit

### What Already Exists

- Public homepage with app intro and facility preview.
- Auth pages and forms for login, register, reset password.
- Employee dashboard with upcoming booking preview.
- Employee facility list and detail pages.
- Booking creation form with facility preselection support.
- My Bookings sections.
- Employee booking detail and cancellation components.
- Admin pages for facilities, bookings, approvals, blocked dates, maintenance, email notifications, reports, audit logs, settings.
- Admin tables and forms for core operational features.
- Basic shadcn/ui primitives: Alert, Button, Card, Input, Label.
- Lucide icons in several action buttons.
- Booking status badge component.
- Server-side route guards are already used by pages.

### What Is Good Enough For Now

- Base visual language is clean and restrained.
- Forms mostly have visible labels.
- Tables use semantic HTML and horizontal scroll.
- Booking and admin feature coverage is broad.
- Status badge colors already exist for booking statuses.
- Empty states exist in many sections.
- The employee booking path is functionally understandable.

### What Needs Improvement

- No shared employee/admin layout shell yet.
- Navigation exists in config but is not consistently rendered globally.
- Logout appears on dashboards but not as a consistent account menu.
- `/profile` and `/admin/users` are in navigation config but not implemented.
- Status badges are not unified across all entity types.
- Form validation is mostly alert-level, not field-level.
- Destructive actions need a consistent confirmation dialog.
- Admin tables are wide and may be awkward on mobile.
- Breadcrumbs are inconsistent or missing.
- Loading states are not standardized.
- Empty states are plain and often lack next actions.
- Homepage copy still says some early phase scaffolding language and should be updated before production.

### Missing Frontend Pieces

- `AdminShell`.
- Employee app shell.
- Auth layout.
- User/account menu.
- Mobile navigation drawer/sheet.
- Shared page header.
- Shared status badge.
- Shared empty/loading/error states.
- Shared confirm dialog.
- Shared form field error.
- Mobile card alternatives for admin tables.
- Profile page.
- Admin users page.
- Facility photo upload UX.
- Availability timeline view.

### Accessibility Risks

- Selects/textareas use custom class strings and may not share all input semantics/states.
- Field-level errors are not consistently associated with controls.
- Disabled pagination links use `aria-disabled` but are still anchors; ensure they are non-interactive.
- Destructive actions need accessible confirmation dialogs.
- Tables with horizontal scroll can be difficult for keyboard and screen reader users if not paired with summaries.
- Status colors need shared text labels everywhere.

### Mobile And Responsive Risks

- Admin tables with `min-w-[920px]`, `min-w-[1120px]`, and `min-w-[1280px]` rely on horizontal scrolling.
- Admin pages lack a mobile navigation model.
- Multi-column forms need careful stacking on mobile.
- Header action groups can wrap unpredictably without a shared page header component.
- Detail pages with side panels need ordering checks on small screens.

### Suggested Quick Wins

1. Create shared `PageHeader`, `EmptyState`, `StatusBadge`, and `ConfirmDialog`.
2. Add `app/(app)/layout.tsx` and `app/admin/layout.tsx`.
3. Render navigation from `config/navigation.ts`, excluding unimplemented routes for now.
4. Replace facility/admin status inline spans with shared `StatusBadge`.
5. Add field-level error helper pattern to BookingForm first.
6. Add mobile card alternative for AdminBookingsTable first, because bookings are the highest-use admin table.
7. Update homepage copy away from scaffold language before production.

## 18. Design Acceptance Checklist

Before considering frontend polish complete:

- [ ] Auth, employee, and admin areas have distinct layouts.
- [ ] All implemented routes have consistent page headers.
- [ ] Employee booking flow is usable on mobile.
- [ ] Admin navigation works on desktop and mobile.
- [ ] Status badge language and colors are consistent.
- [ ] Destructive actions have accessible confirmation.
- [ ] Forms have visible labels and field-level errors.
- [ ] Empty, loading, and error states are standardized.
- [ ] Admin tables are usable on mobile or have card alternatives.
- [ ] No admin-only controls appear on employee pages.
- [ ] Unimplemented routes are not shown as primary nav.
- [ ] `npm.cmd run qa` passes after implementation.
