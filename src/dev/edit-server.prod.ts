/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Production replacement for the local edit-mode server implementation.
 *
 * next.config.js aliases `@/dev/edit-server` here for production builds, so no
 * filesystem or child-process code from the dev editor is included.
 */

import type { DeleteResult, UpdateResult } from "./edit-fields";

export function isDevEditRequest(_request: Request): boolean {
  return false;
}

export function updateGameFields(
  _id: unknown,
  _fields: unknown,
): Promise<UpdateResult> {
  return Promise.reject(
    new Error("Edit mode is only available in local development."),
  );
}

export function deleteGames(_ids: unknown): Promise<DeleteResult> {
  return Promise.reject(
    new Error("Edit mode is only available in local development."),
  );
}
