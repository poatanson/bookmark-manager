"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SearchBar({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (value === (searchParams.get("q") ?? "")) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      const s = params.toString();
      router.replace(s ? `${pathname}?${s}` : pathname);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, searchParams, pathname, router]);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="🔍 제목, URL, 설명 검색"
      className="input max-w-md flex-1"
    />
  );
}
