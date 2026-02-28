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

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Templates</h1>
      <button onClick={() => void handleCreate()} disabled={creating}>
        {creating ? "Creating..." : "New Template"}
      </button>

      {templates.length === 0 ? (
        <p style={{ marginTop: "1rem" }}>No templates yet.</p>
      ) : (
        <ul style={{ marginTop: "1rem" }}>
          {templates.map((template) => (
            <li key={template.id}>
              <strong>{template.name}</strong> ({template.id}) - updated{" "}
              {formatUpdatedAt(template.updatedAt)}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
