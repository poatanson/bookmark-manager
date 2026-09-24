export type Folder = {
  id: string;
  name: string;
  created_at: string;
};

export type Bookmark = {
  id: string;
  folder_id: string | null;
  url: string;
  title: string;
  description: string | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
};

export type ActionResult = { ok: boolean; error?: string; message?: string };
