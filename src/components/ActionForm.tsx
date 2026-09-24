"use client";

import { useActionState, useEffect, type ComponentProps } from "react";
import type { ActionResult } from "@/lib/types";

type Props = Omit<ComponentProps<"form">, "action"> & {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
};

// 서버 액션이 { ok: false } 를 돌려주면 사용자에게 알린다.
export default function ActionForm({ action, ...props }: Props) {
  const [state, formAction] = useActionState(action, null);

  useEffect(() => {
    if (state && !state.ok) alert(state.error ?? "요청을 처리하지 못했습니다.");
  }, [state]);

  return <form action={formAction} {...props} />;
}
