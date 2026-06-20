// Renders a flag-icons SVG flag for a given ISO code.
export default function Flag({ code, title }) {
  return (
    <span
      className={`fi fi-${code} flag`}
      role="img"
      aria-label={title}
      title={title}
    />
  );
}
