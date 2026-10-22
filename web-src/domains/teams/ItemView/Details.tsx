import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { Widget } from '@/ui/components/Widget';

import { Team, TeamMembership, TeamRole } from '../types';
import { useDeleteTeamMutation } from '../queries/useDeleteTeamMutation';

interface Props {
  team: Team;
  memberships: TeamMembership[];
  isAdmin: boolean;
}

export function Details({ team, memberships, isAdmin }: Props) {
  const deleteMutation = useDeleteTeamMutation();
  const router = useRouter();
  const leaderCount = memberships.filter(
    (m) => m.Role === TeamRole.Leader
  ).length;

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-xs-12">
        <Widget>
          <Widget.Title title="Team details" icon={Users} />

          <Widget.Body className="no-padding">
            <table className="table">
              <tbody>
                <tr>
                  <th scope="row" className="font-normal">
                    Name
                  </th>
                  <td>
                    <div className="flex gap-2">
                      {team.Name}
                      {isAdmin && (
                        <DeleteButton
                          size="xsmall"
                          onConfirmed={handleDeleteClick}
                          confirmMessage="Do you want to delete this team? Users in this team will not be deleted."
                          data-cy={`delete-team-${team.Name}`}
                        >
                          Delete this team
                        </DeleteButton>
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="font-normal">
                    Leaders
                  </th>
                  <td>{leaderCount}</td>
                </tr>
                <tr>
                  <th scope="row" className="font-normal">
                    Total users in team
                  </th>
                  <td>{memberships.length}</td>
                </tr>
              </tbody>
            </table>
          </Widget.Body>
        </Widget>
      </div>
    </div>
  );

  async function handleDeleteClick() {
    router.push('/teams');
    deleteMutation.mutate(team.Id);
  }
}
