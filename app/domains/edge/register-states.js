import { AccessHeaders } from '@/core/routing/guards/authorization-guard';
import { registerReactState } from '@/core/routing/registerReactState';
import { AppTemplatesRoute, CreateCustomTemplateRoute, CustomTemplatesListRoute, EditCustomTemplateRoute } from '@/core/routing/lazy-loading/route-components/portainer';
import {
  EdgeGroupCreateRoute,
  EdgeGroupItemRoute,
  EdgeGroupsListRoute,
  EdgeJobCreateRoute,
  EdgeJobItemRoute,
  EdgeJobsListRoute,
  EdgeStackCreateRoute,
  EdgeStackItemRoute,
  EdgeStacksListRoute,
  WaitingRoomRoute,
} from '@/domains/edge/routes';

export function registerEdgeStates($stateRegistryProvider) {
  const edge = {
    name: 'edge',
    url: '/edge',
    parent: 'root',
    abstract: true,
    data: {
      access: AccessHeaders.EdgeAdmin,
    },
  };

  const groups = {
    name: 'edge.groups',
    url: '/groups',
    views: {
      'content@': {
        component: EdgeGroupsListRoute,
      },
    },
    data: {
      docs: '/user/edge/groups',
    },
  };

  const groupsNew = {
    name: 'edge.groups.new',
    url: '/new',
    views: {
      'content@': {
        component: EdgeGroupCreateRoute,
      },
    },
  };

  const groupsEdit = {
    name: 'edge.groups.edit',
    url: '/:groupId',
    views: {
      'content@': {
        component: EdgeGroupItemRoute,
      },
    },
  };

  const stacks = {
    name: 'edge.stacks',
    url: '/stacks',
    views: {
      'content@': {
        component: EdgeStacksListRoute,
      },
    },
    data: {
      docs: '/user/edge/stacks',
    },
  };

  const stacksNew = {
    name: 'edge.stacks.new',
    url: '/new?templateId&templateType',
    views: {
      'content@': {
        component: EdgeStackCreateRoute,
      },
    },
    data: {
      docs: '/user/edge/stacks/add',
    },
    params: {
      templateId: { dynamic: true },
      templateType: { dynamic: true },
    },
  };

  const stacksEdit = {
    name: 'edge.stacks.edit',
    url: '/:stackId?tab&status',
    views: {
      'content@': {
        component: EdgeStackItemRoute,
      },
    },
    params: {
      status: {
        dynamic: true,
      },
    },
  };

  const edgeJobs = {
    name: 'edge.jobs',
    url: '/jobs',
    views: {
      'content@': {
        component: EdgeJobsListRoute,
      },
    },
    data: {
      docs: '/user/edge/jobs',
    },
  };

  const edgeJob = {
    name: 'edge.jobs.job',
    url: '/:id?tab',
    views: {
      'content@': {
        component: EdgeJobItemRoute,
      },
    },
  };

  const edgeJobCreation = {
    name: 'edge.jobs.new',
    url: '/new',
    views: {
      'content@': {
        component: EdgeJobCreateRoute,
      },
    },
  };

  registerReactState($stateRegistryProvider, {
    name: 'edge.devices',
    url: '/devices',
    abstract: true,
  });

  if (process.env.PORTAINER_EDITION === 'BE') {
    registerReactState($stateRegistryProvider, {
      name: 'edge.devices.waiting-room',
      url: '/waiting-room',
      views: {
        'content@': {
          component: WaitingRoomRoute,
        },
      },
      data: {
        docs: '/user/edge/waiting-room',
      },
    });
  }

  registerReactState($stateRegistryProvider, {
    name: 'edge.templates',
    url: '/templates?template',
    views: {
      'content@': {
        component: AppTemplatesRoute,
      },
    },
    data: {
      docs: '/user/edge/templates/application',
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'edge.templates.custom',
    url: '/custom',
    views: {
      'content@': {
        component: CustomTemplatesListRoute,
      },
    },
    data: {
      docs: '/user/edge/templates/custom',
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'edge.templates.custom.new',
    url: '/new?appTemplateId&type',

    views: {
      'content@': {
        component: CreateCustomTemplateRoute,
      },
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'edge.templates.custom.edit',
    url: '/:id',

    views: {
      'content@': {
        component: EditCustomTemplateRoute,
      },
    },
  });

  registerReactState($stateRegistryProvider, edge);

  registerReactState($stateRegistryProvider, groups);
  registerReactState($stateRegistryProvider, groupsNew);
  registerReactState($stateRegistryProvider, groupsEdit);

  registerReactState($stateRegistryProvider, stacks);
  registerReactState($stateRegistryProvider, stacksNew);
  registerReactState($stateRegistryProvider, stacksEdit);

  registerReactState($stateRegistryProvider, edgeJobs);
  registerReactState($stateRegistryProvider, edgeJob);
  registerReactState($stateRegistryProvider, edgeJobCreation);
}
