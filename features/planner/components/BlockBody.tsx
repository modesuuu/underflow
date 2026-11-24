"use client";

import { useEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { Icon } from "@/components/ui/Icon";

// A Notion-style block body for the task detail panel, v1.
// One flat list of blocks per task. Implemented mechanics (from
// the hands-on Notion REA, 2026-11-24): slash menu insert with
// type-to-filter, markdown autoformat (#, ##, ###, [], >, ---),
// Enter splits a block, Enter on an empty to-do turns it back
// into text, Backspace on an empty block deletes it and joins
// the previous one, hover gutter with a + button (insert below
// and browse blocks) and a drag handle (pointer drag reorders
// with a live gap; a plain click opens the block menu with Turn
// into / Duplicate / Delete). Deliberately out of v1: nested
// children (a toggle carries one plain body text instead),
// indent, columns, rich text marks.

export type BlockType =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "todo"
  | "toggle"
  | "divider";

export type Block = {
  id: string;
  type: BlockType;
  text: string;
  checked?: boolean;
  open?: boolean;
  body?: string;
};

const BLOCK_DEFS: {
  type: BlockType;
  glyph: string;
  label: string;
  hint: string;
}[] = [
  { type: "text", glyph: "T", label: "Text", hint: "Plain paragraph" },
  { type: "h1", glyph: "H1", label: "Heading 1", hint: "Large section title" },
  { type: "h2", glyph: "H2", label: "Heading 2", hint: "Medium title" },
  { type: "h3", glyph: "H3", label: "Heading 3", hint: "Small title" },
  { type: "todo", glyph: "✓", label: "To-do", hint: "Checkbox item" },
  { type: "toggle", glyph: "▸", label: "Toggle", hint: "Collapsible note" },
  { type: "divider", glyph: "―", label: "Divider", hint: "Horizontal rule" },
];

let blockSeq = 0;
export function makeBlock(type: BlockType, text = ""): Block {
  blockSeq += 1;
  return {
    id: `b${blockSeq}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    text,
    ...(type === "todo" ? { checked: false } : {}),
    ...(type === "toggle" ? { open: true, body: "" } : {}),
  };
}

const TEXT_CLASS: Record<string, string> = {
  text: "text-[15px] leading-relaxed",
  h1: "text-[26px] font-semibold leading-snug",
  h2: "text-[21px] font-semibold leading-snug",
  h3: "text-[17px] font-semibold leading-snug",
  todo: "text-[15px] leading-relaxed",
  toggle: "text-[15px] font-medium leading-relaxed",
};

const PLACEHOLDER: Record<string, string> = {
  text: "Type '/' for blocks",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  todo: "To-do",
  toggle: "Toggle",
};

type DragBlocks = {
  id: string;
  from: number;
  target: number;
  dy: number;
  heights: number[];
};

export function BlockBody({
  blocks,
  editable,
  onChange,
}: {
  blocks: Block[];
  editable: boolean;
  onChange: (blocks: Block[]) => void;
}) {
  const [slash, setSlash] = useState<{ id: string; index: number } | null>(
    null,
  );
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragBlocks | null>(null);
  const [focusReq, setFocusReq] = useState<{ id: string; pos: number } | null>(
    null,
  );
  const taRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const slashOff = useRef<string | null>(null);

  // Focus a block after a structural change (insert, split,
  // delete, convert), placing the caret where the user expects.
  useEffect(() => {
    if (!focusReq) return;
    const ta = taRefs.current.get(focusReq.id);
    if (ta) {
      ta.focus();
      const pos =
        focusReq.pos < 0
          ? ta.value.length
          : Math.min(focusReq.pos, ta.value.length);
      ta.setSelectionRange(pos, pos);
    }
    setFocusReq(null);
  }, [focusReq]);

  const patch = (id: string, p: Partial<Block>) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...p } : b)));

  const insertAfter = (id: string, type: BlockType, text = ""): string => {
    const nb = makeBlock(type, text);
    const i = blocks.findIndex((b) => b.id === id);
    const next = [...blocks];
    next.splice(i + 1, 0, nb);
    onChange(next);
    return nb.id;
  };

  const removeBlock = (id: string) => {
    const i = blocks.findIndex((b) => b.id === id);
    const prev = blocks[i - 1];
    onChange(blocks.filter((b) => b.id !== id));
    if (prev && prev.type !== "divider") setFocusReq({ id: prev.id, pos: -1 });
  };

  const convertBlock = (id: string, type: BlockType) => {
    const b = blocks.find((x) => x.id === id);
    if (!b) return;
    patch(id, {
      type,
      text: type === "divider" ? "" : b.text,
      ...(type === "todo" ? { checked: b.checked ?? false } : {}),
      ...(type === "toggle" ? { open: b.open ?? true, body: b.body ?? "" } : {}),
    });
    setMenuFor(null);
    setSlash(null);
    if (type !== "divider") setFocusReq({ id, pos: -1 });
  };

  // Typing: markdown autoformat for text blocks, plus opening
  // the slash menu when a text block starts with "/".
  const handleText = (b: Block, value: string) => {
    if (b.type === "text") {
      const conv: [string, BlockType][] = [
        ["# ", "h1"],
        ["## ", "h2"],
        ["### ", "h3"],
        ["[] ", "todo"],
        ["> ", "toggle"],
      ];
      for (const [prefix, type] of conv) {
        if (value === prefix) {
          convertBlock(b.id, type);
          return;
        }
      }
    }
    patch(b.id, { text: value });
    if (b.type === "text" && value.startsWith("/")) {
      if (slashOff.current !== b.id) setSlash({ id: b.id, index: 0 });
    } else if (slash?.id === b.id) {
      setSlash(null);
    }
    if (!value.startsWith("/")) slashOff.current = null;
  };

  const slashQuery = (b: Block) =>
    b.text.startsWith("/") ? b.text.slice(1).toLowerCase() : "";
  const slashDefs = (b: Block) =>
    BLOCK_DEFS.filter((d) => d.label.toLowerCase().includes(slashQuery(b)));

  const chooseSlash = (b: Block, type: BlockType) => {
    slashOff.current = null;
    patch(b.id, { text: "" });
    convertBlock(b.id, type);
  };

  const handleKey = (
    b: Block,
    e: ReactKeyboardEvent<HTMLTextAreaElement>,
  ) => {
    const ta = e.currentTarget;
    if (slash?.id === b.id) {
      const defs = slashDefs(b);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlash({ id: b.id, index: Math.min(defs.length - 1, slash.index + 1) });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlash({ id: b.id, index: Math.max(0, slash.index - 1) });
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (defs[slash.index]) chooseSlash(b, defs[slash.index].type);
        return;
      }
      if (e.key === "Escape") {
        slashOff.current = b.id;
        setSlash(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (b.text === "---" && b.type === "text") {
        convertBlock(b.id, "divider");
        const nid = insertAfter(b.id, "text");
        setFocusReq({ id: nid, pos: 0 });
        return;
      }
      const caret = ta.selectionStart ?? b.text.length;
      const before = b.text.slice(0, caret);
      const after = b.text.slice(caret);
      if (b.type === "todo" && before === "" && after === "") {
        convertBlock(b.id, "text");
        return;
      }
      patch(b.id, { text: before });
      const nextType: BlockType = b.type === "todo" ? "todo" : "text";
      const nid = insertAfter(b.id, nextType, after);
      setFocusReq({ id: nid, pos: 0 });
      return;
    }
    if (e.key === "Backspace" && ta.selectionStart === ta.selectionEnd) {
      const caret = ta.selectionStart ?? 0;
      if (b.text === "") {
        e.preventDefault();
        removeBlock(b.id);
        return;
      }
      if (caret === 0) {
        const i = blocks.findIndex((x) => x.id === b.id);
        const prev = blocks[i - 1];
        if (!prev) return;
        e.preventDefault();
        if (prev.type === "divider") {
          onChange(blocks.filter((x) => x.id !== prev.id));
          setFocusReq({ id: b.id, pos: 0 });
        } else {
          const junction = prev.text.length;
          onChange(
            blocks
              .filter((x) => x.id !== b.id)
              .map((x) =>
                x.id === prev.id ? { ...x, text: x.text + b.text } : x,
              ),
          );
          setFocusReq({ id: prev.id, pos: junction });
        }
      }
      return;
    }
    if (
      e.key === "Delete" &&
      ta.selectionStart === ta.selectionEnd &&
      (ta.selectionStart ?? 0) === b.text.length
    ) {
      const i = blocks.findIndex((x) => x.id === b.id);
      const next = blocks[i + 1];
      if (next?.type === "divider") {
        e.preventDefault();
        onChange(blocks.filter((x) => x.id !== next.id));
      }
    }
  };

  // Pointer drag on the handle: the row follows the pointer and
  // the others shift to open the gap. A press that barely moves
  // counts as a click and opens the block menu instead.
  const onHandleDown = (
    e: ReactPointerEvent<HTMLButtonElement>,
    b: Block,
    index: number,
  ) => {
    if (!editable || e.button !== 0) return;
    e.preventDefault();
    const heights = blocks.map(
      (x) => rowRefs.current.get(x.id)?.offsetHeight ?? 30,
    );
    const startY = e.clientY;
    let cur: DragBlocks = { id: b.id, from: index, target: index, dy: 0, heights };
    setDrag(cur);
    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      const tops: number[] = [];
      let acc = 0;
      for (const h of heights) {
        tops.push(acc);
        acc += h;
      }
      const center = tops[index] + dy + heights[index] / 2;
      let target = heights.length - 1;
      for (let i = 0; i < heights.length; i++) {
        if (center < tops[i] + heights[i]) {
          target = i;
          break;
        }
      }
      cur = { ...cur, dy, target };
      setDrag({ ...cur });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDrag(null);
      if (Math.abs(cur.dy) < 4 && cur.target === cur.from) {
        setMenuFor(b.id);
        return;
      }
      if (cur.target !== cur.from) {
        const next = [...blocks];
        const [moved] = next.splice(cur.from, 1);
        next.splice(cur.target, 0, moved);
        onChange(next);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const rowShift = (i: number): number => {
    if (!drag) return 0;
    const h = drag.heights[drag.from];
    if (drag.from < drag.target && i > drag.from && i <= drag.target) return -h;
    if (drag.from > drag.target && i < drag.from && i >= drag.target) return h;
    return 0;
  };

  const duplicateBlock = (b: Block) => {
    const copy = makeBlock(b.type, b.text);
    copy.checked = b.checked;
    copy.open = b.open;
    copy.body = b.body;
    const i = blocks.findIndex((x) => x.id === b.id);
    const next = [...blocks];
    next.splice(i + 1, 0, copy);
    onChange(next);
    setMenuFor(null);
  };

  return (
    <div className="relative ml-9">
      {menuFor && (
        <div
          aria-hidden
          className="fixed inset-0 z-40"
          onClick={() => setMenuFor(null)}
        />
      )}
      {blocks.map((b, i) => {
        const isDragged = drag?.id === b.id;
        return (
          <div
            key={b.id}
            ref={(el) => {
              if (el) rowRefs.current.set(b.id, el);
              else rowRefs.current.delete(b.id);
            }}
            className={`group relative ${isDragged ? "z-20 rounded-md bg-surface shadow-xl" : ""}`}
            style={{
              transform: isDragged
                ? `translateY(${drag.dy}px)`
                : `translateY(${rowShift(i)}px)`,
              transition:
                drag && !isDragged
                  ? "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)"
                  : undefined,
            }}
          >
            {editable && (
              <div className="absolute top-1 -left-9 flex w-9 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Add block below"
                  className="flex h-6 w-4 items-center justify-center rounded text-muted hover:bg-active hover:text-ink"
                  onClick={() => {
                    const nid = insertAfter(b.id, "text");
                    slashOff.current = null;
                    setFocusReq({ id: nid, pos: 0 });
                    setSlash({ id: nid, index: 0 });
                  }}
                >
                  <Icon name="plus" size={13} />
                </button>
                <button
                  type="button"
                  aria-label="Drag to reorder, click for menu"
                  className="flex h-6 w-4 cursor-grab items-center justify-center rounded text-muted hover:bg-active hover:text-ink"
                  onPointerDown={(e) => onHandleDown(e, b, i)}
                >
                  <span className="grid grid-cols-2 gap-[2px]">
                    {Array.from({ length: 6 }).map((_, d) => (
                      <span
                        key={d}
                        className="h-[3px] w-[3px] rounded-full bg-current opacity-60"
                      />
                    ))}
                  </span>
                </button>
              </div>
            )}

            <div className="px-1 py-0.5">
              {b.type === "divider" ? (
                <div
                  tabIndex={editable ? 0 : -1}
                  title={editable ? "Divider — Backspace deletes it" : undefined}
                  onClick={(e) => e.currentTarget.focus()}
                  onKeyDown={(e) => {
                    if (!editable) return;
                    if (e.key === "Backspace" || e.key === "Delete") {
                      e.preventDefault();
                      removeBlock(b.id);
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const nid = insertAfter(b.id, "text");
                      setFocusReq({ id: nid, pos: 0 });
                    }
                  }}
                  className="group my-1 cursor-pointer rounded-md px-1 py-[7px] outline-none hover:bg-active focus:bg-active"
                >
                  <div className="border-t border-line group-focus:border-ink" />
                </div>
              ) : b.type === "todo" ? (
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    disabled={!editable}
                    aria-label="Toggle to-do"
                    onClick={() => patch(b.id, { checked: !b.checked })}
                    className={`mt-[5px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border ${
                      b.checked
                        ? "border-ink bg-ink text-surface"
                        : "border-line bg-surface"
                    }`}
                  >
                    {b.checked && <Icon name="check" size={12} />}
                  </button>
                  {editable ? (
                    <GrowTextarea
                      regRef={(el) => {
                        if (el) taRefs.current.set(b.id, el);
                        else taRefs.current.delete(b.id);
                      }}
                      value={b.text}
                      placeholder={PLACEHOLDER.todo}
                      onChange={(v) => handleText(b, v)}
                      onKeyDown={(e) => handleKey(b, e)}
                      className={`w-full bg-transparent text-ink outline-none placeholder:text-subtle ${TEXT_CLASS.todo} ${b.checked ? "text-muted line-through" : ""}`}
                    />
                  ) : (
                    <p
                      className={`${TEXT_CLASS.todo} ${b.checked ? "text-muted line-through" : "text-ink"}`}
                    >
                      {b.text}
                    </p>
                  )}
                </div>
              ) : b.type === "toggle" ? (
                <div>
                  <div className="flex items-start gap-1">
                    <button
                      type="button"
                      aria-label="Expand toggle"
                      onClick={() => patch(b.id, { open: !b.open })}
                      className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted hover:bg-active hover:text-ink"
                    >
                      <span
                        className={`flex transition-transform duration-200 ${b.open ? "rotate-90" : ""}`}
                      >
                        <Icon name="chevron-right" size={14} />
                      </span>
                    </button>
                    {editable ? (
                      <GrowTextarea
                        regRef={(el) => {
                          if (el) taRefs.current.set(b.id, el);
                          else taRefs.current.delete(b.id);
                        }}
                        value={b.text}
                        placeholder={PLACEHOLDER.toggle}
                        onChange={(v) => handleText(b, v)}
                        onKeyDown={(e) => handleKey(b, e)}
                        className={`w-full bg-transparent text-ink outline-none placeholder:text-subtle ${TEXT_CLASS.toggle}`}
                      />
                    ) : (
                      <p className={`${TEXT_CLASS.toggle} text-ink`}>{b.text}</p>
                    )}
                  </div>
                  {b.open &&
                    (editable ? (
                      <div className="ml-6">
                        <GrowTextarea
                          regRef={(el) => {
                            if (el) taRefs.current.set(`${b.id}:body`, el);
                            else taRefs.current.delete(`${b.id}:body`);
                          }}
                          value={b.body ?? ""}
                          placeholder="Toggle content"
                          onChange={(v) => patch(b.id, { body: v })}
                          onKeyDown={() => {}}
                          className="w-full bg-transparent text-[15px] leading-relaxed text-ink outline-none placeholder:text-subtle"
                        />
                      </div>
                    ) : (
                      b.body && (
                        <p className="ml-6 text-[15px] leading-relaxed text-ink">
                          {b.body}
                        </p>
                      )
                    ))}
                </div>
              ) : editable ? (
                <GrowTextarea
                  regRef={(el) => {
                    if (el) taRefs.current.set(b.id, el);
                    else taRefs.current.delete(b.id);
                  }}
                  value={b.text}
                  placeholder={PLACEHOLDER[b.type]}
                  onChange={(v) => handleText(b, v)}
                  onKeyDown={(e) => handleKey(b, e)}
                  className={`w-full bg-transparent text-ink outline-none placeholder:text-subtle ${TEXT_CLASS[b.type]}`}
                />
              ) : (
                <p className={`${TEXT_CLASS[b.type]} text-ink`}>{b.text}</p>
              )}
            </div>

            {editable && slash?.id === b.id && (
              <div className="absolute top-full left-8 z-50 mt-1 w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-2xl">
                {slashDefs(b).map((d, di) => (
                  <button
                    key={d.type}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      chooseSlash(b, d.type);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                      di === slash.index ? "bg-active" : ""
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line font-mono text-[11px] text-ink">
                      {d.glyph}
                    </span>
                    <span>
                      <span className="block text-sm text-ink">{d.label}</span>
                      <span className="block text-xs text-muted">{d.hint}</span>
                    </span>
                  </button>
                ))}
                {slashDefs(b).length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted">
                    No blocks match
                  </div>
                )}
              </div>
            )}

            {editable && menuFor === b.id && (
              <div className="absolute top-6 left-8 z-50 w-56 rounded-lg border border-line bg-surface py-1 shadow-2xl">
                <div className="px-3 pt-1.5 pb-1 font-mono text-[10px] font-medium tracking-wider text-muted uppercase">
                  Turn into
                </div>
                {BLOCK_DEFS.filter((d) => d.type !== b.type).map((d) => (
                  <button
                    key={d.type}
                    type="button"
                    onClick={() => convertBlock(b.id, d.type)}
                    className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-active"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-line font-mono text-[10px] text-ink">
                      {d.glyph}
                    </span>
                    <span className="text-sm text-ink">{d.label}</span>
                  </button>
                ))}
                <div className="my-1 border-t border-line" />
                <button
                  type="button"
                  onClick={() => duplicateBlock(b)}
                  className="block w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-active"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuFor(null);
                    removeBlock(b.id);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-active"
                  style={{ color: "#b3261e" }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        );
      })}

      {editable && (
        <div
          className="min-h-24 cursor-text"
          onClick={() => {
            const last = blocks[blocks.length - 1];
            if (last && last.type !== "divider" && last.text === "") {
              setFocusReq({ id: last.id, pos: 0 });
              return;
            }
            const nb = makeBlock("text");
            onChange([...blocks, nb]);
            setFocusReq({ id: nb.id, pos: 0 });
          }}
        />
      )}
    </div>
  );
}

// Auto-growing textarea: one row tall until the text wraps, then
// exactly as tall as the content.
function GrowTextarea({
  value,
  placeholder,
  className,
  onChange,
  onKeyDown,
  regRef,
}: {
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (value: string) => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
  regRef: (el: HTMLTextAreaElement | null) => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  });
  return (
    <textarea
      rows={1}
      ref={(el) => {
        ref.current = el;
        regRef(el);
      }}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      className={`${className ?? ""} resize-none overflow-hidden`}
    />
  );
}
