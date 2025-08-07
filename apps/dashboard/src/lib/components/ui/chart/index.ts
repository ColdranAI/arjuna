export type ChartConfig = Record<string, {
  label: string;
  color: string;
}>;

export { default as ChartContainer } from "./chart-container.svelte";
export { default as LayerChartContainer } from "./layerchart-container.svelte";
export { default as Tooltip } from "./chart-tooltip.svelte";
export { default as SimpleLineChart } from "./simple-line-chart.svelte";
export { default as AnalyticsAreaChart } from "./analytics-area-chart.svelte";