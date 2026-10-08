import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import { getMyCollabProjects } from "@/features/my-collaborations/api";
import { MyCollabCategoryGrid } from "@/features/my-collaborations/components/MyCollabCategoryGrid";
import { getCategory } from "@/features/my-collaborations/types";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  return params.then(({ category }) => {
    const cat = getCategory(category);
    return {
      title: cat ? `My Collaborations — ${cat.crumbLabel}` : "My Collaborations",
      description: cat?.subtitle ?? "My collaborations category.",
    };
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const all = await getMyCollabProjects();
  const projects = all.filter((p) => p.myStatus === cat.slug);

  return (
    <AppShell
      backLabel="My Collaborations"
      backHref="/my-collaborations"
      breadcrumbRoot="Tools / My Collaborations"
      breadcrumbLeaf={cat.crumbLabel}
      actions={<NotificationsBell />}
    >
      <div className="flex flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[40px] font-medium leading-[1.02] text-ink">
            {cat.boardLabel}
          </h1>
          <p className="text-sm font-medium text-muted">{cat.subtitle}</p>
        </div>
        <MyCollabCategoryGrid projects={projects} />
      </div>
    </AppShell>
  );
}
