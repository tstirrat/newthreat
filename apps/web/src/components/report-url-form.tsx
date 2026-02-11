/**
 * Input form for loading a report from URL or report code.
 */
import { useState, type FC } from 'react'

export type ReportUrlFormProps = {
  onSubmit: (input: string) => void
}

export const ReportUrlForm: FC<ReportUrlFormProps> = ({
  onSubmit,
}) => {
  const [value, setValue] = useState('')

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(value)
      }}
    >
      <input
        className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm"
        placeholder="Paste Warcraft Logs report URL or report ID"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        className="rounded-md border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        type="submit"
      >
        Load report
      </button>
    </form>
  )
}
