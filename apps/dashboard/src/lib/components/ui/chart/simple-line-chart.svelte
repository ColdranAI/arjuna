<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from "$lib/utils.js";

	export let data: Array<{ date: string; value: number }> = [];
	export let className: string | undefined = undefined;
	export { className as class };

	let svgElement: SVGSVGElement;
	let width = 400;
	let height = 200;
	const margin = { top: 20, right: 20, bottom: 30, left: 40 };

	$: chartWidth = width - margin.left - margin.right;
	$: chartHeight = height - margin.bottom - margin.top;

	$: maxValue = Math.max(...data.map(d => d.value), 0);
	$: minValue = Math.min(...data.map(d => d.value), 0);
	$: valueRange = maxValue - minValue || 1;

	$: pathData = data.length > 1 ? data.map((d, i) => {
		const x = (i / (data.length - 1)) * chartWidth;
		const y = chartHeight - ((d.value - minValue) / valueRange) * chartHeight;
		return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
	}).join(' ') : '';

	onMount(() => {
		const resizeObserver = new ResizeObserver(entries => {
			for (let entry of entries) {
				width = entry.contentRect.width;
				height = Math.min(entry.contentRect.width * 0.5, 300);
			}
		});
		
		if (svgElement?.parentElement) {
			resizeObserver.observe(svgElement.parentElement);
		}

		return () => resizeObserver.disconnect();
	});
</script>

<div class={cn("w-full", className)}>
	<svg
		bind:this={svgElement}
		{width}
		{height}
		viewBox="0 0 {width} {height}"
		class="w-full h-auto"
	>
		<g transform="translate({margin.left}, {margin.top})">
			<!-- Grid lines -->
			{#each Array(5) as _, i}
				{@const y = (i / 4) * chartHeight}
				<line
					x1="0"
					y1={y}
					x2={chartWidth}
					y2={y}
					stroke="#f3f4f6"
					stroke-width="1"
				/>
			{/each}

			<!-- Data line -->
			{#if pathData}
				<path
					d={pathData}
					fill="none"
					stroke="#111827"
					stroke-width="2"
					class="drop-shadow-sm"
				/>
			{/if}

			<!-- Data points -->
			{#each data as point, i}
				{@const x = (i / (data.length - 1)) * chartWidth}
				{@const y = chartHeight - ((point.value - minValue) / valueRange) * chartHeight}
				<circle
					cx={x}
					cy={y}
					r="3"
					fill="#111827"
					class="drop-shadow-sm"
				/>
			{/each}
		</g>
	</svg>
</div>