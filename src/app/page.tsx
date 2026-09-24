import { createClient } from "@/lib/supabase/server";
import type { Bookmark, Folder } from "@/lib/types";
import { signOut } from "@/app/actions";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import BookmarkForm from "@/components/BookmarkForm";
import BookmarkCard from "@/components/BookmarkCard";

type Filters = { q?: string; folder?: string; tag?: string; fav?: string };

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = (await searchParams) as Filters;
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const email = claims?.claims.email as string | undefined;

  let query = supabase
    .from("bookmarks")
    .select("*")
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false });

  // PostgREST or() 문법을 깨뜨리는 문자는 제거
  const q = params.q?.replace(/[,()*%\\"]/g, " ").trim();
  if (q) {
    query = query.or(`title.ilike.%${q}%,url.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (params.folder) query = query.eq("folder_id", params.folder);
  if (params.tag) query = query.contains("tags", [params.tag]);
  if (params.fav) query = query.eq("is_favorite", true);

  const [{ data: bookmarks, error }, { data: folders }, { data: tagRows }] =
    await Promise.all([
      query.returns<Bookmark[]>(),
      supabase.from("folders").select("*").order("name").returns<Folder[]>(),
      supabase.from("bookmarks").select("tags").returns<Pick<Bookmark, "tags">[]>(),
    ]);

  const tagCounts = new Map<string, number>();
  tagRows?.forEach((row) =>
    row.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)),
  );
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);

  const folderList = folders ?? [];
  const activeFolder = folderList.find((f) => f.id === params.folder);
  const heading = params.fav
    ? "⭐ 즐겨찾기"
    : activeFolder
      ? `📁 ${activeFolder.name}`
      : params.tag
        ? `# ${params.tag}`
        : "전체 북마크";

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar folders={folderList} tags={tags} active={params} />

      <main className="flex-1 p-4 md:p-8">
        <header className="mb-6 flex flex-wrap items-center gap-3">
          <SearchBar defaultValue={params.q ?? ""} />
          <BookmarkForm folders={folderList} defaultFolderId={params.folder} />
          <form action={signOut} className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-zinc-500 sm:inline">{email}</span>
            <button className="btn-ghost">로그아웃</button>
          </form>
        </header>

        <h2 className="mb-4 text-lg font-semibold">
          {heading}
          <span className="ml-2 text-sm font-normal text-zinc-500">
            {bookmarks?.length ?? 0}개
          </span>
        </h2>

        {error ? (
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40">
            데이터를 불러오지 못했습니다: {error.message}
            <br />
            <code>supabase/schema.sql</code>을 Supabase SQL Editor에서 실행했는지 확인하세요.
          </p>
        ) : bookmarks && bookmarks.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {bookmarks.map((b) => (
              <BookmarkCard key={b.id} bookmark={b} folders={folderList} />
            ))}
          </ul>
        ) : (
          <p className="py-16 text-center text-zinc-500">
            {q || params.folder || params.tag || params.fav
              ? "조건에 맞는 북마크가 없습니다."
              : "아직 북마크가 없습니다. ‘+ 북마크 추가’로 시작해 보세요."}
          </p>
        )}
      </main>
    </div>
  );
}
