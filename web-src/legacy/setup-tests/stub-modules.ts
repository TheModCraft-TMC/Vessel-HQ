// this file takes care of stubbing modules that are not tested, like
// axios-progress-bar
// toastr

vi.mock('toastr');
vi.mock('axios-progress-bar', () => ({
  loadProgressBar() {},
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  useParams: () => ({}),
  usePathname: () => '/',
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));
