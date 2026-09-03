export function SentraMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect x="1" y="1" width="30" height="30" rx="7" className="stroke-border" strokeWidth="1" />
      <path
        d="M8 21.5 L13.5 12.5 L18 18.5 L24 9.5"
        className="stroke-accent"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="9.5" r="1.4" className="fill-accent" />
    </svg>
  );
}
