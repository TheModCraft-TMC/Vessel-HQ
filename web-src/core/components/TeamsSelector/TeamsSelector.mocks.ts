import { TeamViewModel } from '@/core/models/team';

export function createMockTeam(id: number, name: string): TeamViewModel {
  return {
    Id: id,
    Name: name,
    Checked: false,
  };
}
