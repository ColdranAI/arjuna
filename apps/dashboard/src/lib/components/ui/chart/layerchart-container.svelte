<script lang="ts">
  import { cn } from "$lib/utils.js";
  import type { ChartConfig } from "./index.js";
  
  export let config: ChartConfig = {};
  export let className: string | undefined = undefined;
  export { className as class };
  
  // Create CSS custom properties for chart colors
  $: cssVars = Object.entries(config || {}).reduce((acc, [key, { color }]) => {
    acc[`--color-${key}`] = color;
    return acc;
  }, {} as Record<string, string>);
</script>

<div 
  class={cn("flex aspect-video justify-center text-xs", className)} 
  style={Object.entries(cssVars).map(([key, value]) => `${key}: ${value}`).join('; ')}
  {...$$restProps}
>
  <slot />
</div>