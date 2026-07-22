export type RelationType = "prerequisite" | "data_dependency";

export interface Procedure {
  code: string;
  name: string;
  category?: string;
}

export interface ProcedureRelation {
  from: string;
  to: string;
  type: RelationType;
  stage: "preparation" | "calculation";
  rationale: string;
  condition: string;
  transferredData?: string;
}

export interface DocumentedSpecialCondition {
  summary: string;
}

export const procedures: Procedure[] = [
  {
    code: "T50-02386",
    name: "Resistencia de devanados",
    category: "Medida de resistencia electrica"
  },
  {
    code: "T50-02413",
    name: "TTR, grupo vectorial y polaridad",
    category: "Medida de relacion de transformacion y verificacion de conexion"
  },
  {
    code: "T50-02417",
    name: "Perdidas en vacio y corriente de excitacion",
    category: "Medida de perdidas en vacio y corriente de excitacion"
  },
  {
    code: "T50-02404",
    name: "Perdidas con carga e impedancia",
    category: "Medida de perdidas con carga e impedancia de cortocircuito"
  },
  {
    code: "T50-02416",
    name: "Resistencia de aislamiento",
    category: "Medida de resistencia de aislamiento"
  },
  {
    code: "T50-02398",
    name: "Tangente delta, factor de potencia y capacitancia",
    category: "Medida de perdidas dielectricas y capacitancia del aislamiento"
  },
  {
    code: "T50-02367",
    name: "Calentamiento",
    category: "Prueba de elevacion de temperatura"
  },
  {
    code: "T50-02393",
    name: "Tension aplicada",
    category: "Prueba dielectrica de tension aplicada"
  },
  {
    code: "T50-02376",
    name: "Tension inducida",
    category: "Prueba dielectrica de tension inducida"
  },
  {
    code: "T50-02408",
    name: "Impulso",
    category: "Prueba dielectrica de impulso"
  }
];

export const verifiedRelations: ProcedureRelation[] = [
  {
    from: "T50-02386",
    to: "T50-02404",
    type: "data_dependency",
    stage: "calculation",
    rationale:
      "Los resultados de resistencia en frio se usan para calcular la componente I2R y su correccion termica en T50-02404.",
    condition:
      "Aplicable cuando se requiere calcular perdidas con carga referidas a temperatura de referencia.",
    transferredData:
      "Resistencia de devanados medida en frio (Rtheta1) y temperatura de medicion (theta1)."
  },
  {
    from: "T50-02386",
    to: "T50-02367",
    type: "data_dependency",
    stage: "calculation",
    rationale:
      "La resistencia en frio y su temperatura se usan para estimar la temperatura media del devanado al cierre del calentamiento.",
    condition:
      "Aplicable al calculo de elevacion de temperatura del devanado en el ensayo de calentamiento.",
    transferredData:
      "Resistencia en frio (R1) y temperatura asociada (theta1/T1)."
  },
  {
    from: "T50-02417",
    to: "T50-02367",
    type: "prerequisite",
    stage: "preparation",
    rationale:
      "T50-02367 requiere las perdidas en vacio para definir la inyeccion de perdidas totales del metodo de cortocircuito.",
    condition:
      "Antes de preparar y ejecutar la inyeccion de perdidas totales en calentamiento."
  },
  {
    from: "T50-02404",
    to: "T50-02367",
    type: "prerequisite",
    stage: "preparation",
    rationale:
      "T50-02367 exige perdidas con carga convertidas a temperatura de referencia para calcular la inyeccion de perdidas totales.",
    condition:
      "Antes de preparar y ejecutar la etapa de inyeccion de perdidas totales del calentamiento."
  },
  {
    from: "T50-02413",
    to: "T50-02408",
    type: "prerequisite",
    stage: "preparation",
    rationale:
      "T50-02408 indica realizar previamente relacion de transformacion, polaridad y grupo vectorial.",
    condition:
      "Antes de iniciar una ejecucion del ensayo de impulso."
  },
  {
    from: "T50-02386",
    to: "T50-02408",
    type: "prerequisite",
    stage: "preparation",
    rationale:
      "T50-02408 exige haber realizado previamente resistencia de devanados como precaucion antes de iniciar.",
    condition:
      "Antes de iniciar una ejecucion del ensayo de impulso."
  },
  {
    from: "T50-02408",
    to: "T50-02393",
    type: "prerequisite",
    stage: "preparation",
    rationale:
      "T50-02393 establece que tension aplicada debe ejecutarse despues de impulso atmosferico y/o maniobra cuando aplican.",
    condition:
      "Solo cuando esos ensayos de impulso formen parte del programa de pruebas de la unidad."
  }
];

export type SpecialConditionsByProcedure = Partial<Record<Procedure["code"], DocumentedSpecialCondition[]>>;

export const documentedSpecialConditions: SpecialConditionsByProcedure = {
  "T50-02417": [
    {
      summary:
        "Puede requerirse desmagnetización del núcleo antes de la prueba, en especial si previamente se realizaron mediciones de resistencia de devanados o ensayos de impulso, porque esas actividades pueden dejar el núcleo magnetizado."
    }
  ]
};

// Pendiente para etapas futuras del proyecto:
// 1) Condiciones especiales de preparacion (ej. desmagnetizacion previa para T50-02417).
// 2) Secuencias internas dentro de una misma prueba (ej. orden interno en T50-02408).
// 3) Repeticiones de una misma prueba en distintos momentos del proceso.
