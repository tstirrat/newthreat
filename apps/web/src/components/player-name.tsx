/**
 * Class-colored player label component.
 */

export function PlayerName({
  label,
  color,
}: {
  label: string
  color: string
}): JSX.Element {
  return (
    <span className="font-medium" style={{ color }}>
      {label}
    </span>
  )
}
