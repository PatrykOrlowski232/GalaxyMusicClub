import { z } from "zod";
import { requireDoorStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import { checkInTicketByNumber } from "@/server/door";

const schema = z.object({
  number: z.string().min(3).max(50),
});

export async function POST(request: Request) {
  try {
    const { user, error } = await requireDoorStaff();
    if (error || !user) return error;

    const body = schema.parse(await request.json());
    const result = await checkInTicketByNumber(body.number, user.id);

    if (!result.ok) {
      if (result.reason === "cancelled") {
        return jsonError("Bilet anulowany.", 409);
      }
      return jsonError("Nie znaleziono biletu o tym numerze.", 404);
    }

    return jsonOk({
      ticket: result.ticket,
      message: result.ticket.alreadyRealized
        ? "Bilet już wcześniej zrealizowany."
        : "Wejście OK — bilet zrealizowany.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(err.issues[0]?.message ?? "Nieprawidłowy numer.", 400);
    }
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie udało się zrealizować biletu.", 500);
  }
}
