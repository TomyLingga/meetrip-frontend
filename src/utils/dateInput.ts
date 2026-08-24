export function toLocalDateTimeInputValue(date: Date, hour = date.getHours(), minute = date.getMinutes()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const mn = String(minute).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mn}`;
}

export function todayStartInputValue() {
  return toLocalDateTimeInputValue(new Date(), 0, 0);
}
