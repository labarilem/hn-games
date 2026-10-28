import { NextResponse } from "next/server";
import { EditModeError } from "@/dev/edit-fields";
import { isDevEditRequest, updateGameFields } from "@/dev/edit-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDevEditRequest(request))
    return new NextResponse("Not found", { status: 404 });

  try {
    const payload: unknown = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      throw new EditModeError(400, "Invalid request body.");

    const { id, fields } = payload as { id?: unknown; fields?: unknown };
    const result = await updateGameFields(id, fields);
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof EditModeError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status });
  }
}
