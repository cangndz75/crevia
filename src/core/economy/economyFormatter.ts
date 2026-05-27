function formatCompactAmount(amount: number): string {
  const abs = Math.abs(amount);
  if (abs === 0) {
    return '0';
  }
  if (abs < 1000) {
    return String(Math.round(abs));
  }
  const thousands = abs / 1000;
  if (Number.isInteger(thousands)) {
    return `${thousands}K`;
  }
  const rounded = Math.round(thousands * 10) / 10;
  return `${rounded}K`;
}

/** Kısa Kaynak miktarı — para birimi simgesi yok. */
export function formatSourceAmount(amount: number): string {
  if (amount === 0) {
    return '0';
  }
  const sign = amount < 0 ? '-' : '';
  return `${sign}${formatCompactAmount(amount)}`;
}

export function formatSourceWithLabel(amount: number): string {
  return `${formatSourceAmount(amount)} Kaynak`;
}

export function formatSourceDelta(amount: number): string {
  if (amount === 0) {
    return '0 Kaynak';
  }
  const sign = amount > 0 ? '+' : '';
  return `${sign}${formatSourceAmount(amount)} Kaynak`;
}
