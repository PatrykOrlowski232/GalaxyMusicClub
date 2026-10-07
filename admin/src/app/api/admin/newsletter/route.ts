import { z } from "zod";
import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import { writeAudit } from "@/server/admin";
import {
  listNewsletterRecipients,
  listNewsletterSends,
  sendNewsToNewsletter,
} from "@/server/news";
import { isMailConfigured } from "@/lib/mail";

export async function GET() {
  try {
    const { error } = await requireStaff();
    if (error) return error;
    const [recipients, sends] = await Promise.all([
      listNewsletterRecipients(),
      listNewsletterSends(),
    ]);
    return jsonOk({
      subscriberCount: recipients.length,
      mailConfigured: isMailConfigured(),
      sends,
    });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Błąd newslettera.", 500);
  }
}

const sendSchema = z.object({
  postId: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const body = sendSchema.parse(await request.json());
    const result = await sendNewsToNewsletter({
      postId: body.postId,
      sentBy: user.id,
    });

    await writeAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "newsletter_sends",
      newValue: result,
    });

    return jsonOk(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(err.issues[0]?.message ?? "Nieprawidłowe dane.");
    }
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    const msg = err instanceof Error ? err.message : "Wysyłka nie powiodła się.";
    console.error(err);
    return jsonError(msg, 500);
  }
}
