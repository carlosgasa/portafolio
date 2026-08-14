import { Input } from "@/components/ui/input"
import { evalAmountExpression } from "@/shared/utils/evalAmountExpression"
import { formatCurrency } from "@/shared/utils/format"
import { cn } from "@/lib/utils"

interface AmountInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
  placeholder?: string
  autoFocus?: boolean
}

/** Input de monto que tambien acepta formulas al estilo hoja de calculo
 * (ej. "=635+876-88"); muestra el resultado calculado debajo, sutil. */
function AmountInput({
  id,
  value,
  onChange,
  required,
  className,
  placeholder = "0.00 o =635+876-88",
  autoFocus,
}: AmountInputProps) {
  const isFormula = value.trim().startsWith("=")
  const evaluated = isFormula ? evalAmountExpression(value) : null

  return (
    <div className="flex flex-col gap-1">
      <Input
        id={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        required={required}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
      {isFormula && (
        <span
          className={cn(
            "text-xs",
            evaluated !== null ? "text-muted-foreground" : "text-negative"
          )}
        >
          {evaluated !== null ? `= ${formatCurrency(evaluated)}` : "Fórmula inválida"}
        </span>
      )}
    </div>
  )
}

export { AmountInput }
