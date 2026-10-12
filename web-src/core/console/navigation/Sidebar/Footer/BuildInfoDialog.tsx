import clsx from 'clsx';
import {
  Database,
  GitCommit,
  Hash,
  Link as LinkIcon,
  Server,
  Tag,
  Variable,
  Wrench,
} from 'lucide-react';
import {
  useLayoutIdentity,
  useLayoutSystem,
} from '@console/layout/LayoutContext';

import { Button } from '@/ui/components/buttons';
import { Modal } from '@/ui/components/dialog';

import styles from './Footer.module.css';

export function BuildInfoDialog({ onClose }: { onClose(): void }) {
  const { isAdmin } = useLayoutIdentity();
  const { status, version } = useLayoutSystem();

  if (!status || !version) {
    return null;
  }

  const { Edition } = status;
  const { ServerVersion, DatabaseVersion, Build, Dependencies, Runtime } =
    version;

  return (
    <Modal onDismiss={onClose} aria-label="build-info-modal">
      <Modal.Header title={`Vessel HQ ${Edition}`} />
      <Modal.Body>
        <div className={styles.versionInfo}>
          <table>
            <tbody>
              <tr>
                <td>
                  <Server size="13" className="space-right" />
                  Server Version: {ServerVersion}
                </td>
                <td>
                  <Database size="13" className="space-right" />
                  Database Version: {DatabaseVersion}
                </td>
              </tr>
              <tr>
                <td>
                  <Hash size="13" className="space-right" />
                  CI Build Number: {Build.BuildNumber}
                </td>
                <td>
                  <Tag size="13" className="space-right" />
                  Image Tag: {Build.ImageTag}
                </td>
              </tr>
              <tr>
                <td>
                  <GitCommit size="13" className="space-right" />
                  Git Commit: {Build.GitCommit}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <InfoGroup icon={<Wrench size="13" />} label="Compilation tools">
          <span>Nodejs {Build.NodejsVersion}</span>
          <span>pnpm v{Build.PnpmVersion}</span>
          <span>Webpack v{Build.WebpackVersion}</span>
          <span>Go {Build.GoVersion}</span>
        </InfoGroup>
        <InfoGroup icon={<LinkIcon size="13" />} label="Dependencies">
          <span>Docker {Dependencies.DockerVersion}</span>
          <span>Helm {Dependencies.HelmVersion}</span>
          <span>Kubectl {Dependencies.KubectlVersion}</span>
          <span>Compose {Dependencies.ComposeVersion}</span>
        </InfoGroup>
        {isAdmin && Runtime.Env && (
          <InfoGroup icon={<Variable size="13" />} label="Environment Variables">
            {Runtime.Env.map((envVar) => (
              <code key={envVar}>{envVar}</code>
            ))}
          </InfoGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="w-full"
          onClick={onClose}
          data-cy="portainerBuildInfoModal-CloseButton"
        >
          Ok
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function InfoGroup({
  icon,
  label,
  children,
}: React.PropsWithChildren<{ icon: React.ReactNode; label: string }>) {
  return (
    <div className={clsx(styles.toolsList, 'mt-3')}>
      <span className="inline-flex items-center gap-1">
        {icon}
        {label}:
      </span>
      <div className={clsx(styles.tools, 'flex flex-wrap gap-2')}>{children}</div>
    </div>
  );
}
