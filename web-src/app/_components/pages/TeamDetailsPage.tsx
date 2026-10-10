'use client';

import { useRouter } from 'next/navigation';

import { Details } from '@/domains/teams/ItemView/Details';
import { TeamAssociationSelector } from '@/domains/teams/ItemView/TeamAssociationSelector';
import { useTeam, useTeamMemberships } from '@/domains/teams/queries';
import { usePublicSettings } from '@/domains/settings';
import { useUsers } from '@/domains/users';
import { useIsPureAdmin } from '@/react/hooks/useUser';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { PageHeader } from '@/ui/layouts/view-layout';

export function TeamDetailsHeader({ teamId }: { teamId: number }) {
  const router = useRouter();
  const teamQuery = useTeam(teamId, () => router.push('/teams'));

  return (
    <PageHeader
      title="Team details"
      breadcrumbs={[
        { label: 'Teams', link: '/teams' },
        { label: teamQuery.data?.Name || 'Team' },
      ]}
      reload
    />
  );
}

export function TeamDetailsContent({ teamId }: { teamId: number }) {
  const router = useRouter();
  const isPureAdmin = useIsPureAdmin();
  const teamQuery = useTeam(teamId, () => router.push('/teams'));
  const usersQuery = useUsers();
  const membershipsQuery = useTeamMemberships(teamId);
  const teamSyncQuery = usePublicSettings<boolean>({
    select: (settings) => settings.TeamSync,
  });

  if (!teamQuery.data) return null;

  return (
    <>
      {membershipsQuery.data && (
        <Details
          team={teamQuery.data}
          memberships={membershipsQuery.data}
          isAdmin={isPureAdmin}
        />
      )}
      {teamSyncQuery.data && <TeamSyncNotice />}
      {usersQuery.data && membershipsQuery.data && (
        <TeamAssociationSelector
          teamId={teamId}
          memberships={membershipsQuery.data}
          users={usersQuery.data}
          membershipChangesDisabled={teamSyncQuery.data}
        />
      )}
    </>
  );
}

function TeamSyncNotice() {
  return (
    <div className="row">
      <div className="col-sm-12">
        <TextTip color="orange">
          Team membership is managed by external authentication. Team leader
          roles can still be assigned here.
        </TextTip>
      </div>
    </div>
  );
}
