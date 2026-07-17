"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import type { InviteCandidate } from "@/lib/bookings/invitations/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldRequirementBadge } from "@/components/shared/field-requirement-badge";

export function InitialAttendeePicker({
  disabled,
  excludeUserId,
}: {
  disabled?: boolean;
  excludeUserId?: string;
}) {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<InviteCandidate[]>([]);
  const [selected, setSelected] = useState<InviteCandidate[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const value = query.trim();
    if (value.length < 2) return () => controller.abort();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: value });
        if (excludeUserId) params.set("excludeUserId", excludeUserId);
        const response = await fetch(`/api/invite-candidates?${params}`, { signal: controller.signal });
        const payload = await response.json() as { candidates?: InviteCandidate[]; message?: string };
        if (!response.ok) throw new Error(payload.message);
        setCandidates(payload.candidates ?? []);
        setError("");
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Staff search is unavailable.");
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [excludeUserId, query]);

  const selectedIds = new Set(selected.map((item) => item.id));
  const label = (candidate: InviteCandidate) => candidate.fullName?.trim() || candidate.email;

  return <section className="grid gap-3 border-b-2 border-border pb-7 text-sm">
    <div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Attendees</p><FieldRequirementBadge required={false} /></div><h2 className="mt-1 text-lg font-bold tracking-normal">Invite attendees</h2><p className="mt-1 text-muted-foreground">Invite active Qbook staff now, or add them later from the booking.</p></div>
    <div className="grid gap-2"><Label htmlFor="initial-invitee-search">Search staff</Label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="initial-invitee-search" type="search" className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} disabled={disabled} placeholder="Name, email, or department" /></div>{error ? <p className="text-destructive">{error}</p> : null}</div>
    {query.trim().length >= 2 && candidates.filter((item) => !selectedIds.has(item.id)).length > 0 ? <ul className="divide-y rounded-lg border">{candidates.filter((item) => !selectedIds.has(item.id)).map((candidate) => <li key={candidate.id}><button type="button" className="w-full px-3 py-2 text-left hover:bg-accent" onClick={() => setSelected((current) => current.length < 50 ? [...current, candidate] : current)} disabled={disabled}><span className="block font-medium">{label(candidate)}</span><span className="text-xs text-muted-foreground">{[candidate.department, candidate.email].filter(Boolean).join(" · ")}</span></button></li>)}</ul> : null}
    {selected.length > 0 ? <ul className="grid gap-2">{selected.map((candidate) => <li key={candidate.id} className="flex items-center justify-between rounded-lg border p-2"><input type="hidden" name="invitedUserId" value={candidate.id} /><span><span className="block font-medium">{label(candidate)}</span><span className="text-xs text-muted-foreground">{candidate.email}</span></span><Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={`Remove ${label(candidate)}`} onClick={() => setSelected((items) => items.filter((item) => item.id !== candidate.id))}><X /></Button></li>)}</ul> : null}
  </section>;
}
