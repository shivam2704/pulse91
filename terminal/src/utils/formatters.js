/**
 * Shared financial & UI formatting utilities for Pulse91 Terminal.
 * Ensures 100% consistent currency, range, and label formatting across all tables.
 */

export function formatINR(val, decimals = 2) {
  if (val === undefined || val === null || isNaN(Number(val))) return '—';
  const num = Number(val);
  const absFormatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return num < 0 ? `-₹${absFormatted}` : `₹${absFormatted}`;
}

export function formatBuyZone(entryRange, fallbackLtp) {
  if (entryRange && typeof entryRange === 'string') {
    const nums = entryRange.replace(/₹|,/g, '').match(/\d+(?:\.\d+)?/g);
    if (nums && nums.length >= 2) {
      return `${formatINR(nums[0])} – ${formatINR(nums[1])}`;
    }
    if (nums && nums.length === 1) {
      return formatINR(nums[0]);
    }
    return entryRange;
  }
  if (fallbackLtp) {
    return `${formatINR(fallbackLtp * 0.995)} – ${formatINR(fallbackLtp * 1.005)}`;
  }
  return '—';
}

export function formatHorizon(horizon) {
  if (!horizon) return '—';
  return String(horizon)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
