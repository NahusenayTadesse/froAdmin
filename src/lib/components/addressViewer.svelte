<script>
	let { address = 'Addis Ababa, Ethiopia' } = $props();
	import DialogComp from '$lib/formComponents/DialogComp.svelte';
	import Copy from '$lib/Copy.svelte';
	import { MapPin } from '@lucide/svelte';
	function truncate(str, maxLength = 15) {
		// Ensure str exists and is treated as a string
		const safeStr = String(str || '');

		return safeStr.length > maxLength ? safeStr.slice(0, maxLength) + '...' : safeStr;
	}

	let mapSrc = $derived(
		`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=13&ie=UTF8&iwloc=&output=embed`
	);

	let shortAddress = $derived(truncate(address, 10));
</script>

<DialogComp title={shortAddress} description={address} IconComp={MapPin}>
	<Copy data={address} />
	<iframe
		title="Google Map"
		width="100%"
		height="400"
		frameborder="0"
		scrolling="no"
		marginheight="0"
		marginwidth="0"
		src={mapSrc}
	></iframe>
</DialogComp>
