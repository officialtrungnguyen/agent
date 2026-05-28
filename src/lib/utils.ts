import { clsx, type ClassValue } from 'clsx';
        import { twMerge } from 'tailwind-merge';

        export function cn(...inputs: ClassValue[]) {
          return twMerge(clsx(inputs));
        }

        export function uid(prefix: string): string {
          return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
        }

        export function copyToClipboard(value: string) {
          return navigator.clipboard.writeText(value);
        }

        export function downloadTextFile(filename: string, content: string) {
          const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = filename;
          anchor.click();
          URL.revokeObjectURL(url);
        }

        export function parseCsv(text: string): string[][] {
          return text
            .trim()
            .split(/\r?\n/)
            .map((line) => line.split(',').map((cell) => cell.trim()));
        }

        export function encodeCsv(rows: string[][]): string {
          return rows
            .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
            .join('\n');
        }

        export function fileToBase64(file: File): Promise<string> {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
        }

        export function formatNumber(value: number): string {
          return new Intl.NumberFormat('en-US').format(value);
        }

        export function formatPercent(value: number): string {
          return `${value.toFixed(0)}%`;
        }
