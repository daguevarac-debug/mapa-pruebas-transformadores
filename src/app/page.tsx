"use client";

import { Fragment, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  documentedContexts,
  documentedSpecialConditions,
  Procedure,
  ProcedureRelation,
  procedures,
  procedureFamilies,
  StudyStatus,
  technicalFamilies,
  verifiedRelations
} from "@/data/pruebas";
import { glossaryTerms, GlossaryTerm } from "@/data/glosario";

type ViewMode = "explore" | "map";

const layout: Record<string, { x: number; y: number }> = {
  "T50-02417": { x: 150, y: 150 }, "T50-02338": { x: 340, y: 150 }, "T50-02407": { x: 530, y: 150 }, "T50-04588": { x: 720, y: 150 },
  "T50-02386": { x: 160, y: 340 }, "T50-02413": { x: 380, y: 340 }, "T50-02692": { x: 600, y: 340 },
  "T50-02404": { x: 850, y: 340 }, "T50-02367": { x: 1030, y: 340 },
  "T50-02416": { x: 120, y: 540 }, "T50-02398": { x: 300, y: 540 }, "T50-02393": { x: 480, y: 540 }, "T50-02376": { x: 660, y: 540 }, "T50-02408": { x: 840, y: 540 }, "T50-04598": { x: 1020, y: 540 },
  "T50-02869": { x: 390, y: 730 }, "T50-04590": { x: 770, y: 730 }
};

const familyAreas = [
  { family: "Excitación, núcleo y ruido", label: "Excitación, núcleo y ruido", x: 30, y: 74, width: 810, height: 124, fill: "#ecfeff", stroke: "#a5f3fc" },
  { family: "Devanados, relación y respuesta mecánica", label: "Devanados, relación y respuesta mecánica", x: 50, y: 256, width: 660, height: 136, fill: "#f0fdf4", stroke: "#bbf7d0" },
  { family: "Pérdidas y calentamiento", label: "Pérdidas y calentamiento", x: 755, y: 256, width: 370, height: 150, fill: "#fff7ed", stroke: "#fed7aa" },
  { family: "Aislamiento dieléctrico", label: "Aislamiento dieléctrico", x: 48, y: 452, width: 1044, height: 142, fill: "#faf5ff", stroke: "#e9d5ff" },
  { family: "Impedancia de secuencia cero", label: "Impedancia de secuencia cero", x: 245, y: 650, width: 290, height: 122, fill: "#f8fafc", stroke: "#cbd5e1" },
  { family: "Transformadores de corriente", label: "Transformadores de corriente", x: 620, y: 650, width: 300, height: 122, fill: "#f0fdfa", stroke: "#99f6e4" }
] as const;

const fullMapBounds = { x: 0, y: 0, width: 1180, height: 810 };

function statusLabel(status: StudyStatus) { return status === "studied" ? "Estudiada" : status === "in_progress" ? "En curso" : "Pendiente"; }
function statusClass(status: StudyStatus) { return status === "studied" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : status === "in_progress" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-600"; }
function typeLabel(type: ProcedureRelation["type"]) { return type === "prerequisite" ? "Prerequisito" : type === "data_dependency" ? "Dependencia de datos" : "Se realiza durante / comparte montaje"; }
function relationKey(relation: ProcedureRelation) { return `${relation.from}-${relation.to}`; }
function procedureName(code: string) { const procedure = procedures.find((item) => item.code === code); return procedure ? `${procedure.code} · ${procedure.name}` : code; }
function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

const glossaryMatches = glossaryTerms
  .flatMap((term) => term.aliases.map((alias) => ({ term, alias })))
  .sort((a, b) => b.alias.length - a.alias.length);
// Los límites evitan coincidencias parciales: por ejemplo, BIL no debe activarse dentro de “estabilizar”.
const glossaryPattern = new RegExp(`((?<![\\p{L}\\p{N}])(?:${glossaryMatches.map(({ alias }) => escapeRegExp(alias)).join("|")})(?![\\p{L}\\p{N}]))`, "giu");

export default function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("explore");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [families, setFamilies] = useState<string[]>([]);
  const [contexts, setContexts] = useState<string[]>([]);
  const [showDirectional, setShowDirectional] = useState(true);
  const [showComplementary, setShowComplementary] = useState(true);
  const [mapZoom, setMapZoom] = useState(1);
  const [inspectedRelationKey, setInspectedRelationKey] = useState<string | null>(null);
  const [comparisonCodes, setComparisonCodes] = useState<[string, string]>(["", ""]);
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<GlossaryTerm | null>(null);
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ pointerId: -1, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, moved: false });

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("prueba");
    if (code && procedures.some((procedure) => procedure.code === code)) setSelectedCode(code);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedCode) url.searchParams.set("prueba", selectedCode);
    else url.searchParams.delete("prueba");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [selectedCode]);

  useEffect(() => {
    if (families.length === 0) return;
    setViewMode("map");
    setMapZoom(1);
    requestAnimationFrame(() => {
      if (mapViewportRef.current) {
        mapViewportRef.current.scrollLeft = 0;
        mapViewportRef.current.scrollTop = 0;
      }
    });
  }, [families]);

  const filteredProcedures = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return procedures.filter((procedure) => {
      const searchable = [procedure.code, procedure.name, procedure.category, procedure.didacticSummary?.apply, procedure.didacticSummary?.measure, procedure.didacticSummary?.obtain].filter(Boolean).join(" ").toLocaleLowerCase("es");
      return (!normalized || searchable.includes(normalized))
        && (families.length === 0 || families.includes(procedureFamilies[procedure.code]))
        && (contexts.length === 0 || contexts.every((contextId) => documentedContexts.find((context) => context.id === contextId)?.codes.includes(procedure.code)));
    });
  }, [contexts, families, query]);

  const visibleCodes = useMemo(() => new Set(filteredProcedures.map((procedure) => procedure.code)), [filteredProcedures]);
  const activeFilterCount = families.length + contexts.length + (query.trim() ? 1 : 0);
  const visibleFamilyAreas = useMemo(() => familyAreas.filter((area) => filteredProcedures.some((procedure) => procedureFamilies[procedure.code] === area.family)), [filteredProcedures]);
  const mapBounds = useMemo(() => {
    if (activeFilterCount === 0 || visibleFamilyAreas.length === familyAreas.length) return fullMapBounds;
    if (visibleFamilyAreas.length === 0) return fullMapBounds;
    const padding = 18;
    const minX = Math.min(...visibleFamilyAreas.map((area) => area.x));
    const minY = Math.min(...visibleFamilyAreas.map((area) => area.y));
    const maxX = Math.max(...visibleFamilyAreas.map((area) => area.x + area.width));
    const maxY = Math.max(...visibleFamilyAreas.map((area) => area.y + area.height));
    return {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: Math.min(fullMapBounds.width - Math.max(0, minX - padding), maxX - minX + padding * 2),
      height: Math.min(fullMapBounds.height - Math.max(0, minY - padding), maxY - minY + padding * 2)
    };
  }, [activeFilterCount, visibleFamilyAreas]);
  const selectedProcedure = selectedCode ? procedures.find((procedure) => procedure.code === selectedCode) ?? null : null;
  const selectedRelations = useMemo(() => selectedCode ? verifiedRelations.filter((relation) => relation.from === selectedCode || relation.to === selectedCode) : [], [selectedCode]);
  const visibleRelations = useMemo(() => selectedRelations.filter((relation) => (relation.type === "shared_setup" ? showComplementary : showDirectional) && visibleCodes.has(relation.from) && visibleCodes.has(relation.to)), [selectedRelations, showComplementary, showDirectional, visibleCodes]);
  const inspectedRelation = useMemo(() => verifiedRelations.find((relation) => relationKey(relation) === inspectedRelationKey) ?? null, [inspectedRelationKey]);
  const outgoingCodes = useMemo(() => new Set(selectedRelations.filter((relation) => relation.type !== "shared_setup" && relation.from === selectedCode).map((relation) => relation.to)), [selectedCode, selectedRelations]);
  const incomingCodes = useMemo(() => new Set(selectedRelations.filter((relation) => relation.type !== "shared_setup" && relation.to === selectedCode).map((relation) => relation.from)), [selectedCode, selectedRelations]);
  const sharedCodes = useMemo(() => new Set(selectedRelations.filter((relation) => relation.type === "shared_setup").map((relation) => relation.from === selectedCode ? relation.to : relation.from)), [selectedCode, selectedRelations]);
  const activeMapLabel = families.length === 1 ? families[0] : activeFilterCount > 0 ? `${filteredProcedures.length} pruebas filtradas` : "Vista completa";
  const mapCanvasWidth = Math.round(Math.min(fullMapBounds.width, Math.max(mapBounds.width * 1.65, 440)) * mapZoom);
  const mapCanvasHeight = Math.round(mapCanvasWidth * (mapBounds.height / mapBounds.width));

  const selectProcedure = (code: string | null) => { setSelectedCode(code); setInspectedRelationKey(null); setActiveGlossaryTerm(null); };
  const toggleFamily = (family: string) => { selectProcedure(null); setFamilies((current) => current.includes(family) ? current.filter((item) => item !== family) : [...current, family]); };
  const toggleContext = (context: string) => { selectProcedure(null); setContexts((current) => current.includes(context) ? current.filter((item) => item !== context) : [...current, context]); };
  const clearFilters = () => { setQuery(""); setFamilies([]); setContexts([]); selectProcedure(null); };
  const zoomIn = () => setMapZoom((current) => Math.min(1.6, Number((current + 0.2).toFixed(1))));
  const zoomOut = () => setMapZoom((current) => Math.max(0.6, Number((current - 0.2).toFixed(1))));
  const fitMap = () => { setMapZoom(1); requestAnimationFrame(() => { if (mapViewportRef.current) { mapViewportRef.current.scrollLeft = 0; mapViewportRef.current.scrollTop = 0; } }); };
  const startPan = (event: PointerEvent<SVGSVGElement>) => {
    if (!mapViewportRef.current) return;
    panRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, scrollLeft: mapViewportRef.current.scrollLeft, scrollTop: mapViewportRef.current.scrollTop, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const movePan = (event: PointerEvent<SVGSVGElement>) => {
    const viewport = mapViewportRef.current; const pan = panRef.current;
    if (!viewport || pan.pointerId !== event.pointerId) return;
    const dx = event.clientX - pan.startX; const dy = event.clientY - pan.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) pan.moved = true;
    viewport.scrollLeft = pan.scrollLeft - dx; viewport.scrollTop = pan.scrollTop - dy;
  };
  const endPan = (event: PointerEvent<SVGSVGElement>) => { if (panRef.current.pointerId === event.pointerId) event.currentTarget.releasePointerCapture(event.pointerId); };
  const clearMapSelection = () => { if (panRef.current.moved) { panRef.current.moved = false; return; } selectProcedure(null); };

  return (
    <main className="study-shell mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 md:px-8">
      <header className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal-700">Mapa de estudio</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#0d2b45] md:text-4xl">Mapa de pruebas de transformadores</h1>
        <p className="mt-3 max-w-3xl text-lg text-slate-700">Herramienta personal y educativa para comprender relaciones entre pruebas.</p>
        <p className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">Este mapa resume relaciones documentadas; para ampliar información, consulta el procedimiento original autorizado.</p>
      </header>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur" aria-label="Búsqueda y filtros">
        <div className="flex flex-wrap items-end justify-between gap-3"><div className="min-w-[220px] flex-1"><label htmlFor="procedure-search" className="text-sm font-semibold text-slate-800">Buscar una prueba</label><input id="procedure-search" value={query} onChange={(event) => { setQuery(event.target.value); selectProcedure(null); }} placeholder="Nombre, T50 o palabra de la ficha" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring-2" /></div><div className="text-sm text-slate-700" aria-live="polite"><strong>{filteredProcedures.length}</strong> de {procedures.length} pruebas coinciden{activeFilterCount ? ` con ${activeFilterCount} filtro${activeFilterCount === 1 ? "" : "s"} activo${activeFilterCount === 1 ? "" : "s"}` : ""}.</div>{activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpiar filtros</button>}</div>
        <div className="mt-4 border-t border-slate-200 pt-3"><p className="text-sm font-semibold text-slate-800">Familia técnica</p><div className="mt-2 flex flex-wrap gap-2">{technicalFamilies.map((family) => <button key={family} type="button" onClick={() => toggleFamily(family)} aria-pressed={families.includes(family)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${families.includes(family) ? "border-teal-600 bg-teal-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>{family}</button>)}</div></div>
        <div className="mt-4 border-t border-slate-200 pt-3"><p className="text-sm font-semibold text-slate-800">Contexto de ejecución documentado</p><div className="mt-2 flex flex-wrap gap-2">{documentedContexts.map((context) => <button key={context.id} type="button" onClick={() => toggleContext(context.id)} aria-pressed={contexts.includes(context.id)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${contexts.includes(context.id) ? "border-violet-600 bg-violet-700 text-white" : "border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100"}`}>{context.label}</button>)}</div></div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white/85 p-2 shadow-sm backdrop-blur"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setViewMode("explore")} className={`rounded-xl px-4 py-3 text-sm font-semibold ${viewMode === "explore" ? "bg-sky-100 text-sky-900 shadow-inner" : "bg-white text-slate-700 hover:bg-slate-50"}`}>Explorar pruebas</button><button type="button" onClick={() => setViewMode("map")} className={`rounded-xl px-4 py-3 text-sm font-semibold ${viewMode === "map" ? "bg-sky-100 text-sky-900 shadow-inner" : "bg-white text-slate-700 hover:bg-slate-50"}`}>Mapa de relaciones</button></div></section>

      {viewMode === "explore" && <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]"><div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur"><h2 className="px-2 text-xl font-semibold text-[#0d2b45]">Catálogo de procedimientos</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filteredProcedures.map((procedure) => <button key={procedure.code} type="button" onClick={() => selectProcedure(procedure.code)} className={`rounded-xl border px-4 py-4 text-left transition ${selectedCode === procedure.code ? "border-sky-300 bg-sky-50 shadow" : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"}`}><p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">{procedure.code}</p><h3 className="mt-1 text-base font-semibold leading-tight text-slate-900">{procedure.name}</h3><span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClass(procedure.studyStatus)}`}>{statusLabel(procedure.studyStatus)}</span><p className="mt-2 text-sm text-slate-600">{procedureFamilies[procedure.code]}</p></button>)}</div>{filteredProcedures.length === 0 && <p className="m-2 rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-600">No hay pruebas que coincidan con los filtros actuales.</p>}</div><ProcedurePanel procedure={selectedProcedure} relations={selectedRelations} onInspectRelation={setInspectedRelationKey} activeGlossaryTerm={activeGlossaryTerm} onSelectGlossaryTerm={setActiveGlossaryTerm} /></section>}

      {viewMode === "map" && <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]"><div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-[#0d2b45]">Mapa de relaciones</h2>{activeFilterCount > 0 && <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900"><span className="h-1.5 w-1.5 rounded-full bg-teal-600" /> Encuadre filtrado: {activeMapLabel}</p>}</div><div className="flex flex-wrap items-center gap-2 text-xs"><div className="inline-flex overflow-hidden rounded-full border border-slate-300 bg-white shadow-sm" aria-label="Controles del mapa"><button type="button" onClick={zoomOut} disabled={mapZoom <= 0.6} className="px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300" aria-label="Alejar mapa">−</button><button type="button" onClick={fitMap} className="min-w-14 border-x border-slate-200 px-2 py-1.5 font-medium text-slate-600 hover:bg-slate-50" aria-label={activeFilterCount ? "Encuadrar resultados filtrados" : "Encuadrar todo el mapa"}>{Math.round(mapZoom * 100)}%</button><button type="button" onClick={zoomIn} disabled={mapZoom >= 1.6} className="px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300" aria-label="Acercar mapa">+</button></div><button type="button" onClick={() => setShowDirectional((value) => !value)} aria-pressed={showDirectional} className={`rounded-full border px-3 py-1.5 font-medium ${showDirectional ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-500"}`}>Relaciones direccionales {showDirectional ? "visibles" : "ocultas"}</button><button type="button" onClick={() => setShowComplementary((value) => !value)} aria-pressed={showComplementary} className={`rounded-full border px-3 py-1.5 font-medium ${showComplementary ? "border-violet-300 bg-violet-50 text-violet-800" : "border-slate-300 bg-white text-slate-500"}`}>Montaje compartido {showComplementary ? "visible" : "oculto"}</button></div></div>
        <p className="mt-3 text-sm text-slate-600">Pulsa una tarjeta para ver la ficha y sus relaciones. Arrastra únicamente el espacio vacío para recorrer el mapa; un clic vacío deselecciona la prueba. Las salientes son verdes; las entrantes, naranjas; y las relaciones de montaje compartido, moradas punteadas y sin flecha.</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs"><span className="inline-flex items-center gap-1 text-emerald-800"><i className="h-0.5 w-6 bg-emerald-600" /> Saliente</span><span className="inline-flex items-center gap-1 text-orange-800"><i className="h-0.5 w-6 bg-orange-600" /> Entrante</span><span className="inline-flex items-center gap-1 text-violet-800"><i className="h-0 w-6 border-t-2 border-dashed border-violet-700" /> Complementaria</span><span className="text-slate-500">Pulsa una línea para ver su trazabilidad.</span></div>
        {inspectedRelation && <RelationTrace relation={inspectedRelation} onClose={() => setInspectedRelationKey(null)} />}
        <div ref={mapViewportRef} className="mt-4 overflow-auto rounded-xl border border-slate-200 bg-slate-50/70 p-2"><div className="flex min-h-[180px] items-center justify-center">{filteredProcedures.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-4 text-center text-sm text-slate-600">No hay pruebas para encuadrar con los filtros actuales.</p> : <svg viewBox={`${mapBounds.x} ${mapBounds.y} ${mapBounds.width} ${mapBounds.height}`} className="block select-none" style={{ height: `${mapCanvasHeight}px`, width: `${mapCanvasWidth}px` }} role="img" aria-label={`Mapa de relaciones: ${activeMapLabel}`} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} onClick={clearMapSelection}><defs><marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#16a34a" /></marker><marker id="arrow-orange" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ea580c" /></marker></defs><g pointerEvents="none">{visibleFamilyAreas.map((area) => <g key={area.label}><rect x={area.x} y={area.y} width={area.width} height={area.height} rx="18" fill={area.fill} stroke={area.stroke} /><text x={area.x + 20} y={area.y + 27} fill="#475569" fontSize="14" fontWeight="700">{area.label}</text></g>)}</g>{visibleRelations.map((relation, relationIndex) => <RelationPath key={relationKey(relation)} relation={relation} relationIndex={relationIndex} relationCount={visibleRelations.length} selectedCode={selectedCode} inspected={relationKey(relation) === inspectedRelationKey} onInspect={setInspectedRelationKey} />)}{procedures.map((procedure) => { if (!visibleCodes.has(procedure.code)) return null; const point = layout[procedure.code]; const selected = procedure.code === selectedCode; const outgoing = outgoingCodes.has(procedure.code); const incoming = incomingCodes.has(procedure.code); const shared = sharedCodes.has(procedure.code); const related = Boolean(selectedCode) && (selected || outgoing || incoming || shared); const inactive = Boolean(selectedCode) && !related; const fill = selected ? "#dbeafe" : outgoing ? "#dcfce7" : incoming ? "#ffedd5" : shared ? "#f3e8ff" : "#ffffff"; const stroke = selected ? "#0284c7" : outgoing ? "#16a34a" : incoming ? "#ea580c" : shared ? "#7e22ce" : "#94a3b8"; const cardWidth = selected ? 146 : inactive ? 96 : 132; const cardHeight = selected ? 66 : inactive ? 38 : 56; const label = procedure.name.length > 22 ? `${procedure.name.slice(0, 21)}…` : procedure.name; return <g key={procedure.code} transform={`translate(${point.x}, ${point.y})`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); selectProcedure(procedure.code); }} style={{ cursor: "pointer" }}><title>{`${procedure.code} · ${procedure.name}`}</title><rect x={-cardWidth / 2} y={-cardHeight / 2} width={cardWidth} height={cardHeight} rx="12" fill={fill} stroke={inactive ? "#cbd5e1" : stroke} strokeWidth={selected ? 3 : 2} opacity={inactive ? 0.66 : 1} /><text textAnchor="middle" y={inactive ? "4" : "-5"} fontSize={inactive ? "9" : "11"} fontWeight="800" fill={inactive ? "#94a3b8" : "#0f172a"}>{procedure.code}</text>{!inactive && <text textAnchor="middle" y="14" fontSize="8.5" fontWeight="600" fill="#475569">{label}</text>}</g>; })}</svg>}</div></div></div><ProcedurePanel procedure={selectedProcedure} relations={visibleRelations} onInspectRelation={setInspectedRelationKey} activeGlossaryTerm={activeGlossaryTerm} onSelectGlossaryTerm={setActiveGlossaryTerm} /></section>}

      <ComparisonPanel codes={comparisonCodes} onChange={setComparisonCodes} />
    </main>
  );
}

function RelationPath({ relation, relationIndex, relationCount, selectedCode, inspected, onInspect }: { relation: ProcedureRelation; relationIndex: number; relationCount: number; selectedCode: string | null; inspected: boolean; onInspect: (key: string) => void }) {
  const source = layout[relation.from]; const target = layout[relation.to];
  if (!source || !target) return null;
  const outgoing = relation.from === selectedCode; const shared = relation.type === "shared_setup"; const color = shared ? "#7e22ce" : outgoing ? "#16a34a" : "#ea580c";
  const dx = target.x - source.x; const dy = target.y - source.y; const distance = Math.hypot(dx, dy) || 1; const ux = dx / distance; const uy = dy / distance;
  const startX = source.x + ux * 37; const startY = source.y + uy * 37; const endX = target.x - ux * 39; const endY = target.y - uy * 39;
  const lane = relationIndex - (relationCount - 1) / 2; const bend = lane * 58; const controlX = (startX + endX) / 2 - uy * bend; const controlY = (startY + endY) / 2 + ux * bend;
  return <path d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`} fill="none" stroke={color} strokeWidth={inspected ? "7" : "3.5"} strokeOpacity={inspected ? "0.85" : "1"} strokeDasharray={shared ? "4 7" : undefined} strokeLinecap="round" markerEnd={shared ? undefined : outgoing ? "url(#arrow-green)" : "url(#arrow-orange)"} tabIndex={0} role="button" aria-label={`Ver trazabilidad de la relación ${relation.from} ${shared ? "con" : "hacia"} ${relation.to}`} onClick={(event) => { event.stopPropagation(); onInspect(relationKey(relation)); }} onMouseEnter={() => onInspect(relationKey(relation))} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onInspect(relationKey(relation)); } }} />;
}

function RelationTrace({ relation, onClose }: { relation: ProcedureRelation; onClose: () => void }) {
  const shared = relation.type === "shared_setup";
  return <section className="mt-4 rounded-xl border border-sky-200 bg-sky-50/80 p-4" aria-live="polite"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-sky-800">Trazabilidad de la relación</p><h3 className="mt-1 text-base font-semibold text-slate-900">{shared ? `${procedureName(relation.from)} ↔ ${procedureName(relation.to)}` : `${procedureName(relation.from)} → ${procedureName(relation.to)}`}</h3></div><button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-white" aria-label="Cerrar trazabilidad">×</button></div><div className="mt-3 grid gap-2 text-sm text-slate-700"><p><strong>Tipo:</strong> {typeLabel(relation.type)}.</p><p><strong>Qué la justifica:</strong> {relation.rationale}</p><p><strong>Condición:</strong> {relation.condition}</p>{relation.transferredData && <p><strong>Dato asociado:</strong> {relation.transferredData}</p>}</div></section>;
}

function GlossaryText({ children, onSelect }: { children: string; onSelect: (term: GlossaryTerm) => void }) {
  const pieces = children.split(glossaryPattern);
  return <>{pieces.map((piece, index) => {
    const match = glossaryMatches.find(({ alias }) => alias.localeCompare(piece, "es", { sensitivity: "accent" }) === 0);
    if (!match) return <Fragment key={`${piece}-${index}`}>{piece}</Fragment>;
    return <button key={`${match.term.id}-${index}`} type="button" onClick={() => onSelect(match.term)} className="rounded border-b border-dashed border-sky-500 px-0.5 font-semibold text-sky-900 decoration-sky-500 underline-offset-2 transition hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-400" aria-label={`Abrir glosario: ${match.term.label}`}>{piece}</button>;
  })}</>;
}

function GlossaryCard({ term, onClose }: { term: GlossaryTerm; onClose: () => void }) {
  return <section className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 shadow-sm" aria-live="polite"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-indigo-800">Glosario contextual</p><h3 className="mt-1 text-lg font-semibold text-slate-900">{term.label}</h3></div><button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-white" aria-label="Cerrar glosario">×</button></div><p className="mt-3 text-sm leading-6 text-slate-800">{term.definition}</p><p className="mt-3 rounded-lg border border-indigo-100 bg-white/80 p-3 text-sm leading-6 text-slate-700"><strong>Analogía:</strong> {term.analogy}</p></section>;
}

function ProcedurePanel({ procedure, relations, onInspectRelation, activeGlossaryTerm, onSelectGlossaryTerm }: { procedure: Procedure | null; relations: ProcedureRelation[]; onInspectRelation: (key: string) => void; activeGlossaryTerm: GlossaryTerm | null; onSelectGlossaryTerm: (term: GlossaryTerm | null) => void }) {
  if (!procedure) return <aside className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm xl:sticky xl:top-6 xl:h-fit"><h2 className="text-2xl font-semibold text-[#0d2b45]">Detalle de la prueba</h2><p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm leading-6 text-slate-600">Selecciona una prueba para consultar su ficha y sus relaciones documentadas.</p></aside>;
  const specialConditions = documentedSpecialConditions[procedure.code] ?? [];
  return <aside className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto"><div className="flex items-start justify-between gap-3"><h2 className="text-2xl font-semibold text-[#0d2b45]">Detalle de la prueba</h2><span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(procedure.studyStatus)}`}>{statusLabel(procedure.studyStatus)}</span></div><div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-700">{procedure.code}</p><h3 className="mt-1 text-xl font-semibold leading-snug text-slate-900"><GlossaryText onSelect={(term) => onSelectGlossaryTerm(term)}>{procedure.name}</GlossaryText></h3><p className="mt-3 inline-flex rounded-md bg-white px-2 py-1 text-sm font-medium text-slate-600 ring-1 ring-slate-200">{procedureFamilies[procedure.code]}</p></div>{procedure.didacticSummary && <section className="mt-5 space-y-2"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">El ensayo, en una mirada</h3><span className="text-xs text-slate-500">Términos subrayados: glosario</span></div><p className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-sm leading-6 text-slate-800"><strong>Se aplica o conecta:</strong> <GlossaryText onSelect={(term) => onSelectGlossaryTerm(term)}>{procedure.didacticSummary.apply}</GlossaryText></p><p className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-sm leading-6 text-slate-800"><strong>Se mide o registra:</strong> <GlossaryText onSelect={(term) => onSelectGlossaryTerm(term)}>{procedure.didacticSummary.measure}</GlossaryText></p><p className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-sm leading-6 text-slate-800"><strong>Se obtiene:</strong> <GlossaryText onSelect={(term) => onSelectGlossaryTerm(term)}>{procedure.didacticSummary.obtain}</GlossaryText></p></section>}{activeGlossaryTerm && <GlossaryCard term={activeGlossaryTerm} onClose={() => onSelectGlossaryTerm(null)} />}{specialConditions.length > 0 && <section className="mt-4"><h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">Condiciones especiales</h3>{specialConditions.map((item, index) => <p key={index} className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-slate-800">{item.summary}</p>)}</section>}<section className="mt-4"><h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">Relaciones documentadas</h3>{relations.length === 0 ? <p className="mt-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600">Sin relaciones verificadas visibles en la matriz actual.</p> : relations.map((relation) => <button type="button" key={relationKey(relation)} onClick={() => onInspectRelation(relationKey(relation))} className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50"><p className="text-sm font-semibold text-slate-900">{relation.type === "shared_setup" ? `${relation.from} ↔ ${relation.to}` : `${relation.from} → ${relation.to}`}</p><span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{typeLabel(relation.type)}</span><p className="mt-2 text-sm text-slate-700">{relation.rationale}</p><p className="mt-2 text-sm text-slate-600"><strong>Condición:</strong> {relation.condition}</p></button>)}</section></aside>;
}

function ComparisonPanel({ codes, onChange }: { codes: [string, string]; onChange: (codes: [string, string]) => void }) {
  const comparison = codes.map((code) => procedures.find((procedure) => procedure.code === code) ?? null) as [Procedure | null, Procedure | null];
  return <section className="mt-6 rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.1em] text-teal-700">Comparar dos pruebas</p><h2 className="mt-1 text-xl font-semibold text-[#0d2b45]">Ficha paralela</h2><p className="mt-1 text-sm text-slate-600">La comparación reúne el contenido ya documentado en cada ficha; no establece una relación nueva entre las pruebas.</p></div>{codes.some(Boolean) && <button type="button" onClick={() => onChange(["", ""])} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpiar comparación</button>}</div><div className="mt-4 grid gap-3 md:grid-cols-2">{([0, 1] as const).map((index) => <label key={index} className="text-sm font-semibold text-slate-700">Prueba {index === 0 ? "A" : "B"}<select value={codes[index]} onChange={(event) => { const next: [string, string] = [...codes] as [string, string]; next[index] = event.target.value; onChange(next); }} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800"><option value="">Seleccionar prueba</option>{procedures.map((procedure) => <option key={procedure.code} value={procedure.code}>{procedure.code} · {procedure.name}</option>)}</select></label>)}</div>{comparison.some(Boolean) && <div className="mt-5 grid gap-4 lg:grid-cols-2">{comparison.map((procedure, index) => <article key={index} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">{procedure ? <><p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-700">{procedure.code}</p><h3 className="mt-1 text-lg font-semibold text-slate-900">{procedure.name}</h3><p className="mt-3 rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-sm leading-6 text-slate-800"><strong>Se aplica:</strong> {procedure.didacticSummary?.apply}</p><p className="mt-2 rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-sm leading-6 text-slate-800"><strong>Se mide:</strong> {procedure.didacticSummary?.measure}</p><p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-sm leading-6 text-slate-800"><strong>Se obtiene:</strong> {procedure.didacticSummary?.obtain}</p></> : <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">Selecciona la prueba {index === 0 ? "A" : "B"} para completar la comparación.</p>}</article>)}</div>}</section>;
}
