import type { TemplateDocument, TemplateInstance } from "../editor/models";
import {
  TEMPLATE_INDEX_KEY,
  type TemplateListItem,
  type TemplateStore,
  templateKey
} from "./template-store";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTemplateInstance(value: unknown): value is TemplateInstance {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.id !== "string") {
    return false;
  }

  const hasNewShape =
    typeof value.componentId === "string" && isRecord(value.overrides);
  const hasLegacyShape =
    typeof value.componentType === "string" && isRecord(value.props);

  if (!hasNewShape && !hasLegacyShape) {
    return false;
  }

  if (value.children === undefined) {
    return true;
  }

  if (!Array.isArray(value.children)) {
    return false;
  }

  return value.children.every(isTemplateInstance);
}

function isTemplateDocument(value: unknown): value is TemplateDocument {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.id !== "string" || typeof value.name !== "string") {
    return false;
  }

  const instances = Array.isArray(value.instances)
    ? value.instances
    : Array.isArray(value.root)
      ? value.root
      : null;

  if (!instances) {
    return false;
  }

  return instances.every(isTemplateInstance);
}

function isTemplateListItem(value: unknown): value is TemplateListItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.updatedAt === "string"
  );
}

function parseJson(value: string | null): unknown {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function createTemplateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function normalizeInstance(instance: TemplateInstance): TemplateInstance {
  return {
    ...instance,
    componentId: instance.componentId ?? instance.componentType ?? "",
    overrides: instance.overrides ?? instance.props ?? {}
  };
}

function normalizeDocument(doc: TemplateDocument): TemplateDocument {
  const instances = Array.isArray(doc.instances)
    ? doc.instances
    : Array.isArray(doc.root)
      ? doc.root
      : [];

  return {
    ...doc,
    instances: instances.map(normalizeInstance)
  };
}

export class LocalStorageTemplateStore implements TemplateStore {
  private getStorage(): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage;
  }

  private readIndex(): TemplateListItem[] {
    const storage = this.getStorage();
    if (!storage) {
      return [];
    }

    const parsed = parseJson(storage.getItem(TEMPLATE_INDEX_KEY));
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isTemplateListItem);
  }

  private writeIndex(index: TemplateListItem[]): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(TEMPLATE_INDEX_KEY, JSON.stringify(index));
  }

  private readTemplate(id: string): TemplateDocument | null {
    const storage = this.getStorage();
    if (!storage) {
      return null;
    }

    const parsed = parseJson(storage.getItem(templateKey(id)));
    if (!isTemplateDocument(parsed)) {
      return null;
    }

    return normalizeDocument(parsed);
  }

  async list(): Promise<TemplateListItem[]> {
    const entries = this.readIndex();
    const validEntries: TemplateListItem[] = [];

    for (const entry of entries) {
      if (this.readTemplate(entry.id)) {
        validEntries.push(entry);
      }
    }

    validEntries.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return validEntries;
  }

  async get(id: string): Promise<TemplateDocument | null> {
    return this.readTemplate(id);
  }

  async create(name?: string): Promise<TemplateDocument> {
    const doc: TemplateDocument = {
      id: createTemplateId(),
      name: name?.trim() || "Untitled Template",
      instances: []
    };

    await this.save(doc);
    return doc;
  }

  async save(doc: TemplateDocument): Promise<void> {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    const normalizedDoc = normalizeDocument(doc);
    storage.setItem(templateKey(doc.id), JSON.stringify(normalizedDoc));

    const nextEntry: TemplateListItem = {
      id: normalizedDoc.id,
      name: normalizedDoc.name,
      updatedAt: new Date().toISOString()
    };

    const currentIndex = this.readIndex().filter((entry) => entry.id !== doc.id);
    currentIndex.push(nextEntry);
    this.writeIndex(currentIndex);
  }

  async remove(id: string): Promise<void> {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.removeItem(templateKey(id));
    this.writeIndex(this.readIndex().filter((entry) => entry.id !== id));
  }
}
