import { describe, it, expect } from 'vitest';
import { formatDuration, formatFileSize } from '@/components/admin/speaking-forecast/SampleAudioUpload';

describe('SampleAudioUpload Helper Functions', () => {
  describe('formatDuration', () => {
    it('formats seconds into mm:ss', () => {
      expect(formatDuration(0)).toBe('00:00');
      expect(formatDuration(48)).toBe('00:48');
      expect(formatDuration(65)).toBe('01:05');
      expect(formatDuration(3600)).toBe('60:00');
    });

    it('handles undefined, null, or negative inputs gracefully', () => {
      expect(formatDuration(undefined)).toBe('00:00');
      expect(formatDuration(null as any)).toBe('00:00');
      expect(formatDuration(-10)).toBe('00:00');
      expect(formatDuration(NaN)).toBe('00:00');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes into KB and MB', () => {
      expect(formatFileSize(0)).toBe('0 KB');
      expect(formatFileSize(500 * 1024)).toBe('500.0 KB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10.0 MB');
    });

    it('handles invalid inputs gracefully', () => {
      expect(formatFileSize(undefined)).toBe('0 KB');
      expect(formatFileSize(NaN)).toBe('0 KB');
      expect(formatFileSize(-50)).toBe('0 KB');
    });
  });
});
