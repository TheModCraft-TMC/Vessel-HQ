// general icons

import dataflow from './assets/dataflow-1.svg?c';
import git from './assets/git.svg?c';
import kube from './assets/kube.svg?c';
import ldap from './assets/ldap.svg?c';
import linux from './assets/linux.svg?c';
import memory from './assets/memory.svg?c';
import restorewindow from './assets/restore-window.svg?c';
import route from './assets/route.svg?c';
import sort from './assets/sort.svg?c';
import subscription from './assets/subscription.svg?c';
import Placeholder from './assets/placeholder.svg?c'; // Placeholder is used when an icon name cant be matched
// vendor icons
import aws from './assets/vendor/aws.svg?c';
import azure from './assets/vendor/azure.svg?c';
import civo from './assets/vendor/civo.svg?c';
import digitalocean from './assets/vendor/digitalocean.svg?c';
import docker from './assets/vendor/docker.svg?c';
import dockericon from './assets/vendor/docker-icon.svg?c';
import dockercompose from './assets/vendor/docker-compose.svg?c';
import ecr from './assets/vendor/ecr.svg?c';
import github from './assets/vendor/github.svg?c';
import gitlab from './assets/vendor/gitlab.svg?c';
import google from './assets/vendor/google.svg?c';
import googlecloud from './assets/vendor/googlecloud.svg?c';
import kubernetes from './assets/vendor/kubernetes.svg?c';
import helm from './assets/vendor/helm.svg?c';
import akamai from './assets/vendor/akamai.svg?c';
import microsoft from './assets/vendor/microsoft.svg?c';
import microsofticon from './assets/vendor/microsoft-icon.svg?c';
import openldap from './assets/vendor/openldap.svg?c';
import proget from './assets/vendor/proget.svg?c';
import quay from './assets/vendor/quay.svg?c';

const placeholder = Placeholder;

export const SvgIcons = {
  dataflow,
  dockericon,
  git,
  ldap,
  linux,
  memory,
  placeholder,
  restorewindow,
  route,
  sort,
  subscription,
  aws,
  azure,
  civo,
  digitalocean,
  docker,
  dockercompose,
  ecr,
  github,
  gitlab,
  google,
  googlecloud,
  kubernetes,
  helm,
  akamai,
  microsoft,
  microsofticon,
  openldap,
  proget,
  quay,
  kube,
};

interface SvgProps {
  icon: keyof typeof SvgIcons;
  className?: string;
}

function Svg({ icon, className }: SvgProps) {
  const SvgIcon = SvgIcons[icon];

  if (!SvgIcon) {
    return (
      <span className={className} aria-hidden="true">
        <Placeholder />
      </span>
    );
  }

  return (
    <span className={className} aria-hidden="true">
      <SvgIcon />
    </span>
  );
}

export default Svg;
