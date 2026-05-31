<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	type StatusType = 'booking' | 'payment';
	type Props = {
		status: string;
		type: StatusType;
	};

	const { status, type }: Props = $props();

	const getVariant = (status: string, type: StatusType) => {
		if (type === 'booking') {
			switch (status?.toLowerCase()) {
				case 'completed':
					return 'default';
				case 'confirmed':
					return 'secondary';
				case 'pending':
					return 'outline';
				case 'cancelled':
					return 'destructive';
				default:
					return 'outline';
			}
		} else {
			switch (status?.toLowerCase()) {
				case 'paid':
					return 'default';
				case 'pending':
					return 'outline';
				case 'refunded':
					return 'secondary';
				case 'failed':
					return 'destructive';
				default:
					return 'outline';
			}
		}
	};

	const variant = $derived(getVariant(status, type));
	const label = $derived(status?.charAt(0).toUpperCase() + status?.slice(1));
</script>

<Badge {variant} class="text-xs font-medium">
	{label}
</Badge>
