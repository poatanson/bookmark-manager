"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

// ---------- Auth ----------

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signIn(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(
    readCredentials(formData),
  );
  if (error) return { ok: false, error: error.message };
  redirect("/");
}

export async function signUp(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(readCredentials(formData));
  if (error) return { ok: false, error: error.message };
  if (!data.session) {
    return {
      ok: true,
      message: "확인 이메일을 보냈습니다. 메일의 링크를 클릭한 뒤 로그인하세요.",
    };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------- Bookmarks ----------

function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
    // javascript: 등 위험한 스킴 차단
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseTags(raw: string): string[] {
  const tags = raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(tags)];
}

function readBookmark(formData: FormData) {
  const url = normalizeUrl(String(formData.get("url") ?? ""));
  if (!url) return { error: "올바른 URL을 입력하세요 (http/https)." } as const;

  const title = String(formData.get("title") ?? "").trim() || new URL(url).hostname;
  const description = String(formData.get("description") ?? "").trim() || null;
  const folderId = String(formData.get("folder_id") ?? "") || null;
  const tags = parseTags(String(formData.get("tags") ?? ""));

  return { data: { url, title, description, folder_id: folderId, tags } } as const;
}

export async function saveBookmark(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = readBookmark(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { error } = id
    ? await supabase.from("bookmarks").update(parsed.data).eq("id", id)
    : await supabase.from("bookmarks").insert(parsed.data);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/");
  return { ok: true };
}

export async function deleteBookmark(id: string) {
  const supabase = await createClient();
  await supabase.from("bookmarks").delete().eq("id", id);
  revalidatePath("/");
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
  const supabase = await createClient();
  await supabase.from("bookmarks").update({ is_favorite: !isFavorite }).eq("id", id);
  revalidatePath("/");
}

// ---------- Folders ----------

export async function addFolder(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const supabase = await createClient();
  await supabase.from("folders").insert({ name });
  revalidatePath("/");
}

export async function deleteFolder(id: string) {
  const supabase = await createClient();
  await supabase.from("folders").delete().eq("id", id);
  revalidatePath("/");
}
