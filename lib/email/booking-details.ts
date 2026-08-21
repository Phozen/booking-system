export function formatPersonLabel(
  name: string | null | undefined,
  email: string | null | undefined,
) {
  const trimmedName = name?.trim() || null;
  const trimmedEmail = email?.trim() || null;

  if (trimmedName && trimmedEmail) {
    return `${trimmedName} (${trimmedEmail})`;
  }

  return trimmedName ?? trimmedEmail ?? null;
}

export function formatInviteeList(
  invitees: Array<{ name?: string | null; email?: string | null }>,
) {
  const labels = invitees
    .map((invitee) => formatPersonLabel(invitee.name, invitee.email))
    .filter((label): label is string => Boolean(label));

  return labels.length > 0 ? labels.join(", ") : null;
}

export function getMeetingTypeLabel(teamsMeeting: unknown) {
  if (teamsMeeting === true || teamsMeeting === "true") {
    return "Teams meeting";
  }

  if (teamsMeeting === false || teamsMeeting === "false") {
    return "Room only";
  }

  return null;
}
