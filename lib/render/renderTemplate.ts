import type {
  ComponentDefinition,
  ComponentSetting,
  TemplateDocument
} from "../editor/models";

type RenderResult = {
  html: string;
  warnings: string[];
};

type LooseTemplateInstance = {
  id?: unknown;
  componentId?: unknown;
  componentType?: unknown;
  overrides?: unknown;
  props?: unknown;
};

type LooseComponentDefinition = ComponentDefinition & {
  id?: unknown;
  componentId?: unknown;
  html?: unknown;
  defaults?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function getInstances(doc: TemplateDocument): LooseTemplateInstance[] {
  const maybeDoc = doc as TemplateDocument & { instances?: unknown };

  if (Array.isArray(maybeDoc.instances)) {
    return maybeDoc.instances.filter(isRecord);
  }

  if (Array.isArray(doc.root)) {
    return doc.root.filter(isRecord);
  }

  return [];
}

function getComponentId(instance: LooseTemplateInstance): string | null {
  const raw = instance.componentId ?? instance.componentType;
  if (typeof raw !== "string" || raw.trim() === "") {
    return null;
  }

  return raw;
}

function getOverrides(instance: LooseTemplateInstance): Record<string, unknown> {
  return toStringRecord(instance.overrides ?? instance.props);
}

function getDefinitionId(component: LooseComponentDefinition): string | null {
  const raw = component.componentId ?? component.id ?? component.type;
  if (typeof raw !== "string" || raw.trim() === "") {
    return null;
  }

  return raw;
}

function getDefinitionHtml(component: LooseComponentDefinition): string {
  return typeof component.html === "string" ? component.html : "";
}

function getSettingKey(setting: ComponentSetting): string {
  return setting.key;
}

function getSettingMap(settings: ComponentSetting[]): Map<string, ComponentSetting> {
  const map = new Map<string, ComponentSetting>();

  for (const setting of settings) {
    map.set(getSettingKey(setting), setting);
  }

  return map;
}

function getDefaults(component: LooseComponentDefinition): Record<string, unknown> {
  const defaults = toStringRecord(component.defaults ?? component.defaultProps);
  const output: Record<string, unknown> = { ...defaults };

  for (const setting of component.settings ?? []) {
    const key = getSettingKey(setting);
    if (output[key] === undefined && setting.defaultValue !== undefined) {
      output[key] = setting.defaultValue;
    }
  }

  return output;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function replacePlaceholders(
  html: string,
  finalSettings: Record<string, unknown>,
  settingMap: Map<string, ComponentSetting>,
  componentId: string,
  warnings: string[]
): string {
  const placeholderRegex = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;

  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = placeholderRegex.exec(html)) !== null) {
    seen.add(match[1]);
  }

  for (const key of seen) {
    if (!settingMap.has(key)) {
      warnings.push(
        `Component "${componentId}" contains placeholder "{{${key}}}" with no matching setting key.`
      );
    }
  }

  return html.replace(placeholderRegex, (_raw, key: string) => {
    const value = finalSettings[key];
    if (value === undefined || value === null) {
      return "";
    }

    const setting = settingMap.get(key);
    const stringValue = String(value);

    if (setting?.type === "text") {
      return escapeHtml(stringValue);
    }

    return stringValue;
  });
}

export function renderTemplate(
  doc: TemplateDocument,
  components: ComponentDefinition[]
): RenderResult {
  const warnings: string[] = [];
  const instances = getInstances(doc);
  const componentMap = new Map<string, LooseComponentDefinition>();

  for (const component of components) {
    const definition = component as LooseComponentDefinition;
    const definitionId = getDefinitionId(definition);
    if (definitionId) {
      componentMap.set(definitionId, definition);
    }
  }

  const htmlParts: string[] = [];

  for (let index = 0; index < instances.length; index += 1) {
    const instance = instances[index];
    const componentId = getComponentId(instance);

    if (!componentId) {
      warnings.push(`Instance at index ${index} is missing componentId.`);
      continue;
    }

    const component = componentMap.get(componentId);
    if (!component) {
      continue;
    }

    const settings = component.settings ?? [];
    const settingMap = getSettingMap(settings);
    const defaults = getDefaults(component);
    const overrides = getOverrides(instance);

    for (const overrideKey of Object.keys(overrides)) {
      if (!settingMap.has(overrideKey)) {
        warnings.push(
          `Instance for component "${componentId}" has override "${overrideKey}" with no matching setting key.`
        );
      }
    }

    const finalSettings = { ...defaults, ...overrides };
    const templateHtml = getDefinitionHtml(component);

    htmlParts.push(
      replacePlaceholders(
        templateHtml,
        finalSettings,
        settingMap,
        componentId,
        warnings
      )
    );
  }

  return {
    html: `<!doctype html><html><body>${htmlParts.join("")}</body></html>`,
    warnings
  };
}
