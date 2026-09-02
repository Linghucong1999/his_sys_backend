/** 本地日期字符串：yyyyMMdd（不用 toISOString，避免 UTC 跨天串号） */
export function dateStr(d: Date = new Date()): string {
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

/** 日期时间：yyyy-MM-dd HH:mm */
export function fmtDateTime(d?: string | Date): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`
}
