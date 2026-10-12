export { AppTemplatesView } from './app-templates/AppTemplatesView';
export { CreateView as CreateCustomTemplateView } from './custom-templates/CreateView';
export { EditView as EditCustomTemplateView } from './custom-templates/EditView';
export { ListView as CustomTemplatesListView } from './custom-templates/ListView/ListView';

export { Platform } from './types';
export { TemplateType } from './app-templates/types';
export type { AppTemplate, TemplateEnv } from './app-templates/types';
export { EnvVarType, TemplateViewModel } from './app-templates/view-model';
export type {
  CustomTemplate,
  CustomTemplateFileContent,
  EdgeTemplateSettings,
} from './custom-templates/types';

export { TemplateNote } from './components/TemplateNote';
export { DeployWidget } from './components/DeployWidget';
export { AdvancedSettings } from './app-templates/DeployFormWidget/AdvancedSettings';
export {
  CommonFields,
  validation,
} from './custom-templates/components/CommonFields';
export { PlatformField } from './custom-templates/components/PlatformSelector';
export { TemplateTypeSelector } from './custom-templates/components/TemplateTypeSelector';
export { EdgeSettingsFieldset } from './custom-templates/CreateView/EdgeSettingsFieldset';
export { useCreateTemplateMutation } from './custom-templates/queries/useCreateTemplateMutation';
export {
  EnvVarsFieldset,
  envVarsFieldsetValidation,
  getDefaultValues,
  getDefaultValues as getAppVariablesDefaultValues,
  getDefaultValues as getEnvVarsDefaultValues,
  type EnvVarsValue,
} from './app-templates/DeployFormWidget/EnvVarsFieldset';
export {
  CustomTemplatesVariablesDefinitionField,
  type VariableDefinition,
} from './custom-templates/components/CustomTemplatesVariablesDefinitionField';
export type { Values as DefinitionFieldValues } from './custom-templates/components/CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';
export { validation as variablesValidation } from './custom-templates/components/CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';
export type { Values } from './custom-templates/components/CommonFields';
export { edgeFieldsetValidation } from './custom-templates/CreateView/EdgeSettingsFieldset.validation';
export { useCustomTemplates } from './custom-templates/queries/useCustomTemplates';
export {
  CustomTemplatesVariablesField,
  getVariablesFieldDefaultValues,
  variablesFieldValidation,
  type VariablesFieldValue,
} from './custom-templates/components/CustomTemplatesVariablesField';
export { getTemplateSourceId } from './custom-templates/types';
export {
  isTemplateVariablesEnabled,
  renderTemplate,
} from './custom-templates/components/utils';
export {
  useAppTemplate,
  useAppTemplates,
} from './app-templates/queries/useAppTemplates';
export { useAppTemplateFile } from './app-templates/queries/useAppTemplateFile';
export { useCustomTemplate } from './custom-templates/queries/useCustomTemplate';
export { useCustomTemplateFile } from './custom-templates/queries/useCustomTemplateFile';
