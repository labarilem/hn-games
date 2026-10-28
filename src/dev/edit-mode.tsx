"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Game } from "@/types/game";
import {
  EDITABLE_FIELDS,
  EDITABLE_FIELD_HINTS,
  EDITABLE_FIELD_LABELS,
  type DeleteResult,
  type EditableField,
  type UpdateResult,
} from "./edit-fields";
import styles from "./edit-mode.module.css";

// Defense in depth: next.config.js already swaps this module for a stub in
// production, but hide the controls if a dev server is started with an
// unexpected NODE_ENV as well.
const EDIT_MODE_ENABLED = process.env.NODE_ENV === "development";

type EditModeContextValue = {
  active: boolean;
  toggleActive: () => void;
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  toggleSelected: (id: string) => void;
  selectAllOnPage: () => void;
  clearSelection: () => void;
  pageIds: string[];
  registerPage: (ids: string[]) => void;
};

const EditModeContext = createContext<EditModeContextValue | null>(null);

function useEditMode(): EditModeContextValue {
  const value = useContext(EditModeContext);
  if (!value)
    throw new Error(
      "Edit mode components must be rendered inside EditModeProvider.",
    );
  return value;
}

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [pageIds, setPageIds] = useState<string[]>([]);

  const toggleActive = useCallback(() => {
    if (active) setSelected(new Set());
    setActive(!active);
  }, [active]);

  const registerPage = useCallback((ids: string[]) => {
    setPageIds(ids);
    setSelected((current) => {
      const allowed = new Set(ids);
      const next = new Set(Array.from(current).filter((id) => allowed.has(id)));
      return next.size === current.size ? current : next;
    });
  }, []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const toggleSelected = useCallback((id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllOnPage = useCallback(() => {
    setSelected(new Set(pageIds));
  }, [pageIds]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const value = useMemo<EditModeContextValue>(
    () => ({
      active,
      toggleActive,
      selectedIds,
      isSelected,
      toggleSelected,
      selectAllOnPage,
      clearSelection,
      pageIds,
      registerPage,
    }),
    [
      active,
      toggleActive,
      selectedIds,
      isSelected,
      toggleSelected,
      selectAllOnPage,
      clearSelection,
      pageIds,
      registerPage,
    ],
  );

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
}

export function EditModeToggle() {
  const { active, toggleActive } = useEditMode();
  if (!EDIT_MODE_ENABLED) return null;
  return (
    <button
      type="button"
      className={`${styles.toggle} ${active ? styles.toggleActive : ""}`}
      onClick={toggleActive}
      aria-pressed={active}
      title="Local development only"
    >
      <span className={styles.toggleDot} aria-hidden="true" />
      {active ? "Editing" : "Edit mode"}
    </button>
  );
}

export function CatalogPageRegistration({ ids }: { ids: string[] }) {
  const { registerPage } = useEditMode();
  const key = ids.join("|");

  useEffect(() => {
    if (!EDIT_MODE_ENABLED) return;
    registerPage(key ? key.split("|") : []);
    return () => registerPage([]);
  }, [key, registerPage]);

  return null;
}

export function SelectableGameCard({
  gameId,
  gameName,
  children,
}: {
  gameId: string;
  gameName: string;
  children: ReactNode;
}) {
  const { active, isSelected, toggleSelected } = useEditMode();

  if (!EDIT_MODE_ENABLED || !active) return <>{children}</>;

  const selected = isSelected(gameId);
  return (
    <div
      className={`${styles.cardWrap} ${
        selected ? styles.cardWrapSelected : ""
      }`}
    >
      {children}
      <button
        type="button"
        className={`${styles.selectToggle} ${
          selected ? styles.selectToggleActive : ""
        }`}
        aria-pressed={selected}
        aria-label={`${selected ? "Deselect" : "Select"} ${gameName}`}
        onClick={() => toggleSelected(gameId)}
      >
        <span className={styles.checkbox} aria-hidden="true">
          {selected ? "✓" : ""}
        </span>
        {selected ? "Selected" : "Select"}
      </button>
    </div>
  );
}

export function EditModeBar() {
  const {
    active,
    selectedIds,
    pageIds,
    selectAllOnPage,
    clearSelection,
    toggleActive,
  } = useEditMode();
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const isCatalog = pathname === "/" || pathname === "/rip";
  const isDetail = pathname.startsWith("/game/");

  useEffect(() => {
    if (active) return;
    setStatus("");
    setError("");
  }, [active]);

  const deleteSelected = useCallback(async () => {
    if (!selectedIds.length || busy) return;

    const label =
      selectedIds.length === 1
        ? "this game"
        : `these ${selectedIds.length} games`;
    const confirmed = window.confirm(
      `Delete ${label}? This removes the entries from scripts/data/*.json, deletes their unshared images, and recompiles the catalog.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setError("");
    setStatus("Deleting…");
    try {
      const response = await fetch("/api/dev/games/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const payload = (await response.json().catch(() => null)) as
        | DeleteResult
        | { error?: string }
        | null;
      if (!response.ok) {
        const message =
          payload && "error" in payload && payload.error
            ? payload.error
            : `Delete failed (${response.status}).`;
        throw new Error(message);
      }
      const result = payload as DeleteResult;
      clearSelection();
      setStatus(
        result.message ||
          `Deleted ${result.deletedIds.length} game${
            result.deletedIds.length === 1 ? "" : "s"
          }.`,
      );
      if (result.missingIds.length)
        setError(`Not found: ${result.missingIds.join(", ")}`);
      router.refresh();
    } catch (caught) {
      setStatus("");
      setError(
        caught instanceof Error ? caught.message : "Could not delete games.",
      );
    } finally {
      setBusy(false);
    }
  }, [busy, clearSelection, router, selectedIds]);

  if (!EDIT_MODE_ENABLED || !active) return null;

  return (
    <div
      className={styles.bar}
      role="region"
      aria-label="Local edit mode controls"
    >
      <span className={styles.badge}>EDIT MODE</span>
      {isCatalog ? (
        <>
          <span className={styles.count}>{selectedIds.length} selected</span>
          <button
            type="button"
            className={styles.barButton}
            onClick={selectAllOnPage}
            disabled={busy || pageIds.length === 0}
          >
            Select all ({pageIds.length})
          </button>
          <button
            type="button"
            className={`${styles.barButton} ${styles.danger}`}
            onClick={deleteSelected}
            disabled={busy || selectedIds.length === 0}
          >
            {busy ? "Deleting…" : `Delete selected (${selectedIds.length})`}
          </button>
          <button
            type="button"
            className={styles.barButton}
            onClick={clearSelection}
            disabled={busy || selectedIds.length === 0}
          >
            Clear
          </button>
        </>
      ) : (
        <span className={styles.hint}>
          {isDetail
            ? "Edit the text fields on this page, then save."
            : "Select a game from the catalog to edit or delete it."}
        </span>
      )}
      <span
        className={`${styles.status} ${error ? styles.error : ""}`}
        role="status"
        aria-live="polite"
      >
        {error || status || "Local development only"}
      </span>
      <button
        type="button"
        className={styles.barButton}
        onClick={toggleActive}
        disabled={busy}
      >
        Exit
      </button>
    </div>
  );
}

type FormValues = Record<EditableField, string>;

function valuesFromGame(game: Game): FormValues {
  return {
    name: game.name,
    description: game.description,
    author: game.author,
    releaseDate: new Date(game.releaseDate).toISOString(),
    hnUrl: game.hnUrl,
    playUrl: game.playUrl,
    imageUrl: game.imageUrl,
    sourceCodeUrl: game.sourceCodeUrl ?? "",
  };
}

export function GameDetailEditor({ game }: { game: Game }) {
  const { active } = useEditMode();
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => valuesFromGame(game));
  const [savedValues, setSavedValues] = useState<FormValues>(() =>
    valuesFromGame(game),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const next = valuesFromGame(game);
    setValues(next);
    setSavedValues(next);
    setError("");
  }, [game]);

  if (!EDIT_MODE_ENABLED || !active) return null;

  const dirty = EDITABLE_FIELDS.some(
    (field) => values[field] !== savedValues[field],
  );

  function updateField(field: EditableField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function reset() {
    setValues(savedValues);
    setMessage("");
    setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !dirty) return;

    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/dev/games/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: game.id, fields: values }),
      });
      const payload = (await response.json().catch(() => null)) as
        | UpdateResult
        | { error?: string }
        | null;
      if (!response.ok) {
        const text =
          payload && "error" in payload && payload.error
            ? payload.error
            : `Save failed (${response.status}).`;
        throw new Error(text);
      }
      const result = payload as UpdateResult;
      setSavedValues(values);
      setMessage(result.message || "Saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={styles.editor}
      aria-labelledby="edit-game-details-title"
    >
      <div className={styles.editorHead}>
        <div>
          <p className={styles.eyebrow}>LOCAL EDIT MODE</p>
          <h2 id="edit-game-details-title" className={styles.editorTitle}>
            Edit game details
          </h2>
          <p className={styles.note}>
            Text fields only. The game ID <code>{game.id}</code> is fixed.
            Saving writes to <code>scripts/data/*.json</code> and recompiles the
            catalog.
          </p>
        </div>
        <span
          className={`${styles.dirty} ${dirty ? styles.dirtyOn : ""}`}
          aria-live="polite"
        >
          {dirty ? "Unsaved" : "Saved"}
        </span>
      </div>
      <form onSubmit={save}>
        <div className={styles.fields}>
          {EDITABLE_FIELDS.map((field) => {
            const inputId = `edit-${field}`;
            const hintId = `${inputId}-hint`;
            const hint = EDITABLE_FIELD_HINTS[field];
            const isDescription = field === "description";
            return (
              <div
                key={field}
                className={`${styles.field} ${
                  isDescription ? styles.fieldFull : ""
                }`}
              >
                <label className={styles.label} htmlFor={inputId}>
                  {EDITABLE_FIELD_LABELS[field]}
                </label>
                {isDescription ? (
                  <textarea
                    id={inputId}
                    className={styles.textarea}
                    value={values[field]}
                    onChange={(event) => updateField(field, event.target.value)}
                    rows={4}
                    disabled={busy}
                    aria-describedby={hint ? hintId : undefined}
                  />
                ) : (
                  <input
                    id={inputId}
                    className={styles.input}
                    value={values[field]}
                    onChange={(event) => updateField(field, event.target.value)}
                    disabled={busy}
                    aria-describedby={hint ? hintId : undefined}
                  />
                )}
                {hint && (
                  <span id={hintId} className={styles.fieldHint}>
                    {hint}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primary}
            disabled={busy || !dirty}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={reset}
            disabled={busy || !dirty}
          >
            Reset
          </button>
          <span
            className={`${styles.status} ${error ? styles.error : ""}`}
            role="status"
            aria-live="polite"
          >
            {error || message}
          </span>
        </div>
      </form>
    </section>
  );
}
