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

export default function UniverseCanvas() {
  const [query,setQuery]=useState(""); const [sector,setSector]=useState("Todos"); const [selectedSlug,setSelectedSlug]=useState("grupo-maia");
  const sectors=useMemo(()=>["Todos",...Array.from(new Set(INSTITUTIONAL_COMPANIES.map(c=>c.sector))).sort()],[]);
  const visible=useMemo(()=>{const needle=normalize(query.trim());return INSTITUTIONAL_COMPANIES.filter(c=>(sector==="Todos"||c.sector===sector)&&(!needle||normalize(`${c.name} ${c.sector} ${c.description}`).includes(needle)))},[query,sector]);
  const selected=INSTITUTIONAL_COMPANIES.find(c=>c.slug===selectedSlug)??INSTITUTIONAL_COMPANIES[7];
  return <div className={styles.site}>
    <a href="#conteudo" className={styles.skip}>Ir para o conteúdo</a>
    <header className={styles.header}><Link href="/" className={styles.brand} aria-label="Grupo Maia — início"><Image src="/brand/grupo-maia-symbol-reverse.svg" alt="" width={32} height={32} priority/><span>Grupo Maia<small>29 empresas</small></span></Link><nav aria-label="Navegação principal"><a href="#empresas">Empresas</a><Link href="/intro">Apresentação</Link><Link href="/support" className={styles.contact}>Contato <ArrowUpRight size={14}/></Link></nav></header>
    <main id="conteudo">
      <section className={styles.hero}>
        <div className={styles.heroCopy}><p className={styles.eyebrow}><span/> Grupo empresarial · Brasil</p><h1>29 empresas.<br/><em>Operações próprias.</em></h1><p className={styles.lead}>Empresas de tecnologia, imóveis, saúde, energia, mobilidade, mídia, hospitalidade e investimentos reunidas sob o Grupo Maia.</p><div className={styles.actions}><a href="#empresas" className={styles.primary}>Ver as 29 empresas <ArrowDown size={16}/></a><Link href="/intro" className={styles.secondary}>Como o grupo funciona <ArrowRight size={16}/></Link></div></div>
        <div className={styles.orbit} aria-label="Empresas em destaque do Grupo Maia"><div className={styles.orbitRings} aria-hidden="true"><i/><i/><i/></div><div className={styles.core}><Image src="/brand/grupo-maia-symbol-reverse.svg" alt="" width={54} height={54}/><span>Grupo<br/>Maia</span></div>{FEATURED_SLUGS.map((slug,index)=>{const company=INSTITUTIONAL_COMPANIES.find(c=>c.slug===slug)!;return <button key={slug} type="button" onClick={()=>setSelectedSlug(slug)} className={`${styles.orbitNode} ${styles[`node${index+1}`]} ${selectedSlug===slug?styles.activeNode:""}`} aria-pressed={selectedSlug===slug}><span>{String(INSTITUTIONAL_COMPANIES.indexOf(company)+1).padStart(2,"0")}</span>{company.name}</button>})}<div className={styles.companyPreview} aria-live="polite"><span>{selected.sector}</span><strong>{selected.name}</strong><p>{selected.description}</p><Link href={`/empresas/${selected.slug}`}>Conhecer empresa <ArrowUpRight size={14}/></Link></div></div>
        <div className={styles.proof}><div><strong>29</strong><span>empresas</span></div><div><strong>{sectors.length-1}</strong><span>setores</span></div><div><strong>01</strong><span>grupo</span></div></div>
      </section>
      <section id="empresas" className={styles.directory}>
        <div className={styles.directoryIntro}><p className={styles.kicker}>Índice de empresas</p><h2>Encontre cada empresa<br/>e sua área de atuação.</h2><p>Consulte as 29 empresas por nome ou setor. Cada página apresenta a atividade e os projetos de sua operação.</p></div>
        <div className={styles.filters}><label className={styles.search}><Search size={18}/><span className="sr-only">Buscar empresa</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar empresa ou setor" type="search"/>{query&&<button type="button" onClick={()=>setQuery("")} aria-label="Limpar busca"><X size={15}/></button>}</label><div className={styles.sectors} aria-label="Filtrar por setor">{sectors.map(item=><button key={item} type="button" onClick={()=>setSector(item)} aria-pressed={sector===item}>{item}</button>)}</div><p className={styles.resultCount}>{String(visible.length).padStart(2,"0")} empresas</p></div>
        <div className={styles.grid}>{visible.map(company=><Link key={company.slug} href={`/empresas/${company.slug}`} className={styles.card} onMouseEnter={()=>setSelectedSlug(company.slug)}><span className={styles.cardIndex}>{String(INSTITUTIONAL_COMPANIES.indexOf(company)+1).padStart(2,"0")}</span><span className={styles.cardArrow}><ArrowUpRight size={18}/></span><div><p>{company.sector}</p><h3>{company.name}</h3><small>{company.description}</small></div></Link>)}</div>
        {visible.length===0&&<div className={styles.empty}>Nenhuma empresa encontrada. <button type="button" onClick={()=>{setQuery("");setSector("Todos")}}>Limpar filtros</button></div>}
      </section>
    </main>
    <footer className={styles.footer}><div><Image src="/brand/grupo-maia-symbol-reverse.svg" alt="" width={28} height={28}/><span>Grupo Maia</span></div><p>29 empresas em diferentes setores.</p><nav><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos</Link><Link href="/support">Contato</Link></nav></footer>
  </div>
}
