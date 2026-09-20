import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@uirouter/react';
import { Plus, Trash2 } from 'lucide-react';

import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { NodeSelector } from '@/react/docker/agent/NodeSelector';
import { useApiVersion } from '@/react/docker/agent/queries/useApiVersion';
import { useIsSwarmAgent } from '@/react/docker/proxy/queries/useIsSwarmAgent';
import { useVolumePlugins } from '@/react/docker/proxy/queries/usePlugins';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { AccessControlForm } from '@/react/portainer/access-control/AccessControlForm';
import { applyResourceControl } from '@/react/portainer/access-control/access-control.service';
import {
  AccessControlFormData,
  ResourceControlOwnership,
} from '@/react/portainer/access-control/types';
import { defaultValues } from '@/react/portainer/access-control/utils';
import { withError } from '@/react-tools/react-query';

import { Button, LoadingButton } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';
import { SwitchField } from '@@/form-components/SwitchField';
import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';

import { queryKeys } from '../queries/query-keys';
import {
  createVolume,
  VolumeConfiguration,
} from '../queries/useCreateVolumeMutation';

interface DriverOption {
  name: string;
  value: string;
}

interface NfsSettings {
  enabled: boolean;
  address: string;
  mountPoint: string;
  version: 'NFS4' | 'NFS';
  options: string;
}

interface CifsSettings {
  enabled: boolean;
  address: string;
  share: string;
  version: '1.0' | '2.0' | '2.1' | '3.0';
  username: string;
  password: string;
}

interface CreateVolumeResponse {
  Portainer?: { ResourceControl?: { Id: number } };
}

export function CreateView() {
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();

  if (isLoading) {
    return null;
  }

  return <CreateVolumeForm isAdmin={isAdmin} userId={user.Id} />;
}

function CreateVolumeForm({
  isAdmin,
  userId,
}: {
  isAdmin: boolean;
  userId: number;
}) {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isSwarmAgent = useIsSwarmAgent();
  const apiVersionQuery = useApiVersion(environmentId);
  const pluginsQuery = useVolumePlugins(
    environmentId,
    (apiVersionQuery.data || 1) < 1.25
  );
  const [name, setName] = useState('');
  const [driver, setDriver] = useState('local');
  const [driverOptions, setDriverOptions] = useState<DriverOption[]>([]);
  const [nodeName, setNodeName] = useState('');
  const [nfs, setNfs] = useState<NfsSettings>({
    enabled: false,
    address: '',
    mountPoint: '',
    version: 'NFS4',
    options: 'rw,noatime,rsize=8192,wsize=8192,tcp,timeo=14',
  });
  const [cifs, setCifs] = useState<CifsSettings>({
    enabled: false,
    address: '',
    share: '',
    version: '2.0',
    username: '',
    password: '',
  });
  const [accessControl, setAccessControl] = useState<AccessControlFormData>(
    () => defaultValues(isAdmin, userId)
  );
  const createMutation = useMutation(
    handleCreate,
    withError('An error occurred during volume creation')
  );
  const drivers = pluginsQuery.data || [];
  const networkSettingsValid =
    (!nfs.enabled || (nfs.address && nfs.mountPoint && nfs.options)) &&
    (!cifs.enabled ||
      (cifs.address && cifs.share && cifs.username && cifs.password));

  return (
    <>
      <PageHeader
        title="Create volume"
        breadcrumbs={[
          { label: 'Volumes', link: 'docker.volumes' },
          'Add volume',
        ]}
      />
      <Widget>
        <WidgetBody>
          <form className="form-horizontal" onSubmit={submit}>
            <FormControl label="Name" inputId="volume_name">
              <Input
                id="volume_name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. myVolume"
                data-cy="volume-name-input"
              />
            </FormControl>

            <FormSection title="Driver configuration">
              <FormControl label="Driver" inputId="volume_driver">
                {drivers.length > 0 ? (
                  <select
                    id="volume_driver"
                    className="form-control"
                    value={driver}
                    onChange={(event) => setDriver(event.target.value)}
                    data-cy="volume-driver-select"
                  >
                    {drivers.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="volume_driver"
                    value={driver}
                    onChange={(event) => setDriver(event.target.value)}
                    placeholder="e.g. driverName"
                    data-cy="volume-driver-input"
                  />
                )}
              </FormControl>

              {!nfs.enabled && !cifs.enabled && (
                <div className="form-group">
                  <div className="col-sm-12">
                    <div className="mb-2 flex items-center gap-2">
                      <span>Driver options</span>
                      <Button
                        type="button"
                        size="xsmall"
                        color="secondary"
                        icon={Plus}
                        onClick={() =>
                          setDriverOptions((options) => [
                            ...options,
                            { name: '', value: '' },
                          ])
                        }
                        data-cy="volume-add-driver-option"
                      >
                        Add driver option
                      </Button>
                    </div>
                    {driverOptions.map((option, index) => (
                      <div className="mb-2 flex items-center gap-2" key={index}>
                        <Input
                          value={option.name}
                          onChange={(event) =>
                            updateDriverOption(
                              index,
                              'name',
                              event.target.value
                            )
                          }
                          placeholder="e.g. mountpoint"
                          data-cy="driver-option-name-input"
                        />
                        <Input
                          value={option.value}
                          onChange={(event) =>
                            updateDriverOption(
                              index,
                              'value',
                              event.target.value
                            )
                          }
                          placeholder="e.g. /path/on/host"
                          data-cy="driver-option-value-input"
                        />
                        <Button
                          type="button"
                          color="secondary"
                          icon={Trash2}
                          onClick={() =>
                            setDriverOptions((options) =>
                              options.filter(
                                (_, itemIndex) => itemIndex !== index
                              )
                            )
                          }
                          data-cy={`volume-remove-driver-option-${index}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {driver === 'local' && (
                <>
                  <div className="form-group">
                    <div className="col-sm-12">
                      <SwitchField
                        checked={nfs.enabled}
                        onChange={(enabled) => {
                          setNfs((value) => ({ ...value, enabled }));
                          if (enabled) {
                            setCifs((value) => ({ ...value, enabled: false }));
                          }
                        }}
                        label="Use NFS volume"
                        data-cy="volume-use-nfs"
                      />
                      {nfs.enabled && (
                        <p className="small text-muted mt-2">
                          Ensure <code>nfs-utils</code> is installed on your
                          hosts.
                        </p>
                      )}
                    </div>
                  </div>
                  {nfs.enabled && <NfsFields value={nfs} onChange={setNfs} />}

                  <div className="form-group">
                    <div className="col-sm-12">
                      <SwitchField
                        checked={cifs.enabled}
                        onChange={(enabled) => {
                          setCifs((value) => ({ ...value, enabled }));
                          if (enabled) {
                            setNfs((value) => ({ ...value, enabled: false }));
                          }
                        }}
                        label="Use CIFS volume"
                        data-cy="volume-use-cifs"
                      />
                      {cifs.enabled && (
                        <p className="small text-muted mt-2">
                          Ensure <code>cifs-utils</code> is installed on your
                          hosts.
                        </p>
                      )}
                    </div>
                  </div>
                  {cifs.enabled && (
                    <CifsFields value={cifs} onChange={setCifs} />
                  )}
                </>
              )}
            </FormSection>

            {isSwarmAgent && driver === 'local' && (
              <FormSection title="Deployment">
                <NodeSelector value={nodeName} onChange={setNodeName} />
              </FormSection>
            )}

            <AccessControlForm
              values={accessControl}
              onChange={setAccessControl}
              environmentId={environmentId}
            />

            <FormSection title="Actions">
              <LoadingButton
                loadingText="Creating volume..."
                isLoading={createMutation.isLoading}
                disabled={!driver || !networkSettingsValid}
                className="!ml-0"
                data-cy="volume-create-button"
              >
                Create the volume
              </LoadingButton>
            </FormSection>
          </form>
        </WidgetBody>
      </Widget>
    </>
  );

  function updateDriverOption(
    index: number,
    field: keyof DriverOption,
    value: string
  ) {
    setDriverOptions((options) =>
      options.map((option, itemIndex) =>
        itemIndex === index ? { ...option, [field]: value } : option
      )
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (
      accessControl.ownership === ResourceControlOwnership.RESTRICTED &&
      !accessControl.authorizedUsers.length &&
      !accessControl.authorizedTeams.length
    ) {
      notifyError(
        'Unable to create volume',
        new Error('Select at least one user or team for restricted access.')
      );
      return;
    }
    createMutation.mutate();
  }

  async function handleCreate() {
    const configuration: VolumeConfiguration = {
      Name: name || undefined,
      Driver: driver,
      DriverOpts: buildDriverOptions(driverOptions, nfs, cifs),
    };
    const response = (await createVolume(environmentId, configuration, {
      nodeName,
    })) as CreateVolumeResponse;
    const resourceControlId = response.Portainer?.ResourceControl?.Id;
    if (resourceControlId) {
      await applyResourceControl(accessControl, resourceControlId);
    }
    await queryClient.invalidateQueries(queryKeys.base(environmentId));
    notifySuccess('Success', 'Volume successfully created');
    router.stateService.go('docker.volumes');
  }
}

function NfsFields({
  value,
  onChange,
}: {
  value: NfsSettings;
  onChange: (value: NfsSettings) => void;
}) {
  return (
    <FormSection title="NFS settings">
      <TextField
        id="nfs_address"
        label="Address"
        value={value.address}
        onChange={(address) => onChange({ ...value, address })}
        placeholder="e.g. my.nfs-server.com"
        dataCy="nfs-address-input"
        required
      />
      <FormControl label="NFS version" inputId="nfs_version">
        <select
          id="nfs_version"
          className="form-control"
          value={value.version}
          onChange={(event) =>
            onChange({
              ...value,
              version: event.target.value as NfsSettings['version'],
            })
          }
          data-cy="nfs-version-select"
        >
          <option value="NFS4">NFS4</option>
          <option value="NFS">NFS</option>
        </select>
      </FormControl>
      <TextField
        id="nfs_mountpoint"
        label="Mount point"
        value={value.mountPoint}
        onChange={(mountPoint) => onChange({ ...value, mountPoint })}
        placeholder="e.g. /export/share"
        dataCy="nfs-mountpoint-input"
        required
      />
      <TextField
        id="nfs_options"
        label="Options"
        value={value.options}
        onChange={(options) => onChange({ ...value, options })}
        placeholder="e.g. rw,noatime,tcp"
        dataCy="nfs-options-input"
        required
      />
    </FormSection>
  );
}

function CifsFields({
  value,
  onChange,
}: {
  value: CifsSettings;
  onChange: (value: CifsSettings) => void;
}) {
  return (
    <FormSection title="CIFS settings">
      <TextField
        id="cifs_address"
        label="Address"
        value={value.address}
        onChange={(address) => onChange({ ...value, address })}
        placeholder="e.g. my.cifs-server.com"
        dataCy="cifs-address-input"
        required
      />
      <TextField
        id="cifs_share"
        label="Share"
        value={value.share}
        onChange={(share) => onChange({ ...value, share })}
        placeholder="e.g. /myshare"
        dataCy="cifs-share-input"
        required
      />
      <FormControl label="CIFS version" inputId="cifs_version">
        <select
          id="cifs_version"
          className="form-control"
          value={value.version}
          onChange={(event) =>
            onChange({
              ...value,
              version: event.target.value as CifsSettings['version'],
            })
          }
          data-cy="cifs-version-select"
        >
          <option value="1.0">CIFS v1.0 (Windows XP / Server 2003)</option>
          <option value="2.0">CIFS v2.0 (Windows Vista / Server 2008)</option>
          <option value="2.1">CIFS v2.1 (Windows 7 / Server 2008 R2)</option>
          <option value="3.0">CIFS 3.0 (Windows 8 / Server 2012+)</option>
        </select>
      </FormControl>
      <TextField
        id="cifs_username"
        label="Username"
        value={value.username}
        onChange={(username) => onChange({ ...value, username })}
        dataCy="cifs-username-input"
        required
      />
      <FormControl label="Password" inputId="cifs_password" required>
        <Input
          id="cifs_password"
          type="password"
          value={value.password}
          onChange={(event) =>
            onChange({ ...value, password: event.target.value })
          }
          data-cy="cifs-password-input"
        />
      </FormControl>
    </FormSection>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  dataCy,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dataCy: string;
  required?: boolean;
}) {
  return (
    <FormControl label={label} inputId={id} required={required}>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        data-cy={dataCy}
      />
    </FormControl>
  );
}

function buildDriverOptions(
  options: DriverOption[],
  nfs: NfsSettings,
  cifs: CifsSettings
) {
  if (nfs.enabled) {
    const mountPoint = nfs.mountPoint.includes(':')
      ? nfs.mountPoint
      : `:${nfs.mountPoint}`;
    const nfsOptions = `${nfs.address},${nfs.options}${
      nfs.version === 'NFS4' ? ',nfsvers=4' : ''
    }`;
    return {
      type: 'nfs',
      o: `addr=${nfsOptions}`,
      device: mountPoint,
    };
  }

  if (cifs.enabled) {
    const share = cifs.share.replaceAll('\\', '/').replace(/^\/?/, '/');
    return {
      type: 'cifs',
      device: `//${cifs.address}${share}`,
      o: `addr=${cifs.address},username=${cifs.username},password=${cifs.password},vers=${cifs.version}`,
    };
  }

  return Object.fromEntries(
    options
      .filter((option) => option.name)
      .map((option) => [option.name, option.value])
  );
}
