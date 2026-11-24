/** "YYYY-MM" from <input type="month"> -> "YYYY-MM-01" for the API. */
export function monthToDate(month: string): string {
  return month ? `${month}-01` : ''
}

/** Today in local time as YYYY-MM-DD (for <input type="date" max>). */
export function todayIso(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** This month in local time as YYYY-MM (for <input type="month" max>). */
export function thisMonthIso(): string {
  return todayIso().slice(0, 7)
}
