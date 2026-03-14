"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LocalStorageTemplateStore } from "../../lib/stores/local-storage-template-store";
import type { TemplateListItem } from "../../lib/stores/template-store";

function formatUpdatedAt(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(timestamp);
}

export default function TemplatesPage() {
  const router = useRouter();
  const store = useMemo(() => new LocalStorageTemplateStore(), []);

  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    const items = await store.list();
    setTemplates(items);
  }, [store]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const handleCreate = useCallback(async () => {
    setCreating(true);

    try {
      const doc = await store.create();
      await loadTemplates();
      router.push(`/editor/${doc.id}`);
    } finally {
      setCreating(false);
    }
  }, [loadTemplates, router, store]);

  const handleOpen = useCallback(
    (templateId: string) => {
      router.push(`/editor/${templateId}`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (template: TemplateListItem) => {
      if (!window.confirm(`Delete template \"${template.name}\"?`)) {
        return;
      }

      setDeletingId(template.id);

      try {
        await store.remove(template.id);
        await loadTemplates();
      } finally {
        setDeletingId(null);
      }
    },
    [loadTemplates, store]
  );

  return (
    <main className="p-8">
      <h1>Templates</h1>
      <button onClick={() => void handleCreate()} disabled={creating}>
        {creating ? "Creating..." : "New Template"}
      </button>

      {templates.length === 0 ? (
        <p className="mt-4">No templates yet.</p>
      ) : (
        <ul className="mt-4 grid list-none gap-3 p-0">
          {templates.map((template) => (
            <li
              key={template.id}
              className="rounded-md border border-slate-300 p-3"
            >
              <p className="m-0">
                <strong>{template.name}</strong>
              </p>
              <p className="my-1 text-sm text-slate-600">
                ID: {template.id}
              </p>
              <p className="m-0 text-sm text-slate-600">
                Updated {formatUpdatedAt(template.updatedAt)}
              </p>

              <div className="mt-3 flex gap-2">
                <button onClick={() => handleOpen(template.id)}>Open</button>
                <button
                  onClick={() => void handleDelete(template)}
                  disabled={deletingId === template.id}
                >
                  {deletingId === template.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
