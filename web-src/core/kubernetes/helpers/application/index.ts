type OwnedApplication = {
  ApplicationOwner?: string;
};

export default class KubernetesApplicationHelper {
  static isExternalApplication(application: OwnedApplication) {
    return !application.ApplicationOwner;
  }
}
