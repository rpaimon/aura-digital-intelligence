import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { EditorialForm } from "@/components/newsroom/editorial-form";
import { zeroClickBrief } from "@/lib/news/verified-brief";
export default async function NewEditorialArticle({ searchParams }: { searchParams: Promise<{brief?:string}> }) {
  await requireAdmin();
  const { brief } = await searchParams;
  return <main className="min-h-screen bg-[#f5f6f3] px-4 py-8 text-[#132522] sm:px-8">
    <div className="mx-auto max-w-4xl"><Link href="/admin/editorial" className="text-sm font-black text-[#53765f]">← Editorial desk</Link>
      <p className="mt-9 text-xs font-black uppercase tracking-[.16em] text-[#638274]">Human editorial · private draft</p>
      <h1 className="mt-2 text-4xl font-black tracking-[-.06em]">Write a news article.</h1>
      <p className="mt-3 mb-8 text-sm leading-7 text-[#64766c]">This form creates an independent draft. Nothing gets published or sent to the automatic pipeline. Verify every factual claim and add your source before publication.</p>
      <div className="rounded-3xl border border-[#dce3dc] bg-white p-5 sm:p-8"><EditorialForm brief={brief === "zero-click" ? zeroClickBrief : undefined} /></div>
    </div>
  </main>;
}
