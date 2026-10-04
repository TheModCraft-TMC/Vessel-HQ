import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';
import { Plus, Trash2 } from 'lucide-react';

import { NodeViewModel } from '@/domains/swarm';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import { NodeSelector } from '@/react/docker/agent/NodeSelector';
import { useNodes } from '@/react/docker/proxy/queries/nodes/useNodes';
import { useInfo } from '@/react/docker/proxy/queries/useInfo';
import { useNetworkPlugins } from '@/react/docker/proxy/queries/usePlugins';
import { useVersion } from '@/react/docker/proxy/queries/useVersion';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { AccessControlForm } from '@/react/portainer/access-control/AccessControlForm';
import { applyResourceControl } from '@/react/portainer/access-control/access-control.service';
import {
  AccessControlFormData,
  ResourceControlOwnership,
} from '@/react/portainer/access-control/types';
import { defaultValues } from '@/react/portainer/access-control/utils';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import { withError } from '@/core/query';
import { Button, LoadingButton } from '@/ui/components/buttons';
import { FormControl } from '@/ui/components/forms/FormControl';
import { FormSection } from '@/ui/components/forms/FormSection';
import { Input } from '@/ui/components/forms/Input';
import { SwitchField } from '@/ui/components/forms/SwitchField';
import { PageHeader } from '@/ui/layouts/view-layout';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { createNetwork } from '@/domains/networks/queries/useCreateNetworkMutation';
import { queryKeys } from '@/domains/networks/queries/queryKeys';
import { DockerNetwork } from '@/domains/networks/models/network';
import { IPConfig as IPAMConfig } from '@/domains/networks/models/network';
import { useNetworks } from '@/domains/networks/queries/useNetworks';
import { MacvlanNodesSelector } from '@/domains/networks/components/NetworkCreate/MacvlanNodesSelector/MacvlanNodesSelector';
import { getOptions } from '@/domains/networks/components/NetworkCreate/macvlanOptions';

import { WidgetBody } from '@@/Widget/WidgetBody';
import { Widget } from '@@/Widget';
import { BoxSelector } from '@@/BoxSelector';

type KeyValue = { name: string; value: string };
type IpSettings = {
  subnet: string;
  gateway: string;
  ipRange: string;
  auxiliaryAddresses: string[];
};
type ConfigNetwork = DockerNetwork & {
  ConfigOnly?: boolean;
  NodeName?: string;
};
type CreateResponse = {
  Portainer?: { ResourceControl?: { Id: number } };
};

const emptyIpSettings: IpSettings = {
  subnet: '',
  gateway: '',
  ipRange: '',
  auxiliaryAddresses: [],
};

export function CreateView() {
  const { user } = useCurrentUser();
  const { isAdmin, isLoading } = useIsEdgeAdmin();

  if (isLoading) {
    return null;
  }

  return <CreateNetworkForm isAdmin={isAdmin} userId={user.Id} />;
}

export function CreateNetworkForm({
  isAdmin,
  userId,
  showHeader = true,
}: {
  isAdmin: boolean;
  userId: number;
  showHeader?: boolean;
}) {
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();
  const infoQuery = useInfo(environmentId);
  const versionQuery = useVersion(environmentId);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const environment = environmentQuery.data;
  const isAgent = Boolean(environment && isAgentEnvironment(environment.Type));
  const isSwarm = Boolean(infoQuery.data?.Swarm?.NodeID);
  const apiVersion = Number.parseFloat(versionQuery.data?.ApiVersion || '0');
  const pluginsQuery = useNetworkPlugins(environmentId, apiVersion < 1.25);
  const nodesQuery = useNodes(environmentId, {
    enabled: isSwarm && isAgent,
  });
  const networksQuery = useNetworks(environmentId, {
    local: false,
    swarm: false,
    swarmAttachable: false,
  });
  const availableNetworks = (networksQuery.data || []).filter(
    (network) => (network as ConfigNetwork).ConfigOnly
  ) as ConfigNetwork[];
  const nodes = useMemo(
    () => nodesQuery.data?.map((node) => new NodeViewModel(node)),
    [nodesQuery.data]
  );
  const drivers = (pluginsQuery.data || []).filter(
    (item) => item !== 'host' && item !== 'null'
  );
  const [name, setName] = useState('');
  const [driver, setDriver] = useState('bridge');
  const [driverOptions, setDriverOptions] = useState<KeyValue[]>([]);
  const [labels, setLabels] = useState<KeyValue[]>([]);
  const [ipv4, setIpv4] = useState<IpSettings>(emptyIpSettings);
  const [ipv6, setIpv6] = useState<IpSettings>(emptyIpSettings);
  const [internal, setInternal] = useState(false);
  const [attachable, setAttachable] = useState(false);
  const [nodeName, setNodeName] = useState('');
  const onNodeNameChange = useCallback((value: string) => {
    setNodeName(value);
  }, []);
  const [macvlanScope, setMacvlanScope] = useState<'local' | 'swarm'>('local');
  const [parentNetworkCard, setParentNetworkCard] = useState('');
  const [selectedConfigName, setSelectedConfigName] = useState('');
  const [selectedNodes, setSelectedNodes] = useState<NodeViewModel[]>([]);
  const [accessControl, setAccessControl] = useState<AccessControlFormData>(
    () => defaultValues(isAdmin, userId)
  );
  const createMutation = useMutation(handleCreate, {
    ...withError('An error occurred during network creation'),
    onSuccess: async () => {
      await queryClient.invalidateQueries(queryKeys.base(environmentId));
      notifySuccess('Success', 'Network successfully created');
      router.push(buildHref('/:endpointId/docker/networks', {}, pathname));
    },
  });
  const selectedConfig = availableNetworks.find(
    (network) => network.Name === selectedConfigName
  );
  const isMacvlan = driver === 'macvlan';
  const isMacvlanConfig = isMacvlan && macvlanScope === 'local';
  const isMacvlanDeploy = isMacvlan && macvlanScope === 'swarm';
  const invalidAuxiliaryAddress =
    ipv4.auxiliaryAddresses.some(
      (address) =>
        Boolean(ipv4.gateway) && auxiliaryAddressValue(address) === ipv4.gateway
    ) ||
    ipv6.auxiliaryAddresses.some(
      (address) =>
        Boolean(ipv6.gateway) && auxiliaryAddressValue(address) === ipv6.gateway
    );
  const macvlanValid =
    !isMacvlan ||
    (isMacvlanConfig &&
      Boolean(parentNetworkCard) &&
      (!isAgent || !isSwarm || selectedNodes.length > 0)) ||
    (isMacvlanDeploy && Boolean(selectedConfig));
  const canCreate = Boolean(name) && macvlanValid && !invalidAuxiliaryAddress;

  return (
    <>
      {showHeader && (
        <PageHeader
          title="Create network"
          breadcrumbs={[
            { label: 'Networks', link: '/:endpointId/docker/networks' },
            'Add network',
          ]}
        />
      )}
      <Widget>
        <WidgetBody>
          <form
            className="form-horizontal"
            onSubmit={(event) => {
              event.preventDefault();
              if (
                accessControl.ownership ===
                  ResourceControlOwnership.RESTRICTED &&
                !accessControl.authorizedUsers.length &&
                !accessControl.authorizedTeams.length
              ) {
                notifyError(
                  'Unable to create network',
                  new Error(
                    'Select at least one user or team for restricted access.'
                  )
                );
                return;
              }
              createMutation.mutate();
            }}
          >
            <FormControl label="Name" inputId="network_name" required>
              <Input
                id="network_name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. myNetwork"
                data-cy="network-name-input"
              />
            </FormControl>

            <FormSection title="Driver configuration">
              <FormControl label="Driver" inputId="network_driver">
                {drivers.length ? (
                  <select
                    id="network_driver"
                    className="form-control"
                    value={driver}
                    onChange={(event) => setDriver(event.target.value)}
                    data-cy="network-driver-select"
                  >
                    {drivers.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="network_driver"
                    value={driver}
                    onChange={(event) => setDriver(event.target.value)}
                    placeholder="e.g. driverName"
                    data-cy="network-driver-input"
                  />
                )}
              </FormControl>
              <KeyValueList
                title="Driver options"
                value={driverOptions}
                onChange={setDriverOptions}
                namePlaceholder="e.g. com.docker.network.bridge.enable_icc"
                valuePlaceholder="e.g. true"
                dataCy="network-driver-option"
              />
            </FormSection>

            {isMacvlan && (
              <FormSection title="Macvlan configuration">
                <TextTip>
                  Create a MACVLAN configuration first, then deploy a network
                  from that configuration.
                </TextTip>
                <BoxSelector<'local' | 'swarm'>
                  radioName="macvlan-scope"
                  value={macvlanScope}
                  onChange={setMacvlanScope}
                  options={getOptions(availableNetworks.length > 0)}
                  slim
                />
                {isMacvlanConfig && (
                  <>
                    <FormControl
                      label="Parent network card"
                      inputId="network_card"
                      required
                    >
                      <Input
                        id="network_card"
                        value={parentNetworkCard}
                        onChange={(event) =>
                          setParentNetworkCard(event.target.value)
                        }
                        placeholder="e.g. eth0 or ens160"
                        data-cy="macvlan-network-card-input"
                      />
                    </FormControl>
                    {isAgent && isSwarm && (
                      <MacvlanNodesSelector
                        dataset={nodes}
                        isIpColumnVisible={apiVersion >= 1.25}
                        haveAccessToNode={isAdmin}
                        value={selectedNodes}
                        onChange={setSelectedNodes}
                      />
                    )}
                  </>
                )}
                {isMacvlanDeploy && (
                  <FormControl
                    label="Configuration"
                    inputId="config_network"
                    required
                  >
                    <select
                      id="config_network"
                      className="form-control"
                      value={selectedConfigName}
                      onChange={(event) =>
                        setSelectedConfigName(event.target.value)
                      }
                      data-cy="macvlanConfigNetworkSelector"
                    >
                      <option value="">Select a network</option>
                      {availableNetworks.map((network) => (
                        <option key={network.Id} value={network.Name}>
                          {network.Name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                )}
              </FormSection>
            )}

            {!isMacvlanDeploy && (
              <IpSection version="IPv4" value={ipv4} onChange={setIpv4} />
            )}
            {(driver === 'bridge' ||
              driver === 'ipvlan' ||
              isMacvlanConfig) && (
              <IpSection version="IPv6" value={ipv6} onChange={setIpv6} />
            )}

            <FormSection title="Advanced configuration">
              <KeyValueList
                title="Labels"
                value={labels}
                onChange={setLabels}
                namePlaceholder="e.g. com.example.foo"
                valuePlaceholder="e.g. bar"
                dataCy="network-label"
              />
              {!isMacvlanConfig && (
                <>
                  <SwitchRow
                    label="Isolated network"
                    tooltip="An isolated network has no inbound or outbound communications."
                    checked={internal}
                    onChange={setInternal}
                    dataCy="network-internal"
                  />
                  <SwitchRow
                    label="Enable manual container attachment"
                    checked={attachable}
                    onChange={setAttachable}
                    dataCy="network-attachable"
                  />
                </>
              )}
            </FormSection>

            {isAgent && isSwarm && !['overlay', 'macvlan'].includes(driver) && (
              <FormSection title="Deployment">
                <NodeSelector value={nodeName} onChange={onNodeNameChange} />
              </FormSection>
            )}

            <AccessControlForm
              values={accessControl}
              onChange={setAccessControl}
              environmentId={environmentId}
            />

            <FormSection title="Actions">
              <LoadingButton
                loadingText="Creating network..."
                isLoading={createMutation.isLoading}
                disabled={!canCreate}
                data-cy="network-create-button"
              >
                Create the network
              </LoadingButton>
            </FormSection>
          </form>
        </WidgetBody>
      </Widget>
    </>
  );

  async function handleCreate() {
    const baseConfig = {
      Name: name,
      CheckDuplicate: true,
      Driver: driver,
      Internal: internal,
      Attachable: attachable,
      EnableIPv6: Boolean(ipv6.subnet),
      IPAM: {
        Driver: 'default',
        Config: [toIpamConfig(ipv4), toIpamConfig(ipv6)].filter(
          (item): item is IPAMConfig => Boolean(item)
        ),
      },
      Options: Object.fromEntries(
        driverOptions
          .filter((item) => item.name)
          .map((item) => [item.name, item.value])
      ),
      Labels: Object.fromEntries(
        labels
          .filter((item) => item.name)
          .map((item) => [item.name, item.value])
      ),
    };
    const targets =
      isMacvlanConfig && isAgent && isSwarm
        ? selectedNodes.map((node) => node.Hostname)
        : [isMacvlanDeploy ? selectedConfig?.NodeName || '' : nodeName];

    await Promise.all(
      targets.map(async (targetNode) => {
        const config = isMacvlanConfig
          ? {
              ...baseConfig,
              Internal: false,
              Attachable: false,
              ConfigOnly: true as const,
              Options: {
                ...baseConfig.Options,
                parent: parentNetworkCard,
              },
            }
          : isMacvlanDeploy && selectedConfig
            ? {
                ...baseConfig,
                ConfigFrom: { Network: selectedConfig.Name },
                Scope: isSwarm ? ('swarm' as const) : ('local' as const),
              }
            : baseConfig;
        const response = (await createNetwork(environmentId, config, {
          nodeName: targetNode || undefined,
          agentManagerOperation: isAgent && isSwarm && driver === 'overlay',
        })) as CreateResponse;
        const resourceControlId = response.Portainer?.ResourceControl?.Id;
        if (resourceControlId) {
          await applyResourceControl(accessControl, resourceControlId);
        }
      })
    );
  }
}

function IpSection({
  version,
  value,
  onChange,
}: {
  version: 'IPv4' | 'IPv6';
  value: IpSettings;
  onChange(value: IpSettings): void;
}) {
  const prefix = version.toLowerCase();
  return (
    <FormSection title={`${version} Network configuration`}>
      <FormControl label="Subnet" inputId={`${prefix}_network_subnet`}>
        <Input
          id={`${prefix}_network_subnet`}
          value={value.subnet}
          onChange={(event) =>
            onChange({ ...value, subnet: event.target.value })
          }
          placeholder={
            version === 'IPv4' ? 'e.g. 172.20.0.0/16' : 'e.g. 2001:db8::/48'
          }
          data-cy={`network-${prefix}-subnet-input`}
        />
      </FormControl>
      <FormControl label="Gateway" inputId={`${prefix}_network_gateway`}>
        <Input
          id={`${prefix}_network_gateway`}
          value={value.gateway}
          onChange={(event) =>
            onChange({ ...value, gateway: event.target.value })
          }
          placeholder={
            version === 'IPv4' ? 'e.g. 172.20.10.11' : 'e.g. 2001:db8::1'
          }
          data-cy={`network-${prefix}-gateway-input`}
        />
      </FormControl>
      <FormControl label="IP range" inputId={`${prefix}_network_iprange`}>
        <Input
          id={`${prefix}_network_iprange`}
          value={value.ipRange}
          onChange={(event) =>
            onChange({ ...value, ipRange: event.target.value })
          }
          placeholder={
            version === 'IPv4' ? 'e.g. 172.20.10.128/25' : 'e.g. 2001:db8::/64'
          }
          data-cy={`network-${prefix}-iprange-input`}
        />
      </FormControl>
      {value.auxiliaryAddresses.map((address, index) => {
        const invalid =
          Boolean(value.gateway) &&
          auxiliaryAddressValue(address) === value.gateway;
        return (
          <div
            className="form-group"
            key={`${index}-${value.auxiliaryAddresses.length}`}
          >
            <label
              htmlFor={`${prefix}_network_auxaddr_${index}`}
              className="col-sm-2 col-lg-1 control-label text-left"
            >
              Exclude IP
            </label>
            <div className="col-sm-9 col-lg-10">
              <Input
                id={`${prefix}_network_auxaddr_${index}`}
                value={address}
                onChange={(event) =>
                  onChange({
                    ...value,
                    auxiliaryAddresses: value.auxiliaryAddresses.map(
                      (item, itemIndex) =>
                        itemIndex === index ? event.target.value : item
                    ),
                  })
                }
                placeholder={
                  version === 'IPv4'
                    ? 'e.g. my-router=172.20.10.129'
                    : 'e.g. my-router=2001:db8::1'
                }
                data-cy={`network-${prefix}-auxaddr-input`}
              />
              {invalid && (
                <div className="small text-warning">
                  Excluded IP cannot be the same as the gateway.
                </div>
              )}
            </div>
            <div className="col-sm-1">
              <Button
                color="dangerlight"
                icon={Trash2}
                onClick={() =>
                  onChange({
                    ...value,
                    auxiliaryAddresses: value.auxiliaryAddresses.filter(
                      (_, itemIndex) => itemIndex !== index
                    ),
                  })
                }
                data-cy={`network-${prefix}-remove-auxaddr-${index}`}
              />
            </div>
          </div>
        );
      })}
      <Button
        color="link"
        icon={Plus}
        onClick={() =>
          onChange({
            ...value,
            auxiliaryAddresses: [...value.auxiliaryAddresses, ''],
          })
        }
        data-cy={`network-${prefix}-add-auxaddr`}
      >
        Add excluded IP
      </Button>
    </FormSection>
  );
}

function KeyValueList({
  title,
  value,
  onChange,
  namePlaceholder,
  valuePlaceholder,
  dataCy,
}: {
  title: string;
  value: KeyValue[];
  onChange(value: KeyValue[]): void;
  namePlaceholder: string;
  valuePlaceholder: string;
  dataCy: string;
}) {
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <label className="control-label text-left">{title}</label>
        {value.map((item, index) => (
          <div className="mt-1 flex gap-2" key={`${index}-${value.length}`}>
            <Input
              value={item.name}
              onChange={(event) =>
                onChange(
                  value.map((current, itemIndex) =>
                    itemIndex === index
                      ? { ...current, name: event.target.value }
                      : current
                  )
                )
              }
              placeholder={namePlaceholder}
              data-cy={`${dataCy}-name-input`}
            />
            <Input
              value={item.value}
              onChange={(event) =>
                onChange(
                  value.map((current, itemIndex) =>
                    itemIndex === index
                      ? { ...current, value: event.target.value }
                      : current
                  )
                )
              }
              placeholder={valuePlaceholder}
              data-cy={`${dataCy}-value-input`}
            />
            <Button
              color="dangerlight"
              icon={Trash2}
              onClick={() =>
                onChange(value.filter((_, itemIndex) => itemIndex !== index))
              }
              data-cy={`${dataCy}-remove-${index}`}
            />
          </div>
        ))}
        <Button
          color="link"
          icon={Plus}
          onClick={() => onChange([...value, { name: '', value: '' }])}
          data-cy={`${dataCy}-add`}
        >
          Add {title.toLowerCase().replace(/s$/, '')}
        </Button>
      </div>
    </div>
  );
}

function SwitchRow({
  label,
  tooltip,
  checked,
  onChange,
  dataCy,
}: {
  label: string;
  tooltip?: string;
  checked: boolean;
  onChange(value: boolean): void;
  dataCy: string;
}) {
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <SwitchField
          label={label}
          tooltip={tooltip}
          checked={checked}
          onChange={onChange}
          labelClass="col-sm-2"
          data-cy={dataCy}
        />
      </div>
    </div>
  );
}

function toIpamConfig(settings: IpSettings): IPAMConfig | undefined {
  if (!settings.subnet) {
    return undefined;
  }
  return {
    Subnet: settings.subnet,
    ...(settings.gateway ? { Gateway: settings.gateway } : {}),
    ...(settings.ipRange ? { IPRange: settings.ipRange } : {}),
    ...(settings.auxiliaryAddresses.length
      ? {
          AuxiliaryAddresses: Object.fromEntries(
            settings.auxiliaryAddresses.map((address, index) => {
              const [key, value] = address.split('=');
              return value ? [key, value] : [`device${index}`, key];
            })
          ),
        }
      : {}),
  };
}

function auxiliaryAddressValue(address: string) {
  return address.split('=').at(-1) || '';
}
