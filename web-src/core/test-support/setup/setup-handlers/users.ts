import { http, HttpResponse } from 'msw';

import type { TeamMembership } from '@/domains/teams';

export const userHandlers = [
  http.get('/api/users', async () =>
    HttpResponse.json(
      Array.from({ length: 10 }, (_, index) => ({
        Id: index + 1,
        Username: `user${index + 1}`,
        Role: 2,
        RoleName: '',
        AuthenticationMethod: '',
        Checked: false,
        EndpointAuthorizations: {},
        PortainerAuthorizations: {},
        UseCache: false,
        ThemeSettings: { color: 'auto', subtleUpgradeButton: false },
      }))
    )
  ),
  http.get<never, never, TeamMembership[]>(
    '/api/users/:userId/memberships',
    () => HttpResponse.json([])
  ),
];
