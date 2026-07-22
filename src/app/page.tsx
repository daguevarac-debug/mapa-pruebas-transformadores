"use client";

import { useMemo, useState } from "react";
import { procedures, verifiedRelations } from "@/data/pruebas";

function typeLabel(type: "prerequisite" | "data_dependency") {
  return type;
}

export default function HomePage() {
  const [selectedCode, setSelectedCode] = useState<string>(procedures[0]?.code ?? "");

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
    </main>
  );
}
