"use client";

import { useState } from "react";
import { Printer } from "lucide-react";

import { PendingButtonContent } from "@/components/shared/pending-button-content";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  const [isPrinting, setIsPrinting] = useState(false);

  function onPrint() {
    setIsPrinting(true);
    window.print();
    window.setTimeout(() => setIsPrinting(false), 1200);
  }

  return (
    <Button type="button" disabled={isPrinting} onClick={onPrint}>
      <PendingButtonContent pending={isPrinting} pendingLabel="Opening print dialog...">
        <Printer data-icon="inline-start" />
        Print
      </PendingButtonContent>
    </Button>
  );
}
