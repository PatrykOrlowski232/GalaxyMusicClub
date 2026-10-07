import { z } from "zod";
import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import { writeAudit } from "@/server/admin";
import {
  NEWS_CATEGORIES,
  createNewsPost,
  deleteNewsPost,
  listAllNews,
  updateNewsPost,
} from "@/server/news";

export async function GET() {
  try {
    const { error } = await requireStaff();
    if (error) return error;
    return jsonOk({ posts: await listAllNews() });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Błąd aktualności.", 500);
  }
}

const createSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(2).max(10000),
  category: z.enum(NEWS_CATEGORIES).default("general"),
  isPublished: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = createSchema.parse(await request.json());
    const id = await createNewsPost({
      ...body,
      authorId: user.id,
    });
    await writeAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "news_posts",
      entityId: id,
      newValue: body,
    });
    return jsonOk({ id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(err.issues[0]?.message ?? "Nieprawidłowe dane.");
    }
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie utworzono posta.", 500);
  }
}

const updateSchema = createSchema.partial().extend({
  id: z.number().int().positive(),
});

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = updateSchema.parse(await request.json());
    const { id, ...data } = body;
    await updateNewsPost(id, data);
    await writeAudit({
      userId: user.id,
      action: "UPDATE",
      entityType: "news_posts",
      entityId: id,
      newValue: data,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(err.issues[0]?.message ?? "Nieprawidłowe dane.");
    }
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie zaktualizowano posta.", 500);
  }
}

const deleteSchema = z.object({ id: z.number().int().positive() });

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = deleteSchema.parse(await request.json());
    await deleteNewsPost(body.id);
    await writeAudit({
      userId: user.id,
      action: "DELETE",
      entityType: "news_posts",
      entityId: body.id,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return jsonError(err.issues[0]?.message ?? "Nieprawidłowe dane.");
    }
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie usunięto posta.", 500);
  }
}
