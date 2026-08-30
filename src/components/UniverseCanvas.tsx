"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import { INSTITUTIONAL_COMPANIES } from "@/lib/company-catalog";
import styles from "./UniverseCanvas.module.css";

export type CompanyRecord = { id:number; username:string; name:string|null; avatar_url:string|null; contributions:number; contributions_total:number; public_repos:number; total_stars:number; rank:number|null; claimed:boolean; category:string|null; employee_count:number; applications_count:number; total_prs:number; total_reviews:number; followers:number };
const FEATURED_SLUGS = ["grupo-maia", "volup-ai", "habitat-x", "tikal-beach-club", "minvest"];
const normalize = (value:string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function UniverseCanvas({ companies }: { companies: CompanyRecord[] }) {
  const [query,setQuery]=useState(""); const [sector,setSector]=useState("Todos"); const [selectedSlug,setSelectedSlug]=useState("grupo-maia");
  const sectors=useMemo(()=>["Todos",...Array.from(new Set(INSTITUTIONAL_COMPANIES.map(c=>c.sector))).sort()],[]);
  const visible=useMemo(()=>{const needle=normalize(query.trim());return INSTITUTIONAL_COMPANIES.filter(c=>(sector==="Todos"||c.sector===sector)&&(!needle||normalize(`${c.name} ${c.sector} ${c.description}`).includes(needle)))},[query,sector]);
  const selected=INSTITUTIONAL_COMPANIES.find(c=>c.slug===selectedSlug)??INSTITUTIONAL_COMPANIES[7];
  const liveRecord=companies.find(c=>normalize(`${c.username} ${c.name??""}`).includes(normalize(selected.name)));
  return <div className={styles.site}>
    <a href="#conteudo" className={styles.skip}>Ir para o conteúdo</a>
    <header className={styles.header}><Link href="/" className={styles.brand} aria-label="Grupo Maia Universe — início"><Image src="/brand/grupo-maia-symbol-reverse.svg" alt="" width={32} height={32} priority/><span>Grupo Maia<small>Universe</small></span></Link><nav aria-label="Navegação principal"><a href="#empresas">Empresas</a><Link href="/intro">Manifesto</Link><Link href="/support" className={styles.contact}>Conversar <ArrowUpRight size={14}/></Link></nav></header>
    <main id="conteudo">
      <section className={styles.hero}>
        <div className={styles.heroCopy}><p className={styles.eyebrow}><span/> Grupo empresarial independente · Brasil</p><h1>Um grupo.<br/><em>Muitos futuros.</em></h1><p className={styles.lead}>Criamos, operamos e conectamos empresas que transformam tecnologia, capital e cultura em negócios duradouros.</p><div className={styles.actions}><a href="#empresas" className={styles.primary}>Explorar empresas <ArrowDown size={16}/></a><Link href="/intro" className={styles.secondary}>Conhecer o grupo <ArrowRight size={16}/></Link></div></div>
        <div className={styles.orbit} aria-label="Empresas em destaque do Grupo Maia"><div className={styles.orbitRings} aria-hidden="true"><i/><i/><i/></div><div className={styles.core}><Image src="/brand/grupo-maia-symbol-reverse.svg" alt="" width={54} height={54}/><span>Direção<br/>compartilhada</span></div>{FEATURED_SLUGS.map((slug,index)=>{const company=INSTITUTIONAL_COMPANIES.find(c=>c.slug===slug)!;return <button key={slug} type="button" onClick={()=>setSelectedSlug(slug)} className={`${styles.orbitNode} ${styles[`node${index+1}`]} ${selectedSlug===slug?styles.activeNode:""}`} aria-pressed={selectedSlug===slug}><span>{String(INSTITUTIONAL_COMPANIES.indexOf(company)+1).padStart(2,"0")}</span>{company.name}</button>})}<div className={styles.companyPreview} aria-live="polite"><span>{selected.sector}</span><strong>{selected.name}</strong><p>{selected.description}</p><Link href={`/dev/${liveRecord?.username??selected.slug}`}>Ver empresa <ArrowUpRight size={14}/></Link></div></div>
        <div className={styles.proof}><div><strong>29</strong><span>empresas</span></div><div><strong>{sectors.length-1}</strong><span>setores</span></div><div><strong>01</strong><span>visão compartilhada</span></div></div>
      </section>
      <section id="empresas" className={styles.directory}>
        <div className={styles.directoryIntro}><p className={styles.kicker}>O ecossistema</p><h2>Negócios diferentes.<br/>Uma mesma ambição.</h2><p>Do imobiliário à inteligência artificial, cada empresa opera com autonomia e ganha força através da rede.</p></div>
        <div className={styles.filters}><label className={styles.search}><Search size={18}/><span className="sr-only">Buscar empresa</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar empresa ou setor" type="search"/>{query&&<button type="button" onClick={()=>setQuery("")} aria-label="Limpar busca"><X size={15}/></button>}</label><div className={styles.sectors} aria-label="Filtrar por setor">{sectors.map(item=><button key={item} type="button" onClick={()=>setSector(item)} aria-pressed={sector===item}>{item}</button>)}</div><p className={styles.resultCount}>{String(visible.length).padStart(2,"0")} empresas</p></div>
        <div className={styles.grid}>{visible.map(company=><Link key={company.slug} href={`/dev/${company.slug}`} className={styles.card} onMouseEnter={()=>setSelectedSlug(company.slug)}><span className={styles.cardIndex}>{String(INSTITUTIONAL_COMPANIES.indexOf(company)+1).padStart(2,"0")}</span><span className={styles.cardArrow}><ArrowUpRight size={18}/></span><div><p>{company.sector}</p><h3>{company.name}</h3><small>{company.description}</small></div></Link>)}</div>
        {visible.length===0&&<div className={styles.empty}>Nenhuma empresa encontrada. <button type="button" onClick={()=>{setQuery("");setSector("Todos")}}>Limpar filtros</button></div>}
      </section>
    </main>
    <footer className={styles.footer}><div><Image src="/brand/grupo-maia-symbol-reverse.svg" alt="" width={28} height={28}/><span>Grupo Maia Universe</span></div><p>Construindo empresas para o que vem depois.</p><nav><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos</Link><Link href="/support">Contato</Link></nav></footer>
  </div>
}
