import Link from "next/link";
import type { Bookmark, Folder } from "@/lib/types";
import { deleteBookmark, toggleFavorite } from "@/app/actions";
import BookmarkForm from "@/components/BookmarkForm";
import ConfirmButton from "@/components/ConfirmButton";

export default function BookmarkCard({
  bookmark,
  folders,
}: {
  bookmark: Bookmark;
  folders: Folder[];
}) {
  const host = new URL(bookmark.url).hostname;
  const folder = folders.find((f) => f.id === bookmark.folder_id);

  return (
    <li className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
          alt=""
          width={32}
          height={32}
          className="mt-0.5 size-8 shrink-0 rounded"
        />
        <div className="min-w-0 flex-1">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-2 font-medium hover:text-indigo-600"
          >
            {bookmark.title}
          </a>
          <p className="truncate text-xs text-zinc-500">{host}</p>
        </div>
        <form action={toggleFavorite.bind(null, bookmark.id, bookmark.is_favorite)}>
          <button
            title={bookmark.is_favorite ? "즐겨찾기 해제" : "즐겨찾기"}
            className={`text-xl leading-none ${
              bookmark.is_favorite ? "text-amber-400" : "text-zinc-300 hover:text-amber-400 dark:text-zinc-600"
            }`}
          >
            {bookmark.is_favorite ? "★" : "☆"}
          </button>
        </form>
      </div>

      {bookmark.description && (
        <p className="mt-3 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
          {bookmark.description}
        </p>
      )}

      {bookmark.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {bookmark.tags.map((tag) => (
            <Link
              key={tag}
              href={`/?tag=${encodeURIComponent(tag)}`}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center gap-1 pt-3 text-xs text-zinc-500">
        {folder && <span className="mr-auto truncate">📁 {folder.name}</span>}
        <span className={folder ? "" : "mr-auto"}>
          {new Date(bookmark.created_at).toLocaleDateString("ko-KR")}
        </span>
        <BookmarkForm folders={folders} bookmark={bookmark} />
        <ConfirmButton
          action={deleteBookmark.bind(null, bookmark.id)}
          message={`'${bookmark.title}' 북마크를 삭제할까요?`}
        />
      </div>
    </li>
  );
}
