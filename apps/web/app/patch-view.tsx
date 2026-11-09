'use client';
import {useEffect,useState} from 'react';
import {createHighlighterCore} from 'shiki/core';
import {createJavaScriptRegexEngine} from 'shiki/engine/javascript';
import diffGrammar from 'shiki/langs/diff.mjs';
import theme from 'shiki/themes/vitesse-dark.mjs';
type Token={content:string;color?:string};
const highlighter=createHighlighterCore({themes:[theme],langs:[diffGrammar],engine:createJavaScriptRegexEngine()});
export default function PatchView({patch}:{patch:string}){
 const [highlight,setHighlight]=useState<{patch:string;lines:Token[][]}|null>(null);
 useEffect(()=>{let current=true;highlighter.then(h=>{const result=h.codeToTokens(patch,{lang:'diff',theme:'vitesse-dark'});if(current)setHighlight({patch,lines:result.tokens});}).catch(()=>{});return()=>{current=false;};},[patch]);
 const lines=patch.split('\n'),tokens=highlight?.patch===patch?highlight.lines:null;
 return <pre className="diff" aria-label="Syntax-highlighted unified patch">{lines.map((line,i)=><div key={i} className={line.startsWith('+')&&!line.startsWith('+++')?'addition':line.startsWith('-')&&!line.startsWith('---')?'deletion':line.startsWith('@@')?'hunk':''}><span>{i+1}</span><code>{tokens?.[i]?.length?tokens[i].map((t,j)=><span key={j} style={{color:t.color}}>{t.content}</span>):line||' '}</code></div>)}</pre>;
}
