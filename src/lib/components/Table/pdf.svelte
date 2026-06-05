<script lang="ts">
	import jsPDF from 'jspdf';
	import autoTable from 'jspdf-autotable';
	import { Button } from '$lib/components/ui/button/index';
	import { FileDown, Download, Grid3x3 } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index';
	import { page } from '$app/state';
	import Papa from 'papaparse';

	// Accept parameters directly from the parent Mega Component
	const {
		fileName = page.url.pathname.split('/').pop() || 'export',
		table
	}: { fileName: string; table: any } = $props();

	/**
	 * Extracts clean data rows out of TanStack Table's internal memory state machine.
	 * Completely isolates cell data values while bypassing UI components.
	 */
	function getTableData() {
		if (!table) {
			console.error('TanStack table instance was not provided to the export component.');
			return null;
		}

		// 1. Map Headers (Ignore layout indices, selection toggles, and trailing actions)
		const headerGroups = table.getHeaderGroups();
		const headers: string[] = [];
		const validColumnIds: string[] = [];

		headerGroups.forEach((headerGroup: any) => {
			headerGroup.headers.forEach((header: any) => {
				const id = header.id.toLowerCase();
				if (id === 'index' || id === 'actions' || id.includes('select')) {
					return;
				}
				validColumnIds.push(header.id);

				const headerText =
					typeof header.column.columnDef.header === 'string'
						? header.column.columnDef.header
						: header.id;

				// Standard CamelCase to Header Title spacing mutations
				const cleanHeader = headerText
					.replace(/([A-Z])/g, ' $1')
					.replace(/^./, (str: string) => str.toUpperCase());
				headers.push(cleanHeader.trim());
			});
		});

		// 2. Map Row Data matrices
		const rowModel = table.getRowModel();
		const rows = rowModel.rows.map((row: any) => {
			return validColumnIds.map((columnId) => {
				const cell = row.getAllCells().find((c: any) => c.column.id === columnId);
				if (!cell) return '';

				let value = cell.renderValue();

				// Handle complex fallback payloads gracefully
				if (typeof value === 'object' && value !== null) {
					value = row.original[columnId] ?? '';
				}

				if (value === undefined || value === null) {
					return '';
				}

				// --- FINANCIAL LEDGER FLOAT FORMATTER ---
				// --- FINANCIAL LEDGER FLOAT FORMATTER ---
				const num = Number(value);
				if (!isNaN(num) && typeof value !== 'boolean' && String(value).trim() !== '') {
					// Bypasses phone numbers, TIN numbers, national IDs, and zip codes
					const lowerKey = columnId.toLowerCase();
					const isIdentifier =
						lowerKey.includes('phone') ||
						lowerKey.includes('tin') ||
						lowerKey.includes('id') ||
						lowerKey.includes('code') ||
						lowerKey.includes('number') ||
						lowerKey.includes('index');

					if (isIdentifier) {
						return String(value).trim(); // Keep raw text format intact
					}

					// Otherwise, format as a standard financial ledger string: 6,000.00
					return num.toLocaleString('en-US', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2
					});
				}
				// ----------------------------------------
				// ----------------------------------------

				return String(value).trim();
			});
		});

		return { headers, rows };
	}

	/**
	 * Dynamically generates a scalable PDF report based on total columns density.
	 */
	function generatedPdf() {
		const parsed = getTableData();
		if (!parsed) return;

		const columnCount = parsed.headers.length;

		// Scalable blueprint fallback sizing values
		let pdfFormat: string | [number, number] = 'a4';
		let pdfOrientation: 'portrait' | 'landscape' = 'landscape';
		let calculatedFontSize = 9;
		let calculatedPadding = 5;

		if (columnCount > 25) {
			pdfFormat = 'a1';
			calculatedFontSize = 7;
			calculatedPadding = 3;
		} else if (columnCount > 15) {
			pdfFormat = 'a3'; // Ideal layout for your wide payroll structures
			calculatedFontSize = 8;
			calculatedPadding = 4;
		} else if (columnCount > 8) {
			pdfFormat = 'a4';
			pdfOrientation = 'landscape';
		} else {
			pdfFormat = 'a4';
			pdfOrientation = 'portrait';
		}

		const doc = new jsPDF({
			orientation: pdfOrientation,
			unit: 'pt',
			format: pdfFormat
		});

		autoTable(doc, {
			head: [parsed.headers],
			body: parsed.rows,
			theme: 'striped',
			styles: {
				font: 'helvetica',
				fontSize: calculatedFontSize,
				cellPadding: calculatedPadding,
				valign: 'middle',
				overflow: 'linebreak', // Ensure continuous textual wraps inside narrow grids
				cellWidth: 'auto'
			},
			headStyles: {
				fillColor: [30, 41, 59], // Dark Slate layout design matching ERP structures
				textColor: [255, 255, 255],
				fontStyle: 'bold'
			},
			alternateRowStyles: {
				fillColor: [248, 250, 252]
			},
			minCellWidth: 45,
			margin: { top: 30, bottom: 30 }
		});

		doc.save(`${fileName}.pdf`);
	}

	function exportTableToCSV() {
		const parsed = getTableData();
		if (!parsed) return;

		const csvData = [parsed.headers, ...parsed.rows];
		const csv = Papa.unparse(csvData);

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');

		link.href = url;
		link.download = `${fileName}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" class="ml-auto">
				<Download class="size-5" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item class="capitalize">
			<Button variant="default" class="w-full justify-start gap-2" onclick={generatedPdf}>
				<FileDown class="size-4 text-white dark:text-black" /> Download in PDF
			</Button>
		</DropdownMenu.Item>
		<DropdownMenu.Item class="capitalize">
			<Button variant="default" class="w-full justify-start gap-2" onclick={exportTableToCSV}>
				<Grid3x3 class="size-4 text-white dark:text-black" /> Export to CSV
			</Button>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
