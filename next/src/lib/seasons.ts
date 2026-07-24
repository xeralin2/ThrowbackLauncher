export function operatorsLocked(key: string): boolean {
  const match = /^Y(\d+)S(\d+)/.exec(key);
  if (!match) return false;
  const year = Number(match[1]);
  const season = Number(match[2]);
  return year > 8 || (year === 8 && season >= 3);
}

export function seasonRank(key: string): number {
  const match = /^Y(\d+)S(\d+)/.exec(key);
  return match ? Number(match[1]) * 10 + Number(match[2]) : 0;
}
