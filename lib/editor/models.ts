export type ComponentSettingType =
  | "text"
  | "number"
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
  componentType: string;
  props: Record<string, unknown>;
  children?: TemplateInstance[];
};

export type ComponentDefinition = {
  type: string;
  displayName: string;
  defaultProps: Record<string, unknown>;
  settings: ComponentSetting[];
};

export type TemplateDocument = {
  id: string;
  name: string;
  root: TemplateInstance[];
};
