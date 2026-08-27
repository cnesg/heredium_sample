"use client";

import { useEffect, useState } from "react";

/**
 * 챗봇이 켜져 있는지 한 번 확인한다. 꺼져 있으면 버튼 자체를 그리지 않는다 —
 * 눌러도 "꺼져 있습니다"만 뜨는 버튼은 화면에 둘 이유가 없다.
 */
export function useAskEnabled(): boolean {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/ask")
      .then((r) => r.json())
      .then((d) => alive && setOn(Boolean(d.enabled)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return on;
}
