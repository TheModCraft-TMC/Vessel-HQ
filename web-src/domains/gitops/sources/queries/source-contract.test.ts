import {
  zGitOpsSourcesUpdateGitBody,
  zGitOpsSourcesTestByIdBody,
} from '@api/zod.gen';

it.each([zGitOpsSourcesUpdateGitBody, zGitOpsSourcesTestByIdBody])(
  'retains Vault overrides in the generated update and connection-test contracts',
  (schema) => {
    const payload = {
      name: 'Vault',
      address: 'https://vault.example.test',
      internalAddress: 'https://vault.internal.test',
      namespace: 'team',
      kvVersion: 2,
      tlsSkipVerify: false,
      authentication: { method: 'token', token: 'test-fixture-token' },
    };
    expect(schema.parse(payload)).toEqual(payload);
  }
);

it('retains Git update compatibility', () => {
  const payload = {
    url: 'https://example.test/repo',
    interval: '5m',
    authentication: { username: 'user', password: 'fixture' },
  };
  expect(zGitOpsSourcesUpdateGitBody.parse(payload)).toEqual(payload);
});
