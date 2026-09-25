import { AccessHeaders } from '@/core/routing';
import { registerReactState } from '@/core/routing/registerReactState';
import { ContainerItemRoute } from '@/domains/containers';
import {
  AppTemplatesRoute,
  CreateCustomTemplateRoute,
  CustomTemplatesListRoute,
  EditCustomTemplateRoute,
  EnvironmentRegistriesListRoute,
} from '@/core/routing/lazy-loading/route-components/portainer';
import {
  ConfigsListRoute,
  ConfigCreateRoute,
  ConfigItemRoute,
  DockerDashboardRoute,
  EventsListRoute,
  ImagesListRoute,
  ImageImportRoute,
  ImageItemRoute,
  ImageBuildRoute,
  HostBrowseRoute,
  NodeBrowseRoute,
  HostDetailsRoute,
  NodeDetailsRoute,
  SwarmRoute,
  SwarmVisualizerRoute,
  DockerFeaturesConfigurationRoute,
  NetworkItemRoute,
  NetworksListRoute,
  NetworkCreateRoute,
  RegistryAccessRoute,
  SecretCreateRoute,
  SecretItemRoute,
  ServiceLogsRoute,
  ServicesListRoute,
  ServiceItemRoute,
  ServiceCreateRoute,
  SecretsListRoute,
  StackCreateRoute,
  StackItemRoute,
  StacksListRoute,
  TaskLogsRoute,
  TaskItemRoute,
  VolumesListRoute,
  VolumeItemRoute,
  VolumeCreateRoute,
  VolumeBrowseRoute,
} from '@/core/routing/lazy-loading/route-components/docker';

export function registerDockerStates($stateRegistryProvider) {
    'use strict';

    var docker = {
      name: 'docker',
      parent: 'endpoint',
      url: '/docker',
      abstract: true,
    };

    var configs = {
      name: 'docker.configs',
      url: '/configs',
      views: {
        'content@': {
          component: ConfigsListRoute,
        },
      },
      data: {
        docs: '/user/docker/configs',
      },
    };

    var config = {
      name: 'docker.configs.config',
      url: '/:id',
      views: {
        'content@': {
          component: ConfigItemRoute,
        },
      },
    };

    var configCreation = {
      name: 'docker.configs.new',
      url: '/new?id',
      views: {
        'content@': {
          component: ConfigCreateRoute,
        },
      },
      data: {
        docs: '/user/docker/configs/add',
      },
    };

    const customTemplates = {
      name: 'docker.templates.custom',
      url: '/custom',

      views: {
        'content@': {
          component: CustomTemplatesListRoute,
        },
      },
      data: {
        docs: '/user/docker/templates/custom',
      },
    };

    const customTemplatesNew = {
      name: 'docker.templates.custom.new',
      url: '/new?fileContent&appTemplateId&type',

      views: {
        'content@': {
          component: CreateCustomTemplateRoute,
        },
      },
    };

    const customTemplatesEdit = {
      name: 'docker.templates.custom.edit',
      url: '/:id',

      views: {
        'content@': {
          component: EditCustomTemplateRoute,
        },
      },
    };

    var dashboard = {
      name: 'docker.dashboard',
      url: '/dashboard',
      views: {
        'content@': {
          component: DockerDashboardRoute,
        },
      },
      data: {
        docs: '/user/docker/dashboard',
      },
    };

    var host = {
      name: 'docker.host',
      url: '/host',
      views: {
        'content@': {
          component: HostDetailsRoute,
        },
      },
      data: {
        docs: '/user/docker/host/details',
      },
    };

    var hostBrowser = {
      name: 'docker.host.browser',
      url: '/browser',
      views: {
        'content@': {
          component: HostBrowseRoute,
        },
      },
    };

    var events = {
      name: 'docker.events',
      url: '/events',
      views: {
        'content@': {
          component: EventsListRoute,
        },
      },
      data: {
        docs: '/user/docker/events',
      },
    };

    var images = {
      name: 'docker.images',
      url: '/images',
      views: {
        'content@': {
          component: ImagesListRoute,
        },
      },
      data: {
        docs: '/user/docker/images',
      },
    };

    var image = {
      name: 'docker.images.image',
      url: '/:id?nodeName',
      views: {
        'content@': {
          component: ImageItemRoute,
        },
      },
    };

    var imageBuild = {
      name: 'docker.images.build',
      url: '/build',
      views: {
        'content@': {
          component: ImageBuildRoute,
        },
      },
      data: {
        docs: '/user/docker/images/build',
      },
    };

    var imageImport = {
      name: 'docker.images.import',
      url: '/import',
      views: {
        'content@': {
          component: ImageImportRoute,
        },
      },
      data: {
        docs: '/user/docker/images/import',
      },
    };

    var networks = {
      name: 'docker.networks',
      url: '/networks',
      views: {
        'content@': {
          component: NetworksListRoute,
        },
      },
      data: {
        docs: '/user/docker/networks',
      },
    };

    var network = {
      name: 'docker.networks.network',
      url: '/:id?nodeName',
      views: {
        'content@': {
          component: NetworkItemRoute,
        },
      },
    };

    var networkCreation = {
      name: 'docker.networks.new',
      url: '/new',
      views: {
        'content@': {
          component: NetworkCreateRoute,
        },
      },
      data: {
        docs: '/user/docker/networks/add',
      },
    };

    var nodes = {
      name: 'docker.nodes',
      url: '/nodes',
      abstract: true,
      data: {
        docs: '/user/docker/swarm/details',
      },
    };

    var node = {
      name: 'docker.nodes.node',
      url: '/:id',
      views: {
        'content@': {
          component: NodeDetailsRoute,
        },
      },
    };

    var nodeBrowser = {
      name: 'docker.nodes.node.browse',
      url: '/browse',
      views: {
        'content@': {
          component: NodeBrowseRoute,
        },
      },
    };

    var secrets = {
      name: 'docker.secrets',
      url: '/secrets',
      views: {
        'content@': {
          component: SecretsListRoute,
        },
      },
      data: {
        docs: '/user/docker/secrets',
      },
    };

    var secret = {
      name: 'docker.secrets.secret',
      url: '/:id',
      views: {
        'content@': {
          component: SecretItemRoute,
        },
      },
    };

    var secretCreation = {
      name: 'docker.secrets.new',
      url: '/new',
      views: {
        'content@': {
          component: SecretCreateRoute,
        },
      },
      data: {
        docs: '/user/docker/secrets/add',
      },
    };

    var services = {
      name: 'docker.services',
      url: '/services',
      views: {
        'content@': {
          component: ServicesListRoute,
        },
      },
      data: {
        docs: '/user/docker/services',
      },
    };

    var service = {
      name: 'docker.services.service',
      url: '/:id',
      views: {
        'content@': {
          component: ServiceItemRoute,
        },
      },
    };

    var serviceCreation = {
      name: 'docker.services.new',
      url: '/new',
      views: {
        'content@': {
          component: ServiceCreateRoute,
        },
      },
      data: {
        docs: '/user/docker/stacks/add',
      },
    };

    var serviceLogs = {
      name: 'docker.services.service.logs',
      url: '/logs',
      views: {
        'content@': {
          component: ServiceLogsRoute,
        },
      },
    };

    var stacks = {
      name: 'docker.stacks',
      url: '/stacks',
      views: {
        'content@': {
          component: StacksListRoute,
        },
      },
      data: {
        docs: '/user/docker/stacks',
      },
    };

    var stack = {
      name: 'docker.stacks.stack',
      url: '/:name?id&type&regular&external&orphaned&orphanedRunning&tab',
      views: {
        'content@': {
          component: StackItemRoute,
        },
      },
    };

    var stackContainer = {
      name: 'docker.stacks.stack.container',
      url: '/:id?nodeName',
      views: {
        'content@': {
          component: ContainerItemRoute,
        },
      },
    };

    var stackCreation = {
      name: 'docker.stacks.newstack',
      url: '/newstack',
      views: {
        'content@': {
          component: StackCreateRoute,
        },
      },
    };

    var swarm = {
      name: 'docker.swarm',
      url: '/swarm',
      views: {
        'content@': {
          component: SwarmRoute,
        },
      },
      data: {
        docs: '/user/docker/swarm/details',
      },
    };

    var swarmVisualizer = {
      name: 'docker.swarm.visualizer',
      url: '/visualizer',
      views: {
        'content@': {
          component: SwarmVisualizerRoute,
        },
      },
      data: {
        docs: '/user/docker/swarm/cluster-visualizer',
      },
    };

    var tasks = {
      name: 'docker.tasks',
      url: '/tasks',
      abstract: true,
    };

    var task = {
      name: 'docker.tasks.task',
      url: '/:id',
      views: {
        'content@': {
          component: TaskItemRoute,
        },
      },
    };

    var taskLogs = {
      name: 'docker.tasks.task.logs',
      url: '/logs',
      views: {
        'content@': {
          component: TaskLogsRoute,
        },
      },
    };

    var templates = {
      name: 'docker.templates',
      url: '/templates?template',
      views: {
        'content@': {
          component: AppTemplatesRoute,
        },
      },
      data: {
        docs: '/user/docker/templates/application',
      },
    };

    var volumes = {
      name: 'docker.volumes',
      url: '/volumes',
      views: {
        'content@': {
          component: VolumesListRoute,
        },
      },
      data: {
        docs: '/user/docker/volumes',
      },
    };

    var volume = {
      name: 'docker.volumes.volume',
      url: '/:id?nodeName',
      views: {
        'content@': {
          component: VolumeItemRoute,
        },
      },
    };

    var volumeBrowse = {
      name: 'docker.volumes.volume.browse',
      url: '/browse',
      views: {
        'content@': {
          component: VolumeBrowseRoute,
        },
      },
    };

    var volumeCreation = {
      name: 'docker.volumes.new',
      url: '/new',
      views: {
        'content@': {
          component: VolumeCreateRoute,
        },
      },
      data: {
        docs: '/user/docker/volumes/add',
      },
    };

    const dockerFeaturesConfiguration = {
      name: 'docker.host.featuresConfiguration',
      url: '/feat-config',
      views: {
        'content@': {
          component: DockerFeaturesConfigurationRoute,
        },
      },
      data: {
        docs: '/user/docker/host/setup',
      },
    };

    const swarmFeaturesConfiguration = {
      name: 'docker.swarm.featuresConfiguration',
      url: '/feat-config',
      views: {
        'content@': {
          component: DockerFeaturesConfigurationRoute,
        },
      },
      data: {
        docs: '/user/docker/swarm/setup',
      },
    };

    const dockerRegistries = {
      name: 'docker.host.registries',
      url: '/registries',
      views: {
        'content@': {
          component: EnvironmentRegistriesListRoute,
        },
      },
      data: {
        docs: '/user/docker/host/registries',
      },
    };

    const swarmRegistries = {
      name: 'docker.swarm.registries',
      url: '/registries',
      views: {
        'content@': {
          component: EnvironmentRegistriesListRoute,
        },
      },
      data: {
        docs: '/user/docker/swarm/registries',
      },
    };

    const dockerRegistryAccess = {
      name: 'docker.host.registries.access',
      url: '/:id/access',
      views: {
        'content@': {
          component: RegistryAccessRoute,
        },
      },
      data: {
        access: AccessHeaders.Admin,
      },
    };

    const swarmRegistryAccess = {
      name: 'docker.swarm.registries.access',
      url: '/:id/access',
      views: {
        'content@': {
          component: RegistryAccessRoute,
        },
      },
      data: {
        access: AccessHeaders.Admin,
      },
    };

    registerReactState($stateRegistryProvider, configs);
    registerReactState($stateRegistryProvider, config);
    registerReactState($stateRegistryProvider, configCreation);

    registerReactState($stateRegistryProvider, customTemplates);
    registerReactState($stateRegistryProvider, customTemplatesNew);
    registerReactState($stateRegistryProvider, customTemplatesEdit);
    registerReactState($stateRegistryProvider, docker);
    registerReactState($stateRegistryProvider, dashboard);
    registerReactState($stateRegistryProvider, host);
    registerReactState($stateRegistryProvider, hostBrowser);
    registerReactState($stateRegistryProvider, events);
    registerReactState($stateRegistryProvider, images);
    registerReactState($stateRegistryProvider, image);
    registerReactState($stateRegistryProvider, imageBuild);
    registerReactState($stateRegistryProvider, imageImport);
    registerReactState($stateRegistryProvider, networks);
    registerReactState($stateRegistryProvider, network);
    registerReactState($stateRegistryProvider, networkCreation);
    registerReactState($stateRegistryProvider, nodes);
    registerReactState($stateRegistryProvider, node);
    registerReactState($stateRegistryProvider, nodeBrowser);
    registerReactState($stateRegistryProvider, secrets);
    registerReactState($stateRegistryProvider, secret);
    registerReactState($stateRegistryProvider, secretCreation);
    registerReactState($stateRegistryProvider, services);
    registerReactState($stateRegistryProvider, service);
    registerReactState($stateRegistryProvider, serviceCreation);
    registerReactState($stateRegistryProvider, serviceLogs);
    registerReactState($stateRegistryProvider, stacks);
    registerReactState($stateRegistryProvider, stack);
    registerReactState($stateRegistryProvider, stackContainer);
    registerReactState($stateRegistryProvider, stackCreation);
    registerReactState($stateRegistryProvider, swarm);
    registerReactState($stateRegistryProvider, swarmVisualizer);
    registerReactState($stateRegistryProvider, tasks);
    registerReactState($stateRegistryProvider, task);
    registerReactState($stateRegistryProvider, taskLogs);
    registerReactState($stateRegistryProvider, templates);
    registerReactState($stateRegistryProvider, volumes);
    registerReactState($stateRegistryProvider, volume);
    registerReactState($stateRegistryProvider, volumeBrowse);
    registerReactState($stateRegistryProvider, volumeCreation);
    registerReactState($stateRegistryProvider, dockerFeaturesConfiguration);
    registerReactState($stateRegistryProvider, swarmFeaturesConfiguration);
    registerReactState($stateRegistryProvider, dockerRegistries);
    registerReactState($stateRegistryProvider, swarmRegistries);
    registerReactState($stateRegistryProvider, dockerRegistryAccess);
    registerReactState($stateRegistryProvider, swarmRegistryAccess);
}
