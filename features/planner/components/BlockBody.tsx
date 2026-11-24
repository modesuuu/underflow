"use client";

import { useEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { Icon } from "@/components/ui/Icon";

// A Notion-style block body for the task detail panel.
// One flat list of blocks per task; nesting is a level field on
// each block, so a block's children are the following blocks
// with a deeper level (a toggle hides its children while it is
// closed). Implemented mechanics (from the hands-on Notion REA,
// 2026-11-24): slash menu insert with type-to-filter, markdown
// autoformat (#, ##, ###, [], >, -, 1., ---), Enter splits a
// block (lists continue, Enter on an empty list item outdents
// or turns it back into text), Backspace merges into the block
// above (a divider above is deleted instead), Tab / Shift+Tab
// indent and outdent whole subtrees, hover gutter with a +
// button and a drag handle (pointer drag reorders, a toggle
// travels with its children; a plain click opens the block menu
// with Turn into / Duplicate / Delete), click below the last
// block to append text. Still out of scope: columns and rich
// text marks (they need a contentEditable rewrite).

export type BlockType =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "todo"
  | "bullet"
  | "numbered"
  | "toggle"
  | "callout"
  | "divider";

export type Block = {
  id: string;
  type: BlockType;
  text: string;
  level?: number;
  checked?: boolean;
  open?: boolean;
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
  { type: "bullet", glyph: "•", label: "Bulleted list", hint: "Dot list item" },
  { type: "numbered", glyph: "1.", label: "Numbered list", hint: "Auto-numbered item" },
  { type: "toggle", glyph: "▸", label: "Toggle", hint: "Collapsible children" },
  { type: "callout", glyph: "!", label: "Callout", hint: "Highlighted note" },
  { type: "divider", glyph: "―", label: "Divider", hint: "Horizontal rule" },
];

const NESTABLE: ReadonlySet<BlockType> = new Set([
  "text",
  "todo",
  "bullet",
  "numbered",
  "toggle",
  "callout",
]);

const LIST_TYPES: ReadonlySet<BlockType> = new Set([
  "todo",
  "bullet",
  "numbered",
]);

let blockSeq = 0;
export function makeBlock(type: BlockType, text = ""): Block {
  blockSeq += 1;
  return {
    id: `b${blockSeq}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    text,
    level: 0,
    ...(type === "todo" ? { checked: false } : {}),
    ...(type === "toggle" ? { open: true } : {}),
  };
}

// Index just past a block's subtree: the block itself plus the
// following blocks with a deeper level.
function subtreeEnd(blocks: Block[], i: number): number {
  const lvl = blocks[i]?.level ?? 0;
  let j = i + 1;
  while (j < blocks.length && (blocks[j].level ?? 0) > lvl) j++;
  return j;
}

const TEXT_CLASS: Record<string, string> = {
  text: "text-[15px] leading-relaxed",
  h1: "text-[26px] font-semibold leading-snug",
  h2: "text-[21px] font-semibold leading-snug",
  h3: "text-[17px] font-semibold leading-snug",
  todo: "text-[15px] leading-relaxed",
  bullet: "text-[15px] leading-relaxed",
  numbered: "text-[15px] leading-relaxed",
  toggle: "text-[15px] font-medium leading-relaxed",
  callout: "text-[15px] leading-relaxed",
};

const PLACEHOLDER: Record<string, string> = {
  text: "Type '/' for blocks",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  todo: "To-do",
  bullet: "List",
  numbered: "List",
  toggle: "Toggle",
  callout: "Callout",
};

type DragBlocks = {
  id: string;
  from: number;
  target: number;
  dy: number;
  heights: number[];
};

type Entry = { b: Block; index: number };

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
  const slashMenuRef = useRef<HTMLDivElement | null>(null);
  const taRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const slashOff = useRef<string | null>(null);

  // Visible rows: a block inside a closed toggle is not
  // rendered. Entries keep the block's index in the full list.
  const entries: Entry[] = [];
  {
    const stack: { level: number; closed: boolean }[] = [];
    blocks.forEach((b, index) => {
      const lvl = b.level ?? 0;
      while (stack.length && stack[stack.length - 1].level >= lvl) stack.pop();
      if (!stack.some((t) => t.closed)) entries.push({ b, index });
      if (b.type === "toggle") stack.push({ level: lvl, closed: !b.open });
    });
  }

  // Numbered-list counters per level, reset when another block
  // type interrupts at the same level.
  const numbers = new Map<string, number>();
  {
    const counters = new Map<number, number>();
    for (const { b } of entries) {
      const lvl = b.level ?? 0;
      for (const k of [...counters.keys()]) if (k > lvl) counters.delete(k);
      if (b.type === "numbered") {
        const n = (counters.get(lvl) ?? 0) + 1;
        counters.set(lvl, n);
        numbers.set(b.id, n);
      } else {
        counters.delete(lvl);
      }
    }
  }

  // While the slash menu is open, keep the highlighted item
  // scrolled into view (the menu itself is height-capped).
  useEffect(() => {
    if (!slash) return;
    slashMenuRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [slash]);

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
    const src = blocks.find((b) => b.id === id);
    const nb = makeBlock(type, text);
    nb.level = src?.level ?? 0;
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
      ...(type === "toggle" ? { open: b.open ?? true } : {}),
    });
    setMenuFor(null);
    setSlash(null);
    if (type !== "divider") setFocusReq({ id, pos: -1 });
  };

  const changeLevel = (b: Block, delta: number) => {
    if (!NESTABLE.has(b.type)) return;
    const i = blocks.findIndex((x) => x.id === b.id);
    if (i < 0) return;
    if (delta > 0) {
      const prev = blocks[i - 1];
      const maxLvl = prev ? (prev.level ?? 0) + 1 : 0;
      if ((b.level ?? 0) >= Math.min(maxLvl, 4)) return;
    }
    const end = subtreeEnd(blocks, i);
    onChange(
      blocks.map((x, j) =>
        j < i || j >= end
          ? x
          : { ...x, level: Math.max(0, Math.min(4, (x.level ?? 0) + delta)) },
      ),
    );
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
        ["- ", "bullet"],
        ["1. ", "numbered"],
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
    if (e.key === "Tab") {
      if (!NESTABLE.has(b.type)) return;
      e.preventDefault();
      changeLevel(b, e.shiftKey ? -1 : 1);
      return;
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
      if (LIST_TYPES.has(b.type) && before === "" && after === "") {
        if ((b.level ?? 0) > 0) changeLevel(b, -1);
        else convertBlock(b.id, "text");
        return;
      }
      patch(b.id, { text: before });
      const nextType: BlockType = LIST_TYPES.has(b.type) ? b.type : "text";
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
        if (!prev || prev.type === "toggle") return;
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
  // the others shift to open the gap. On drop the block travels
  // with its whole subtree. A press that barely moves counts as
  // a click and opens the block menu instead.
  const onHandleDown = (
    e: ReactPointerEvent<HTMLButtonElement>,
    entry: Entry,
    entryIndex: number,
  ) => {
    if (!editable || e.button !== 0) return;
    e.preventDefault();
    const heights = entries.map(
      (x) => rowRefs.current.get(x.b.id)?.offsetHeight ?? 30,
    );
    const startY = e.clientY;
    let cur: DragBlocks = {
      id: entry.b.id,
      from: entryIndex,
      target: entryIndex,
      dy: 0,
      heights,
    };
    setDrag(cur);
    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      const tops: number[] = [];
      let acc = 0;
      for (const h of heights) {
        tops.push(acc);
        acc += h;
      }
      const center = tops[entryIndex] + dy + heights[entryIndex] / 2;
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
        setMenuFor(entry.b.id);
        return;
      }
      if (cur.target !== cur.from) {
        const fromArr = entries[cur.from].index;
        const end = subtreeEnd(blocks, fromArr);
        const moving = blocks.slice(fromArr, end);
        const rest = [...blocks.slice(0, fromArr), ...blocks.slice(end)];
        const targetId = entries[cur.target].b.id;
        const tIdx = rest.findIndex((x) => x.id === targetId);
        const insertPos =
          cur.target > cur.from ? subtreeEnd(rest, tIdx) : tIdx;
        onChange([
          ...rest.slice(0, insertPos),
          ...moving,
          ...rest.slice(insertPos),
        ]);
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
    copy.level = b.level;
    const i = blocks.findIndex((x) => x.id === b.id);
    const next = [...blocks];
    next.splice(i + 1, 0, copy);
    onChange(next);
    setMenuFor(null);
  };

  const editor = (b: Block, inCallout = false) => (
    <GrowTextarea
      regRef={(el) => {
        if (el) taRefs.current.set(b.id, el);
        else taRefs.current.delete(b.id);
      }}
      value={b.text}
      placeholder={PLACEHOLDER[b.type]}
      onChange={(v) => handleText(b, v)}
      onKeyDown={(e) => handleKey(b, e)}
      className={`w-full bg-transparent text-ink outline-none placeholder:text-subtle ${TEXT_CLASS[b.type]} ${
        b.type === "todo" && b.checked ? "text-muted line-through" : ""
      } ${inCallout ? "placeholder:text-muted" : ""}`}
    />
  );

  const staticText = (b: Block) => (
    <p
      className={`${TEXT_CLASS[b.type]} ${
        b.type === "todo" && b.checked ? "text-muted line-through" : "text-ink"
      }`}
    >
      {b.text}
    </p>
  );

  const renderContent = (b: Block) => {
    if (b.type === "divider") {
      return (
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
      );
    }
    if (b.type === "todo") {
      return (
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
          {editable ? editor(b) : staticText(b)}
        </div>
      );
    }
    if (b.type === "bullet" || b.type === "numbered") {
      return (
        <div className="flex items-start gap-2">
          <span className="mt-[3px] w-6 shrink-0 text-center text-[15px] text-muted select-none">
            {b.type === "bullet" ? "•" : `${numbers.get(b.id) ?? 1}.`}
          </span>
          {editable ? editor(b) : staticText(b)}
        </div>
      );
    }
    if (b.type === "toggle") {
      return (
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
          {editable ? editor(b) : staticText(b)}
        </div>
      );
    }
    if (b.type === "callout") {
      return (
        <div className="flex items-start gap-2.5 rounded-lg bg-active px-3 py-2.5">
          <span className="mt-[3px] shrink-0 text-muted">
            <Icon name="bulb" size={16} />
          </span>
          {editable ? editor(b, true) : staticText(b)}
        </div>
      );
    }
    return editable ? editor(b) : staticText(b);
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
      {entries.map((entry, i) => {
        const b = entry.b;
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
              marginLeft: (b.level ?? 0) * 24,
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
                  onPointerDown={(e) => onHandleDown(e, entry, i)}
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

            <div className="px-1 py-0.5">{renderContent(b)}</div>

            {editable && slash?.id === b.id && (
              <div
                ref={slashMenuRef}
                className="absolute top-full left-8 z-50 mt-1 max-h-72 w-64 overflow-y-auto rounded-lg border border-line bg-surface shadow-2xl [scrollbar-width:thin]"
              >
                {slashDefs(b).map((d, di) => (
                  <button
                    key={d.type}
                    type="button"
                    data-active={di === slash.index}
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
              <div className="absolute top-6 left-8 z-50 max-h-80 w-56 overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-2xl [scrollbar-width:thin]">
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
