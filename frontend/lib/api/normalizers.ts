export function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  return typeof value === "number" ? value : Number(value);
}

export function decimalToNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}
