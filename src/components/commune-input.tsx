import * as React from "react"
import { useServerFn } from "@tanstack/react-start"
import { Input } from "~/components/ui/input"
import { searchCommunes } from "~/server/communes"
import { territories, type Commune, type CommuneSearchResult } from "~/lib/communes"

export function CommuneInput({
  value, territory, onChange, onSelect, onBlur,
}: {
  value: string
  territory: string
  onChange: (value: string) => void
  onSelect: (commune: Commune) => void
  onBlur: () => void
}) {
  const search = useServerFn(searchCommunes)
  const listId = React.useId()
  const helpId = React.useId()
  const [result, setResult] = React.useState<CommuneSearchResult | null>(null)
  const [status, setStatus] = React.useState<"idle" | "loading" | "error" | "done">("idle")
  const [error, setError] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const [selectedName, setSelectedName] = React.useState<string | null>(null)
  const supported = territory !== "Autre" && territories.some((item) => item === territory)
  const query = value.trim()

  React.useEffect(() => {
    let cancelled = false
    setResult(null)
    setActiveIndex(-1)
    setError("")
    if (!supported || query.length < 2 || value === selectedName) {
      setStatus("idle")
      return
    }

    setStatus("loading")
    const timer = setTimeout(() => {
      void search({ data: { territory: territory as typeof territories[number], query } })
        .then((response) => {
          if (cancelled) return
          setResult(response)
          setStatus("done")
        })
        .catch((cause: unknown) => {
          if (cancelled) return
          setStatus("error")
          setError(cause instanceof Error ? cause.message : "La recherche est indisponible. Saisis la commune manuellement.")
        })
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [value, query, territory, supported, selectedName, search])

  const options = open ? result?.communes ?? [] : []

  function choose(commune: Commune) {
    setSelectedName(commune.name)
    setOpen(false)
    setActiveIndex(-1)
    onChange(commune.name)
    onSelect(commune)
  }

  let message = "Saisis au moins 2 lettres pour rechercher, ou indique la commune manuellement."
  if (!supported) message = "Saisis la commune manuellement, puis place le repère sur la carte."
  else if (selectedName === value) message = "Commune sélectionnée. La carte est centrée ; place ensuite le repère exact du spot."
  else if (status === "loading") message = "Recherche des communes…"
  else if (status === "error") message = error
  else if (status === "done") {
    message = result?.communes.length
      ? `${result.communes.length} commune(s) proposée(s)${result.cached ? " depuis les dernières données disponibles" : ""}. Tu peux aussi conserver ta saisie.`
      : "Aucune commune trouvée. Tu peux conserver ta saisie et placer le repère manuellement."
  }

  return (
    <div className="relative grid gap-2">
      <Input
        id="city"
        name="city"
        value={value}
        maxLength={100}
        autoComplete="off"
        placeholder="Les Abymes"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={options.length > 0}
        aria-controls={options.length > 0 ? listId : undefined}
        aria-activedescendant={activeIndex >= 0 && options[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        aria-describedby={helpId}
        onFocus={() => setOpen(true)}
        onBlur={() => { setOpen(false); onBlur() }}
        onChange={(event) => {
          setSelectedName(null)
          setResult(null)
          setActiveIndex(-1)
          setOpen(true)
          onChange(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") { setOpen(false); return }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            setOpen(true)
            const count = result?.communes.length ?? 0
            if (count) setActiveIndex((current) => {
              if (current < 0) return event.key === "ArrowDown" ? 0 : count - 1
              return (current + (event.key === "ArrowDown" ? 1 : count - 1)) % count
            })
          }
          if (event.key === "Enter" && options[activeIndex]) {
            event.preventDefault()
            choose(options[activeIndex])
          }
        }}
      />
      {options.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Communes proposées" className="max-h-64 overflow-y-auto border border-line bg-surface">
          {options.map((commune, index) => (
            <li
              key={commune.code}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              className={`cursor-pointer px-3 py-3 text-sm hover:bg-sun/20 ${activeIndex === index ? "bg-sun/20" : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(commune)}
            >
              <span className="font-semibold">{commune.name}</span>
              <span className="ml-2 text-muted">({commune.departmentCode})</span>
            </li>
          ))}
        </ul>
      )}
      <p id={helpId} role="status" className={`text-sm leading-5 ${status === "error" ? "text-clay" : "text-muted"}`}>
        {message}
      </p>
    </div>
  )
}
