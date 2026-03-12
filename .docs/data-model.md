# Data Model

placeholder syntax: {{key}}

## ComponentDefinition

Represents a reusable email component.

```ts
type ComponentDefinition = {
  id: string;
  name: string;
  description?: string;
  html: string;
  settings: ComponentSetting[];
};
```

## ComponentSetting

Represents an object pair defining an individual setting for a component.

```ts
type ComponentSetting = {
  key: string;
  label: string;
  description?: string;
  type:
    | "text"
    | "color"
    | "number"
    | "url"
    | "select"
    | "boolean";
  default: string | number | boolean;
  options?: string[];
};
```

## TemplateDocument

Represents a complete email template.

```ts
type TemplateDocument = {
  id: string;
  name: string;
  updatedAt: string;
  docVersion: 1;
  instances: TemplateInstance[];
};
```

## TemplateInstance

Represents a component placed inside a template.

```ts
type TemplateInstance = {
  id: string;
  componentId: string;
  overrides: Record<string, any>;
};
```