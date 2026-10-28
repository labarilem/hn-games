/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Production replacement for the local edit-mode UI.
 *
 * next.config.js aliases `@/dev/edit-mode` to this module when building or
 * serving a production bundle. Keeping the implementation here inert means
 * the real editor is never reachable on the public site.
 */

import type { ReactNode } from "react";
import type { Game } from "@/types/game";

export function EditModeProvider({ children }: { children: ReactNode }) {
  return children;
}

export function EditModeToggle() {
  return null;
}

export function EditModeBar() {
  return null;
}

export function CatalogPageRegistration(_props: { ids: string[] }) {
  return null;
}

export function SelectableGameCard({
  children,
}: {
  gameId: string;
  gameName: string;
  children: ReactNode;
}) {
  return children;
}

export function GameDetailEditor(_props: { game: Game }) {
  return null;
}
