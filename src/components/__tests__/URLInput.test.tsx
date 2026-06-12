import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { URLInput } from '../URLInput';

test('URLInput renders and accepts input', async () => {
  const handleSubmit = vi.fn();
  render(<URLInput onSubmit={handleSubmit} loading={false} />);
  
  const input = screen.getByPlaceholderText(/Enter URL to audit/i);
  fireEvent.change(input, { target: { value: 'https://example.com' } });
  
  const button = screen.getByRole('button', { name: /Run Audit/i });
  fireEvent.click(button);
  
  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith('https://example.com', 'STANDARD');
  });
});

test('URLInput adds https:// automatically', async () => {
  const handleSubmit = vi.fn();
  render(<URLInput onSubmit={handleSubmit} loading={false} />);
  
  const input = screen.getByPlaceholderText(/Enter URL to audit/i);
  fireEvent.change(input, { target: { value: 'example.com' } });
  
  const button = screen.getByRole('button', { name: /Run Audit/i });
  fireEvent.click(button);
  
  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith('https://example.com', 'STANDARD');
  });
});
