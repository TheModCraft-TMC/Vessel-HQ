import { vi } from 'vitest';

const toastr = {
  options: {},
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
};

export default toastr;
