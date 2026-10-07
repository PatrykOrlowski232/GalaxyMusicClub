import { z } from "zod";
import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import { writeAudit } from "@/server/admin";
import {
  generateAndStoreEventSummary,
  listEventSummaries,
} from "@/server/reports";

export async function GET(request: Request) {
  try {
    const { error } = await requireStaff();
    if (error) return error;

    const url = new URL(request.url);
    const eventIdRaw = url.searchParams.get("eventId");
    const eventId = eventIdRaw ? Number(eventIdRaw) : undefined;
    if (eventIdRaw && (!Number.isFinite(eventId) || (eventId as number) < 1)) {
      return jsonError("Nieprawidłowe eventId.");
    }

    const reports = await listEventSummaries(eventId);
    return jsonOk({ reports });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Błąd listy raportów.", 500);
  }
}

const createSchema = z.object({
  eventId: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = createSchema.parse(await request.json());
    const result = await generateAndStoreEventSummary({
      eventId: body.eventId,
      generatedBy: user.id,
    });

    await writeAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "event_summaries",
      entityId: result.id,
      newValue: {
        eventId: body.eventId,
        onlineSalesTotal: result.snapshot.onlineSalesTotal,
        pdfFilename: result.pdfFilename,
      },
    });

    return jsonOk(
      {
        id: result.id,
        pdfFilename: result.pdfFilename,
        snapshot: result.snapshot,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(err.issues[0]?.message ?? "Nieprawidłowe dane.");
    }
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    const msg = err instanceof Error ? err.message : "Nie wygenerowano raportu.";
    console.error(err);
    return jsonError(msg, 500);
  }
}
