<script lang="ts">
	import { cn } from "$lib/utils.js";

	export let labelFormatter: ((value: any) => string) | undefined = undefined;
	export let indicator: string = "dot";

	let className: string | undefined = undefined;
	export { className as class };
</script>

<div class={cn("rounded-lg border bg-background p-2 shadow-md", className)} {...$$restProps}>
	<slot />
</div> 