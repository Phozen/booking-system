"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, Search, X } from "lucide-react";

import type { InviteCandidate } from "@/lib/bookings/invitations/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldRequirementBadge } from "@/components/shared/field-requirement-badge";
import { FormFieldHelper } from "@/components/shared/form-field-helper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim();

  useEffect(() => {
    const controller = new AbortController();

    if (normalizedQuery.length < 2) {
      queueMicrotask(() => {
        if (!controller.signal.aborted) {
          setCandidates([]);
          setSearching(false);
          setError("");
        }
      });
      return () => controller.abort();
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      setError("");

      try {
        const params = new URLSearchParams({ q: normalizedQuery });
        if (excludeUserId) params.set("excludeUserId", excludeUserId);

        const response = await fetch(`/api/invite-candidates?${params}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          candidates?: InviteCandidate[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(payload.message ?? "Staff search is unavailable.");
        }

        setCandidates(payload.candidates ?? []);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          return;
        }

        setCandidates([]);
        setError(
          cause instanceof Error ? cause.message : "Staff search is unavailable.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [excludeUserId, normalizedQuery]);

  const selectedIds = new Set(selected.map((item) => item.id));
  const availableCandidates = candidates.filter(
    (item) => !selectedIds.has(item.id),
  );
  const label = (candidate: InviteCandidate) =>
    candidate.fullName?.trim() || candidate.email;

  return (
    <section className="grid gap-3 border-b-2 border-border pb-7 text-sm">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            Attendees
          </p>
          <FieldRequirementBadge required={false} />
        </div>
        <h2 className="mt-1 text-lg font-bold tracking-normal">
          Invite attendees
        </h2>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="initial-invitee-search">Search staff</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            ref={searchInputRef}
            id="initial-invitee-search"
            type="search"
            className="pl-9 pr-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
            disabled={disabled}
            placeholder="Name, email, or department"
            aria-describedby="initial-invitee-search-helper initial-invitee-search-status"
            autoComplete="off"
          />
          {searching ? (
            <Loader2
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : null}
        </div>
        <FormFieldHelper id="initial-invitee-search-helper">
          Enter at least 2 characters, then select one or more staff.
        </FormFieldHelper>
        <p
          id="initial-invitee-search-status"
          className="sr-only"
          aria-live="polite"
        >
          {searching
            ? "Searching staff"
            : normalizedQuery.length >= 2
              ? `${availableCandidates.length} matching staff found`
              : "Enter at least 2 characters to search"}
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Staff search unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {normalizedQuery.length >= 2 && !searching && !error ? (
        availableCandidates.length > 0 ? (
          <div className="rounded-md border border-dashed bg-muted/40 p-1">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Search results
            </p>
            <ul className="grid gap-1" aria-label="Matching staff">
              {availableCandidates.map((candidate) => (
                <li key={candidate.id}>
                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-sm border border-transparent px-3 py-2 text-left transition hover:border-primary/35 hover:bg-background hover:shadow-sm focus-visible:border-primary focus-visible:bg-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      setSelected((current) =>
                        current.length < 50 ? [...current, candidate] : current,
                      );
                      setQuery("");
                      requestAnimationFrame(() => searchInputRef.current?.focus());
                    }}
                    disabled={disabled || selected.length >= 50}
                  >
                    <span className="block font-medium">{label(candidate)}</span>
                    <span className="text-xs text-muted-foreground">
                      {[candidate.department, candidate.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
            No additional active staff match this search.
          </p>
        )
      ) : null}

      {selected.length > 0 ? (
        <ul className="grid gap-2">
          {selected.map((candidate) => (
            <li
              key={candidate.id}
              className="flex items-center justify-between rounded-lg border p-2"
            >
              <input type="hidden" name="invitedUserId" value={candidate.id} />
              <span>
                <span className="block font-medium">{label(candidate)}</span>
                <span className="text-xs text-muted-foreground">
                  {candidate.email}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                aria-label={`Remove ${label(candidate)}`}
                onClick={() =>
                  setSelected((items) =>
                    items.filter((item) => item.id !== candidate.id),
                  )
                }
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
