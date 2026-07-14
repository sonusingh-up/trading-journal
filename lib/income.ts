/** Chart series keys become CSS variables, so source names need slugifying. */
export const sourceSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export type MonthlyIncomeRow = {
  month: string;
  [sourceSlug: string]: string | number;
};
