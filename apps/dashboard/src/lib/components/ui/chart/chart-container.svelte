<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { ChartConfig } from "./index.js";

	export let config: ChartConfig;
	let className: string | undefined = undefined;
	export { className as class };
</script>

<div class={cn("", className)} {...$$restProps}>
	<slot />
</div> 