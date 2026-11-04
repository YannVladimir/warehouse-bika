import { describe, it, expect, vi, afterEach } from 'vitest';
import { statusMeta, STATUS_META, formatRelativeTime } from './documentDisplay';

describe('statusMeta', () => {
  it('returns the matching metadata for each known status', () => {
    expect(statusMeta('AVAILABLE').label).toBe('Available');
    expect(statusMeta('CHECKED_OUT').label).toBe('Checked Out');
    expect(statusMeta('MISSING').label).toBe('Missing');
  });

  // Documents current behavior rather than "fixing" it silently: an
  // unrecognized or missing status falls back to the AVAILABLE badge, which
  // could misleadingly show a document as available when its real status is
  // simply unexpected. Worth a deliberate "Unknown" state if this is ever hit
  // in practice.
  it('falls back to AVAILABLE for an unrecognized status', () => {
    expect(statusMeta('SOMETHING_NEW')).toBe(STATUS_META.AVAILABLE);
    expect(statusMeta(undefined)).toBe(STATUS_META.AVAILABLE);
  });
});

describe('formatRelativeTime', () => {
  const NOW = new Date('2026-01-01T12:00:00.000Z');

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an empty string for a missing timestamp', () => {
    expect(formatRelativeTime(null)).toBe('');
    expect(formatRelativeTime(undefined)).toBe('');
  });

  it('shows "just now" for timestamps under a minute old', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const thirtySecondsAgo = new Date(NOW.getTime() - 30_000).toISOString();

    expect(formatRelativeTime(thirtySecondsAgo)).toBe('just now');
  });

  it('shows minutes for timestamps under an hour old', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const fiveMinutesAgo = new Date(NOW.getTime() - 5 * 60_000).toISOString();

    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
  });

  it('shows hours for timestamps under a day old', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const threeHoursAgo = new Date(NOW.getTime() - 3 * 3_600_000).toISOString();

    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('shows days for anything older', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const twoDaysAgo = new Date(NOW.getTime() - 2 * 86_400_000).toISOString();

    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago');
  });
});
