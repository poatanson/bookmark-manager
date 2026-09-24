"use client";

export default function ConfirmButton({
  action,
  message,
}: {
  action: () => Promise<void>;
  message: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <button className="btn-ghost px-2 py-1 text-xs hover:text-red-500">삭제</button>
    </form>
  );
}
