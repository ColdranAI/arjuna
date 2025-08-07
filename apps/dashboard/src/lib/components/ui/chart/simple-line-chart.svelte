<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from "$lib/utils.js";

	export let data: Array<{ date: string; value: number }> = [];
	export let className: string | undefined = undefined;
	export { className as class };

	let svgElement: SVGSVGElement;
	let width = 400;
	let height = 200;
	let hoveredPoint: { x: number; y: number; data: { date: string; value: number } } | null = null;
	let mouseX = 0;
	let mouseY = 0;
	
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

	function handleMouseMove(event: MouseEvent) {
		if (!svgElement || data.length === 0) return;
		
		const rect = svgElement.getBoundingClientRect();
		const svgX = event.clientX - rect.left;
		const svgY = event.clientY - rect.top;
		
		// Convert to chart coordinates
		const chartX = svgX - margin.left;
		const chartY = svgY - margin.top;
		
		if (chartX >= 0 && chartX <= chartWidth && chartY >= 0 && chartY <= chartHeight) {
			// Find closest data point
			const dataIndex = Math.round((chartX / chartWidth) * (data.length - 1));
			if (dataIndex >= 0 && dataIndex < data.length) {
				const point = data[dataIndex];
				const x = (dataIndex / (data.length - 1)) * chartWidth;
				const y = chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
				
				hoveredPoint = { x: x + margin.left, y: y + margin.top, data: point };
				mouseX = event.clientX;
				mouseY = event.clientY;
			}
		} else {
			hoveredPoint = null;
		}
	}

	function handleMouseLeave() {
		hoveredPoint = null;
	}

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

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

<div class={cn("w-full relative", className)}>
	<svg
		bind:this={svgElement}
		{width}
		{height}
		viewBox="0 0 {width} {height}"
		class="w-full h-auto cursor-crosshair"
		on:mousemove={handleMouseMove}
		on:mouseleave={handleMouseLeave}
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
					class="drop-shadow-sm hover:r-4 transition-all duration-200"
				/>
			{/each}

			<!-- Hover line -->
			{#if hoveredPoint}
				<line
					x1={hoveredPoint.x - margin.left}
					y1="0"
					x2={hoveredPoint.x - margin.left}
					y2={chartHeight}
					stroke="#6b7280"
					stroke-width="1"
					stroke-dasharray="3,3"
					opacity="0.7"
				/>
				<circle
					cx={hoveredPoint.x - margin.left}
					cy={hoveredPoint.y - margin.top}
					r="5"
					fill="#111827"
					stroke="white"
					stroke-width="2"
					class="drop-shadow-lg"
				/>
			{/if}
		</g>
	</svg>

	<!-- Tooltip -->
	{#if hoveredPoint}
		<div
			class="absolute z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none transform -translate-x-1/2 -translate-y-full"
			style="left: {hoveredPoint.x}px; top: {hoveredPoint.y - 8}px;"
		>
			<div class="font-medium">{hoveredPoint.data.value.toLocaleString()}</div>
			<div class="text-gray-300">{formatDate(hoveredPoint.data.date)}</div>
		</div>
	{/if}
</div>