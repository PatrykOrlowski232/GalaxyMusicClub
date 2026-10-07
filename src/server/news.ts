import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { newsPosts, newsletterSends, users } from "@/db/schema";
import { buildNewsEmail, sendNewsletterEmails } from "@/lib/mail";

export const NEWS_CATEGORIES = ["event", "promo", "general"] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export function newsCategoryLabel(category: string) {
  switch (category) {
    case "event":
      return "Wydarzenie";
    case "promo":
      return "Promocja";
    default:
      return "Aktualność";
  }
}

function mapPost(row: typeof newsPosts.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    categoryLabel: newsCategoryLabel(row.category),
    isPublished: row.isPublished,
    authorId: row.authorId,
    publishedAt:
      row.publishedAt instanceof Date
        ? row.publishedAt.toISOString()
        : String(row.publishedAt),
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
  };
}

export async function listPublishedNews() {
  const rows = await db
    .select()
    .from(newsPosts)
    .where(eq(newsPosts.isPublished, true))
    .orderBy(desc(newsPosts.publishedAt));
  return rows.map(mapPost);
}

export async function listAllNews() {
  const rows = await db
    .select()
    .from(newsPosts)
    .orderBy(desc(newsPosts.publishedAt));
  return rows.map(mapPost);
}

export async function getNewsPost(id: number) {
  const [row] = await db.select().from(newsPosts).where(eq(newsPosts.id, id)).limit(1);
  return row ? mapPost(row) : null;
}

export async function createNewsPost(input: {
  title: string;
  body: string;
  category: NewsCategory;
  isPublished?: boolean;
  authorId: number | null;
}) {
  const result = await db.insert(newsPosts).values({
    title: input.title.trim(),
    body: input.body.trim(),
    category: input.category,
    isPublished: input.isPublished ?? true,
    authorId: input.authorId,
    publishedAt: new Date(),
  });
  return Number(result[0].insertId);
}

export async function updateNewsPost(
  id: number,
  data: {
    title?: string;
    body?: string;
    category?: NewsCategory;
    isPublished?: boolean;
  },
) {
  await db
    .update(newsPosts)
    .set({
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.body !== undefined ? { body: data.body.trim() } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
    })
    .where(eq(newsPosts.id, id));
}

export async function deleteNewsPost(id: number) {
  await db.delete(newsPosts).where(eq(newsPosts.id, id));
}

export async function listNewsletterRecipients() {
  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.isNewsletterMember, true));
  return rows.map((r) => r.email);
}

export async function sendNewsToNewsletter(input: {
  postId: number;
  sentBy: number | null;
}) {
  const post = await getNewsPost(input.postId);
  if (!post) throw new Error("Post nie istnieje.");
  if (!post.isPublished) {
    throw new Error("Opublikuj post przed wysyłką newslettera.");
  }

  const recipients = await listNewsletterRecipients();
  const email = buildNewsEmail({
    title: post.title,
    body: post.body,
    categoryLabel: post.categoryLabel,
  });
  const subject = `Galaxy · ${post.title}`;

  const result = await sendNewsletterEmails({
    subject,
    html: email.html,
    text: email.text,
    recipients,
  });

  await db.insert(newsletterSends).values({
    newsPostId: post.id,
    subject,
    recipientCount: result.sent,
    sentBy: input.sentBy,
  });

  return {
    sent: result.sent,
    dryRun: result.dryRun,
    subject,
    recipients: recipients.length,
  };
}

export async function listNewsletterSends(limit = 30) {
  const rows = await db
    .select()
    .from(newsletterSends)
    .orderBy(desc(newsletterSends.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    newsPostId: r.newsPostId,
    subject: r.subject,
    recipientCount: r.recipientCount,
    sentBy: r.sentBy,
    createdAt:
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : String(r.createdAt),
  }));
}
