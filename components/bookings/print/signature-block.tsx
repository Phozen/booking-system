export function SignatureBlock({ title }: { title: string }) {
  return (
    <section className="break-inside-avoid rounded-lg border border-border p-4 print:border-zinc-300">
      <h3 className="font-semibold tracking-normal">{title}</h3>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <p className="border-b border-border pb-6 print:border-zinc-300" />
          <p className="qbook-type-meta mt-2 uppercase">Name</p>
        </div>
        <div>
          <p className="border-b border-border pb-6 print:border-zinc-300" />
          <p className="qbook-type-meta mt-2 uppercase">Date</p>
        </div>
        <div className="sm:col-span-2">
          <p className="border-b border-border pb-8 print:border-zinc-300" />
          <p className="qbook-type-meta mt-2 uppercase">Signature</p>
        </div>
        <div className="sm:col-span-2">
          <p className="border-b border-border pb-8 print:border-zinc-300" />
          <p className="qbook-type-meta mt-2 uppercase">Remarks</p>
        </div>
      </div>
    </section>
  );
}
