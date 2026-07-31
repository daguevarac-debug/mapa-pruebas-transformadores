"use client";

import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
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
type MapFrameMode = "filtered" | "selection" | "full";

const NODE_WIDTH = 108;
const NODE_HEIGHT = 54;

const layout: Record<string, { x: number; y: number }> = {
  "T50-02417": { x: 150, y: 150 },
  "T50-02338": { x: 340, y: 150 },
  "T50-02407": { x: 530, y: 150 },
  "T50-04588": { x: 720, y: 150 },
  "T50-02386": { x: 160, y: 340 },
  "T50-02413": { x: 380, y: 340 },
  "T50-02692": { x: 600, y: 340 },
  "T50-02404": { x: 850, y: 340 },
  "T50-02367": { x: 1030, y: 340 },
  "T50-02416": { x: 120, y: 540 },
  "T50-02398": { x: 300, y: 540 },
  "T50-02393": { x: 480, y: 540 },
  "T50-02376": { x: 660, y: 540 },
  "T50-02408": { x: 840, y: 540 },
  "T50-04598": { x: 1020, y: 540 },
  "T50-02869": { x: 390, y: 730 },
  "T50-04590": { x: 770, y: 730 }
};

const familyAreas = [
  {
    family: "Excitación, núcleo y ruido",
    label: "Excitación, núcleo y ruido",
    x: 30,
    y: 74,
    width: 810,
    height: 124,
    fill: "#ecfeff",
    stroke: "#a5f3fc"
  },
  {
    family: "Devanados, relación y respuesta mecánica",
    label: "Devanados, relación y respuesta mecánica",
    x: 50,
    y: 256,
    width: 660,
    height: 136,
    fill: "#f0fdf4",
    stroke: "#bbf7d0"
  },
  {
    family: "Pérdidas y calentamiento",
    label: "Pérdidas y calentamiento",
    x: 755,
    y: 256,
    width: 370,
    height: 150,
    fill: "#fff7ed",
    stroke: "#fed7aa"
  },
  {
    family: "Aislamiento dieléctrico",
    label: "Aislamiento dieléctrico",
    x: 48,
    y: 452,
    width: 1044,
    height: 142,
    fill: "#faf5ff",
    stroke: "#e9d5ff"
  },
  {
    family: "Impedancia de secuencia cero",
    label: "Impedancia de secuencia cero",
    x: 245,
    y: 650,
    width: 290,
    height: 122,
    fill: "#f8fafc",
    stroke: "#cbd5e1"
  },
  {
    family: "Transformadores de corriente",
    label: "Transformadores de corriente",
    x: 620,
    y: 650,
    width: 300,
    height: 122,
    fill: "#f0fdfa",
    stroke: "#99f6e4"
  }
] as const;

const fullMapBounds = { x: 0, y: 0, width: 1180, height: 810 };

function statusLabel(status: StudyStatus) {
  return status === "studied" ? "Estudiada" : status === "in_progress" ? "En curso" : "Pendiente";
}

function statusClass(status: StudyStatus) {
  return status === "studied"
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : status === "in_progress"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-slate-200 bg-slate-50 text-slate-600";
}

function typeLabel(type: ProcedureRelation["type"]) {
  return type === "prerequisite"
    ? "Prerequisito"
    : type === "data_dependency"
      ? "Dependencia de datos"
      : "Se realiza durante / comparte montaje";
}

function relationKey(relation: ProcedureRelation) {
  return `${relation.from}-${relation.to}`;
}

function procedureName(code: string) {
  const procedure = procedures.find((item) => item.code === code);
  return procedure ? `${procedure.code} · ${procedure.name}` : code;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compactNodeName(name: string) {
  return name.length > 24 ? `${name.slice(0, 22)}…` : name;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const glossaryMatches = glossaryTerms
  .flatMap((term) => term.aliases.map((alias) => ({ term, alias })))
  .sort((a, b) => b.alias.length - a.alias.length);

// Los límites evitan coincidencias parciales: por ejemplo, BIL no debe activarse dentro de "estabilizar".
const glossaryPattern = new RegExp(
  `((?<![\\p{L}\\p{N}])(?:${glossaryMatches.map(({ alias }) => escapeRegExp(alias)).join("|")})(?![\\p{L}\\p{N}]))`,
  "giu"
);

// ── React Flow custom node types ────────────────────────────────────────────

type ProcedureNodeData = {
  code: string;
  name: string;
  isSelected: boolean;
  isOutgoing: boolean;
  isIncoming: boolean;
  isShared: boolean;
};

type FamilyAreaNodeData = {
  label: string;
  fill: string;
  stroke: string;
  areaWidth: number;
  areaHeight: number;
};

const ProcedureNode = memo(function ProcedureNode({ data }: NodeProps) {
  const d = data as unknown as ProcedureNodeData;
  const borderColor = d.isSelected
    ? "#0284c7"
    : d.isOutgoing
      ? "#16a34a"
      : d.isIncoming
        ? "#ea580c"
        : d.isShared
          ? "#7e22ce"
          : "#94a3b8";
  const bg = d.isSelected ? "#eff6ff" : "#ffffff";
  const bw = d.isSelected ? 3 : 2;
  return (
    <div
      title={`${d.code} · ${d.name}`}
      style={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        border: `${bw}px solid ${borderColor}`,
        borderRadius: 12,
        background: bg,
        boxShadow: d.isSelected ? "0 0 0 4px #bae6fd" : undefined,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
        padding: "4px 6px",
        boxSizing: "border-box",
      }}
    >
      <p style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.2, textAlign: "center" }}>
        {d.code}
      </p>
      <p style={{ fontSize: 8, color: "#334155", margin: 0, textAlign: "center", lineHeight: 1.2 }}>
        {compactNodeName(d.name)}
      </p>
    </div>
  );
});

const FamilyAreaNode = memo(function FamilyAreaNode({ data }: NodeProps) {
  const d = data as unknown as FamilyAreaNodeData;
  return (
    <div
      style={{
        width: d.areaWidth,
        height: d.areaHeight,
        background: d.fill,
        border: `2px solid ${d.stroke}`,
        borderRadius: 18,
        pointerEvents: "none",
        padding: "8px 20px",
        boxSizing: "border-box",
      }}
    >
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#475569", lineHeight: 1.2 }}>
        {d.label}
      </p>
    </div>
  );
});

const nodeTypes = { procedure: ProcedureNode, familyArea: FamilyAreaNode };

// ── MapController: triggers fitView inside the ReactFlow context ─────────────

function MapController({
  frameMode,
  selectedClusterCodes,
  filteredCodes,
}: {
  frameMode: MapFrameMode;
  selectedClusterCodes: string[];
  filteredCodes: string[];
}) {
  const { fitView } = useReactFlow();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (frameMode === "full") {
        fitView({ duration: 500, padding: 0.08 });
      } else if (frameMode === "filtered") {
        const nodes = filteredCodes.map((id) => ({ id }));
        if (nodes.length > 0) fitView({ nodes, duration: 500, padding: 0.08 });
        else fitView({ duration: 500, padding: 0.08 });
      } else if (frameMode === "selection" && selectedClusterCodes.length > 0) {
        fitView({ nodes: selectedClusterCodes.map((id) => ({ id })), duration: 500, padding: 0.2 });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [frameMode, filteredCodes, selectedClusterCodes, fitView]);

  return null;
}

// ── HomePage ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("explore");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [families, setFamilies] = useState<string[]>([]);
  const [contexts, setContexts] = useState<string[]>([]);
  const [showFamilyFilters, setShowFamilyFilters] = useState(false);
  const [showContextFilters, setShowContextFilters] = useState(false);
  const [showDirectional, setShowDirectional] = useState(true);
  const [showComplementary, setShowComplementary] = useState(true);
  const [mapFrameMode, setMapFrameMode] = useState<MapFrameMode>("filtered");
  const [inspectedRelationKey, setInspectedRelationKey] = useState<string | null>(null);
  const [comparisonCodes, setComparisonCodes] = useState<[string, string]>(["", ""]);
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<GlossaryTerm | null>(null);
  const [announcement, setAnnouncement] = useState("Mapa listo para explorar.");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("prueba");
    if (code && procedures.some((procedure) => procedure.code === code)) {
      setSelectedCode(code);
      setViewMode("map");
      setMapFrameMode("selection");
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedCode) {
      url.searchParams.set("prueba", selectedCode);
    } else {
      url.searchParams.delete("prueba");
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [selectedCode]);

  const filteredProcedures = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return procedures.filter((procedure) => {
      const searchable = [
        procedure.code,
        procedure.name,
        procedure.category,
        procedure.didacticSummary?.apply,
        procedure.didacticSummary?.measure,
        procedure.didacticSummary?.obtain
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es");

      return (
        (!normalized || searchable.includes(normalized)) &&
        (families.length === 0 || families.includes(procedureFamilies[procedure.code])) &&
        (contexts.length === 0 ||
          contexts.every((contextId) =>
            documentedContexts.find((context) => context.id === contextId)?.codes.includes(procedure.code)
          ))
      );
    });
  }, [contexts, families, query]);

  const visibleCodes = useMemo(
    () => new Set(filteredProcedures.map((procedure) => procedure.code)),
    [filteredProcedures]
  );

  const activeFilterCount = families.length + contexts.length + (query.trim() ? 1 : 0);

  const visibleFamilyAreas = useMemo(
    () =>
      familyAreas.filter((area) =>
        filteredProcedures.some((procedure) => procedureFamilies[procedure.code] === area.family)
      ),
    [filteredProcedures]
  );

  const selectedProcedure = selectedCode
    ? procedures.find((procedure) => procedure.code === selectedCode) ?? null
    : null;

  const selectedRelations = useMemo(
    () =>
      selectedCode
        ? verifiedRelations.filter((relation) => relation.from === selectedCode || relation.to === selectedCode)
        : [],
    [selectedCode]
  );

  const visibleRelations = useMemo(
    () =>
      selectedRelations.filter(
        (relation) =>
          (relation.type === "shared_setup" ? showComplementary : showDirectional) &&
          visibleCodes.has(relation.from) &&
          visibleCodes.has(relation.to)
      ),
    [selectedRelations, showComplementary, showDirectional, visibleCodes]
  );

  const inspectedRelation = useMemo(
    () => verifiedRelations.find((relation) => relationKey(relation) === inspectedRelationKey) ?? null,
    [inspectedRelationKey]
  );

  const outgoingCodes = useMemo(
    () =>
      new Set(
        selectedRelations
          .filter((relation) => relation.type !== "shared_setup" && relation.from === selectedCode)
          .map((relation) => relation.to)
      ),
    [selectedCode, selectedRelations]
  );

  const incomingCodes = useMemo(
    () =>
      new Set(
        selectedRelations
          .filter((relation) => relation.type !== "shared_setup" && relation.to === selectedCode)
          .map((relation) => relation.from)
      ),
    [selectedCode, selectedRelations]
  );

  const sharedCodes = useMemo(
    () =>
      new Set(
        selectedRelations
          .filter((relation) => relation.type === "shared_setup")
          .map((relation) => (relation.from === selectedCode ? relation.to : relation.from))
      ),
    [selectedCode, selectedRelations]
  );

  const selectedClusterCodes = useMemo(() => {
    if (!selectedCode) return [];
    const cluster = new Set<string>([selectedCode]);
    outgoingCodes.forEach((code) => cluster.add(code));
    incomingCodes.forEach((code) => cluster.add(code));
    sharedCodes.forEach((code) => cluster.add(code));
    return [...cluster];
  }, [incomingCodes, outgoingCodes, selectedCode, sharedCodes]);

  const activeMapLabel =
    families.length === 1
      ? families[0]
      : activeFilterCount > 0
        ? `${filteredProcedures.length} pruebas filtradas`
        : "Vista completa";

  const filteredCodes = useMemo(
    () => filteredProcedures.map((p) => p.code),
    [filteredProcedures]
  );

  // React Flow nodes
  const rfNodes: Node[] = useMemo(() => {
    const familyAreaNodes: Node[] = visibleFamilyAreas.map((area) => ({
      id: `family-${area.family}`,
      type: "familyArea",
      position: { x: area.x, y: area.y },
      data: {
        label: area.label,
        fill: area.fill,
        stroke: area.stroke,
        areaWidth: area.width,
        areaHeight: area.height,
      } as unknown as Record<string, unknown>,
      width: area.width,
      height: area.height,
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: -1,
    }));

    const procedureNodes: Node[] = filteredProcedures.map((procedure) => {
      const pos = layout[procedure.code];
      return {
        id: procedure.code,
        type: "procedure",
        position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
        data: {
          code: procedure.code,
          name: procedure.name,
          isSelected: selectedCode === procedure.code,
          isOutgoing: outgoingCodes.has(procedure.code),
          isIncoming: incomingCodes.has(procedure.code),
          isShared: sharedCodes.has(procedure.code),
        } as unknown as Record<string, unknown>,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        draggable: false,
        selectable: false,
      };
    });

    return [...familyAreaNodes, ...procedureNodes];
  }, [filteredProcedures, visibleFamilyAreas, selectedCode, outgoingCodes, incomingCodes, sharedCodes]);

  // React Flow edges (only for selected procedure's relations)
  const rfEdges: Edge[] = useMemo(() => {
    return visibleRelations.map((relation) => {
      const isShared = relation.type === "shared_setup";
      const isOutgoing = relation.from === selectedCode;
      const color = isShared ? "#7e22ce" : isOutgoing ? "#16a34a" : "#ea580c";
      const isInspected = relationKey(relation) === inspectedRelationKey;
      return {
        id: relationKey(relation),
        source: relation.from,
        target: relation.to,
        type: "smoothstep",
        style: {
          stroke: color,
          strokeWidth: isInspected ? 6 : 2.5,
          strokeDasharray: isShared ? "6 4" : undefined,
        },
        markerEnd: isShared
          ? undefined
          : { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
        focusable: true,
        data: { relation } as unknown as Record<string, unknown>,
      };
    });
  }, [visibleRelations, selectedCode, inspectedRelationKey]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];

    if (query.trim()) {
      chips.push({
        key: "query",
        label: `Búsqueda: "${query.trim()}"`,
        clear: () => setQuery("")
      });
    }

    families.forEach((family) => {
      chips.push({
        key: `family-${family}`,
        label: family,
        clear: () => setFamilies((current) => current.filter((item) => item !== family))
      });
    });

    contexts.forEach((contextId) => {
      const context = documentedContexts.find((item) => item.id === contextId);
      if (!context) return;
      chips.push({
        key: `context-${context.id}`,
        label: context.label,
        clear: () => setContexts((current) => current.filter((item) => item !== context.id))
      });
    });

    return chips;
  }, [contexts, families, query]);

  const applyMapFrame = (mode: MapFrameMode) => {
    setMapFrameMode(mode);
  };

  const selectProcedure = (code: string | null) => {
    setSelectedCode(code);
    setInspectedRelationKey(null);
    setActiveGlossaryTerm(null);
    if (code) setMapFrameMode("selection");
    setAnnouncement(
      code
        ? `Prueba seleccionada: ${procedureName(code)}.`
        : "Selección de prueba borrada."
    );
  };

  const toggleFamily = (family: string) => {
    setFamilies((current) =>
      current.includes(family) ? current.filter((item) => item !== family) : [...current, family]
    );
    setViewMode("map");
    setMapFrameMode("filtered");
  };

  const toggleContext = (contextId: string) => {
    setContexts((current) =>
      current.includes(contextId)
        ? current.filter((item) => item !== contextId)
        : [...current, contextId]
    );
    setViewMode("map");
    setMapFrameMode("filtered");
  };

  const clearFilters = () => {
    setQuery("");
    setFamilies([]);
    setContexts([]);
    setMapFrameMode("full");
  };

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === "familyArea") return;
      selectProcedure(node.id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCode]
  );

  const handlePaneClick = useCallback(() => {
    selectProcedure(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setInspectedRelationKey(edge.id);
  }, []);

  return (
    <main className="study-shell mx-auto flex min-h-[100dvh] w-full max-w-[1320px] flex-col px-4 py-6 md:px-8 md:py-8">
      <a className="skip-link" href="#contenido-principal">
        Saltar al contenido principal
      </a>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <header className="rounded-3xl border border-slate-200/95 bg-white/92 p-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.4)] backdrop-blur md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.17em] text-teal-700 md:text-sm">
          Mapa de estudio
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold leading-tight text-[#0d2b45] md:text-5xl">
          Mapa de pruebas de transformadores
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
          Herramienta personal y educativa para comprender relaciones entre pruebas.
        </p>
        <p className="mt-5 max-w-3xl rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-slate-700">
          Este mapa resume relaciones documentadas; para ampliar información, consulta el
          procedimiento original autorizado.
        </p>
      </header>

      <section
        id="contenido-principal"
        className="mt-4 rounded-3xl border border-slate-200 bg-white/88 p-4 shadow-[0_14px_38px_-30px_rgba(15,23,42,0.45)] backdrop-blur md:p-5"
        aria-label="Búsqueda y filtros"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="procedure-search" className="text-sm font-semibold text-slate-800">
              Buscar una prueba
            </label>
            <input
              id="procedure-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setMapFrameMode("filtered");
              }}
              placeholder="Nombre, T50 o palabra de la ficha"
              aria-describedby="procedure-search-help"
              className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none ring-sky-300 transition-colors duration-150 focus:border-sky-300 focus:ring-2"
            />
            <span id="procedure-search-help" className="sr-only">
              Busca por código, nombre, familia o contenido didáctico.
            </span>
          </div>
          <div className="text-sm text-slate-700" aria-live="polite">
            <strong>{filteredProcedures.length}</strong> de {procedures.length} pruebas coinciden
            {activeFilterCount
              ? ` con ${activeFilterCount} filtro${activeFilterCount === 1 ? "" : "s"} activo${activeFilterCount === 1 ? "" : "s"}`
              : ""}
            .
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-[background-color,transform] duration-200 ease-out hover:bg-slate-50 active:scale-[0.98]"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {activeFilterChips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.clear}
                className="inline-flex min-h-9 items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 text-xs font-medium text-sky-900 transition-[background-color,transform] duration-150 hover:bg-sky-100 active:scale-[0.98]"
                aria-label={`Quitar filtro ${chip.label}`}
              >
                <span>{chip.label}</span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={() => setShowFamilyFilters((value) => !value)}
            className="flex min-h-11 w-full items-center justify-between rounded-xl px-2 text-left text-sm font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 md:hidden"
            aria-expanded={showFamilyFilters}
            aria-controls="family-filter-options"
          >
            Familia técnica
            <span aria-hidden="true">{showFamilyFilters ? "−" : "+"}</span>
          </button>
          <p className="hidden text-sm font-semibold text-slate-800 md:block">Familia técnica</p>
          <div id="family-filter-options" className={`${showFamilyFilters ? "mt-2" : "hidden"} md:mt-2 md:block`}>
            <div className="flex flex-wrap gap-2">
              {technicalFamilies.map((family) => (
                <button
                  key={family}
                  type="button"
                  onClick={() => toggleFamily(family)}
                  aria-pressed={families.includes(family)}
                  className={`min-h-10 rounded-full border px-3 py-1.5 text-xs font-medium transition-[border-color,background-color,color,transform] duration-200 ease-out active:scale-[0.98] md:min-h-9 ${
                    families.includes(family)
                      ? "border-teal-600 bg-teal-700 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {family}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={() => setShowContextFilters((value) => !value)}
            className="flex min-h-11 w-full items-center justify-between rounded-xl px-2 text-left text-sm font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 md:hidden"
            aria-expanded={showContextFilters}
            aria-controls="context-filter-options"
          >
            Contexto de ejecución documentado
            <span aria-hidden="true">{showContextFilters ? "−" : "+"}</span>
          </button>
          <p className="hidden text-sm font-semibold text-slate-800 md:block">
            Contexto de ejecución documentado
          </p>
          <div id="context-filter-options" className={`${showContextFilters ? "mt-2" : "hidden"} md:mt-2 md:block`}>
            <div className="flex flex-wrap gap-2">
              {documentedContexts.map((context) => (
                <button
                  key={context.id}
                  type="button"
                  onClick={() => toggleContext(context.id)}
                  aria-pressed={contexts.includes(context.id)}
                  className={`min-h-10 rounded-full border px-3 py-1.5 text-xs font-medium transition-[border-color,background-color,color,transform] duration-200 ease-out active:scale-[0.98] md:min-h-9 ${
                    contexts.includes(context.id)
                      ? "border-violet-600 bg-violet-700 text-white"
                      : "border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100"
                  }`}
                >
                  {context.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setViewMode("explore")}
            aria-pressed={viewMode === "explore"}
            className={`min-h-11 rounded-xl px-4 py-3 text-sm font-semibold transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.98] ${
              viewMode === "explore"
                ? "bg-sky-100 text-sky-900 shadow-inner"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Explorar pruebas
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            aria-pressed={viewMode === "map"}
            className={`min-h-11 rounded-xl px-4 py-3 text-sm font-semibold transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.98] ${
              viewMode === "map"
                ? "bg-sky-100 text-sky-900 shadow-inner"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Mapa de relaciones
          </button>
        </div>
      </section>

      {viewMode === "explore" && (
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-[0_14px_38px_-30px_rgba(15,23,42,0.45)] md:p-5">
            <h2 className="px-2 text-2xl font-semibold text-[#0d2b45]">Catálogo de procedimientos</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProcedures.map((procedure) => {
                const selected = selectedCode === procedure.code;
                return (
                  <button
                    key={procedure.code}
                    type="button"
                    onClick={() => selectProcedure(procedure.code)}
                    className={`rounded-2xl border px-4 py-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] ${
                      selected
                        ? "border-sky-300 bg-sky-50 shadow-[0_0_0_3px_rgba(56,189,248,0.2),0_10px_28px_-18px_rgba(14,116,144,0.6)]"
                        : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-teal-700">
                      {procedure.code}
                    </p>
                    <h3 className="mt-1 text-base font-semibold leading-tight text-slate-900">
                      {procedure.name}
                    </h3>
                    <span
                      className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClass(procedure.studyStatus)}`}
                    >
                      {statusLabel(procedure.studyStatus)}
                    </span>
                    <p className="mt-2 text-sm text-slate-600">{procedureFamilies[procedure.code]}</p>
                  </button>
                );
              })}
            </div>

            {filteredProcedures.length === 0 && (
              <p className="m-2 rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-600">
                No hay pruebas que coincidan con los filtros actuales.
              </p>
            )}
          </div>

          <ProcedurePanel
            key={selectedCode ?? "empty"}
            procedure={selectedProcedure}
            relations={selectedRelations}
            inspectedRelationKey={inspectedRelationKey}
            onInspectRelation={setInspectedRelationKey}
            activeGlossaryTerm={activeGlossaryTerm}
            onSelectGlossaryTerm={setActiveGlossaryTerm}
          />
        </section>
      )}

      {viewMode === "map" && (
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
          <div className="rounded-3xl border border-slate-200 bg-white/92 p-4 shadow-[0_14px_38px_-30px_rgba(15,23,42,0.45)] md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-[#0d2b45]">Mapa de relaciones</h2>
                {activeFilterCount > 0 && (
                  <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                    Encuadre filtrado: {activeMapLabel}
                  </p>
                )}
              </div>

              <div className="w-full space-y-2 sm:w-auto">
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDirectional((value) => !value)}
                    aria-pressed={showDirectional}
                    className={`min-h-11 rounded-full border px-3 text-xs font-semibold transition-[border-color,background-color,color,transform] duration-200 ease-out active:scale-[0.98] ${
                      showDirectional
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-300 bg-white text-slate-500"
                    }`}
                  >
                    Rel. direccionales {showDirectional ? "visibles" : "ocultas"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowComplementary((value) => !value)}
                    aria-pressed={showComplementary}
                    className={`min-h-11 rounded-full border px-3 text-xs font-semibold transition-[border-color,background-color,color,transform] duration-200 ease-out active:scale-[0.98] ${
                      showComplementary
                        ? "border-violet-300 bg-violet-50 text-violet-800"
                        : "border-slate-300 bg-white text-slate-500"
                    }`}
                  >
                    Montaje {showComplementary ? "visible" : "oculto"}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyMapFrame("full")}
                    aria-pressed={mapFrameMode === "full"}
                    className={`min-h-10 rounded-lg border px-2 text-xs font-semibold transition-[background-color,color,border-color] duration-200 ${
                      mapFrameMode === "full"
                        ? "border-slate-400 bg-slate-100 text-slate-900"
                        : "border-slate-300 bg-white text-slate-600"
                    }`}
                  >
                    Vista global
                  </button>
                  <button
                    type="button"
                    onClick={() => applyMapFrame("filtered")}
                    aria-pressed={mapFrameMode === "filtered"}
                    className={`min-h-10 rounded-lg border px-2 text-xs font-semibold transition-[background-color,color,border-color] duration-200 ${
                      mapFrameMode === "filtered"
                        ? "border-teal-300 bg-teal-50 text-teal-900"
                        : "border-slate-300 bg-white text-slate-600"
                    }`}
                  >
                    Resultado actual
                  </button>
                  <button
                    type="button"
                    onClick={() => applyMapFrame("selection")}
                    disabled={!selectedCode}
                    aria-pressed={mapFrameMode === "selection"}
                    className={`min-h-10 rounded-lg border px-2 text-xs font-semibold transition-[background-color,color,border-color] duration-200 disabled:cursor-not-allowed disabled:text-slate-300 ${
                      mapFrameMode === "selection"
                        ? "border-sky-300 bg-sky-50 text-sky-900"
                        : "border-slate-300 bg-white text-slate-600"
                    }`}
                  >
                    Prueba activa
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200/90 bg-white/80 p-3 text-sm text-slate-700">
              <p id="map-instructions" className="leading-6">
                Rueda del ratón o botones +/− para zoom; clic sostenido para arrastrar; clic en nodo para ver ficha.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-800">
                  <i className="h-0.5 w-6 bg-emerald-600" /> Saliente
                </span>
                <span className="inline-flex items-center gap-1 text-orange-800">
                  <i className="h-0.5 w-6 bg-orange-600" /> Entrante
                </span>
                <span className="inline-flex items-center gap-1 text-violet-800">
                  <i className="h-0 w-6 border-t-2 border-dashed border-violet-700" /> Complementaria
                </span>
                <span className="text-slate-500">Pulsa una línea para ver su trazabilidad.</span>
              </div>
            </div>

            {inspectedRelation && (
              <RelationTrace relation={inspectedRelation} onClose={() => setInspectedRelationKey(null)} />
            )}

            {/* React Flow map canvas — fixed height so the page never grows with zoom */}
            <div
              role="region"
              aria-label="Lienzo del mapa de relaciones"
              className="map-viewport mt-4 h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70"
            >
              {filteredProcedures.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-4 text-center text-sm text-slate-600">
                    No hay pruebas para encuadrar con los filtros actuales.
                  </p>
                </div>
              ) : (
                <ReactFlow
                  nodes={rfNodes}
                  edges={rfEdges}
                  nodeTypes={nodeTypes}
                  onNodeClick={handleNodeClick}
                  onPaneClick={handlePaneClick}
                  onEdgeClick={handleEdgeClick}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  fitView
                  fitViewOptions={{ padding: 0.08, duration: 0 }}
                  minZoom={0.2}
                  maxZoom={4}
                  proOptions={{ hideAttribution: true }}
                  aria-label={`Mapa de relaciones: ${activeMapLabel}`}
                  aria-describedby="map-instructions"
                >
                  <Controls
                    aria-label="Controles de zoom del mapa"
                    showInteractive={false}
                    style={{ bottom: 8, left: 8, top: "auto" }}
                  />
                  <MiniMap
                    nodeColor={(node) => {
                      if (node.type === "familyArea") return "transparent";
                      const d = node.data as unknown as ProcedureNodeData;
                      return d.isSelected
                        ? "#0284c7"
                        : d.isOutgoing
                          ? "#16a34a"
                          : d.isIncoming
                            ? "#ea580c"
                            : d.isShared
                              ? "#7e22ce"
                              : "#94a3b8";
                    }}
                    zoomable
                    pannable
                    style={{ bottom: 8, right: 8, top: "auto" }}
                  />
                  <MapController
                    frameMode={mapFrameMode}
                    selectedClusterCodes={selectedClusterCodes}
                    filteredCodes={filteredCodes}
                  />
                </ReactFlow>
              )}
            </div>
          </div>

          <ProcedurePanel
            procedure={selectedProcedure}
            relations={selectedRelations}
            inspectedRelationKey={inspectedRelationKey}
            onInspectRelation={setInspectedRelationKey}
            activeGlossaryTerm={activeGlossaryTerm}
            onSelectGlossaryTerm={setActiveGlossaryTerm}
          />
        </section>
      )}

      <ComparisonPanel codes={comparisonCodes} onChange={setComparisonCodes} />
    </main>
  );
}

function RelationTrace({ relation, onClose }: { relation: ProcedureRelation; onClose: () => void }) {
  const shared = relation.type === "shared_setup";

  return (
    <section className="slide-in mt-4 rounded-xl border border-sky-200 bg-sky-50/80 p-4" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-sky-800">
            Trazabilidad de la relación
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">
            {shared
              ? `${procedureName(relation.from)} ↔ ${procedureName(relation.to)}`
              : `${procedureName(relation.from)} → ${procedureName(relation.to)}`}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition-[background-color,transform] duration-200 ease-out hover:bg-sky-100 active:scale-[0.95]"
          aria-label="Cerrar trazabilidad"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-slate-700">
        <p>
          <strong>Tipo:</strong> {typeLabel(relation.type)}.
        </p>
        <p>
          <strong>Qué la justifica:</strong> {relation.rationale}
        </p>
        <p>
          <strong>Condición:</strong> {relation.condition}
        </p>
        {relation.transferredData && (
          <p>
            <strong>Dato asociado:</strong> {relation.transferredData}
          </p>
        )}
      </div>
    </section>
  );
}

function GlossaryText({ children, onSelect }: { children: string; onSelect: (term: GlossaryTerm) => void }) {
  const pieces = children.split(glossaryPattern);

  return (
    <>
      {pieces.map((piece, index) => {
        const match = glossaryMatches.find(
          ({ alias }) => alias.localeCompare(piece, "es", { sensitivity: "accent" }) === 0
        );

        if (!match) return <Fragment key={`${piece}-${index}`}>{piece}</Fragment>;

        return (
          <button
            key={`${match.term.id}-${index}`}
            type="button"
            onClick={() => onSelect(match.term)}
            className="rounded border-b border-dashed border-sky-500 px-0.5 font-semibold text-sky-900 decoration-sky-500 underline-offset-2 transition-[background-color] duration-200 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
            aria-label={`Abrir glosario: ${match.term.label}`}
          >
            {piece}
          </button>
        );
      })}
    </>
  );
}

function GlossaryCard({ term, onClose }: { term: GlossaryTerm; onClose: () => void }) {
  return (
    <section className="slide-in mt-4 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 shadow-sm" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-indigo-800">
            Glosario contextual
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{term.label}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition-[background-color,transform] duration-200 ease-out hover:bg-indigo-100 active:scale-[0.95]"
          aria-label="Cerrar glosario"
        >
          ✕
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-800">{term.definition}</p>
      <p className="mt-3 rounded-lg border border-indigo-100 bg-white/80 p-3 text-sm leading-6 text-slate-700">
        <strong>Analogía:</strong> {term.analogy}
      </p>
    </section>
  );
}

function ProcedurePanel({
  procedure,
  relations,
  inspectedRelationKey,
  onInspectRelation,
  activeGlossaryTerm,
  onSelectGlossaryTerm
}: {
  procedure: Procedure | null;
  relations: ProcedureRelation[];
  inspectedRelationKey: string | null;
  onInspectRelation: (key: string) => void;
  activeGlossaryTerm: GlossaryTerm | null;
  onSelectGlossaryTerm: (term: GlossaryTerm | null) => void;
}) {
  if (!procedure) {
    return (
      <aside className="rounded-3xl border border-slate-200 bg-white/92 p-5 shadow-[0_14px_38px_-30px_rgba(15,23,42,0.45)] lg:sticky lg:top-6 lg:h-fit">
        <h2 className="text-2xl font-semibold text-[#0d2b45]">Detalle de la prueba</h2>
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm leading-6 text-slate-600">
          Selecciona una prueba para consultar su ficha y sus relaciones documentadas.
        </p>
      </aside>
    );
  }

  const specialConditions = documentedSpecialConditions[procedure.code] ?? [];

  return (
    <aside className="panel-enter rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-[0_14px_38px_-30px_rgba(15,23,42,0.45)] lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold text-[#0d2b45]">Detalle de la prueba</h2>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(procedure.studyStatus)}`}
        >
          {statusLabel(procedure.studyStatus)}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-700">{procedure.code}</p>
        <h3 className="mt-1 text-xl font-semibold leading-snug text-slate-900">
          <GlossaryText onSelect={onSelectGlossaryTerm}>{procedure.name}</GlossaryText>
        </h3>
        <p className="mt-3 inline-flex rounded-md bg-white px-2 py-1 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
          {procedureFamilies[procedure.code]}
        </p>
      </div>

      {procedure.didacticSummary && (
        <section className="mt-5 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">
              El ensayo, en una mirada
            </h3>
            <span className="text-xs text-slate-500">Términos subrayados: glosario</span>
          </div>
          <p className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-sm leading-6 text-slate-800">
            <strong>Se aplica o conecta:</strong>{" "}
            <GlossaryText onSelect={onSelectGlossaryTerm}>{procedure.didacticSummary.apply}</GlossaryText>
          </p>
          <p className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-sm leading-6 text-slate-800">
            <strong>Se mide o registra:</strong>{" "}
            <GlossaryText onSelect={onSelectGlossaryTerm}>{procedure.didacticSummary.measure}</GlossaryText>
          </p>
          <p className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-sm leading-6 text-slate-800">
            <strong>Se obtiene:</strong>{" "}
            <GlossaryText onSelect={onSelectGlossaryTerm}>{procedure.didacticSummary.obtain}</GlossaryText>
          </p>
        </section>
      )}

      {specialConditions.length > 0 && (
        <section className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">
            Condiciones especiales
          </h3>
          <div className="mt-2 space-y-2">
            {specialConditions.map((condition) => (
              <p
                key={condition.summary}
                className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm leading-6 text-slate-800"
              >
                {condition.summary}
              </p>
            ))}
          </div>
        </section>
      )}

      <section className="mt-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">
          Relaciones documentadas
        </h3>
        <div className="mt-2 space-y-2">
          {relations.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 text-sm text-slate-600">
              No se han documentado relaciones para esta prueba.
            </p>
          ) : (
            relations.map((relation) => {
              const key = relationKey(relation);
              const active = inspectedRelationKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onInspectRelation(key)}
                  className={`w-full rounded-xl border p-3 text-left transition-[border-color,background-color,transform,box-shadow] duration-200 ease-out active:scale-[0.99] ${
                    active
                      ? "border-sky-300 bg-sky-50 shadow-[0_0_0_2px_rgba(186,230,253,0.9)]"
                      : "border-slate-200 bg-white/90 hover:border-sky-200 hover:bg-sky-50/40"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {relation.from} {relation.type === "shared_setup" ? "↔" : "→"} {relation.to}
                  </p>
                  <p className="mt-1 inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {typeLabel(relation.type)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{relation.rationale}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    <strong>Condición:</strong> {relation.condition}
                  </p>
                  {relation.transferredData && (
                    <p className="mt-2 text-sm text-slate-600">
                      <strong>Dato asociado:</strong> {relation.transferredData}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </section>

      {activeGlossaryTerm && (
        <GlossaryCard term={activeGlossaryTerm} onClose={() => onSelectGlossaryTerm(null)} />
      )}
    </aside>
  );
}

function ComparisonPanel({
  codes,
  onChange
}: {
  codes: [string, string];
  onChange: (codes: [string, string]) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (codes.some(Boolean)) setExpanded(true);
  }, [codes]);

  const comparison = codes.map(
    (code) => procedures.find((procedure) => procedure.code === code) ?? null
  ) as [Procedure | null, Procedure | null];

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white/88 p-5 shadow-[0_14px_38px_-30px_rgba(15,23,42,0.45)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-teal-700">
            Comparar dos pruebas
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#0d2b45]">Ficha paralela</h2>
          <p className="mt-1 text-sm text-slate-600">
            La comparación reúne el contenido ya documentado en cada ficha; no establece una relación
            nueva entre las pruebas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {codes.some(Boolean) && (
            <button
              type="button"
              onClick={() => onChange(["", ""])}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-[background-color,transform] duration-200 ease-out hover:bg-slate-50 active:scale-[0.98]"
            >
              Limpiar comparación
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-[background-color,transform] duration-200 ease-out hover:bg-slate-50 active:scale-[0.98]"
            aria-expanded={expanded}
          >
            {expanded ? "Ocultar" : "Mostrar"} comparación
          </button>
        </div>
      </div>

      {expanded && (
        <div className="slide-in">
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {([0, 1] as const).map((index) => (
              <label key={index} className="text-sm font-semibold text-slate-700">
                Prueba {index === 0 ? "A" : "B"}
                <select
                  value={codes[index]}
                  onChange={(event) => {
                    const next: [string, string] = [...codes] as [string, string];
                    next[index] = event.target.value;
                    onChange(next);
                  }}
                  className="mt-1 block h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800"
                >
                  <option value="">Seleccionar prueba</option>
                  {procedures.map((procedure) => (
                    <option key={procedure.code} value={procedure.code}>
                      {procedure.code} · {procedure.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {comparison.some(Boolean) && (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {comparison.map((procedure, index) => (
                <article key={index} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  {procedure ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-700">
                        {procedure.code}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">{procedure.name}</h3>
                      <p className="mt-3 rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-sm leading-6 text-slate-800">
                        <strong>Se aplica o conecta:</strong>{" "}
                        {procedure.didacticSummary?.apply ?? "Sin resumen documentado."}
                      </p>
                      <p className="mt-2 rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-sm leading-6 text-slate-800">
                        <strong>Se mide o registra:</strong>{" "}
                        {procedure.didacticSummary?.measure ?? "Sin resumen documentado."}
                      </p>
                      <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-sm leading-6 text-slate-800">
                        <strong>Se obtiene:</strong>{" "}
                        {procedure.didacticSummary?.obtain ?? "Sin resumen documentado."}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Selecciona una prueba para esta columna.</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
