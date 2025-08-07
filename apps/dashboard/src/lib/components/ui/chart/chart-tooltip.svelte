<script lang="ts">
	import { cn } from "$lib/utils.js";

	export let labelFormatter: ((value: any) => string) | undefined = undefined;
	export let indicator: string = "dot";
	export let className: string | undefined = undefined;
	export { className as class };
</script>

<div 
	class={cn(
		"rounded-lg border bg-white p-3 shadow-lg text-sm",
		"border-gray-200 text-gray-900",
		className
	)} 
	{...$$restProps}
>
	<slot />
</div>