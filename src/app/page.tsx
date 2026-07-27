"use client";

import { useMemo, useState } from "react";
import { documentedSpecialConditions, procedures, StudyStatus, verifiedRelations } from "@/data/pruebas";

type ViewMode = "explore" | "map";
type RelationFocus = "none" | "outgoing" | "incoming";

function typeLabel(type: "prerequisite" | "data_dependency") {
  if (type === "prerequisite") return "Prerequisito";
  return "Dependencia de datos";
}

function relationColor(type: "prerequisite" | "data_dependency") {
  if (type === "prerequisite") return "#b45309";
  return "#0369a1";
}

function studyStatusLabel(status: StudyStatus) {
  if (status === "studied") return "Estudiada";
  if (status === "in_progress") return "En curso";
  return "Pendiente";
}

function studyStatusClassName(status: StudyStatus) {
  if (status === "studied") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "in_progress") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function studyStatusColor(status: StudyStatus) {
  if (status === "studied") return "#059669";
  if (status === "in_progress") return "#d97706";
  return "#94a3b8";
}

export default function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("explore");
  const [selectedCode, setSelectedCode] = useState<string>(procedures[0]?.code ?? "");
  const [relationFocus, setRelationFocus] = useState<RelationFocus>("none");

  const svgWidth = 1000;
  const svgHeight = 660;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const radius = 240;

  const selectedProcedure = useMemo(
    () => procedures.find((procedure) => procedure.code === selectedCode) ?? procedures[0],
    [selectedCode]
  );

  const outgoing = useMemo(
    () => verifiedRelations.filter((relation) => relation.from === selectedProcedure.code),
    [selectedProcedure.code]
  );

  const incoming = useMemo(
    () => verifiedRelations.filter((relation) => relation.to === selectedProcedure.code),
    [selectedProcedure.code]
  );

  const nodes = useMemo(
    () =>
      procedures.map((procedure, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / procedures.length;
        return {
          ...procedure,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      }),
    [centerX, centerY, radius]
  );

  const nodeByCode = useMemo(
    () => new Map(nodes.map((node) => [node.code, node])),
    [nodes]
  );

  const selectedRelationKeys = useMemo(
    () =>
      new Set(
        verifiedRelations
          .filter((relation) => relation.from === selectedProcedure.code || relation.to === selectedProcedure.code)
          .map((relation) => `${relation.from}-${relation.to}`)
      ),
    [selectedProcedure.code]
  );

  const outgoingCodes = useMemo(
    () => new Set(outgoing.map((relation) => relation.to)),
    [outgoing]
  );

  const incomingCodes = useMemo(
    () => new Set(incoming.map((relation) => relation.from)),
    [incoming]
  );

  const focusedRelationKeys = useMemo(
    () =>
      new Set(
        (relationFocus === "outgoing" ? outgoing : relationFocus === "incoming" ? incoming : []).map(
          (relation) => `${relation.from}-${relation.to}`
        )
      ),
    [incoming, outgoing, relationFocus]
  );

  const focusDirection = (direction: Exclude<RelationFocus, "none">) => {
    setRelationFocus((currentFocus) => (currentFocus === direction ? "none" : direction));
  };

  const selectProcedure = (code: string) => {
    setSelectedCode(code);
    setRelationFocus("none");
  };

  const selectedNarrative = useMemo(() => {
    if (incoming.length === 0 && outgoing.length === 0) {
      return "Esta prueba no muestra relaciones verificadas directas en la matriz actual; puede estudiarse como referencia individual dentro del mapa.";
    }

    const total = incoming.length + outgoing.length;
    const prerequisiteCount = [...incoming, ...outgoing].filter((relation) => relation.type === "prerequisite").length;
    const dataCount = [...incoming, ...outgoing].filter((relation) => relation.type === "data_dependency").length;

    return `Esta vista muestra ${total} conexión(es) verificadas para ${selectedProcedure.code}: ${outgoing.length} saliente(s), ${incoming.length} entrante(s), ${prerequisiteCount} de tipo prerequisito y ${dataCount} de tipo dependencia de datos. Úsala como apoyo didáctico para interpretar dependencias documentadas, no como una secuencia operativa obligatoria.`;
  }, [incoming, outgoing, selectedProcedure.code]);

  const selectedSpecialConditions = documentedSpecialConditions[selectedProcedure.code] ?? [];

  return (
    <main className="study-shell mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 md:px-8">
      <header className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal-700">Mapa de estudio</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#0d2b45] md:text-4xl">
          Mapa de pruebas de transformadores
        </h1>
        <p className="mt-3 max-w-3xl text-lg text-slate-700">
          Herramienta personal y educativa para comprender relaciones entre pruebas.
        </p>
        <p className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
          Este mapa resume relaciones documentadas; para ampliar información, consulta el procedimiento original autorizado.
        </p>
      </header>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
        <h2 className="text-lg font-semibold text-[#0d2b45]">Cómo leer este mapa</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
            <p className="text-sm font-semibold text-slate-900">Flecha</p>
            <p className="mt-1 text-sm text-slate-700">
              Indica una relación documentada entre una prueba de origen y una prueba de destino.
            </p>
          </article>

          <article className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-3">
            <p className="text-sm font-semibold text-amber-900">Prerequisito</p>
            <p className="mt-1 text-sm text-slate-700">
              Señala una prueba o resultado que el procedimiento de destino requiere considerar antes de una etapa determinada.
            </p>
          </article>

          <article className="rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-3">
            <p className="text-sm font-semibold text-sky-900">Dependencia de datos</p>
            <p className="mt-1 text-sm text-slate-700">
              Señala que un dato medido en una prueba se utiliza en el cálculo o la interpretación de otra.
            </p>
          </article>
        </div>

        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-800">
          Las condiciones especiales son avisos de estudio; no son flechas ni definen por sí solas una secuencia operativa obligatoria.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          El estado de lectura indica el avance personal del estudio. Las pruebas pendientes aparecen en el catálogo sin relaciones ni explicaciones técnicas hasta revisar su procedimiento.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white/85 p-2 shadow-sm backdrop-blur">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setViewMode("explore")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              viewMode === "explore"
                ? "bg-sky-100 text-sky-900 shadow-inner"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
            aria-pressed={viewMode === "explore"}
          >
            Explorar pruebas
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              viewMode === "map"
                ? "bg-sky-100 text-sky-900 shadow-inner"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
            aria-pressed={viewMode === "map"}
          >
            Mapa de relaciones
          </button>
        </div>
      </section>

      {viewMode === "explore" && (
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-2">
              <h2 className="text-xl font-semibold text-[#0d2b45]">Catálogo de procedimientos</h2>
              <p className="text-sm text-slate-600">{procedures.length} procedimientos</p>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {procedures.map((procedure, index) => {
                const isActive = selectedProcedure.code === procedure.code;
                const isOutgoingTarget = relationFocus === "outgoing" && outgoingCodes.has(procedure.code);
                const isIncomingSource = relationFocus === "incoming" && incomingCodes.has(procedure.code);
                const isBidirectional = isOutgoingTarget && isIncomingSource;
                const relationHighlightClass = isActive
                  ? "border-sky-300 bg-sky-50 shadow"
                  : isBidirectional
                    ? "border-violet-300 bg-violet-50"
                    : isOutgoingTarget
                      ? "border-emerald-300 bg-emerald-50"
                      : isIncomingSource
                        ? "border-orange-300 bg-orange-50"
                        : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50";
                return (
                  <button
                    key={procedure.code}
                    type="button"
                    onClick={() => selectProcedure(procedure.code)}
                    className={`rounded-xl border px-4 py-4 text-left transition ${relationHighlightClass}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">{procedure.code}</p>
                    <h3 className="mt-1 text-base font-semibold leading-tight text-slate-900">{procedure.name}</h3>
                    <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${studyStatusClassName(procedure.studyStatus)}`}>
                      {studyStatusLabel(procedure.studyStatus)}
                    </span>
                    {!isActive && isOutgoingTarget && !isIncomingSource && (
                      <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                        Saliente
                      </span>
                    )}
                    {!isActive && isIncomingSource && !isOutgoingTarget && (
                      <span className="ml-2 inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                        Entrante
                      </span>
                    )}
                    {procedure.category ? (
                      <p className="mt-2 text-sm text-slate-600">{procedure.category}</p>
                    ) : (
                      <p className="mt-2 text-sm italic text-slate-500">Categoria no documentada aun</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur lg:sticky lg:top-6 lg:h-fit">
            <h2 className="text-xl font-semibold text-[#0d2b45]">Detalle de la prueba</h2>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">{selectedProcedure.code}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{selectedProcedure.name}</h3>
              <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${studyStatusClassName(selectedProcedure.studyStatus)}`}>
                {studyStatusLabel(selectedProcedure.studyStatus)}
              </span>
              {selectedProcedure.category && (
                <p className="mt-1 text-sm text-slate-600">{selectedProcedure.category}</p>
              )}
            </div>

            <div className="mt-5 space-y-5">
              {selectedProcedure.didacticSummary && (
                <section aria-labelledby="ensayo-en-una-mirada">
                  <h4 id="ensayo-en-una-mirada" className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">
                    El ensayo, en una mirada
                  </h4>
                  <div className="mt-2 space-y-2">
                    <article className="rounded-lg border border-teal-200 bg-teal-50/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-800">1. Se aplica o conecta</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedProcedure.didacticSummary.apply}</p>
                    </article>
                    <article className="rounded-lg border border-sky-200 bg-sky-50/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sky-800">2. Se mide o registra</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedProcedure.didacticSummary.measure}</p>
                    </article>
                    <article className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-800">3. Se obtiene o interpreta</p>
                      <p className="mt-1 text-sm text-slate-800">{selectedProcedure.didacticSummary.obtain}</p>
                    </article>
                  </div>
                </section>
              )}

              {selectedSpecialConditions.length > 0 && (
                <section>
                  <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">Condiciones especiales</h4>
                  <div className="mt-2 space-y-2">
                    {selectedSpecialConditions.map((specialCondition, index) => (
                      <article
                        key={`${selectedProcedure.code}-special-${index}`}
                        className="rounded-lg border border-amber-200 bg-amber-50/80 p-3"
                      >
                        <p className="text-sm text-slate-800">{specialCondition.summary}</p>
                        <p className="mt-2 text-sm font-medium text-amber-900">
                          Esta condición orienta el estudio del procedimiento; no define por sí sola una secuencia operativa obligatoria.
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <button
                  type="button"
                  onClick={() => focusDirection("outgoing")}
                  aria-pressed={relationFocus === "outgoing"}
                  className={`rounded-md px-2 py-1 text-left text-sm font-semibold uppercase tracking-[0.08em] transition ${
                    relationFocus === "outgoing"
                      ? "bg-emerald-100 text-emerald-900"
                      : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
                  }`}
                >
                  Relaciones salientes
                </button>
                <div className="mt-2 space-y-2">
                  {outgoing.length === 0 && (
                    <p className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600">
                      Sin relaciones salientes verificadas en la matriz principal.
                    </p>
                  )}
                  {outgoing.map((relation) => (
                    <article key={`${relation.from}-${relation.to}`} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-sm font-semibold text-slate-900">{relation.from} → {relation.to}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-sky-100 px-2 py-1 font-medium text-sky-800">
                          {typeLabel(relation.type)}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-800">
                          {relation.stage}
                        </span>
                      </div>
                      {relation.type === "data_dependency" && relation.transferredData && (
                        <p className="mt-2 text-sm text-slate-700">
                          <strong>Dato transferido:</strong> {relation.transferredData}
                        </p>
                      )}
                      {relation.type === "prerequisite" && (
                        <p className="mt-2 text-sm text-slate-700">
                          <strong>Explicacion:</strong> {relation.rationale}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-slate-600">
                        <strong>Condicion:</strong> {relation.condition}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section>
                <button
                  type="button"
                  onClick={() => focusDirection("incoming")}
                  aria-pressed={relationFocus === "incoming"}
                  className={`rounded-md px-2 py-1 text-left text-sm font-semibold uppercase tracking-[0.08em] transition ${
                    relationFocus === "incoming"
                      ? "bg-orange-100 text-orange-900"
                      : "text-slate-600 hover:bg-orange-50 hover:text-orange-900"
                  }`}
                >
                  Relaciones entrantes
                </button>
                <div className="mt-2 space-y-2">
                  {incoming.length === 0 && (
                    <p className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600">
                      Sin relaciones entrantes verificadas en la matriz principal.
                    </p>
                  )}
                  {incoming.map((relation) => (
                    <article key={`${relation.from}-${relation.to}`} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-sm font-semibold text-slate-900">{relation.from} → {relation.to}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-sky-100 px-2 py-1 font-medium text-sky-800">
                          {typeLabel(relation.type)}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-800">
                          {relation.stage}
                        </span>
                      </div>
                      {relation.type === "data_dependency" && relation.transferredData && (
                        <p className="mt-2 text-sm text-slate-700">
                          <strong>Dato transferido:</strong> {relation.transferredData}
                        </p>
                      )}
                      {relation.type === "prerequisite" && (
                        <p className="mt-2 text-sm text-slate-700">
                          <strong>Explicacion:</strong> {relation.rationale}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-slate-600">
                        <strong>Condicion:</strong> {relation.condition}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        </section>
      )}

      {viewMode === "map" && (
        <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <h2 className="text-xl font-semibold text-[#0d2b45]">Mapa de relaciones</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">
                  <span className="h-[2px] w-6 bg-amber-700" aria-hidden /> Prerequisito
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-sky-800">
                  <span
                    className="h-[2px] w-6 bg-sky-700"
                    style={{ backgroundImage: "repeating-linear-gradient(to right, #0369a1 0, #0369a1 6px, transparent 6px, transparent 10px)" }}
                    aria-hidden
                  />
                  Dependencia de datos
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800">
                  <span className="h-[2px] w-6 bg-emerald-600" aria-hidden /> Saliente
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-orange-800">
                  <span className="h-[2px] w-6 bg-orange-600" aria-hidden /> Entrante
                </span>
              </div>
            </div>

            <p className="mt-3 px-1 text-sm text-slate-600">
              Selecciona una prueba y luego elige relaciones salientes o entrantes en el panel lateral para resaltar esa dirección.
            </p>

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="mx-auto h-[620px] min-w-[860px] w-full"
                role="img"
                aria-label="Grafo de relaciones verificadas entre pruebas"
              >
                <defs>
                  <marker id="arrow-prerequisite" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#b45309" />
                  </marker>
                  <marker id="arrow-data" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#0369a1" />
                  </marker>
                  <marker id="arrow-outgoing" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#16a34a" />
                  </marker>
                  <marker id="arrow-incoming" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ea580c" />
                  </marker>
                </defs>

                {verifiedRelations.map((relation) => {
                  const source = nodeByCode.get(relation.from);
                  const target = nodeByCode.get(relation.to);

                  if (!source || !target) {
                    return null;
                  }

                  const relationKey = `${relation.from}-${relation.to}`;
                  const isFocused = focusedRelationKeys.has(relationKey);
                  if (!isFocused) {
                    return null;
                  }
                  const directionColor = isFocused
                    ? relationFocus === "outgoing"
                      ? "#16a34a"
                      : "#ea580c"
                    : relationColor(relation.type);
                  const markerEnd = isFocused
                    ? relationFocus === "outgoing"
                      ? "url(#arrow-outgoing)"
                      : "url(#arrow-incoming)"
                    : relation.type === "prerequisite"
                      ? "url(#arrow-prerequisite)"
                      : "url(#arrow-data)";

                  const dx = target.x - source.x;
                  const dy = target.y - source.y;
                  const distance = Math.hypot(dx, dy) || 1;
                  const ux = dx / distance;
                  const uy = dy / distance;
                  const sourceRadius = selectedProcedure.code === relation.from ? 37 : 31;
                  const targetRadius = selectedProcedure.code === relation.to ? 37 : 31;

                  // Draw edges from node border to node border so arrowheads are never hidden by circles.
                  const x1 = source.x + ux * (sourceRadius + 2);
                  const y1 = source.y + uy * (sourceRadius + 2);
                  const x2 = target.x - ux * (targetRadius + 4);
                  const y2 = target.y - uy * (targetRadius + 4);

                  return (
                    <line
                      key={relationKey}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={directionColor}
                      strokeWidth={isFocused ? 3.6 : 2.3}
                      strokeDasharray={relation.type === "data_dependency" ? "7 6" : undefined}
                      markerEnd={markerEnd}
                      strokeLinecap="round"
                      opacity={0.94}
                    />
                  );
                })}

                {nodes.map((node) => {
                  const isSelected = node.code === selectedProcedure.code;
                  const isOutgoingTarget = relationFocus === "outgoing" && outgoingCodes.has(node.code);
                  const isIncomingSource = relationFocus === "incoming" && incomingCodes.has(node.code);
                  const isBidirectional = isOutgoingTarget && isIncomingSource;
                  const isRelated = isSelected || isOutgoingTarget || isIncomingSource;
                  const isInactive = relationFocus !== "none" && !isRelated;
                  const nodeFill = isSelected
                    ? "#dbeafe"
                    : isBidirectional
                      ? "#f3e8ff"
                      : isOutgoingTarget
                        ? "#dcfce7"
                        : isIncomingSource
                          ? "#ffedd5"
                          : isInactive
                            ? "#f8fafc"
                            : "#ffffff";
                  const nodeStroke = isSelected
                    ? "#0284c7"
                    : isBidirectional
                      ? "#9333ea"
                      : isOutgoingTarget
                        ? "#16a34a"
                        : isIncomingSource
                          ? "#ea580c"
                          : isInactive
                            ? "#cbd5e1"
                            : studyStatusColor(node.studyStatus);
                  const nodeRadius = isSelected ? 37 : isInactive ? 19 : 31;
                  const labelSize = isInactive ? 8.5 : 12;
                  const labelColor = isInactive ? "#94a3b8" : "#0f172a";
                  return (
                    <g
                      key={node.code}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => selectProcedure(node.code)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        r={nodeRadius}
                        fill={nodeFill}
                        stroke={nodeStroke}
                        strokeWidth={isSelected ? 3 : isInactive ? 1.5 : 2}
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={labelSize}
                        fontWeight="700"
                        fill={labelColor}
                      >
                        {node.code}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur xl:sticky xl:top-6 xl:h-fit">
            <h3 className="text-lg font-semibold text-[#0d2b45]">Prueba seleccionada</h3>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">{selectedProcedure.code}</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{selectedProcedure.name}</p>
              <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${studyStatusClassName(selectedProcedure.studyStatus)}`}>
                {studyStatusLabel(selectedProcedure.studyStatus)}
              </span>
              {selectedProcedure.category && (
                <p className="mt-1 text-sm text-slate-600">{selectedProcedure.category}</p>
              )}
            </div>

            <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
              {selectedNarrative}
            </p>

            {selectedSpecialConditions.length > 0 && (
              <section className="mt-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">Condiciones especiales</h4>
                <div className="mt-2 space-y-2">
                  {selectedSpecialConditions.map((specialCondition, index) => (
                    <article
                      key={`${selectedProcedure.code}-map-special-${index}`}
                      className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-3"
                    >
                      <p className="text-sm text-slate-800">{specialCondition.summary}</p>
                      <p className="mt-2 text-sm font-medium text-amber-900">
                        Esta condición orienta el estudio del procedimiento; no define por sí sola una secuencia operativa obligatoria.
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">Conexiones visibles</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => focusDirection("outgoing")}
                  aria-pressed={relationFocus === "outgoing"}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    relationFocus === "outgoing"
                      ? "bg-emerald-600 text-white"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  Relaciones salientes
                </button>
                <button
                  type="button"
                  onClick={() => focusDirection("incoming")}
                  aria-pressed={relationFocus === "incoming"}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    relationFocus === "incoming"
                      ? "bg-orange-600 text-white"
                      : "border border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100"
                  }`}
                >
                  Relaciones entrantes
                </button>
              </div>
              {selectedRelationKeys.size === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600">
                  Esta prueba no tiene enlaces entrantes o salientes verificados en el conjunto actual.
                </p>
              )}
              {verifiedRelations
                .filter((relation) => selectedRelationKeys.has(`${relation.from}-${relation.to}`))
                .map((relation) => (
                  <article key={`${relation.from}-${relation.to}`} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-900">{relation.from} → {relation.to}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      <span
                        className={`rounded-full px-2 py-1 font-medium ${
                          relation.type === "prerequisite"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-sky-100 text-sky-900"
                        }`}
                      >
                        {typeLabel(relation.type)}
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{relation.rationale}</p>
                  </article>
                ))}
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}
