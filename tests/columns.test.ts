import { describe, expect, it } from "vitest";
import {
  groupMyCollabBoard,
  myCollabCategorySlice,
} from "@/features/my-collaborations/columns";
import type {
  MyCollabProject,
  MyCollabStatus,
} from "@/features/my-collaborations/types";

const ME = "user-me";
const OTHER = "user-other";

function project(
  id: string,
  ownerId: string,
  myStatus: MyCollabStatus,
): MyCollabProject {
  return {
    id,
    title: `Project ${id}`,
    subtitle: "",
    status: "open",
    type: "coursework",
    dueDate: "2026-12-01",
    postedAgo: "1d ago",
    slotsFilled: 1,
    slotsTotal: 3,
    members: [],
    skills: [],
    description: "",
    photos: [],
    photoPublicIds: [],
    owner: { id: ownerId, name: "Owner", role: "Owner" },
    myStatus,
  };
}

const ids = (list: MyCollabProject[]) => list.map((p) => p.id);

describe("groupMyCollabBoard partition", () => {
  const projects = [
    project("owned-pending", ME, "pending"),
    project("owned-active", ME, "not-started"),
    project("joined-pending", OTHER, "pending"),
    project("joined-complete", OTHER, "complete"),
    project("joined-revise", OTHER, "revise"),
    project("joined-active", OTHER, "not-started"),
  ];

  it("puts every owned project in Owned, whatever its status", () => {
    const board = groupMyCollabBoard(projects, ME);
    const owned = board.find((c) => c.slug === "owned");
    expect(ids(owned?.projects ?? [])).toEqual(["owned-pending", "owned-active"]);
  });

  it("groups joined projects by status, with revise falling back to Active", () => {
    const board = groupMyCollabBoard(projects, ME);
    const bySlug = Object.fromEntries(board.map((c) => [c.slug, ids(c.projects)]));
    expect(bySlug["pending"]).toEqual(["joined-pending"]);
    expect(bySlug["complete"]).toEqual(["joined-complete"]);
    expect(bySlug["not-started"]).toEqual(["joined-revise", "joined-active"]);
  });

  it("partitions: every project appears in exactly one column", () => {
    const board = groupMyCollabBoard(projects, ME);
    const all = board.flatMap((c) => ids(c.projects)).sort();
    expect(all).toEqual(ids(projects).sort());
  });

  it("startIndex accumulates the earlier columns' counts", () => {
    const board = groupMyCollabBoard(projects, ME);
    let expected = 0;
    for (const col of board) {
      expect(col.startIndex).toBe(expected);
      expected += col.projects.length;
    }
  });

  it("owns nothing when the viewer is unknown", () => {
    const board = groupMyCollabBoard(projects, null);
    const owned = board.find((c) => c.slug === "owned");
    expect(owned?.projects).toEqual([]);
  });
});

describe("myCollabCategorySlice", () => {
  it("the Revise page still lists every revise project, owned or not", () => {
    const projects = [
      project("owned-revise", ME, "revise"),
      project("joined-revise", OTHER, "revise"),
      project("joined-active", OTHER, "not-started"),
    ];
    const slice = myCollabCategorySlice(projects, ME, "revise");
    expect(ids(slice.projects)).toEqual(["owned-revise", "joined-revise"]);
  });
});
