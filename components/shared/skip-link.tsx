export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 outline-none focus:not-sr-only focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background print:hidden"
    >
      Skip to main content
    </a>
  );
}
