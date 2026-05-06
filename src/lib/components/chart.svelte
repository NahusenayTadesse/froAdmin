<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		type ChartType,
		type ChartData,
		type ChartOptions,
		type Plugin,
		BarController,
		LineController,
		PieController,
		DoughnutController,
		RadarController,
		PolarAreaController,
		BubbleController,
		ScatterController,
		CategoryScale,
		LinearScale,
		RadialLinearScale,
		LogarithmicScale,
		TimeScale,
		PointElement,
		LineElement,
		BarElement,
		ArcElement,
		Tooltip,
		Legend,
		Title,
		Filler
	} from 'chart.js';

	// Register all components you need
	Chart.register(
		BarController,
		LineController,
		PieController,
		DoughnutController,
		RadarController,
		PolarAreaController,
		BubbleController,
		ScatterController,
		CategoryScale,
		LinearScale,
		RadialLinearScale,
		LogarithmicScale,
		TimeScale,
		PointElement,
		LineElement,
		BarElement,
		ArcElement,
		Tooltip,
		Legend,
		Title,
		Filler
	);

	// ─── Props ────────────────────────────────────────────────────────────────
	interface Props {
		/** Chart type: bar | line | pie | doughnut | radar | polarArea | bubble | scatter */
		type: ChartType;
		/** Chart.js ChartData object */
		data: ChartData;
		/** Chart.js ChartOptions object — merged with sensible defaults */
		options?: ChartOptions;
		/** Extra Chart.js plugins */
		plugins?: Plugin[];
		/** Tailwind classes applied to the outer wrapper div */
		class?: string;
		/** Accessible label for the canvas */
		ariaLabel?: string;
	}

	let {
		type,
		data,
		options = {},
		plugins = [],
		class: className = '',
		ariaLabel = 'Chart'
	}: Props = $props();

	// ─── State ────────────────────────────────────────────────────────────────
	let canvas = $state<HTMLCanvasElement | null>(null);
	let chart = $state<Chart | null>(null);

	// ─── Defaults ─────────────────────────────────────────────────────────────
	const defaultOptions: ChartOptions = {
		responsive: true,
		maintainAspectRatio: true,
		plugins: {
			legend: {
				position: 'bottom',
				labels: {
					padding: 16,
					usePointStyle: true,
					font: { size: 13 }
				}
			},
			tooltip: {
				mode: 'index',
				intersect: false
			}
		},
		animation: {
			duration: 500,
			easing: 'easeInOutQuart'
		}
	};

	function mergeOptions(defaults: ChartOptions, overrides: ChartOptions): ChartOptions {
		return {
			...defaults,
			...overrides,
			plugins: {
				...(defaults.plugins ?? {}),
				...(overrides.plugins ?? {})
			}
		};
	}

	// ─── Lifecycle ────────────────────────────────────────────────────────────
	onMount(() => {
		if (!canvas) return;

		chart = new Chart(canvas, {
			type,
			data,
			options: mergeOptions(defaultOptions, options),
			plugins
		});
	});

	onDestroy(() => {
		chart?.destroy();
		chart = null;
	});

	// ─── Reactive updates ─────────────────────────────────────────────────────
	$effect(() => {
		if (!chart) return;

		// Type changed → full rebuild
		if (chart.config.type !== type) {
			chart.destroy();
			if (!canvas) return;
			chart = new Chart(canvas, {
				type,
				data,
				options: mergeOptions(defaultOptions, options),
				plugins
			});
			return;
		}

		// Data / options changed → soft update
		chart.data = data;
		chart.options = mergeOptions(defaultOptions, options);
		chart.update();
	});
</script>

<!--
  Wrapper div accepts Tailwind classes via `class` prop.
  Default: full width, auto height via aspect ratio.
-->
<div class={['relative w-full', className].filter(Boolean).join(' ')}>
	<canvas bind:this={canvas} role="img" aria-label={ariaLabel}></canvas>
</div>
