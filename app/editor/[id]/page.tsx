"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ComponentStore } from "../../../lib/editor/component-store";
import type {
  ComponentDefinition,
  ComponentSetting,
  TemplateDocument,
  TemplateInstance
} from "../../../lib/editor/models";
import { renderTemplate } from "../../../lib/render/renderTemplate";
import { LocalStorageTemplateStore } from "../../../lib/stores/local-storage-template-store";

type SaveState = "idle" | "saving" | "saved" | "error";

function createInstanceId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function getComponentDefaults(component: ComponentDefinition): Record<string, unknown> {
  const defaults = { ...component.defaults };

  for (const setting of component.settings) {
    if (defaults[setting.key] === undefined && setting.defaultValue !== undefined) {
      defaults[setting.key] = setting.defaultValue;
    }
  }

  return defaults;
}

function normalizeInstance(instance: TemplateInstance): TemplateInstance {
  return {
    ...instance,
    componentId: instance.componentId ?? instance.componentType ?? "",
    overrides: instance.overrides ?? instance.props ?? {}
  };
}

function normalizeDoc(doc: TemplateDocument): TemplateDocument {
  const legacyRoot = Array.isArray(doc.root) ? doc.root : [];
  const instances = Array.isArray(doc.instances) ? doc.instances : legacyRoot;

  return {
    ...doc,
    instances: instances.map(normalizeInstance)
  };
}

function formatSavedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function sanitizeFileName(value: string): string {
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return cleaned || "template";
}

function SettingField({
  setting,
  value,
  onChange
}: {
  setting: ComponentSetting;
  value: unknown;
  onChange: (nextValue: unknown) => void;
}) {
  const labelStyle = { display: "block", marginBottom: "0.35rem", fontWeight: 600 };
  const commonInputStyle = {
    width: "100%",
    padding: "0.45rem",
    border: "1px solid #ccc",
    borderRadius: "4px"
  };

  if (setting.type === "boolean") {
    return (
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{setting.label}</span>
      </label>
    );
  }

  if (setting.type === "select") {
    return (
      <label style={{ display: "block" }}>
        <span style={labelStyle}>{setting.label}</span>
        <select
          style={commonInputStyle}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        >
          {(setting.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (setting.type === "number") {
    return (
      <label style={{ display: "block" }}>
        <span style={labelStyle}>{setting.label}</span>
        <input
          type="number"
          style={commonInputStyle}
          value={typeof value === "number" ? value : 0}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            onChange(Number.isNaN(parsed) ? 0 : parsed);
          }}
        />
      </label>
    );
  }

  const inputType: React.HTMLInputTypeAttribute =
    setting.type === "color"
      ? "color"
      : setting.type === "url" || setting.type === "image"
        ? "url"
        : "text";

  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{setting.label}</span>
      <input
        type={inputType}
        style={commonInputStyle}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default function EditorPage() {
  const params = useParams<{ id: string | string[] }>();
  const templateId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const store = useMemo(() => new LocalStorageTemplateStore(), []);
  const components = useMemo(() => ComponentStore.list(), []);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [doc, setDoc] = useState<TemplateDocument | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const loadTemplate = useCallback(async () => {
    if (!templateId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    const loadedDoc = await store.get(templateId);
    if (!loadedDoc) {
      setDoc(null);
      setNotFound(true);
      setLoading(false);
      return;
    }

    const normalized = normalizeDoc(loadedDoc);
    setDoc(normalized);
    setSelectedInstanceId(normalized.instances[0]?.id ?? null);
    setSaveState("idle");
    setSavedAt(null);
    setLoading(false);
  }, [store, templateId]);

  useEffect(() => {
    void loadTemplate();
  }, [loadTemplate]);

  const selectedInstance = useMemo(() => {
    if (!doc || !selectedInstanceId) {
      return null;
    }

    return doc.instances.find((instance) => instance.id === selectedInstanceId) ?? null;
  }, [doc, selectedInstanceId]);

  const selectedComponent = useMemo(() => {
    if (!selectedInstance) {
      return null;
    }

    return ComponentStore.get(selectedInstance.componentId) ?? null;
  }, [selectedInstance]);

  const rendered = useMemo(() => {
    if (!doc) {
      return { html: "", warnings: [] as string[] };
    }

    return renderTemplate(doc, components);
  }, [components, doc]);

  const handleNameChange = useCallback((name: string) => {
    setDoc((previous) => {
      if (!previous) {
        return previous;
      }

      return { ...previous, name };
    });
    setSaveState("idle");
  }, []);

  const handleAddComponent = useCallback((component: ComponentDefinition) => {
    const newInstance: TemplateInstance = {
      id: createInstanceId(),
      componentId: component.id,
      overrides: {}
    };

    setDoc((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        instances: [...previous.instances, newInstance]
      };
    });
    setSelectedInstanceId(newInstance.id);
    setSaveState("idle");
  }, []);

  const handleSettingChange = useCallback(
    (setting: ComponentSetting, nextValue: unknown) => {
      setDoc((previous) => {
        if (!previous || !selectedInstanceId || !selectedComponent) {
          return previous;
        }

        const index = previous.instances.findIndex(
          (instance) => instance.id === selectedInstanceId
        );
        if (index < 0) {
          return previous;
        }

        const instance = previous.instances[index];
        const overrides = { ...instance.overrides };
        const defaults = getComponentDefaults(selectedComponent);
        const defaultValue = defaults[setting.key];

        if (nextValue === defaultValue) {
          delete overrides[setting.key];
        } else {
          overrides[setting.key] = nextValue;
        }

        const nextInstances = [...previous.instances];
        nextInstances[index] = {
          ...instance,
          overrides
        };

        return {
          ...previous,
          instances: nextInstances
        };
      });
      setSaveState("idle");
    },
    [selectedComponent, selectedInstanceId]
  );

  const handleSave = useCallback(async () => {
    if (!doc) {
      return;
    }

    setSaveState("saving");
    try {
      await store.save(doc);
      const now = new Date().toISOString();
      setSavedAt(now);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [doc, store]);

  const handleExport = useCallback(() => {
    if (!doc) {
      return;
    }

    const result = renderTemplate(doc, components);
    const blob = new Blob([result.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${sanitizeFileName(doc.name)}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [components, doc]);

  if (loading) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>Editor</h1>
        <p>Loading template...</p>
      </main>
    );
  }

  if (notFound || !doc) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>Template not found</h1>
        <p>The requested template does not exist.</p>
        <Link href="/templates">Back to templates</Link>
      </main>
    );
  }

  const selectedDefaults = selectedComponent
    ? getComponentDefaults(selectedComponent)
    : {};

  return (
    <main style={{ padding: "1rem" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1rem"
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <label style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>
            Template Name
          </label>
          <input
            type="text"
            value={doc.name}
            onChange={(event) => handleNameChange(event.target.value)}
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button onClick={() => void handleSave()} disabled={saveState === "saving"}>
            {saveState === "saving" ? "Saving..." : "Save"}
          </button>
          <button onClick={handleExport}>Export HTML</button>
          <span style={{ fontSize: "0.9rem", color: "#444" }}>
            {saveState === "saved" && savedAt
              ? `Saved ${formatSavedAt(savedAt)}`
              : saveState === "error"
                ? "Save failed"
                : ""}
          </span>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr 320px",
          gap: "1rem",
          alignItems: "start"
        }}
      >
        <aside style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "0.75rem" }}>
          <h2 style={{ marginTop: 0 }}>Components</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.5rem" }}>
            {components.map((component) => (
              <li
                key={component.id}
                style={{ border: "1px solid #e5e5e5", borderRadius: "4px", padding: "0.5rem" }}
              >
                <strong>{component.name}</strong>
                <p style={{ margin: "0.35rem 0", fontSize: "0.9rem", color: "#555" }}>
                  {component.description}
                </p>
                <button onClick={() => handleAddComponent(component)}>Add</button>
              </li>
            ))}
          </ul>
        </aside>

        <section style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "0.75rem" }}>
          <h2 style={{ marginTop: 0 }}>Canvas</h2>

          {doc.instances.length === 0 ? (
            <p>No components added yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.5rem" }}>
              {doc.instances.map((instance) => (
                <li key={instance.id}>
                  <button
                    onClick={() => setSelectedInstanceId(instance.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      border:
                        instance.id === selectedInstanceId
                          ? "2px solid #2563eb"
                          : "1px solid #d4d4d4",
                      background:
                        instance.id === selectedInstanceId ? "#eff6ff" : "#fff"
                    }}
                  >
                    {instance.componentId} ({instance.id})
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: "1rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>Live Preview</h3>
            <iframe
              title="Template Preview"
              srcDoc={rendered.html}
              style={{
                width: "100%",
                minHeight: "320px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "#fff"
              }}
            />
          </div>

          {rendered.warnings.length > 0 ? (
            <div
              style={{
                marginTop: "1rem",
                border: "1px solid #f5c2c7",
                background: "#fff5f5",
                borderRadius: "4px",
                padding: "0.75rem"
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#842029" }}>
                Renderer Warnings
              </h3>
              <ul style={{ margin: 0, paddingLeft: "1rem", color: "#842029" }}>
                {rendered.warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <aside style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "0.75rem" }}>
          <h2 style={{ marginTop: 0 }}>Properties</h2>
          {!selectedInstance || !selectedComponent ? (
            <p>Select a component instance to edit settings.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#555" }}>
                Editing: <strong>{selectedComponent.name}</strong>
              </p>

              {selectedComponent.settings.map((setting) => {
                const effectiveValue =
                  selectedInstance.overrides[setting.key] ?? selectedDefaults[setting.key];

                return (
                  <SettingField
                    key={setting.key}
                    setting={setting}
                    value={effectiveValue}
                    onChange={(value) => handleSettingChange(setting, value)}
                  />
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
