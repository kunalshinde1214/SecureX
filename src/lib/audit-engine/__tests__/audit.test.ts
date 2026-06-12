import { expect, test, vi } from 'vitest';
import { runAudit } from '../index';

// Mock global fetch for DNS resolution
global.fetch = vi.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ Answer: [{ data: '1.2.3.4' }] })
  })
);

test('runAudit completes a scan and generates a report', async () => {
  const onProgress = vi.fn();
  const report = await runAudit('example.com', { depth: 'QUICK', checks: ['SSL_TLS'] }, onProgress);
  
  expect(report.target.url).toBe('https://example.com');
  expect(report.target.domain).toBe('example.com');
  expect(report.status).toBe('COMPLETE');
  expect(report.checkResults).toBeDefined();
  
  // Progress should have been called
  expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ type: 'check_start' }));
  expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ type: 'check_complete' }));
  expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ type: 'scan_complete' }));
});
