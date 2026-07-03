export function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 2,
      }}
    >
      <span style={{ background: "#f25022" }} />
      <span style={{ background: "#7fba00" }} />
      <span style={{ background: "#00a4ef" }} />
      <span style={{ background: "#ffb900" }} />
    </span>
  );
}
