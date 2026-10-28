/**
 * Shared types and helpers for the local-only edit mode.
 *
 * Nothing in this module touches the filesystem, so it is safe to import from
 * both the client UI and the dev API implementation. The whole feature is
 * replaced with inert stubs in production (see next.config.js).
 */

export const EDITABLE_FIELDS = [
  "name",
  "description",
  "author",
  "releaseDate",
  "hnUrl",
  "playUrl",
  "imageUrl",
  "sourceCodeUrl",
] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];

export type EditableFields = Partial<Record<EditableField, string>>;

export const EDITABLE_FIELD_LABELS: Record<EditableField, string> = {
  name: "Name",
  description: "Description",
  author: "Author",
  releaseDate: "Release date",
  hnUrl: "HN discussion URL",
  playUrl: "Play URL",
  imageUrl: "Image URL",
  sourceCodeUrl: "Source code URL",
};

export const EDITABLE_FIELD_HINTS: Partial<Record<EditableField, string>> = {
  releaseDate: "ISO 8601, e.g. 2024-05-17T12:00:00.000Z",
  imageUrl: "A site-relative path like /images/games/123.jpg or an http(s) URL",
  sourceCodeUrl: "Leave empty for games without public source code",
};

export const EDITABLE_FIELD_LIMITS: Record<EditableField, number> = {
  name: 200,
  description: 4000,
  author: 100,
  releaseDate: 100,
  hnUrl: 2048,
  playUrl: 2048,
  imageUrl: 2048,
  sourceCodeUrl: 2048,
};

export type UpdateResult = {
  ok: true;
  id: string;
  file: string;
  message: string;
};

export type DeleteResult = {
  ok: true;
  deletedIds: string[];
  missingIds: string[];
  message: string;
};

export class EditModeError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "EditModeError";
    this.status = status;
  }
}
