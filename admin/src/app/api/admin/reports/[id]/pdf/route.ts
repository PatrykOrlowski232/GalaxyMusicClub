import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError } from "@/lib/api";
import { getEventSummaryPdf } from "@/server/reports";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  try {
    const { error } = await requireStaff();
    if (error) return error;

    const { id: raw } = await params;
    const id = Number(raw);
    if (!Number.isFinite(id) || id < 1) {
      return jsonError("Nieprawidłowe id raportu.");
    }

    const pdf = await getEventSummaryPdf(id);
    if (!pdf) return jsonError("Raport nie istnieje.", 404);

    return new Response(new Uint8Array(pdf.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie udało się pobrać PDF.", 500);
  }
}
