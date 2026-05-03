export function getWeekBounds(date: Date) {
  const utcDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = utcDate.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const weekStart = new Date(utcDate);
  weekStart.setUTCDate(weekStart.getUTCDate() - diffToMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}
