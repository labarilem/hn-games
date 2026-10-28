/**
 * Production replacement for the shared edit-mode helpers. Only the error
 * shape is kept because the (inert) API route still maps errors to responses.
 */

export class EditModeError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "EditModeError";
    this.status = status;
  }
}
