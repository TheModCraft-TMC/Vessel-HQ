import { CreateCustomTemplateRoute, CustomTemplatesListRoute, EditCustomTemplateRoute } from '@/portainer/react/views/route-components';
import { registerReactState } from '@/react-tools/registerReactState';

export function registerKubernetesTemplateStates($stateRegistryProvider) {
  const templates = {
    name: 'kubernetes.templates',
    url: '/templates',
    abstract: true,
  };

  const customTemplates = {
    name: 'kubernetes.templates.custom',
    url: '/custom',

    views: {
      'content@': {
        component: CustomTemplatesListRoute,
      },
    },
    data: {
      docs: '/user/kubernetes/templates',
    },
  };

  const customTemplatesNew = {
    name: 'kubernetes.templates.custom.new',
    url: '/new?fileContent',

    views: {
      'content@': {
        component: CreateCustomTemplateRoute,
      },
    },
    params: {
      fileContent: '',
    },
    data: {
      docs: '/user/kubernetes/templates/add',
    },
  };

  const customTemplatesEdit = {
    name: 'kubernetes.templates.custom.edit',
    url: '/:id',

    views: {
      'content@': {
        component: EditCustomTemplateRoute,
      },
    },
  };

  registerReactState($stateRegistryProvider, templates);
  registerReactState($stateRegistryProvider, customTemplates);
  registerReactState($stateRegistryProvider, customTemplatesNew);
  registerReactState($stateRegistryProvider, customTemplatesEdit);
}
