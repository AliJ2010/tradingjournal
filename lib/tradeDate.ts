export function isWeekendDate(dateInput: Date | string): boolean {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}
