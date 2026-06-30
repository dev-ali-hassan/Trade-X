export function formatMoney(value: number, decimals = 2) {
  const absolute = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  if (value < 0) return `-$${absolute}`;
  if (value > 0) return `+$${absolute}`;
  return `$${absolute}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}
