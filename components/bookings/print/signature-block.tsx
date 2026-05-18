export function SignatureBlock({ title }: { title: string }) {
  return (
    <section className="break-inside-avoid rounded-lg border border-zinc-300 p-4">
      <h3 className="font-semibold tracking-normal">{title}</h3>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <p className="border-b border-zinc-300 pb-6" />
          <p className="mt-2 text-xs uppercase text-zinc-500">Name</p>
        </div>
        <div>
          <p className="border-b border-zinc-300 pb-6" />
          <p className="mt-2 text-xs uppercase text-zinc-500">Date</p>
        </div>
        <div className="sm:col-span-2">
          <p className="border-b border-zinc-300 pb-8" />
          <p className="mt-2 text-xs uppercase text-zinc-500">Signature</p>
        </div>
        <div className="sm:col-span-2">
          <p className="border-b border-zinc-300 pb-8" />
          <p className="mt-2 text-xs uppercase text-zinc-500">Remarks</p>
        </div>
      </div>
    </section>
  );
}
