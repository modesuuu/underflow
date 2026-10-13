import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CollabGrid } from "@/features/collaborations/components/CollabGrid";
import { getPerson, getPersonProjects } from "@/features/profile/api";

interface ProfileProjectsPageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({
  params,
}: ProfileProjectsPageProps): Promise<Metadata> {
  const { userId } = await params;
  const person = await getPerson(userId);
  if (!person) return { title: "Projects" };
  return { title: `${person.name}'s projects — Bareng` };
}

/** Toolbar + grid mirror of CollabGrid (the section this page suspends on). */
function ProjectsGridSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="size-[42px] rounded-sm bg-placeholder" />
          <div className="size-[42px] rounded-sm bg-placeholder" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-[42px] w-64 items-center gap-2 rounded-md border border-line bg-surface px-4">
            <div className="size-4 shrink-0 rounded-full bg-placeholder" />
            <div className="h-3 flex-1 rounded bg-placeholder" />
          </div>
          <div className="h-[42px] w-24 rounded-md bg-placeholder" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`flex h-[235px] flex-col justify-between rounded-xl bg-bg p-5 ${
              i === 0 ? "sm:col-span-2" : ""
            }`}
          >
            <div className="h-3.5 w-12 rounded bg-placeholder" />
            <div className="flex flex-col gap-2">
              <div className="h-7 w-4/5 rounded bg-placeholder" />
              <div className="h-4 w-3/5 rounded bg-placeholder" />
              <div className="h-3.5 w-24 rounded bg-placeholder" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-placeholder" />
                <div className="size-7 -ml-3 rounded-full bg-placeholder" />
              </div>
              <div className="h-10 w-24 rounded-xl bg-placeholder" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

async function ProjectsBody({ userId }: { userId: string }) {
  const person = await getPerson(userId);
  if (!person) notFound();
  const projects = await getPersonProjects(person);
  return <CollabGrid projects={projects} />;
}

export default async function ProfileProjectsPage({
  params,
}: ProfileProjectsPageProps) {
  const { userId } = await params;
  const person = await getPerson(userId);
  if (!person) notFound();

  return (
    <AppShell
      breadcrumbRoot={person.name}
      breadcrumbLeaf="Collaborations"
      backLabel={person.name}
      backHref={`/profile/${person.id}`}
    >
      <div className="flex flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.01em] text-ink">
            Active Project {person.name}
          </h1>
          <p className="text-sm font-medium text-muted">
            Queued and ready to start.
          </p>
        </div>

        <Suspense fallback={<ProjectsGridSkeleton />}>
          <ProjectsBody userId={userId} />
        </Suspense>
      </div>
    </AppShell>
  );
}
