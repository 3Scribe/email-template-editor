import type { TemplateDocument } from "../editor/models";

export const TEMPLATE_INDEX_KEY = "oeb:templates:index";

export function templateKey(id: string): string {
  return `oeb:template:${id}`;
}

export type TemplateListItem = {
  id: string;
  name: string;
  updatedAt: string;
};

export interface TemplateStore {
  list(): Promise<TemplateListItem[]>;
  get(id: string): Promise<TemplateDocument | null>;
  create(name?: string): Promise<TemplateDocument>;
  save(doc: TemplateDocument): Promise<void>;
  remove(id: string): Promise<void>;
}
