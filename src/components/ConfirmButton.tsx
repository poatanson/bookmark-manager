"use client";

import type { ActionResult } from "@/lib/types";
import ActionForm from "@/components/ActionForm";

export default function ConfirmButton({
  action,
  message,
}: {
  action: () => Promise<ActionResult>;
  message: string;
}) {
  return (
    <ActionForm
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <button className="btn-ghost px-2 py-1 text-xs hover:text-red-500">삭제</button>
    </ActionForm>
  );
}
