"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { HeroItem } from "@/app/api/home/route";

function Wrap({
  item,
  className,
  children,
}: {
  item: HeroItem;
  className: string;
  children: ReactNode;
}) {
  if (!item.href) return <div className={className}>{children}</div>;
  if (item.external) {
    return (
      <a className={className} href={item.href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link className={className} href={item.href}>
      {children}
    </Link>
  );
}

export default function Hero({ lead, side }: { lead: HeroItem | null; side: HeroItem[] }) {
  if (!lead) return null;

  return (
    <div className="hero">
      <Wrap item={lead} className="heroLead">
        <span className="heroKicker">{lead.kicker}</span>
        <h1 className="heroTitle">{lead.title}</h1>
        {lead.body && <p className="heroBody">{lead.body}</p>}
        <span className="heroMeta">{lead.meta}</span>
      </Wrap>

      <div className="heroSide">
        {side.map((s, i) => (
          <Wrap key={i} item={s} className="heroSideItem">
            <span className="heroSideKicker">{s.kicker}</span>
            <span className="heroSideTitle">{s.title}</span>
            <span className="heroSideMeta">{s.meta}</span>
          </Wrap>
        ))}
      </div>
    </div>
  );
}
