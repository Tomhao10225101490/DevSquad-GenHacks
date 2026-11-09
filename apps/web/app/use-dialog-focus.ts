"use client";
import {useEffect,useRef} from 'react';
export function useDialogFocus(onClose:()=>void){
 const ref=useRef<HTMLElement>(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const dialog=ref.current;if(!dialog)return;const previous=document.activeElement as HTMLElement|null;
  const focusable=()=>Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(e=>e.getClientRects().length>0);
  focusable()[0]?.focus();
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close.current();return;}if(event.key!=='Tab')return;const items=focusable(),first=items[0],last=items.at(-1);if(!first)return;if(!dialog.contains(document.activeElement)){event.preventDefault();(event.shiftKey?last:first)?.focus();}else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}};
  dialog.addEventListener('keydown',key);return()=>{dialog.removeEventListener('keydown',key);if(previous?.isConnected)previous.focus();};
 },[]);return ref;
}
