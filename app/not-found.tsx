import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
export default function NotFound(){return <main className="adi-public-shell min-h-screen"><NewsHeader/><section className="grid min-h-[68vh] place-items-center border-b border-white/10 px-4 py-16 text-center"><div><p className="adi-kicker">404 · Signal lost</p><h1 className="adi-display mt-4">Page not found</h1><p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-white/45">The page may have moved, or the story is no longer available.</p><Link href="/" className="mt-7 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-white"><ArrowLeft size={13}/> Back home</Link></div></section><NewsFooter/></main>}
