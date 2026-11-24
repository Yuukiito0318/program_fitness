import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import type { FieldErrors } from '../lib/api'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  name: string
  errors?: FieldErrors
  hint?: ReactNode
}

export function Field({ label, name, errors, hint, id, ...inputProps }: FieldProps) {
  const inputId = id ?? `field-${name}`
  const messages = errors?.[name] ?? []
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} name={name} aria-invalid={messages.length > 0} {...inputProps} />
      {hint && <p className="hint">{hint}</p>}
      <FieldMessages messages={messages} />
    </div>
  )
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  name: string
  errors?: FieldErrors
  hint?: ReactNode
}

export function TextAreaField({ label, name, errors, hint, id, ...props }: TextAreaFieldProps) {
  const inputId = id ?? `field-${name}`
  const messages = errors?.[name] ?? []
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <textarea id={inputId} name={name} aria-invalid={messages.length > 0} {...props} />
      {hint && <p className="hint">{hint}</p>}
      <FieldMessages messages={messages} />
    </div>
  )
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  name: string
  errors?: FieldErrors
  hint?: ReactNode
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({ label, name, errors, hint, id, options, placeholder, ...props }: SelectFieldProps) {
  const inputId = id ?? `field-${name}`
  const messages = errors?.[name] ?? []
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <select id={inputId} name={name} aria-invalid={messages.length > 0} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="hint">{hint}</p>}
      <FieldMessages messages={messages} />
    </div>
  )
}

/** Shows errors for a key that has no input of its own (e.g. "base", "days.0.base"). */
export function FieldMessages({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null
  return (
    <ul className="field-errors">
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  )
}

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: ReactNode }) {
  if (!children) return null
  return (
    <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}
