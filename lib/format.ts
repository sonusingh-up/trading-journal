export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const signedCurrency = (value: number) =>
  `${value > 0 ? "+" : ""}${currency.format(value)}`;

// Forex/index prices aren't dollars — plain figures, up to 5 decimals.
export const price = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 5,
});

export const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export const pnlTone = (value: number | null | undefined) =>
  value == null || value === 0
    ? ""
    : value > 0
      ? "text-success"
      : "text-destructive";
