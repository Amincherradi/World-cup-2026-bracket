// Neutral, ownable BracketLive logo: a knockout-bracket glyph converging
// left-to-right into a single node (the "champion" / live dot). No FIFA IP.
// Lines inherit `currentColor`; the node is styled via the `.node` class.
export default function BrandMark({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-label="BracketLive"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* top pair -> merge */}
      <path d="M6 14h14M6 26h14M20 14v12M20 20h12" />
      {/* bottom pair -> merge */}
      <path d="M6 38h14M6 50h14M20 38v12M20 44h12" />
      {/* two semis -> final */}
      <path d="M32 20v24M32 32h12" />
      {/* champion node */}
      <circle className="node" cx="50" cy="32" r="5.5" stroke="none" />
    </svg>
  );
}
