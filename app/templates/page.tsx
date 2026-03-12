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
    <main style={{ padding: "2rem" }}>
      <h1>Templates</h1>
      <button onClick={() => void handleCreate()} disabled={creating}>
        {creating ? "Creating..." : "New Template"}
      </button>

      {templates.length === 0 ? (
        <p style={{ marginTop: "1rem" }}>No templates yet.</p>
      ) : (
        <ul style={{ marginTop: "1rem", padding: 0, listStyle: "none", display: "grid", gap: "0.75rem" }}>
          {templates.map((template) => (
            <li
              key={template.id}
              style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "0.75rem" }}
            >
              <p style={{ margin: 0 }}>
                <strong>{template.name}</strong>
              </p>
              <p style={{ margin: "0.35rem 0", color: "#555", fontSize: "0.9rem" }}>
                ID: {template.id}
              </p>
              <p style={{ margin: 0, color: "#555", fontSize: "0.9rem" }}>
                Updated {formatUpdatedAt(template.updatedAt)}
              </p>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
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
