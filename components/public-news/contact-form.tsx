"use client";
import { FormEvent, useState } from "react";
import { ArrowUpRight } from "lucide-react";

export function ContactForm() {
  const [status,setStatus]=useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    const name=String(form.get("name")||""); const email=String(form.get("email")||""); const subject=String(form.get("subject")||"Aura Intelligence enquiry"); const message=String(form.get("message")||"");
    const body=`Name: ${name}\nEmail: ${email}\n\n${message}`;
    setStatus("Opening your email app…");
    window.location.href=`mailto:contact@auradigitalfiji.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  return <form onSubmit={submit} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Name</span><input required name="name" className="w-full border border-white/14 bg-[#0c0c0c] px-4 py-3 text-sm text-white outline-none focus:border-white" placeholder="Your name"/></label><label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Email</span><input required type="email" name="email" className="w-full border border-white/14 bg-[#0c0c0c] px-4 py-3 text-sm text-white outline-none focus:border-white" placeholder="you@business.com"/></label></div>
    <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Subject</span><select name="subject" className="w-full border border-white/14 bg-[#0c0c0c] px-4 py-3 text-sm text-white outline-none focus:border-white"><option>Story tip or source</option><option>Correction request</option><option>Aura Digital Fiji business enquiry</option><option>Contributor enquiry</option><option>General enquiry</option></select></label>
    <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Message</span><textarea required name="message" rows={6} className="w-full resize-none border border-white/14 bg-[#0c0c0c] px-4 py-3 text-sm leading-6 text-white outline-none focus:border-white" placeholder="Tell us what you need…"/></label>
    <div className="flex flex-wrap items-center gap-4"><button className="inline-flex items-center gap-2 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black">Send message <ArrowUpRight size={13}/></button>{status&&<span className="text-xs text-white/40">{status}</span>}</div>
  </form>;
}
