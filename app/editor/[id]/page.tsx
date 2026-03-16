"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

function toStableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => toStableJson(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${toStableJson(record[key])}`).join(",")}}`;
  }

  return JSON.stringify(value);
}

function getDocSnapshot(doc: TemplateDocument | null): string {
  if (!doc) {
    return "";
  }

  return toStableJson({
    id: doc.id,
    name: doc.name,
    instances: doc.instances
  });
}

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
  if (setting.type === "boolean") {
    return (
      <label className="flex items-center gap-2">
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
      <label className="block">
        <span className="mb-1 block font-semibold">{setting.label}</span>
        <select
          className="w-full rounded border border-slate-300 p-2"
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
      <label className="block">
        <span className="mb-1 block font-semibold">{setting.label}</span>
        <input
          type="number"
          className="w-full rounded border border-slate-300 p-2"
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
    <label className="block">
      <span className="mb-1 block font-semibold">{setting.label}</span>
      <input
        type={inputType}
        className="w-full rounded border border-slate-300 p-2"
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default function EditorPage() {
  const params = useParams<{ id: string | string[] }>();
  const templateId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const store = useMemo(() => new LocalStorageTemplateStore(), []);
  const components = useMemo(() => ComponentStore.list(), []);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [doc, setDoc] = useState<TemplateDocument | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");

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
    setSavedSnapshot(getDocSnapshot(normalized));
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

  const hasUnsavedChanges = useMemo(
    () => getDocSnapshot(doc) !== savedSnapshot,
    [doc, savedSnapshot]
  );

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!templateId || !doc || typeof window === "undefined") {
      return;
    }

    const guardUrl = window.location.href;
    const guardState = { __oebUnsavedGuard: true };

    window.history.pushState(guardState, "", guardUrl);

    const handlePopState = () => {
      if (!hasUnsavedChanges) {
        window.removeEventListener("popstate", handlePopState);
        window.history.back();
        return;
      }

      const shouldLeave = window.confirm(
        "You have unsaved changes. Leave the editor without saving?"
      );

      if (shouldLeave) {
        window.removeEventListener("popstate", handlePopState);
        window.history.back();
        return;
      }

      window.history.pushState(guardState, "", guardUrl);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [doc, hasUnsavedChanges, templateId]);

  const handleNavigateToTemplates = useCallback(() => {
    if (hasUnsavedChanges) {
      const shouldLeave = window.confirm(
        "You have unsaved changes. Leave the editor without saving?"
      );

      if (!shouldLeave) {
        return;
      }
    }

    router.push("/templates");
  }, [hasUnsavedChanges, router]);

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

  const handleMoveInstance = useCallback(
    (instanceId: string, direction: "up" | "down") => {
      setDoc((previous) => {
        if (!previous) {
          return previous;
        }

        const index = previous.instances.findIndex((instance) => instance.id === instanceId);
        if (index < 0) {
          return previous;
        }

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= previous.instances.length) {
          return previous;
        }

        const nextInstances = [...previous.instances];
        const [moved] = nextInstances.splice(index, 1);
        nextInstances.splice(targetIndex, 0, moved);

        return {
          ...previous,
          instances: nextInstances
        };
      });

      setSaveState("idle");
    },
    []
  );

  const handleDeleteInstance = useCallback((instanceId: string) => {
    setDoc((previous) => {
      if (!previous) {
        return previous;
      }

      const index = previous.instances.findIndex((instance) => instance.id === instanceId);
      if (index < 0) {
        return previous;
      }

      const nextInstances = previous.instances.filter((instance) => instance.id !== instanceId);

      setSelectedInstanceId((current) => {
        if (current !== instanceId) {
          return current;
        }

        if (nextInstances.length === 0) {
          return null;
        }

        const fallbackIndex = Math.min(index, nextInstances.length - 1);
        return nextInstances[fallbackIndex].id;
      });

      return {
        ...previous,
        instances: nextInstances
      };
    });

    setSaveState("idle");
  }, []);

  const componentNameById = useMemo(
    () => new Map(components.map((component) => [component.id, component.name])),
    [components]
  );

  const confirmDeleteInstance = useCallback(
    (instance: TemplateInstance, index: number) => {
      const componentName = componentNameById.get(instance.componentId) ?? instance.componentId;
      const shouldDelete = window.confirm(
        `Delete component ${index + 1}: ${componentName}?`
      );

      if (!shouldDelete) {
        return;
      }

      handleDeleteInstance(instance.id);
    },
    [componentNameById, handleDeleteInstance]
  );

  const handleDuplicateInstance = useCallback((instanceId: string) => {
    const nextInstanceId = createInstanceId();

    setDoc((previous) => {
      if (!previous) {
        return previous;
      }

      const index = previous.instances.findIndex((instance) => instance.id === instanceId);
      if (index < 0) {
        return previous;
      }

      const source = previous.instances[index];
      const duplicate: TemplateInstance = {
        id: nextInstanceId,
        componentId: source.componentId,
        overrides: { ...source.overrides }
      };

      const nextInstances = [...previous.instances];
      nextInstances.splice(index + 1, 0, duplicate);

      return {
        ...previous,
        instances: nextInstances
      };
    });

    setSelectedInstanceId(nextInstanceId);
    setSaveState("idle");
  }, []);

  const handleClearCanvas = useCallback(() => {
    const shouldClear = window.confirm("Delete all components from the canvas?");
    if (!shouldClear) {
      return;
    }

    setDoc((previous) => {
      if (!previous || previous.instances.length === 0) {
        return previous;
      }

      return {
        ...previous,
        instances: []
      };
    });

    setSelectedInstanceId(null);
    setSaveState("idle");
  }, []);

  const handleSave = useCallback(async () => {
    if (!doc) {
      return;
    }

    setSaveState("saving");
    try {
      await store.save(doc);
      const now = new Date().toISOString();
      setSavedSnapshot(getDocSnapshot(doc));
      setSavedAt(now);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [doc, store]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSaveShortcut =
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "s";

      if (!isSaveShortcut) {
        return;
      }

      event.preventDefault();

      if (!hasUnsavedChanges || saveState === "saving") {
        return;
      }

      void handleSave();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSave, hasUnsavedChanges, saveState]);

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
      <main className="p-8">
        <h1>Editor</h1>
        <p>Loading template...</p>
      </main>
    );
  }

  if (notFound || !doc) {
    return (
      <main className="p-8">
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
    <main className="p-4">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <button onClick={handleNavigateToTemplates} className="mb-3 text-sm underline">
            Back to templates
          </button>
          <label className="mb-1 block font-semibold">
            Template Name
          </label>
          <input
            type="text"
            value={doc.name}
            onChange={(event) => handleNameChange(event.target.value)}
            className="w-full max-w-[460px] rounded border border-slate-300 p-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void handleSave()}
            disabled={saveState === "saving" || !hasUnsavedChanges}
          >
            {saveState === "saving" ? "Saving..." : "Save"}
          </button>
          <button onClick={handleExport}>Export HTML</button>
          <span className="text-sm text-slate-700">
            {saveState === "saved" && savedAt && !hasUnsavedChanges
              ? `Saved ${formatSavedAt(savedAt)}`
              : hasUnsavedChanges
                ? "Unsaved changes"
              : saveState === "error"
                ? "Save failed"
                : ""}
          </span>
        </div>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[260px_1fr_320px]">
        <aside className="rounded-md border border-slate-300 p-3">
          <h2 className="mt-0">Components</h2>
          <ul className="m-0 grid list-none gap-2 p-0">
            {components.map((component) => (
              <li
                key={component.id}
                className="rounded border border-slate-200 p-2"
              >
                <strong>{component.name}</strong>
                <p className="my-1 text-sm text-slate-600">
                  {component.description}
                </p>
                <button onClick={() => handleAddComponent(component)}>Add</button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="rounded-md border border-slate-300 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="m-0">Canvas</h2>
            <button onClick={handleClearCanvas} disabled={doc.instances.length === 0}>
              Clear Canvas
            </button>
          </div>

          {doc.instances.length === 0 ? (
            <p>No components added yet.</p>
          ) : (
            <ul className="m-0 grid list-none gap-2 p-0">
              {doc.instances.map((instance, index) => (
                <li key={instance.id}>
                  <div className="grid gap-1.5">
                    <button
                      onClick={() => setSelectedInstanceId(instance.id)}
                      className={`w-full rounded p-2 text-left ${instance.id === selectedInstanceId ? "border-2 border-blue-600 bg-blue-50" : "border border-slate-300 bg-white"}`}
                    >
                      <span className="block font-semibold">
                        {index + 1}. {componentNameById.get(instance.componentId) ?? instance.componentId}
                      </span>
                      <span className="block text-xs text-slate-600">
                        {instance.id}
                      </span>
                    </button>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleMoveInstance(instance.id, "up")}
                        disabled={index === 0}
                        className="flex-1"
                      >
                        Move Up
                      </button>
                      <button
                        onClick={() => handleMoveInstance(instance.id, "down")}
                        disabled={index === doc.instances.length - 1}
                        className="flex-1"
                      >
                        Move Down
                      </button>
                      <button onClick={() => handleDuplicateInstance(instance.id)}>
                        Duplicate
                      </button>
                      <button onClick={() => confirmDeleteInstance(instance, index)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4">
            <h3 className="mb-2">Live Preview</h3>
            <iframe
              title="Template Preview"
              srcDoc={rendered.html}
              className="min-h-[320px] w-full rounded border border-slate-300 bg-white"
            />
          </div>

          {rendered.warnings.length > 0 ? (
            <div className="mt-4 rounded border border-rose-200 bg-rose-50 p-3">
              <h3 className="mb-2 mt-0 text-rose-900">
                Renderer Warnings
              </h3>
              <ul className="m-0 list-disc pl-4 text-rose-900">
                {rendered.warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <aside className="rounded-md border border-slate-300 p-3">
          <h2 className="mt-0">Properties</h2>
          {!selectedInstance || !selectedComponent ? (
            <p>Select a component instance to edit settings.</p>
          ) : (
            <div className="grid gap-3">
              <p className="m-0 text-sm text-slate-600">
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
