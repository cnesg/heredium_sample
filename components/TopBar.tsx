"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Scope } from "@/lib/data";

const NAV = [
  { href: "/", label: "트렌드" },
  { href: "/artists", label: "작가" },
  { href: "/exhibitions", label: "전시" },
  { href: "/market", label: "시장" },
  { href: "/calendar", label: "캘린더" },
  { href: "/sources", label: "소스" },
];

export default function TopBar({
  scope,
  onScope,
  onAsk,
}: {
  scope?: Scope;
  onScope?: (s: Scope) => void;
  onAsk?: () => void;
}) {
  const path = usePathname();

  return (
    <header className="topbar">
      <div className="topbarInner">
        <Link href="/" className="wordmark">
          ART<em>rend</em>
        </Link>

        <nav className="nav" aria-label="주요 메뉴">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={path === n.href ? "page" : undefined}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="topbarRight">
          {onAsk && (
            <button type="button" className="askOpen" onClick={onAsk}>
              <span aria-hidden="true">✦</span> 물어보기
            </button>
          )}
          {scope && onScope && (
            <div className="scope" role="group" aria-label="지역 범위">
              <button type="button" aria-pressed={scope === "kr"} onClick={() => onScope("kr")}>
                국내
              </button>
              <button type="button" aria-pressed={scope === "intl"} onClick={() => onScope("intl")}>
                해외
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
