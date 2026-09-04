"use client";

import { useEffect, useRef } from "react";
import type { Npc } from "@/lib/manifest";
import { stillUrl } from "@/lib/media";
import { STRINGS } from "@/lib/strings";

export default function NpcCard({
  npc,
  mediaBase,
  onClose,
}: {
  npc: Npc;
  mediaBase: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={npc.nameEn}
    >
      <div className="w-full max-w-sm rounded-lg border border-amber-500/30 bg-zinc-900 p-4 text-zinc-100 shadow-xl">
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={stillUrl(mediaBase, npc.portrait, "jpg")}
            alt={npc.nameEn}
            className="h-20 w-20 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <div className="truncate text-lg font-medium">{npc.nameEn}</div>
            <div className="truncate text-zinc-400">
              {npc.nameZh} · {npc.pinyin}
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-zinc-300">{npc.blurbEn}</p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="mt-4 touch-manipulation rounded-full border border-zinc-600 px-4 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          {STRINGS.npcCard.close}
        </button>
      </div>
    </div>
  );
}
