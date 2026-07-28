"use client";

import { useMemo, useState } from "react";
import {
  documentedContexts,
  documentedSpecialConditions,
  procedures,
  procedureFamilies,
  StudyStatus,
  technicalFamilies,
  verifiedRelations
} from "@/data/pruebas";

type ViewMode = "explore" | "map";

const layout: Record<string, { x: number; y: number }> = {
  "T50-02417": { x: 150, y: 150 }, "T50-02338": { x: 340, y: 150 }, "T50-02407": { x: 530, y: 150 }, "T50-04588": { x: 720, y: 150 },
  "T50-02386": { x: 160, y: 340 }, "T50-02413": { x: 380, y: 340 }, "T50-02692": { x: 600, y: 340 },
  "T50-02404": { x: 850, y: 300 }, "T50-02367": { x: 1030, y: 300 },
  "T50-02416": { x: 120, y: 540 }, "T50-02398": { x: 300, y: 540 }, "T50-02393": { x: 480, y: 540 }, "T50-02376": { x: 660, y: 540 }, "T50-02408": { x: 840, y: 540 }, "T50-04598": { x: 1020, y: 540 },
  "T50-02869": { x: 390, y: 730 }, "T50-04590": { x: 770, y: 730 }
};

function statusLabel(status: StudyStatus) { return status === "studied" ? "Estudiada" : status === "in_progress" ? "En curso" : "Pendiente"; }
function statusClass(status: StudyStatus) { return status === "studied" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : status === "in_progress" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-600"; }
function typeLabel(type: "prerequisite" | "data_dependency" | "shared_setup") { return type === "prerequisite" ? "Prerequisito" : type === "data_dependency" ? "Dependencia de datos" : "Se realiza durante / comparte montaje"; }

export default function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("explore");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [families, setFamilies] = useState<string[]>([]);
  const [contexts, setContexts] = useState<string[]>([]);
  const [showDirectional, setShowDirectional] = useState(true);
  const [showComplementary, setShowComplementary] = useState(true);

  const filteredProcedures = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return procedures.filter((procedure) => {
      const searchable = [procedure.code, procedure.name, procedure.category, procedure.didacticSummary?.apply, procedure.didacticSummary?.measure, procedure.didacticSummary?.obtain].filter(Boolean).join(" ").toLocaleLowerCase("es");
      const queryMatch = !normalized || searchable.includes(normalized);
      const familyMatch = families.length === 0 || families.includes(procedureFamilies[procedure.code]);
      const contextMatch = contexts.length === 0 || contexts.every((contextId) => documentedContexts.find((context) => context.id === contextId)?.codes.includes(procedure.code));
      return queryMatch && familyMatch && contextMatch;
    });
  }, [contexts, families, query]);

  const visibleCodes = useMemo(() => new Set(filteredProcedures.map((procedure) => procedure.code)), [filteredProcedures]);
  const selectedProcedure = selectedCode ? procedures.find((procedure) => procedure.code === selectedCode) ?? null : null;
  const selectedRelations = useMemo(() => selectedCode ? verifiedRelations.filter((relation) => relation.from === selectedCode || relation.to === selectedCode) : [], [selectedCode]);
  const outgoingCodes = useMemo(() => new Set(selectedRelations.filter((relation) => relation.type !== "shared_setup" && relation.from === selectedCode).map((relation) => relation.to)), [selectedCode, selectedRelations]);
  const incomingCodes = useMemo(() => new Set(selectedRelations.filter((relation) => relation.type !== "shared_setup" && relation.to === selectedCode).map((relation) => relation.from)), [selectedCode, selectedRelations]);
  const sharedCodes = useMemo(() => new Set(selectedRelations.filter((relation) => relation.type === "shared_setup").map((relation) => relation.from === selectedCode ? relation.to : relation.from)), [selectedCode, selectedRelations]);
  const activeFilterCount = families.length + contexts.length + (query.trim() ? 1 : 0);

  const toggleFamily = (family: string) => { setSelectedCode(null); setFamilies((current) => current.includes(family) ? current.filter((item) => item !== family) : [...current, family]); };
  const toggleContext = (context: string) => { setSelectedCode(null); setContexts((current) => current.includes(context) ? current.filter((item) => item !== context) : [...current, context]); };
  const clearFilters = () => { setQuery(""); setFamilies([]); setContexts([]); setSelectedCode(null); };

  return (
    <main className="study-shell mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 md:px-8">
      <header className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal-700">Mapa de estudio</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#0d2b45] md:text-4xl">Mapa de pruebas de transformadores</h1>
        <p className="mt-3 max-w-3xl text-lg text-slate-700">Herramienta personal y educativa para comprender relaciones entre pruebas.</p>
        <p className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">Este mapa resume relaciones documentadas; para ampliar información, consulta el procedimiento original autorizado.</p>
      </header>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur" aria-label="Búsqueda y filtros">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="procedure-search" className="text-sm font-semibold text-slate-800">Buscar una prueba</label>
            <input id="procedure-search" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedCode(null); }} placeholder="Nombre, T50 o palabra de la ficha" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring-2" />
          </div>
          <div className="text-sm text-slate-700" aria-live="polite"><strong>{filteredProcedures.length}</strong> de {procedures.length} pruebas coinciden{activeFilterCount ? ` con ${activeFilterCount} filtro${activeFilterCount === 1 ? "" : "s"} activo${activeFilterCount === 1 ? "" : "s"}` : ""}.</div>
          {activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Limpiar filtros</button>}
        </div>
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-sm font-semibold text-slate-800">Familia técnica</p>
          <div className="mt-2 flex flex-wrap gap-2">{technicalFamilies.map((family) => <button key={family} type="button" onClick={() => toggleFamily(family)} aria-pressed={families.includes(family)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${families.includes(family) ? "border-teal-600 bg-teal-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>{family}</button>)}</div>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-sm font-semibold text-slate-800">Contexto de ejecución documentado</p>
          <div className="mt-2 flex flex-wrap gap-2">{documentedContexts.map((context) => <button key={context.id} type="button" onClick={() => toggleContext(context.id)} aria-pressed={contexts.includes(context.id)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${contexts.includes(context.id) ? "border-violet-600 bg-violet-700 text-white" : "border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100"}`}>{context.label}</button>)}</div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white/85 p-2 shadow-sm backdrop-blur"><div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setViewMode("explore")} className={`rounded-xl px-4 py-3 text-sm font-semibold ${viewMode === "explore" ? "bg-sky-100 text-sky-900 shadow-inner" : "bg-white text-slate-700 hover:bg-slate-50"}`}>Explorar pruebas</button>
        <button type="button" onClick={() => setViewMode("map")} className={`rounded-xl px-4 py-3 text-sm font-semibold ${viewMode === "map" ? "bg-sky-100 text-sky-900 shadow-inner" : "bg-white text-slate-700 hover:bg-slate-50"}`}>Mapa de relaciones</button>
      </div></section>

      {viewMode === "explore" && <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
          <h2 className="px-2 text-xl font-semibold text-[#0d2b45]">Catálogo de procedimientos</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filteredProcedures.map((procedure) => <button key={procedure.code} type="button" onClick={() => setSelectedCode(procedure.code)} className={`rounded-xl border px-4 py-4 text-left transition ${selectedCode === procedure.code ? "border-sky-300 bg-sky-50 shadow" : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">{procedure.code}</p><h3 className="mt-1 text-base font-semibold leading-tight text-slate-900">{procedure.name}</h3><span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClass(procedure.studyStatus)}`}>{statusLabel(procedure.studyStatus)}</span><p className="mt-2 text-sm text-slate-600">{procedureFamilies[procedure.code]}</p>
          </button>)}</div>
          {filteredProcedures.length === 0 && <p className="m-2 rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-600">No hay pruebas que coincidan con los filtros actuales.</p>}
        </div>
        <ProcedurePanel procedure={selectedProcedure} relations={selectedRelations} />
      </section>}

      {viewMode === "map" && <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold text-[#0d2b45]">Mapa de relaciones</h2><div className="flex flex-wrap gap-2 text-xs">
            <button type="button" onClick={() => setShowDirectional((value) => !value)} aria-pressed={showDirectional} className={`rounded-full border px-3 py-1.5 font-medium ${showDirectional ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-500"}`}>Relaciones direccionales {showDirectional ? "visibles" : "ocultas"}</button>
            <button type="button" onClick={() => setShowComplementary((value) => !value)} aria-pressed={showComplementary} className={`rounded-full border px-3 py-1.5 font-medium ${showComplementary ? "border-violet-300 bg-violet-50 text-violet-800" : "border-slate-300 bg-white text-slate-500"}`}>Montaje compartido {showComplementary ? "visible" : "oculto"}</button>
          </div></div>
          <p className="mt-3 text-sm text-slate-600">Selecciona una prueba para revelar solo sus relaciones. Las salientes son verdes; las entrantes, naranjas; y las relaciones de montaje compartido, moradas punteadas y sin flecha.</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs"><span className="inline-flex items-center gap-1 text-emerald-800"><i className="h-0.5 w-6 bg-emerald-600" /> Saliente</span><span className="inline-flex items-center gap-1 text-orange-800"><i className="h-0.5 w-6 bg-orange-600" /> Entrante</span><span className="inline-flex items-center gap-1 text-violet-800"><i className="h-0 w-6 border-t-2 border-dashed border-violet-700" /> Complementaria</span></div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/70 p-2"><svg viewBox="0 0 1180 810" className="h-[510px] min-w-[920px] w-full" role="img" aria-label="Mapa fijo de relaciones verificadas entre pruebas">
            <defs><marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#16a34a" /></marker><marker id="arrow-orange" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ea580c" /></marker></defs>
            <g fill="#64748b" fontSize="14" fontWeight="700"><text x="80" y="62">Excitación, núcleo y ruido</text><text x="80" y="245">Devanados, relación y respuesta mecánica</text><text x="790" y="210">Pérdidas y calentamiento</text><text x="75" y="445">Aislamiento dieléctrico</text><text x="290" y="650">Secuencia cero</text><text x="690" y="650">Transformadores de corriente</text></g>
            {selectedRelations.map((relation) => {
              if ((relation.type === "shared_setup" && !showComplementary) || (relation.type !== "shared_setup" && !showDirectional)) return null;
              const source = layout[relation.from]; const target = layout[relation.to]; if (!source || !target) return null;
              const outgoing = relation.from === selectedCode; const shared = relation.type === "shared_setup"; const color = shared ? "#7e22ce" : outgoing ? "#16a34a" : "#ea580c"; const dx = target.x - source.x; const dy = target.y - source.y; const distance = Math.hypot(dx, dy) || 1; const ux = dx / distance; const uy = dy / distance;
              return <line key={`${relation.from}-${relation.to}`} x1={source.x + ux * 37} y1={source.y + uy * 37} x2={target.x - ux * 39} y2={target.y - uy * 39} stroke={color} strokeWidth="3.5" strokeDasharray={shared ? "4 7" : undefined} strokeLinecap="round" markerEnd={shared ? undefined : outgoing ? "url(#arrow-green)" : "url(#arrow-orange)"} />;
            })}
            {procedures.map((procedure) => { if (!visibleCodes.has(procedure.code)) return null; const point = layout[procedure.code]; const selected = procedure.code === selectedCode; const outgoing = outgoingCodes.has(procedure.code); const incoming = incomingCodes.has(procedure.code); const shared = sharedCodes.has(procedure.code); const related = Boolean(selectedCode) && (selected || outgoing || incoming || shared); const inactive = Boolean(selectedCode) && !related; const fill = selected ? "#dbeafe" : outgoing ? "#dcfce7" : incoming ? "#ffedd5" : shared ? "#f3e8ff" : "#f8fafc"; const stroke = selected ? "#0284c7" : outgoing ? "#16a34a" : incoming ? "#ea580c" : shared ? "#7e22ce" : "#cbd5e1"; return <g key={procedure.code} transform={`translate(${point.x}, ${point.y})`} onClick={() => setSelectedCode(procedure.code)} style={{ cursor: "pointer" }}><circle r={selected ? 34 : inactive ? 18 : 28} fill={fill} stroke={inactive ? "#cbd5e1" : stroke} strokeWidth={selected ? 3 : 2} opacity={inactive ? 0.65 : 1} /><text textAnchor="middle" dominantBaseline="middle" fontSize={inactive ? "8" : "10"} fontWeight="700" fill={inactive ? "#94a3b8" : "#0f172a"}>{procedure.code}</text></g>; })}
          </svg></div>
        </div>
        <ProcedurePanel procedure={selectedProcedure} relations={selectedRelations.filter((relation) => relation.type === "shared_setup" ? showComplementary : showDirectional)} />
      </section>}
    </main>
  );
}

function ProcedurePanel({ procedure, relations }: { procedure: (typeof procedures)[number] | null; relations: typeof verifiedRelations }) {
  if (!procedure) return <aside className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm"><h2 className="text-xl font-semibold text-[#0d2b45]">Detalle de la prueba</h2><p className="mt-3 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">Selecciona una prueba para consultar su ficha y sus relaciones documentadas.</p></aside>;
  const specialConditions = documentedSpecialConditions[procedure.code] ?? [];
  return <aside className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm xl:sticky xl:top-6 xl:h-fit"><h2 className="text-xl font-semibold text-[#0d2b45]">Detalle de la prueba</h2><div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">{procedure.code}</p><h3 className="mt-1 text-lg font-semibold text-slate-900">{procedure.name}</h3><span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClass(procedure.studyStatus)}`}>{statusLabel(procedure.studyStatus)}</span><p className="mt-2 text-sm text-slate-600">{procedureFamilies[procedure.code]}</p></div>
    {procedure.didacticSummary && <section className="mt-4 space-y-2"><h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">El ensayo, en una mirada</h3><p className="rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-sm text-slate-800"><strong>Se aplica o conecta:</strong> {procedure.didacticSummary.apply}</p><p className="rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-sm text-slate-800"><strong>Se mide o registra:</strong> {procedure.didacticSummary.measure}</p><p className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-sm text-slate-800"><strong>Se obtiene:</strong> {procedure.didacticSummary.obtain}</p></section>}
    {specialConditions.length > 0 && <section className="mt-4"><h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">Condiciones especiales</h3>{specialConditions.map((item, index) => <p key={index} className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-slate-800">{item.summary}</p>)}</section>}
    <section className="mt-4"><h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">Relaciones documentadas</h3>{relations.length === 0 ? <p className="mt-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600">Sin relaciones verificadas visibles en la matriz actual.</p> : relations.map((relation) => <article key={`${relation.from}-${relation.to}`} className="mt-2 rounded-lg border border-slate-200 p-3"><p className="text-sm font-semibold text-slate-900">{relation.type === "shared_setup" ? `${relation.from} ↔ ${relation.to}` : `${relation.from} → ${relation.to}`}</p><span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{typeLabel(relation.type)}</span><p className="mt-2 text-sm text-slate-700">{relation.rationale}</p><p className="mt-2 text-sm text-slate-600"><strong>Condición:</strong> {relation.condition}</p></article>)}</section>
  </aside>;
}
