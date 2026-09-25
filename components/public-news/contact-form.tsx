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
  const field="w-full border-b border-black/25 bg-transparent px-0 py-3 text-sm text-black outline-none transition placeholder:text-black/30 focus:border-black";
  const label="mb-1 block text-[9px] font-black uppercase tracking-[0.16em] text-black/45";
  return <form onSubmit={submit} className="space-y-5">
    <div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className={label}>Name</span><input required name="name" className={field} placeholder="Your name"/></label><label className="block"><span className={label}>Email</span><input required type="email" name="email" className={field} placeholder="you@business.com"/></label></div>
    <label className="block"><span className={label}>Subject</span><select name="subject" className={field}><option>Story tip or source</option><option>Correction request</option><option>Aura Digital Fiji business enquiry</option><option>Contributor enquiry</option><option>General enquiry</option></select></label>
    <label className="block"><span className={label}>Message</span><textarea required name="message" rows={6} className={`${field} resize-none`} placeholder="Tell us what you need…"/></label>
    <div className="flex flex-wrap items-center gap-4"><button className="inline-flex items-center gap-2 bg-black px-5 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white">Send message <ArrowUpRight size={13}/></button>{status&&<span className="text-xs text-black/45">{status}</span>}</div>
  </form>;
}
