"use client";

import { useEffect } from "react";
import { commitSearch, setDraftQuery } from "../toolbar-store";

/**
 * Lands global-search skill links (audit P2 #21): opening
 * /collaborations?q=<term> seeds the toolbar store once on
 * mount, so the grid arrives already filtered by that term.
 * Reads window.location directly to stay out of the
 * server-render path.
 */
export function CollabQueryFromUrl() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      setDraftQuery(q);
      commitSearch();
    }
  }, []);
  return null;
}
