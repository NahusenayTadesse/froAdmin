<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import { FileDown, Download, Grid3x3 } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index';
	import { page } from '$app/state';

	const {
		fileName = page.url.pathname.split('/').pop() || 'export',
		tableId,
		data
	}: { fileName: string; tableId: string; data: any } = $props();

	// ── CSV (replaces papaparse) ──────────────────────────────────────────────
	// Escapes a cell value per RFC 4180: wrap in quotes if it contains comma,
	// newline, or double-quote; double up any internal double-quotes.
	function escapeCSVCell(value: unknown): string {
		const str = value == null ? '' : String(value);
		if (str.includes(',') || str.includes('\n') || str.includes('"')) {
			return '"' + str.replace(/"/g, '""') + '"';
		}
		return str;
	}

	function unparse(rows: unknown[][]): string {
		return rows.map((row) => row.map(escapeCSVCell).join(',')).join('\r\n');
	}

	function exportTableToCSV() {
		let rows: string[][];

		if (tableId) {
			const tableElement = document.querySelector(tableId) as HTMLTableElement;
			if (!tableElement) {
				console.error(`Table with selector ${tableId} not found.`);
				return;
			}
			rows = Array.from(tableElement.querySelectorAll('tr')).map((row) =>
				Array.from(row.querySelectorAll('th, td')).map((cell) =>
					(cell as HTMLElement).innerText.trim()
				)
			);
		} else {
			rows = data;
		}

		const csv = unparse(rows);
		downloadBlob(csv, `${fileName}.csv`, 'text/csv;charset=utf-8;');
	}

	// ── PDF (replaces jsPDF + jspdf-autotable) ────────────────────────────────
	// Builds a minimal valid PDF from scratch using only the spec primitives we
	// actually need: a single landscape A4 page, a Helvetica text grid.
	//
	// A4 landscape in PDF points (1 pt = 1/72 inch): 841.89 × 595.28
	// We work in integer pts for simplicity.

	const PAGE_W = 842;
	const PAGE_H = 595;
	const MARGIN = 20;
	const HEAD_SIZE = 10;
	const BODY_SIZE = 9;
	const LINE_H = 18; // row height in pts
	const HEAD_H = 22; // header row height
	const PAD_X = 4; // horizontal cell padding
	const PAD_Y = 5; // vertical cell padding (baseline offset)

	function getTableRows(): string[][] | null {
		if (tableId) {
			const el = document.querySelector(tableId) as HTMLTableElement;
			if (!el) {
				console.error(`Table ${tableId} not found`);
				return null;
			}
			return Array.from(el.querySelectorAll('tr')).map((row) =>
				Array.from(row.querySelectorAll('th, td')).map((c) =>
					(c as HTMLElement).innerText.trim().replace(/\n/g, ' ')
				)
			);
		}
		return data as string[][];
	}

	// Very rough character-width estimate for Helvetica at given pt size.
	// Helvetica average advance is ~0.55× the point size for mixed text.
	function estimateTextWidth(text: string, size: number): number {
		return text.length * size * 0.52;
	}

	function truncateToFit(text: string, maxWidth: number, size: number): string {
		if (estimateTextWidth(text, size) <= maxWidth) return text;
		let t = text;
		while (t.length > 1 && estimateTextWidth(t + '…', size) > maxWidth) {
			t = t.slice(0, -1);
		}
		return t + '…';
	}

	// Encode a JS string to PDF "literal string" bytes (Latin-1, safe subset).
	function pdfStr(s: string): string {
		// Escape backslash, parens; strip non-latin chars.
		return s
			.replace(/\\/g, '\\\\')
			.replace(/\(/g, '\\(')
			.replace(/\)/g, '\\)')
			.replace(/[^\x20-\x7E]/g, '?');
	}

	function generatedPdf() {
		const allRows = getTableRows();
		if (!allRows || allRows.length === 0) return;

		const [headerRow, ...bodyRows] = allRows;
		const colCount = headerRow.length;
		const usableW = PAGE_W - MARGIN * 2;

		// Distribute column widths proportionally by max content width, capped
		const rawWidths = headerRow.map((h, ci) => {
			const maxContent = Math.max(
				estimateTextWidth(h, HEAD_SIZE),
				...bodyRows.map((r) => estimateTextWidth(r[ci] ?? '', BODY_SIZE))
			);
			return maxContent + PAD_X * 2;
		});
		const rawTotal = rawWidths.reduce((a, b) => a + b, 0);
		const scale = rawTotal > usableW ? usableW / rawTotal : 1;
		const colWidths = rawWidths.map((w) => Math.floor(w * scale));
		// Assign any rounding remainder to last column
		const widthSum = colWidths.reduce((a, b) => a + b, 0);
		colWidths[colWidths.length - 1] += usableW - widthSum;

		// ── Build PDF content stream ──────────────────────────────────────────
		const lines: string[] = [];

		// Draw a filled rectangle: x y w h re f
		const fillRect = (
			x: number,
			y: number,
			w: number,
			h: number,
			r: number,
			g: number,
			b: number
		) => {
			lines.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`);
			lines.push(`${x} ${y} ${w} ${h} re f`);
		};

		// Draw a stroked rectangle outline
		const strokeRect = (x: number, y: number, w: number, h: number) => {
			lines.push('0 0 0 RG');
			lines.push('0.3 w');
			lines.push(`${x} ${y} ${w} ${h} re S`);
		};

		// Draw text at position (PDF y-axis is bottom-up)
		const drawText = (text: string, x: number, y: number, size: number, bold = false) => {
			lines.push('BT');
			lines.push(`/${bold ? 'F2' : 'F1'} ${size} Tf`);
			lines.push(`${x} ${y} Td`);
			lines.push(`(${pdfStr(text)}) Tj`);
			lines.push('ET');
		};

		// PDF uses bottom-up Y; we track from top
		const totalTableH = HEAD_H + bodyRows.length * LINE_H;
		let cursorY = PAGE_H - MARGIN; // starts at top margin, going down

		// ── Header row ────────────────────────────────────────────────────────
		let x = MARGIN;
		const headerPdfY = cursorY - HEAD_H; // bottom-left of this row in PDF coords

		// Header background
		fillRect(MARGIN, headerPdfY, usableW, HEAD_H, 0, 0, 0);

		headerRow.forEach((cell, ci) => {
			const cw = colWidths[ci];
			const truncated = truncateToFit(cell, cw - PAD_X * 2, HEAD_SIZE);
			// White text on black
			lines.push('1 1 1 rg');
			drawText(truncated, x + PAD_X, headerPdfY + PAD_Y, HEAD_SIZE, true);
			// Column divider
			if (ci < colCount - 1) {
				lines.push('0.6 0.6 0.6 RG');
				lines.push('0.3 w');
				lines.push(`${x + cw} ${headerPdfY} m ${x + cw} ${headerPdfY + HEAD_H} l S`);
			}
			x += cw;
		});

		cursorY -= HEAD_H;

		// ── Body rows ─────────────────────────────────────────────────────────
		bodyRows.forEach((row, ri) => {
			const rowPdfY = cursorY - LINE_H;
			const isAlt = ri % 2 === 1;

			// Alternate row fill
			if (isAlt) fillRect(MARGIN, rowPdfY, usableW, LINE_H, 245, 245, 245);

			x = MARGIN;
			row.forEach((cell, ci) => {
				const cw = colWidths[ci];
				const truncated = truncateToFit(cell ?? '', cw - PAD_X * 2, BODY_SIZE);
				lines.push('0.157 0.157 0.157 rg'); // ~rgb(40,40,40)
				drawText(truncated, x + PAD_X, rowPdfY + PAD_Y, BODY_SIZE, false);
				// Column divider
				if (ci < colCount - 1) {
					lines.push('0.85 0.85 0.85 RG');
					lines.push('0.3 w');
					lines.push(`${x + cw} ${rowPdfY} m ${x + cw} ${rowPdfY + LINE_H} l S`);
				}
				x += cw;
			});

			// Row bottom border
			lines.push('0.85 0.85 0.85 RG');
			lines.push('0.3 w');
			lines.push(`${MARGIN} ${rowPdfY} m ${MARGIN + usableW} ${rowPdfY} l S`);

			cursorY -= LINE_H;
		});

		// Outer border around entire table
		const tableTop = PAGE_H - MARGIN;
		const tableBottom = tableTop - totalTableH;
		strokeRect(MARGIN, tableBottom, usableW, totalTableH);

		// ── Assemble PDF binary ───────────────────────────────────────────────
		const stream = lines.join('\n');
		const streamBytes = new TextEncoder().encode(stream);
		const streamLen = streamBytes.length;

		// We build the PDF as a string for simplicity (all content is ASCII-safe)
		const parts: string[] = [];
		const offsets: number[] = [];
		let pos = 0;

		const emit = (s: string) => {
			parts.push(s);
			pos += s.length;
		};

		// Header
		emit('%PDF-1.4\n');

		// Object 1: Catalog
		offsets[1] = pos;
		emit('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

		// Object 2: Pages
		offsets[2] = pos;
		emit('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

		// Object 3: Page (landscape A4)
		offsets[3] = pos;
		emit(
			`3 0 obj\n<< /Type /Page /Parent 2 0 R\n` +
				`   /MediaBox [0 0 ${PAGE_W} ${PAGE_H}]\n` +
				`   /Contents 4 0 R\n` +
				`   /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >>\n` +
				`>>\nendobj\n`
		);

		// Object 4: Content stream
		offsets[4] = pos;
		emit(`4 0 obj\n<< /Length ${streamLen} >>\nstream\n` + stream + `\nendstream\nendobj\n`);

		// Object 5: Helvetica font
		offsets[5] = pos;
		emit(
			'5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica\n' +
				'   /Encoding /WinAnsiEncoding >>\nendobj\n'
		);

		// Object 6: Helvetica-Bold font
		offsets[6] = pos;
		emit(
			'6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold\n' +
				'   /Encoding /WinAnsiEncoding >>\nendobj\n'
		);

		// xref table
		const xrefPos = pos;
		emit(`xref\n0 7\n`);
		emit(`0000000000 65535 f \n`);
		for (let i = 1; i <= 6; i++) {
			emit(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
		}

		// Trailer
		emit(`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

		downloadBlob(parts.join(''), `${fileName}.pdf`, 'application/pdf');
	}

	// ── Shared download helper ────────────────────────────────────────────────
	function downloadBlob(content: string, name: string, mime: string) {
		const blob = new Blob([content], { type: mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = name;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline">
				<Download class="size-5" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-auto">
		<DropdownMenu.Item class="capitalize">
			<Button variant="default" onclick={generatedPdf}>
				<FileDown class="size-4 text-white dark:text-black" /> Download in PDF
			</Button>
		</DropdownMenu.Item>
		<DropdownMenu.Item class="capitalize">
			<Button variant="default" onclick={exportTableToCSV}>
				<Grid3x3 class="size-4 text-white dark:text-black" /> Export to CSV
			</Button>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
