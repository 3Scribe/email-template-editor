export type ComponentSettingType =
  | "text"
  | "color"
  | "number"
  | "url"
  | "boolean"
  | "select"
  | "image";

export type ComponentSettingValue = string | number | boolean;

export type ComponentSettingOption = {
  label: string;
  value: string;
};

export type ComponentSetting = {
  key: string;
  label: string;
  type: ComponentSettingType;
  defaultValue?: ComponentSettingValue;
  options?: ComponentSettingOption[];
};

export type TemplateInstance = {
  id: string;
  componentId: string;
  overrides: Record<string, unknown>;
  componentType?: string;
  props?: Record<string, unknown>;
  children?: TemplateInstance[];
};

export type ComponentDefinition = {
  id: string;
  name: string;
  description: string;
  html: string;
  defaults: Record<string, unknown>;
  settings: ComponentSetting[];
  type?: string;
  displayName?: string;
  defaultProps?: Record<string, unknown>;
};

export type TemplateDocument = {
  id: string;
  name: string;
  instances: TemplateInstance[];
  root?: TemplateInstance[];
};
