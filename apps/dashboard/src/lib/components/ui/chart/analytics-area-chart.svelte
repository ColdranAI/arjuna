<script lang="ts">
  import { AreaChart, Area, ChartClipPath } from "layerchart";
  import { TrendingUp } from "lucide-svelte";
  import { curveNatural } from "d3-shape";
  import { scaleUtc } from "d3-scale";
  import { cubicInOut } from "svelte/easing";
  import * as Chart from "$lib/components/ui/chart/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import LayerChartContainer from "./layerchart-container.svelte";

  // Props
  export let data: Array<{ date: Date; visitors: number; pageviews?: number }> = [];
  export let timeRange: string = "7d";
  export let title: string = "Visitors Over Time";
  export let description: string = "Analytics data for your website";
  export let showTimeSelector: boolean = true;
  export let className: string | undefined = undefined;
  export { className as class };

  // Chart configuration
  const chartConfig = {
    visitors: { 
      label: "Visitors", 
      color: "hsl(var(--chart-1, 220 70% 50%))" 
    },
    pageviews: { 
      label: "Page Views", 
      color: "hsl(var(--chart-2, 160 60% 45%))" 
    },
  } satisfies Chart.ChartConfig;

  // Time range options
  const timeRangeOptions = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
  ];

  // Get selected label
  $: selectedLabel = timeRangeOptions.find(option => option.value === timeRange)?.label || "Last 7 days";

  // Prepare chart data
  $: chartData = data.map(item => ({
    date: item.date,
    visitors: item.visitors || 0,
    pageviews: item.pageviews || 0,
  }));

  // Calculate trend
  $: trend = calculateTrend(chartData);

  function calculateTrend(data: Array<{ visitors: number }>): { percentage: number; isUp: boolean } {
    if (data.length < 2) return { percentage: 0, isUp: true };
    
    const recent = data.slice(-7).reduce((sum: number, item: any) => sum + item.visitors, 0);
    const previous = data.slice(-14, -7).reduce((sum: number, item: any) => sum + item.visitors, 0);
    
    if (previous === 0) return { percentage: 0, isUp: true };
    
    const percentage = ((recent - previous) / previous) * 100;
    return { percentage: Math.abs(percentage), isUp: percentage >= 0 };
  }

  // Event handlers
  function handleTimeRangeChange(event: CustomEvent<{ value: string }>) {
    timeRange = event.detail.value;
  }

  // Determine series based on available data
  $: series = chartData.some(item => item.pageviews > 0) 
    ? [
        {
          key: "visitors",
          label: "Visitors",
          color: chartConfig.visitors.color,
        },
        {
          key: "pageviews", 
          label: "Page Views",
          color: chartConfig.pageviews.color,
        }
      ]
    : [
        {
          key: "visitors",
          label: "Visitors", 
          color: chartConfig.visitors.color,
        }
      ];
</script>

<Card.Root class={className}>
  <Card.Header class="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
    <div class="grid flex-1 gap-1 text-center sm:text-left">
      <Card.Title>{title}</Card.Title>
      <Card.Description>{description}</Card.Description>
    </div>
    
    {#if showTimeSelector}
      <Select.Root bind:value={timeRange}>
        <Select.Trigger class="w-[160px] rounded-lg sm:ml-auto" aria-label="Select time range">
          {selectedLabel}
        </Select.Trigger>
        <Select.Content class="rounded-xl">
          {#each timeRangeOptions as option}
            <Select.Item 
              value={option.value} 
              class="rounded-lg"
              on:select={handleTimeRangeChange}
            >
              {option.label}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    {/if}
  </Card.Header>
  
  <Card.Content class="px-2 sm:p-6">
    <LayerChartContainer config={chartConfig} class="aspect-auto h-[250px] w-full">
      {#if chartData.length > 0}
        <AreaChart
          legend
          data={chartData}
          x="date"
          xScale={scaleUtc()}
          {series}
          seriesLayout="stack"
          props={{
            area: {
              curve: curveNatural,
              "fill-opacity": 0.4,
              line: { class: "stroke-2" },
              motion: "tween",
            },
            xAxis: {
              ticks: timeRange === "7d" ? 7 : undefined,
              format: (v) => {
                return v.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              },
            },
            yAxis: { format: () => "" },
          }}
        >
          {#snippet marks({ series: chartSeries, getAreaProps }: { series: any; chartSeries: any; getAreaProps: any })}
            <defs>
              <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stop-color="var(--color-visitors)"
                  stop-opacity={0.8}
                />
                <stop
                  offset="95%"
                  stop-color="var(--color-visitors)"
                  stop-opacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillPageviews" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stop-color="var(--color-pageviews)" 
                  stop-opacity={0.8} 
                />
                <stop
                  offset="95%"
                  stop-color="var(--color-pageviews)"
                  stop-opacity={0.1}
                />
              </linearGradient>
            </defs>
            <ChartClipPath
              initialWidth={0}
              motion={{
                width: { type: "tween", duration: 1000, easing: cubicInOut },
              }}
            >
              {#each chartSeries as s, i (s.key)}
                <Area
                  {...getAreaProps(s, i)}
                  fill={s.key === "visitors"
                    ? "url(#fillVisitors)"
                    : "url(#fillPageviews)"}
                />
              {/each}
            </ChartClipPath>
          {/snippet}
          
          <Chart.Tooltip
            labelFormatter={(v: Date) => {
              return v.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              });
            }}
            indicator="line"
          />
        </AreaChart>
      {:else}
        <div class="h-[250px] flex items-center justify-center text-neutral-400">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p class="text-sm">No data available yet</p>
            <p class="text-xs text-neutral-500 mt-1">Data will appear once tracking is active</p>
          </div>
        </div>
      {/if}
    </LayerChartContainer>
  </Card.Content>
  
  {#if chartData.length > 0}
    <Card.Footer>
      <div class="flex w-full items-start gap-2 text-sm">
        <div class="grid gap-2">
          <div class="flex items-center gap-2 font-medium leading-none">
            {trend.isUp ? 'Trending up' : 'Trending down'} by {trend.percentage.toFixed(1)}% this period
            <TrendingUp class="size-4 {trend.isUp ? 'text-green-600' : 'text-red-600 rotate-180'}" />
          </div>
          <div class="text-neutral-500 flex items-center gap-2 leading-none">
            Analytics data for selected time period
          </div>
        </div>
      </div>
    </Card.Footer>
  {/if}
</Card.Root>