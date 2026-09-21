import { EnvironmentRegistriesListRoute } from '@/portainer/react/views/route-components';
import { registerReactState } from '@/core/routing/registerReactState';
import {
  ApplicationDetailsRoute,
  ApplicationStatsRoute,
  KubernetesLogsRoute,
  ApplicationsListRoute,
  ClusterRolesRoute,
  ConfigmapsAndSecretsRoute,
  HelmApplicationRoute,
  HelmInstallRoute,
  IngressCreateRoute,
  IngressesListRoute,
  JobsRoute,
  KubectlShellRoute,
  KubernetesClusterRoute,
  KubernetesConfigureRoute,
  KubernetesConsoleRoute,
  KubernetesDashboardRoute,
  KubernetesNodeRoute,
  KubernetesNodeStatsRoute,
  KubernetesRegistryAccessRoute,
  KubernetesDeployRoute,
  ApplicationCreateRoute,
  ApplicationEditRoute,
  KubernetesResourceEditorRoute,
  NamespaceAccessRoute,
  NamespaceCreateRoute,
  NamespaceRoute,
  NamespacesListRoute,
  ResourceDetailsYAMLRoute,
  RolesRoute,
  ServiceAccountRoute,
  ServiceAccountsRoute,
  ServicesRoute,
  VolumesRoute,
} from '@/kubernetes/react/views/route-components';
import { AccessHeaders } from '../portainer/authorization-guard';

import './views/kubernetes.css';

export function registerKubernetesStates($stateRegistryProvider) {
    'use strict';

    const kubernetes = {
      name: 'kubernetes',
      url: '/kubernetes',
      parent: 'endpoint',
      abstract: true,

    };

    const helmApplication = {
      name: 'kubernetes.helm',
      url: '/helm/:namespace/:name?revision&tab',
      views: {
        'content@': {
          component: HelmApplicationRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/inspect-helm',
      },
    };

    const helmInstall = {
      name: 'kubernetes.helminstall',
      url: '/helm?referrer',
      views: {
        'content@': {
          component: HelmInstallRoute,
        },
      },
      params: {
        yaml: '',
      },
      data: {
        docs: '/user/kubernetes/applications/manifest/helm',
      },
    };

    const services = {
      name: 'kubernetes.services',
      url: '/services',
      views: {
        'content@': {
          component: ServicesRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/networking/services',
      },
    };
    const service = {
      name: 'kubernetes.services.service',
      url: '/:namespace/:name?tab',
      views: {
        'content@': {
          component: ResourceDetailsYAMLRoute,
        },
      },
      data: {
        resourceConfig: {
          title: 'Service details',
          breadcrumbLabel: 'Services',
          breadcrumbLink: 'kubernetes.services',
          resourceType: 'service',
          apiVersion: 'v1',
          resourcePlural: 'services',
          namespaced: true,
          yamlIdentifier: 'service-yaml',
          dataCy: 'service-yaml',
        },
      },
    };

    const ingresses = {
      name: 'kubernetes.ingresses',
      url: '/ingresses',
      views: {
        'content@': {
          component: IngressesListRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/networking/ingresses',
      },
    };

    const ingressesCreate = {
      name: 'kubernetes.ingresses.create',
      url: '/add',
      views: {
        'content@': {
          component: IngressCreateRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/networking/ingresses/add',
      },
    };

    const ingressesEdit = {
      name: 'kubernetes.ingresses.edit',
      url: '/:namespace/:name/edit',
      views: {
        'content@': {
          component: IngressCreateRoute,
        },
      },
    };

    const applications = {
      name: 'kubernetes.applications',
      url: '/applications?tab',
      views: {
        'content@': {
          component: ApplicationsListRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/applications',
      },
    };

    const applicationCreation = {
      name: 'kubernetes.applications.new',
      url: '/new',
      views: {
        'content@': {
          component: ApplicationCreateRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/applications/add',
      },
    };

    const application = {
      name: 'kubernetes.applications.application',
      url: '/:namespace/:name?resource-type',
      params: {
        openGitSettings: { value: null, dynamic: true },
      },
      views: {
        'content@': {
          component: ApplicationDetailsRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/applications/inspect',
      },
    };

    const applicationEdit = {
      name: 'kubernetes.applications.application.edit',
      url: '/edit',
      views: {
        'content@': {
          component: ApplicationEditRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/applications/edit',
      },
    };

    const applicationConsole = {
      name: 'kubernetes.applications.application.console',
      url: '/:pod/:container/console',
      views: {
        'content@': {
          component: KubernetesConsoleRoute,
        },
      },
    };

    const applicationLogs = {
      name: 'kubernetes.applications.application.logs',
      url: '/:pod/:container/logs',
      views: {
        'content@': {
          component: KubernetesLogsRoute,
        },
      },
    };

    const applicationStats = {
      name: 'kubernetes.applications.application.stats',
      url: '/:pod/:container/stats',
      views: {
        'content@': {
          component: ApplicationStatsRoute,
        },
      },
    };

    const stacks = {
      name: 'kubernetes.stacks',
      url: '/stacks',
      abstract: true,
    };

    const stack = {
      name: 'kubernetes.stacks.stack',
      url: '/:namespace/:name',
      abstract: true,
    };

    const stackLogs = {
      name: 'kubernetes.stacks.stack.logs',
      url: '/logs',
      views: {
        'content@': {
          component: KubernetesLogsRoute,
        },
      },
    };

    const configurations = {
      name: 'kubernetes.configurations',
      url: '/configurations?tab',
      views: {
        'content@': {
          component: ConfigmapsAndSecretsRoute,
        },
      },
      params: {
        tab: null,
      },
      data: {
        docs: '/user/kubernetes/configurations',
      },
    };
    const configmaps = {
      name: 'kubernetes.configmaps',
      url: '/configmaps',
      abstract: true,
      data: {
        docs: '/user/kubernetes/configurations',
      },
    };

    const configMapCreation = {
      name: 'kubernetes.configmaps.new',
      url: '/new',
      views: {
        'content@': {
          component: KubernetesResourceEditorRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/configurations/add-configmap',
        resourceEditorConfig: {
          title: 'Create ConfigMap',
          kind: 'ConfigMap',
          plural: 'configmaps',
          listRoute: 'kubernetes.configurations',
          isCreate: true,
        },
      },
    };

    const configMap = {
      name: 'kubernetes.configmaps.configmap',
      url: '/:namespace/:name',
      views: {
        'content@': {
          component: KubernetesResourceEditorRoute,
        },
      },
      data: {
        resourceEditorConfig: {
          title: 'ConfigMap details',
          kind: 'ConfigMap',
          plural: 'configmaps',
          listRoute: 'kubernetes.configurations',
        },
      },
    };

    const secrets = {
      name: 'kubernetes.secrets',
      url: '/secrets',
      abstract: true,
      data: {
        docs: '/user/kubernetes/configurations',
      },
    };

    const secretCreation = {
      name: 'kubernetes.secrets.new',
      url: '/new',
      views: {
        'content@': {
          component: KubernetesResourceEditorRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/configurations/add-secret',
        resourceEditorConfig: {
          title: 'Create secret',
          kind: 'Secret',
          plural: 'secrets',
          listRoute: 'kubernetes.configurations',
          isCreate: true,
        },
      },
    };

    const secret = {
      name: 'kubernetes.secrets.secret',
      url: '/:namespace/:name?tab',
      params: {
        tab: { dynamic: true },
      },
      views: {
        'content@': {
          component: KubernetesResourceEditorRoute,
        },
      },
      data: {
        resourceEditorConfig: {
          title: 'Secret details',
          kind: 'Secret',
          plural: 'secrets',
          listRoute: 'kubernetes.configurations',
        },
      },
    };

    const cluster = {
      name: 'kubernetes.cluster',
      url: '/cluster',
      views: {
        'content@': {
          component: KubernetesClusterRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/cluster/details',
      },
    };

    const node = {
      name: 'kubernetes.cluster.node',
      url: '/:nodeName?tab',
      views: {
        'content@': {
          component: KubernetesNodeRoute,
        },
      },
    };

    const nodeStats = {
      name: 'kubernetes.cluster.node.stats',
      url: '/stats',
      views: {
        'content@': {
          component: KubernetesNodeStatsRoute,
        },
      },
    };

    const kubectlShell = {
      name: 'kubernetes.kubectlshell',
      url: '/kubectl-shell',
      views: {
        'content@': {
          component: KubectlShellRoute,
        },
        'sidebar@': {},
      },
    };

    const dashboard = {
      name: 'kubernetes.dashboard',
      url: '/dashboard',
      views: {
        'content@': {
          component: KubernetesDashboardRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/dashboard',
      },
    };

    const deploy = {
      name: 'kubernetes.deploy',
      url: '/deploy?templateId&referrer&tab&buildMethod&chartName',
      views: {
        'content@': {
          component: KubernetesDeployRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/applications/manifest',
      },
    };

    const namespaces = {
      name: 'kubernetes.resourcePools',
      url: '/namespaces',
      views: {
        'content@': {
          component: NamespacesListRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/namespaces',
      },
    };

    const namespaceCreation = {
      name: 'kubernetes.resourcePools.new',
      url: '/new',
      views: {
        'content@': {
          component: NamespaceCreateRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/namespaces/add',
      },
    };

    const namespace = {
      name: 'kubernetes.resourcePools.resourcePool',
      url: '/:id?tab',
      views: {
        'content@': {
          component: NamespaceRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/namespaces/manage',
      },
    };

    const namespaceAccess = {
      name: 'kubernetes.resourcePools.resourcePool.access',
      url: '/access',
      views: {
        'content@': {
          component: NamespaceAccessRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/namespaces/access',
      },
    };

    const volumes = {
      name: 'kubernetes.volumes',
      url: '/volumes?tab',
      views: {
        'content@': {
          component: VolumesRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/volumes',
      },
      params: {
        tab: null,
      },
    };

    const volume = {
      name: 'kubernetes.volumes.volume',
      url: '/:namespace/:name',
      views: {
        'content@': {
          component: ResourceDetailsYAMLRoute,
        },
      },
      data: {
        resourceConfig: {
          title: 'Volume details',
          breadcrumbLabel: 'Volumes',
          breadcrumbLink: 'kubernetes.volumes',
          breadcrumbTab: 'volumes',
          resourceType: 'persistentvolumeclaim',
          apiVersion: 'v1',
          resourcePlural: 'persistentvolumeclaims',
          namespaced: true,
          yamlIdentifier: 'volume-yaml',
          dataCy: 'k8sVolDetail-volYaml',
        },
      },
    };

    const persistentVolume = {
      name: 'kubernetes.volumes.persistentVolume',
      url: '/persistent-volumes/:name?tab',
      views: {
        'content@': {
          component: ResourceDetailsYAMLRoute,
        },
      },
      data: {
        resourceConfig: {
          title: 'Persistent Volume details',
          breadcrumbLabel: 'Volumes',
          breadcrumbLink: 'kubernetes.volumes',
          breadcrumbTab: 'volumes',
          resourceType: 'persistentvolume',
          apiVersion: 'v1',
          resourcePlural: 'persistentvolumes',
          namespaced: false,
          yamlIdentifier: 'persistent-volume-yaml',
          dataCy: 'persistent-volume-yaml',
        },
      },
    };

    const storageClass = {
      name: 'kubernetes.volumes.storageClass',
      url: '/storage-classes/:name?tab',
      views: {
        'content@': {
          component: ResourceDetailsYAMLRoute,
        },
      },
      data: {
        resourceConfig: {
          title: 'Storage Class details',
          breadcrumbLabel: 'Volumes',
          breadcrumbLink: 'kubernetes.volumes',
          breadcrumbTab: 'storage',
          resourceType: 'storageclass',
          apiVersion: 'storage.k8s.io/v1',
          resourcePlural: 'storageclasses',
          namespaced: false,
          yamlIdentifier: 'storage-class-yaml',
          dataCy: 'storage-class-yaml',
        },
      },
    };

    const registries = {
      name: 'kubernetes.registries',
      url: '/registries',
      views: {
        'content@': {
          component: EnvironmentRegistriesListRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/cluster/registries',
      },
    };

    const registriesAccess = {
      name: 'kubernetes.registries.access',
      url: '/:id/access',
      views: {
        'content@': {
          component: KubernetesRegistryAccessRoute,
        },
      },
      data: {
        access: AccessHeaders.Admin,
      },
    };

    const endpointKubernetesConfiguration = {
      name: 'kubernetes.cluster.setup',
      url: '/configure',
      views: {
        'content@': {
          component: KubernetesConfigureRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/cluster/setup',
      },
    };

    const moreResources = {
      name: 'kubernetes.moreResources',
      url: '/moreResources',
      abstract: true,
    };

    const jobs = {
      name: 'kubernetes.moreResources.jobs',
      url: '/jobs?tab',
      views: {
        'content@': {
          component: JobsRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/more-resources/jobs',
      },
    };
    const job = {
      name: 'kubernetes.moreResources.job',
      url: '/jobs/:namespace/:name?tab',
      views: {
        'content@': {
          component: ResourceDetailsYAMLRoute,
        },
      },
      data: {
        resourceConfig: {
          title: 'Job details',
          breadcrumbLabel: 'Cron Jobs & Jobs',
          breadcrumbLink: 'kubernetes.moreResources.jobs',
          breadcrumbTab: 'jobs',
          resourceType: 'job',
          apiVersion: 'batch/v1',
          resourcePlural: 'jobs',
          namespaced: true,
          yamlIdentifier: 'job-yaml',
          dataCy: 'job-yaml',
        },
      },
    };
    const cronJob = {
      name: 'kubernetes.moreResources.cronJob',
      url: '/cronjobs/:namespace/:name?tab',
      views: {
        'content@': {
          component: ResourceDetailsYAMLRoute,
        },
      },
      data: {
        resourceConfig: {
          title: 'Cron Job details',
          breadcrumbLabel: 'Cron Jobs & Jobs',
          breadcrumbLink: 'kubernetes.moreResources.jobs',
          breadcrumbTab: 'cronJobs',
          resourceType: 'cronjob',
          apiVersion: 'batch/v1',
          resourcePlural: 'cronjobs',
          namespaced: true,
          yamlIdentifier: 'cronjob-yaml',
          dataCy: 'cronjob-yaml',
        },
      },
    };

    const serviceAccounts = {
      name: 'kubernetes.moreResources.serviceAccounts',
      url: '/serviceAccounts',
      views: {
        'content@': {
          component: ServiceAccountsRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/more-resources/service-accounts',
      },
    };

    const serviceAccount = {
      name: 'kubernetes.moreResources.serviceAccounts.serviceAccount',
      url: '/serviceAccounts/:namespace/:name?tab',
      views: {
        'content@': {
          component: ServiceAccountRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/more-resources/service-accounts',
      },
    };

    const clusterRoles = {
      name: 'kubernetes.moreResources.clusterRoles',
      url: '/clusterRoles?tab',
      views: {
        'content@': {
          component: ClusterRolesRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/more-resources/cluster-roles',
      },
    };
    const clusterRole = {
      name: 'kubernetes.moreResources.clusterRole',
      url: '/clusterRoles/:name?tab',
      views: {
        'content@': {
          component: ResourceDetailsYAMLRoute,
        },
      },
      data: {
        resourceConfig: {
          title: 'Cluster Role details',
          breadcrumbLabel: 'Cluster Roles',
          breadcrumbLink: 'kubernetes.moreResources.clusterRoles',
          breadcrumbTab: 'clusterRoles',
          resourceType: 'clusterrole',
          apiVersion: 'rbac.authorization.k8s.io/v1',
          resourcePlural: 'clusterroles',
          namespaced: false,
          yamlIdentifier: 'cluster-role-yaml',
          dataCy: 'cluster-role-yaml',
        },
      },
    };
    const clusterRoleBinding = {
      name: 'kubernetes.moreResources.clusterRoleBinding',
      url: '/clusterRoleBindings/:name?tab',
      views: {
        'content@': {
          component: ResourceDetailsYAMLRoute,
        },
      },
      data: {
        resourceConfig: {
          title: 'Cluster Role Binding details',
          breadcrumbLabel: 'Cluster Roles',
          breadcrumbLink: 'kubernetes.moreResources.clusterRoles',
          breadcrumbTab: 'clusterRoleBindings',
          resourceType: 'clusterrolebinding',
          apiVersion: 'rbac.authorization.k8s.io/v1',
          resourcePlural: 'clusterrolebindings',
          namespaced: false,
          yamlIdentifier: 'cluster-role-binding-yaml',
          dataCy: 'cluster-role-binding-yaml',
        },
      },
    };

    const roles = {
      name: 'kubernetes.moreResources.roles',
      url: '/roles?tab',
      views: {
        'content@': {
          component: RolesRoute,
        },
      },
      data: {
        docs: '/user/kubernetes/more-resources/namespace-roles',
      },
    };
    const role = {
      name: 'kubernetes.moreResources.role',
      url: '/roles/:namespace/:name?tab',
      views: {
        'content@': {
          component: ResourceDetailsYAMLRoute,
        },
      },
      data: {
        resourceConfig: {
          title: 'Role details',
          breadcrumbLabel: 'Roles',
          breadcrumbLink: 'kubernetes.moreResources.roles',
          breadcrumbTab: 'roles',
          resourceType: 'role',
          apiVersion: 'rbac.authorization.k8s.io/v1',
          resourcePlural: 'roles',
          namespaced: true,
          yamlIdentifier: 'role-yaml',
          dataCy: 'role-yaml',
        },
      },
    };
    const roleBinding = {
      name: 'kubernetes.moreResources.roleBinding',
      url: '/roleBindings/:namespace/:name?tab',
      views: {
        'content@': {
          component: ResourceDetailsYAMLRoute,
        },
      },
      data: {
        resourceConfig: {
          title: 'Role Binding details',
          breadcrumbLabel: 'Roles',
          breadcrumbLink: 'kubernetes.moreResources.roles',
          breadcrumbTab: 'roleBindings',
          resourceType: 'rolebinding',
          apiVersion: 'rbac.authorization.k8s.io/v1',
          resourcePlural: 'rolebindings',
          namespaced: true,
          yamlIdentifier: 'role-binding-yaml',
          dataCy: 'role-binding-yaml',
        },
      },
    };

    registerReactState($stateRegistryProvider, kubernetes);
    registerReactState($stateRegistryProvider, helmApplication);
    registerReactState($stateRegistryProvider, applications);
    registerReactState($stateRegistryProvider, applicationCreation);
    registerReactState($stateRegistryProvider, application);
    registerReactState($stateRegistryProvider, applicationEdit);
    registerReactState($stateRegistryProvider, applicationConsole);
    registerReactState($stateRegistryProvider, applicationLogs);
    registerReactState($stateRegistryProvider, applicationStats);
    registerReactState($stateRegistryProvider, stacks);
    registerReactState($stateRegistryProvider, stack);
    registerReactState($stateRegistryProvider, stackLogs);
    registerReactState($stateRegistryProvider, configurations);
    registerReactState($stateRegistryProvider, configmaps);
    registerReactState($stateRegistryProvider, configMapCreation);
    registerReactState($stateRegistryProvider, secrets);
    registerReactState($stateRegistryProvider, secretCreation);
    registerReactState($stateRegistryProvider, configMap);
    registerReactState($stateRegistryProvider, secret);
    registerReactState($stateRegistryProvider, cluster);
    registerReactState($stateRegistryProvider, dashboard);
    registerReactState($stateRegistryProvider, deploy);
    registerReactState($stateRegistryProvider, helmInstall);
    registerReactState($stateRegistryProvider, node);
    registerReactState($stateRegistryProvider, nodeStats);
    registerReactState($stateRegistryProvider, kubectlShell);
    registerReactState($stateRegistryProvider, namespaces);
    registerReactState($stateRegistryProvider, namespaceCreation);
    registerReactState($stateRegistryProvider, namespace);
    registerReactState($stateRegistryProvider, namespaceAccess);
    registerReactState($stateRegistryProvider, volumes);
    registerReactState($stateRegistryProvider, volume);
    registerReactState($stateRegistryProvider, persistentVolume);
    registerReactState($stateRegistryProvider, storageClass);
    registerReactState($stateRegistryProvider, registries);
    registerReactState($stateRegistryProvider, registriesAccess);
    registerReactState($stateRegistryProvider, endpointKubernetesConfiguration);
    registerReactState($stateRegistryProvider, services);
    registerReactState($stateRegistryProvider, service);
    registerReactState($stateRegistryProvider, ingresses);
    registerReactState($stateRegistryProvider, ingressesCreate);
    registerReactState($stateRegistryProvider, ingressesEdit);

    registerReactState($stateRegistryProvider, moreResources);
    registerReactState($stateRegistryProvider, jobs);
    registerReactState($stateRegistryProvider, job);
    registerReactState($stateRegistryProvider, cronJob);
    registerReactState($stateRegistryProvider, serviceAccounts);
    registerReactState($stateRegistryProvider, serviceAccount);
    registerReactState($stateRegistryProvider, clusterRoles);
    registerReactState($stateRegistryProvider, clusterRole);
    registerReactState($stateRegistryProvider, clusterRoleBinding);
    registerReactState($stateRegistryProvider, roles);
    registerReactState($stateRegistryProvider, role);
    registerReactState($stateRegistryProvider, roleBinding);
}
