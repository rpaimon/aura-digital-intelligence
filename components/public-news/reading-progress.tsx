"use client";
import { useEffect, useState } from "react";
export function ReadingProgress() {
  const [progress,setProgress]=useState(0);
  useEffect(()=>{const onScroll=()=>{const h=document.documentElement.scrollHeight-window.innerHeight;setProgress(h<=0?0:Math.min(100,(window.scrollY/h)*100));};onScroll();window.addEventListener("scroll",onScroll,{passive:true});return()=>window.removeEventListener("scroll",onScroll);},[]);
  return <div className="fixed left-0 top-0 z-[70] h-[3px] bg-white transition-[width] duration-100" style={{width:`${progress}%`}} aria-hidden="true"/>;
}
