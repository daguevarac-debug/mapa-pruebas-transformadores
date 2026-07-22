"use client";

import { useMemo, useState } from "react";
import { documentedSpecialConditions, procedures, verifiedRelations } from "@/data/pruebas";

type ViewMode = "explore" | "map";

function typeLabel(type: "prerequisite" | "data_dependency") {
  if (type === "prerequisite") return "Prerequisito";
  return "Dependencia de datos";
}

function relationColor(type: "prerequisite" | "data_dependency") {
  if (type === "prerequisite") return "#b45309";
  return "#0369a1";
}

export default function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("explore");
  const [selectedCode, setSelectedCode] = useState<string>(procedures[0]?.code ?? "");

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
            <h2 className="px-2 text-xl font-semibold text-[#0d2b45]">Pruebas documentadas</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {procedures.map((procedure, index) => {
                const isActive = selectedProcedure.code === procedure.code;
                return (
                  <button
                    key={procedure.code}
                    type="button"
                    onClick={() => setSelectedCode(procedure.code)}
                    className={`rounded-xl border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-sky-300 bg-sky-50 shadow"
                        : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">{procedure.code}</p>
                    <h3 className="mt-1 text-base font-semibold leading-tight text-slate-900">{procedure.name}</h3>
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
              {selectedProcedure.category && (
                <p className="mt-1 text-sm text-slate-600">{selectedProcedure.category}</p>
              )}
            </div>

            <div className="mt-5 space-y-5">
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
                <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">Relaciones salientes</h4>
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
                <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">Relaciones entrantes</h4>
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
              </div>
            </div>

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
                </defs>

                {verifiedRelations.map((relation) => {
                  const source = nodeByCode.get(relation.from);
                  const target = nodeByCode.get(relation.to);

                  if (!source || !target) {
                    return null;
                  }

                  const relationKey = `${relation.from}-${relation.to}`;
                  const connected = selectedRelationKeys.has(relationKey);
                  const faded = selectedRelationKeys.size > 0 && !connected;

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
                      stroke={relationColor(relation.type)}
                      strokeWidth={connected ? 3.2 : 2.3}
                      strokeDasharray={relation.type === "data_dependency" ? "7 6" : undefined}
                      markerEnd={relation.type === "prerequisite" ? "url(#arrow-prerequisite)" : "url(#arrow-data)"}
                      strokeLinecap="round"
                      opacity={faded ? 0.28 : 0.92}
                    />
                  );
                })}

                {nodes.map((node) => {
                  const isSelected = node.code === selectedProcedure.code;
                  return (
                    <g
                      key={node.code}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => setSelectedCode(node.code)}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        r={isSelected ? 37 : 31}
                        fill={isSelected ? "#dbeafe" : "#ffffff"}
                        stroke={isSelected ? "#0284c7" : "#94a3b8"}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="12"
                        fontWeight="700"
                        fill="#0f172a"
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
