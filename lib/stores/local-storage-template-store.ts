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

  if (
    typeof value.id !== "string" ||
    typeof value.componentType !== "string" ||
    !isRecord(value.props)
  ) {
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

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !Array.isArray(value.root)
  ) {
    return false;
  }

  return value.root.every(isTemplateInstance);
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

    return parsed;
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
      root: []
    };

    await this.save(doc);
    return doc;
  }

  async save(doc: TemplateDocument): Promise<void> {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(templateKey(doc.id), JSON.stringify(doc));

    const nextEntry: TemplateListItem = {
      id: doc.id,
      name: doc.name,
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
