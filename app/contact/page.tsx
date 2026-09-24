import type { Metadata } from "next";
import { Mail, MapPin, ArrowUpRight } from "lucide-react";
import { ContactForm } from "@/components/public-news/contact-form";
import { NewsFooter, NewsHeader } from "@/components/public-news/news-shell";
import { siteUrl } from "@/lib/news/public";

export const metadata: Metadata = { title: "Contact", description: "Contact Aura Digital Intelligence.", alternates: { canonical: `${siteUrl()}/contact` } };

export default function ContactPage(){
  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <NewsHeader/>
      <section className="adi-noise border-b border-white/10"><div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><p className="adi-kicker">Contact</p><h1 className="adi-hero-title mt-3 max-w-4xl font-black text-white">Let&apos;s talk.</h1><p className="mt-5 max-w-2xl text-base leading-8 text-white/54 sm:text-lg">Story tips, correction requests, contributor enquiries and business conversations are welcome.</p></div></section>
      <section className="mx-auto grid max-w-[1240px] gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[.72fr_1.28fr] lg:px-8 lg:py-14">
        <aside className="space-y-5">
          <div className="adi-panel p-5"><Mail size={20}/><p className="mt-4 adi-kicker">Email address</p><a href="mailto:contact@auradigitalfiji.com" className="mt-2 block text-lg font-black hover:text-white/70">contact@auradigitalfiji.com</a></div>
          <div className="adi-panel p-5"><MapPin size={20}/><p className="mt-4 adi-kicker">Published for</p><p className="mt-2 text-lg font-black">Fiji & the Pacific</p></div>
          <div className="adi-panel p-5"><p className="adi-kicker">Need digital services?</p><p className="mt-2 text-2xl font-black leading-tight">Talk directly to Aura Digital Fiji.</p><a href="https://auradigitalfiji.com" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white">Visit agency <ArrowUpRight size={13}/></a></div>
        </aside>
        <div className="adi-panel p-5 sm:p-6"><div className="mb-6"><p className="adi-kicker">Send us a message</p><h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">Message the newsroom</h2><p className="mt-2 text-sm leading-6 text-white/42">The form opens your email application with the message pre-filled, so no data is stored on this website.</p></div><ContactForm/></div>
      </section>
      <NewsFooter/>
    </main>
  );
}
