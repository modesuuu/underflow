export function formatCount(n: number): string {
  if (n >= 1000) {
    const k = Math.round(n / 100) / 10;
    return `${k}k`.replace(/\.0k$/, "k");
  }
  return String(n);
}