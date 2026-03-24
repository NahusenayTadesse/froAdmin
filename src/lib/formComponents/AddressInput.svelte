<script>
	let results = $state([]);
	let selectedAddress = $state('');
	import { Input } from '$lib/components/ui/input/index.js';
	let timer;

	let { query = $bindable() } = $props();

	// Addis Ababa Coordinates
	const ADDIS_LAT = 8.9806;
	const ADDIS_LON = 38.7578;

	async function searchAddress() {
		if (query.length < 3) {
			results = [];
			return;
		}

		try {
			// 1. lat/lon centers the search on Addis
			// 2. location_bias_scale=1 makes it extremely strict to that location
			// 3. bbox (Optional) adds a "bounding box" around the city for even tighter locking
			const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${ADDIS_LAT}&lon=${ADDIS_LON}&location_bias_scale=1&limit=10`;

			const response = await fetch(url);
			const data = await response.json();

			results = data.features
				.filter((f) => {
					const p = f.properties;
					const isAddis = [p.city, p.state, p.county, p.district].some(
						(val) => val && val.toLowerCase().includes('addis ababa')
					);
					return isAddis;
				})
				.map((f) => {
					const p = f.properties;
					// Clean up the string for the user
					return [p.name, p.street, p.district].filter(Boolean).join(', ');
				});
		} catch (err) {
			console.error('Search failed', err);
		}
	}

	// Debounce logic: waits 300ms after the user stops typing to call the API
	function handleInput(e) {
		query = e.target.value;
		clearTimeout(timer);
		timer = setTimeout(searchAddress, 300);
	}

	function handleSelect(address) {
		selectedAddress = address;
		query = address;
		results = [];
	}
</script>

<div class="search-container">
	<Input
		type="text"
		oninput={handleInput}
		class="w-full!"
		bind:value={query}
		placeholder="Search neighborhoods (e.g., Bole, Kazanchis...)"
	/>

	{#if results.length > 0}
		<ul class="dropdown">
			{#each results as res}
				<li>
					<button onclick={() => handleSelect(res)}>{res}</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if selectedAddress}
		<p class="saved">Selected: <span>{selectedAddress}</span></p>
	{/if}
</div>

<style>
	.search-container {
		font-family: 'Segoe UI', sans-serif;
		position: relative;
	}

	.dropdown {
		position: absolute;
		width: 100%;
		background: white;
		border: 1px solid #ccc;
		list-style: none;
		padding: 0;
		margin: 2px 0;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 100;
	}
	.dropdown li button {
		width: 100%;
		text-align: left;
		padding: 12px;
		border: none;
		background: none;
		cursor: pointer;
		border-bottom: 1px solid #eee;
	}
	.dropdown li button:hover {
		background: #f4f4f4;
		color: #0066ff;
	}
	.saved {
		margin-top: 15px;
		font-size: 0.9rem;
		color: #555;
	}
	.saved span {
		color: #000;
		font-weight: bold;
	}
</style>
