import { MEDUSA_BACKEND_URL } from './config';

const PLACEHOLDER_SVG = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">' +
  '<rect width="300" height="300" fill="#111"/>' +
  '<text x="150" y="150" font-family="sans-serif" font-size="16" fill="#fff" text-anchor="middle" dominant-baseline="middle">Car Tunez</text>' +
  '</svg>'
);

export function formatPrice(amount: number): string {
  const rupees = amount / 100;
  return `\u20B9${rupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function imageUrl(url: string | null | undefined): string {
  if (!url) return PLACEHOLDER_SVG;
  if (url.startsWith('http')) return url;
  return `${MEDUSA_BACKEND_URL}${url}`;
}
