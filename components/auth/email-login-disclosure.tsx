"use client";

import { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmailLoginDisclosure({
  initialMessage,
}: {
  initialMessage?: string;
}) {
  const [open, setOpen] = useState(Boolean(initialMessage));

  return (
    <div className="grid gap-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-11 w-full justify-between"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="inline-flex items-center gap-2">
          <Mail className="size-4" aria-hidden="true" />
          Email login
        </span>
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </Button>
      {open ? (
        <div className="rounded-md border bg-background/70 p-3">
          <LoginForm initialMessage={initialMessage} />
        </div>
      ) : null}
    </div>
  );
}
