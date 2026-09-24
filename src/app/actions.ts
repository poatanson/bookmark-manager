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

// 에러뿐 아니라 영향받은 행이 0개인 경우(이미 삭제됨, RLS 거부)도 실패로 본다.
function result(
  error: { message: string } | null,
  count: number | null,
  failMessage: string,
): ActionResult {
  if (error) return { ok: false, error: `${failMessage}: ${error.message}` };
  if (count === 0) return { ok: false, error: `${failMessage}: 이미 삭제되었거나 권한이 없습니다.` };
  return { ok: true };
}

export async function deleteBookmark(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("bookmarks")
    .delete({ count: "exact" })
    .eq("id", id);
  revalidatePath("/");
  return result(error, count, "북마크를 삭제하지 못했습니다");
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("bookmarks")
    .update({ is_favorite: !isFavorite }, { count: "exact" })
    .eq("id", id);
  revalidatePath("/");
  return result(error, count, "즐겨찾기를 변경하지 못했습니다");
}

// ---------- Folders ----------

export async function addFolder(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "폴더 이름을 입력하세요." };
  const supabase = await createClient();
  const { error } = await supabase.from("folders").insert({ name });
  if (error) return { ok: false, error: `폴더를 추가하지 못했습니다: ${error.message}` };
  revalidatePath("/");
  return { ok: true };
}

export async function deleteFolder(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("folders")
    .delete({ count: "exact" })
    .eq("id", id);
  revalidatePath("/");
  return result(error, count, "폴더를 삭제하지 못했습니다");
}
