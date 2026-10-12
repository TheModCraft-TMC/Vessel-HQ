import { notificationsStore } from './notifications-store';
import { notifyError, notifySuccess, notifyWarning } from './notifications';

const userId = 1;
let restoreConsole: () => void;

beforeEach(() => {
  localStorage.setItem('USER_ID', String(userId));
  notificationsStore.getState().clearUserNotifications(userId);
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  restoreConsole = () => errorSpy.mockRestore();
});

afterEach(() => {
  restoreConsole();
  localStorage.removeItem('USER_ID');
});

it('records a success notification', () => {
  notifySuccess('title', 'text');

  expect(latestNotification()).toMatchObject({
    title: 'title',
    details: 'text',
    type: 'success',
  });
});

it('records an Error message', () => {
  notifyError('title', new Error('message'), 'fallback');

  expect(latestNotification()).toMatchObject({
    title: 'title',
    details: 'message',
    type: 'error',
  });
});

it('records the fallback when no error is supplied', () => {
  notifyError('title', undefined, 'fallback');

  expect(latestNotification()).toMatchObject({
    title: 'title',
    details: 'fallback',
    type: 'error',
  });
});

it.each([
  'Invalid credentials',
  'Only initial admin is allowed to login without oauth',
])('records the server authentication reason: %s', (message) => {
  notifyError('Failure', {
    message: 'Request failed with status code 422',
    response: { status: 422, data: { message, details: 'Unauthorized' } },
  });

  expect(latestNotification()).toMatchObject({
    title: 'Failure',
    details: message,
    type: 'error',
  });
});

it('records a warning notification', () => {
  notifyWarning('title', 'text');

  expect(latestNotification()).toMatchObject({
    title: 'title',
    details: 'text',
    type: 'warning',
  });
});

function latestNotification() {
  return notificationsStore.getState().userNotifications[userId][0];
}
