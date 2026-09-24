import Link from "next/link";
import type { Folder } from "@/lib/types";
import { addFolder, deleteFolder } from "@/app/actions";

type Active = { q?: string; folder?: string; tag?: string; fav?: string };

function href(active: Active, filter: Record<string, string>) {
  const params = new URLSearchParams(filter);
  if (active.q) params.set("q", active.q);
  const s = params.toString();
  return s ? `/?${s}` : "/";
}

function itemClass(selected: boolean) {
  return `flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${
    selected
      ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
  }`;
}

export default function Sidebar({
  folders,
  tags,
  active,
}: {
  folders: Folder[];
  tags: [string, number][];
  active: Active;
}) {
  const noFilter = !active.folder && !active.tag && !active.fav;

  return (
    <aside className="border-b border-zinc-200 bg-white p-4 md:w-64 md:shrink-0 md:border-r md:border-b-0 dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="mb-4 px-3 text-lg font-bold">🔖 북마크</h1>

      <nav className="space-y-1">
        <Link href={href(active, {})} className={itemClass(noFilter)}>
          전체
        </Link>
        <Link href={href(active, { fav: "1" })} className={itemClass(!!active.fav)}>
          ⭐ 즐겨찾기
        </Link>
      </nav>

      <details open className="mt-6">
        <summary className="cursor-pointer px-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          폴더
        </summary>
        <ul className="mt-2 space-y-1">
          {folders.map((f) => (
            <li key={f.id} className="group relative">
              <Link
                href={href(active, { folder: f.id })}
                className={itemClass(active.folder === f.id)}
              >
                📁 {f.name}
              </Link>
              <form
                action={deleteFolder.bind(null, f.id)}
                className="absolute top-1/2 right-2 -translate-y-1/2"
              >
                <button
                  title="폴더 삭제 (북마크는 유지됨)"
                  className="hidden px-1 text-zinc-400 group-hover:block hover:text-red-500"
                >
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addFolder} className="mt-2 flex gap-1 px-1">
          <input name="name" placeholder="새 폴더" required maxLength={100} className="input py-1" />
          <button className="btn-ghost px-2 py-1" title="폴더 추가">
            +
          </button>
        </form>
      </details>

      {tags.length > 0 && (
        <details open className="mt-6">
          <summary className="cursor-pointer px-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            태그
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5 px-2">
            {tags.map(([tag, count]) => (
              <Link
                key={tag}
                href={href(active, { tag })}
                className={`rounded-full px-2.5 py-0.5 text-xs ${
                  active.tag === tag
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                #{tag} <span className="opacity-60">{count}</span>
              </Link>
            ))}
          </div>
        </details>
      )}
    </aside>
  );
}
