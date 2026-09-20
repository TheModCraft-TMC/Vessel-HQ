import { AccessHeaders } from '../authorization-guard';
import { RegistriesListRoute, RegistryCreateRoute, RegistryItemRoute, RegistryRepositoriesRoute, RegistryRepositoryRoute } from '../react/views/route-components';
import { registerReactState } from '../../react-tools/registerReactState';

export function registerRegistryStates($stateRegistryProvider) {
  const registries = {
    name: 'portainer.registries',
    url: '/registries',
    views: {
      'content@': {
        component: RegistriesListRoute,
      },
    },
    data: {
      docs: '/admin/registries',
      access: AccessHeaders.Admin,
    },
  };

  const registryCreation = {
    name: 'portainer.registries.new',
    url: '/new',
    views: {
      'content@': {
        component: RegistryCreateRoute,
      },
    },
    data: {
      docs: '/admin/registries/add',
    },
  };

  const registry = {
    name: 'portainer.registries.registry',
    url: '/:id',
    views: {
      'content@': {
        component: RegistryItemRoute,
      },
    },
    data: {
      docs: '/admin/registries/edit',
    },
  };

  const registryRepositories = {
    name: 'portainer.registries.registry.repositories',
    url: '/repositories?endpointId',
    views: {
      'content@': {
        component: RegistryRepositoriesRoute,
      },
    },
    data: {
      docs: '/admin/registries/browse',
    },
  };

  const registryRepository = {
    name: 'portainer.registries.registry.repository',
    url: '/repository?repository&endpointId',
    views: {
      'content@': {
        component: RegistryRepositoryRoute,
      },
    },
    data: {
      docs: '/admin/registries/browse',
    },
  };

  registerReactState($stateRegistryProvider, registries);
  registerReactState($stateRegistryProvider, registry);
  registerReactState($stateRegistryProvider, registryRepositories);
  registerReactState($stateRegistryProvider, registryRepository);
  registerReactState($stateRegistryProvider, registryCreation);
}
