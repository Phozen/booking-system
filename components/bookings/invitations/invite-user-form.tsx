"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Search, UserPlus, X } from "lucide-react";

import {
  invitationBatchActionInitialState,
  type InvitationBatchActionResult,
} from "@/lib/bookings/invitations/action-state";
import { inviteUsersToBookingAction } from "@/lib/bookings/invitations/actions";
import type { InviteCandidate } from "@/lib/bookings/invitations/types";
import { ActionToastEffect } from "@/components/shared/action-toast-effect";
import { FormFieldHelper } from "@/components/shared/form-field-helper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CandidateSearchResponse = {
  candidates?: InviteCandidate[];
  message?: string;
};

function getCandidateLabel(candidate: InviteCandidate) {
  return candidate.fullName?.trim() || candidate.email;
}

export function InviteUserForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<InviteCandidate[]>([]);
  const [selected, setSelected] = useState<InviteCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [actionState, setActionState] = useState<InvitationBatchActionResult>(
    invitationBatchActionInitialState,
  );
  const [isSending, startSending] = useTransition();
  const normalizedQuery = query.trim();
  const selectedIds = useMemo(
    () => new Set(selected.map((candidate) => candidate.id)),
    [selected],
  );

  useEffect(() => {
    const controller = new AbortController();

    if (normalizedQuery.length < 2) {
      queueMicrotask(() => {
        if (!controller.signal.aborted) {
          setCandidates([]);
          setSearching(false);
          setSearchError("");
        }
      });
      return () => controller.abort();
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError("");

      try {
        const response = await fetch(
          `/api/bookings/${bookingId}/invite-candidates?q=${encodeURIComponent(normalizedQuery)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as CandidateSearchResponse;

        if (!response.ok) {
          throw new Error(payload.message ?? "Staff search is unavailable.");
        }

        setCandidates(payload.candidates ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setCandidates([]);
        setSearchError(
          error instanceof Error
            ? error.message
            : "Staff search is unavailable.",
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
  }, [bookingId, normalizedQuery]);

  function addCandidate(candidate: InviteCandidate) {
    if (selectedIds.has(candidate.id) || selected.length >= 50) {
      return;
    }

    setSelected((current) => [...current, candidate]);
    setActionState(invitationBatchActionInitialState);
  }

  function removeCandidate(candidateId: string) {
    setSelected((current) =>
      current.filter((candidate) => candidate.id !== candidateId),
    );
    setActionState(invitationBatchActionInitialState);
  }

  function sendInvitations() {
    if (selected.length === 0 || isSending) {
      return;
    }

    startSending(async () => {
      const result = await inviteUsersToBookingAction(
        bookingId,
        selected.map((candidate) => candidate.id),
      );
      const invitedIds = new Set(result.invitedUserIds);

      setActionState(result);
      setSelected((current) =>
        current.filter((candidate) => !invitedIds.has(candidate.id)),
      );

      if (result.invitedUserIds.length > 0) {
        setQuery("");
        setCandidates([]);
        router.refresh();
      }
    });
  }

  const availableCandidates = candidates.filter(
    (candidate) => !selectedIds.has(candidate.id),
  );
  const failureLabels = actionState.failures.map((failure) => {
    const candidate = selected.find((item) => item.id === failure.userId);
    return {
      ...failure,
      label: candidate ? getCandidateLabel(candidate) : "Selected user",
    };
  });

  return (
    <section className="grid gap-4 rounded-lg border border-border/75 bg-background p-4">
      <ActionToastEffect
        state={actionState}
        successTitle="Invitations processed"
        errorTitle="Invitations not sent"
      />

      <div className="grid gap-2">
        <Label htmlFor="invitee-search">Add attendees</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="invitee-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, or department"
            className="pl-9 pr-10"
            aria-describedby="invitee-search-helper invitee-search-status"
            autoComplete="off"
          />
          {searching ? (
            <Loader2
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : null}
        </div>
        <FormFieldHelper id="invitee-search-helper">
          Enter at least 2 characters. Only active internal staff are shown.
        </FormFieldHelper>
        <p id="invitee-search-status" className="sr-only" aria-live="polite">
          {searching
            ? "Searching staff"
            : normalizedQuery.length >= 2
              ? `${availableCandidates.length} matching staff found`
              : "Enter at least 2 characters to search"}
        </p>
      </div>

      {searchError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Staff search unavailable</AlertTitle>
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      ) : null}

      {normalizedQuery.length >= 2 && !searching && !searchError ? (
        availableCandidates.length > 0 ? (
          <ul
            className="max-h-72 divide-y overflow-y-auto rounded-lg border border-border/75 bg-card"
            aria-label="Matching staff"
          >
            {availableCandidates.map((candidate) => (
              <li key={candidate.id}>
                <button
                  type="button"
                  onClick={() => addCandidate(candidate)}
                  disabled={selected.length >= 50}
                  className="grid min-h-14 w-full gap-0.5 px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="font-medium">{getCandidateLabel(candidate)}</span>
                  <span className="break-all text-sm text-muted-foreground">
                    {[candidate.department, candidate.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No additional active staff match this search.
          </p>
        )
      ) : null}

      <div className="grid gap-3" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium">Selected attendees</h3>
          <span className="text-sm text-muted-foreground">
            {selected.length} / 50
          </span>
        </div>

        {selected.length > 0 ? (
          <ul className="grid gap-2">
            {selected.map((candidate) => (
              <li
                key={candidate.id}
                className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {getCandidateLabel(candidate)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[candidate.department, candidate.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCandidate(candidate.id)}
                  disabled={isSending}
                  aria-label={`Remove ${getCandidateLabel(candidate)}`}
                >
                  <X aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Search for staff and add one or more attendees.
          </p>
        )}
      </div>

      {actionState.status !== "idle" ? (
        <Alert
          variant={
            actionState.status === "error"
              ? "destructive"
              : actionState.failures.length > 0
                ? "warning"
                : "success"
          }
        >
          <AlertDescription>
            <p>{actionState.message}</p>
            {failureLabels.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {failureLabels.map((failure) => (
                  <li key={failure.userId}>
                    {failure.label}: {failure.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={sendInvitations}
          disabled={selected.length === 0 || isSending}
          className="w-full sm:w-auto"
        >
          {isSending ? (
            <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus data-icon="inline-start" aria-hidden="true" />
          )}
          {isSending
            ? "Sending invitations..."
            : selected.length > 0
              ? `Send ${selected.length} invitation${selected.length === 1 ? "" : "s"}`
              : "Send invitations"}
        </Button>
      </div>
    </section>
  );
}
