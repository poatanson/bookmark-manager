"use client";

import { useActionState, useEffect, useState } from "react";
import type { Bookmark, Folder } from "@/lib/types";
import { saveBookmark } from "@/app/actions";

type Props = {
  folders: Folder[];
  bookmark?: Bookmark;
  defaultFolderId?: string;
};

export default function BookmarkForm({ folders, bookmark, defaultFolderId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {bookmark ? (
        <button onClick={() => setOpen(true)} className="btn-ghost px-2 py-1 text-xs">
          수정
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="btn-primary">
          + 북마크 추가
        </button>
      )}
      {open && (
        <Modal
          folders={folders}
          bookmark={bookmark}
          defaultFolderId={defaultFolderId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function Modal({ folders, bookmark, defaultFolderId, onClose }: Props & { onClose: () => void }) {
  const [state, action, pending] = useActionState(saveBookmark, null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        action={action}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
      >
        <h3 className="text-lg font-semibold">{bookmark ? "북마크 수정" : "북마크 추가"}</h3>
        {bookmark && <input type="hidden" name="id" value={bookmark.id} />}

        <label className="block space-y-1">
          <span className="text-sm text-zinc-500">URL *</span>
          <input
            name="url"
            required
            autoFocus
            defaultValue={bookmark?.url}
            placeholder="https://example.com"
            className="input"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-500">제목 (비우면 도메인 사용)</span>
          <input name="title" defaultValue={bookmark?.title} className="input" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-500">설명</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={bookmark?.description ?? ""}
            className="input resize-none"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-500">폴더</span>
          <select
            name="folder_id"
            defaultValue={bookmark ? (bookmark.folder_id ?? "") : (defaultFolderId ?? "")}
            className="input"
          >
            <option value="">(폴더 없음)</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-500">태그 (쉼표로 구분)</span>
          <input
            name="tags"
            defaultValue={bookmark?.tags.join(", ")}
            placeholder="react, 공부, 참고"
            className="input"
          />
        </label>

        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            취소
          </button>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}
