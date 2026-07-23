export type RelationType = "prerequisite" | "data_dependency";
export type StudyStatus = "studied" | "in_progress" | "pending";

export interface Procedure {
  code: string;
  name: string;
  category?: string;
  studyStatus: StudyStatus;
  didacticSummary?: DidacticSummary;
}

/** Resumen visible de la acción física y de la lectura principal del ensayo. */
export interface DidacticSummary {
  apply: string;
  measure: string;
  obtain: string;
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
    category: "Medida de resistencia electrica",
    studyStatus: "studied",
    didacticSummary: {
      apply: "Se inyecta una corriente continua pequeña en cada devanado y posición del conmutador.",
      measure: "El equipo registra la corriente, la caída de tensión y la temperatura del aceite.",
      obtain: "Se obtiene la resistencia de cada devanado y, cuando aplica, su valor corregido a una temperatura de referencia."
    }
  },
  {
    code: "T50-02413",
    name: "TTR, grupo vectorial y polaridad",
    category: "Medida de relacion de transformacion y verificacion de conexion",
    studyStatus: "studied",
    didacticSummary: {
      apply: "Se conecta el medidor a los bornes y se aplica una tensión alterna reducida a uno de los devanados.",
      measure: "Se miden las tensiones inducidas, su relación, polaridad y desplazamiento angular.",
      obtain: "Se verifica la relación de transformación, el grupo vectorial y la polaridad en las posiciones aplicables del conmutador."
    }
  },
  {
    code: "T50-02417",
    name: "Perdidas en vacio y corriente de excitacion",
    category: "Medida de perdidas en vacio y corriente de excitacion",
    studyStatus: "studied",
    didacticSummary: {
      apply: "Se aplica tensión nominal a un devanado con los demás devanados en circuito abierto.",
      measure: "El analizador registra tensión, corriente de excitación y potencia activa por fase.",
      obtain: "Se obtienen las pérdidas en vacío corregidas y la corriente de excitación, como indicadores del comportamiento del núcleo."
    }
  },
  {
    code: "T50-02404",
    name: "Perdidas con carga e impedancia",
    category: "Medida de perdidas con carga e impedancia de cortocircuito",
    studyStatus: "studied",
    didacticSummary: {
      apply: "Se cortocircuita un devanado y se aplica una tensión reducida al otro hasta hacer circular la corriente nominal.",
      measure: "El analizador registra tensión, corriente, potencia activa, factor de potencia y temperatura del aceite.",
      obtain: "Se obtienen las pérdidas con carga y la impedancia de cortocircuito, referidas a la temperatura aplicable."
    }
  },
  {
    code: "T50-02416",
    name: "Resistencia de aislamiento",
    category: "Medida de resistencia de aislamiento",
    studyStatus: "studied",
    didacticSummary: {
      apply: "Se agrupan los terminales de cada devanado y se aplica tensión continua entre devanados y tierra con un megóhmetro.",
      measure: "Se registran las lecturas de resistencia a distintos tiempos, junto con la tensión aplicada y las condiciones ambientales.",
      obtain: "Se obtiene la resistencia de aislamiento y, según la línea del transformador, el índice de absorción o de polarización."
    }
  },
  {
    code: "T50-02398",
    name: "Tangente delta, factor de potencia y capacitancia",
    category: "Medida de perdidas dielectricas y capacitancia del aislamiento",
    studyStatus: "studied",
    didacticSummary: {
      apply: "Se conectan los grupos de devanados al equipo y se aplica una tensión alterna controlada sobre el aislamiento seleccionado.",
      measure: "El equipo separa la respuesta capacitiva y disipativa para registrar capacitancia y factor de potencia o tangente delta.",
      obtain: "Se obtienen valores de capacitancia y pérdidas dieléctricas, útiles para comparar el estado relativo del aislamiento."
    }
  },
  {
    code: "T50-02367",
    name: "Calentamiento",
    category: "Prueba de elevacion de temperatura",
    studyStatus: "studied",
    didacticSummary: {
      apply: "Con el método de cortocircuito se inyectan las pérdidas totales hasta estabilizar el aceite; después se aplica corriente nominal durante una hora.",
      measure: "Se registran temperaturas de aceite y ambiente; al desconectar, se mide rápidamente la resistencia en caliente de los devanados.",
      obtain: "Se obtienen las elevaciones de temperatura del aceite, del devanado y del punto caliente calculado."
    }
  },
  {
    code: "T50-02393",
    name: "Tension aplicada",
    category: "Prueba dielectrica de tension aplicada",
    studyStatus: "studied",
    didacticSummary: {
      apply: "Se aplica tensión alterna de frecuencia nominal al devanado bajo prueba; los demás devanados, núcleo y tanque permanecen a tierra.",
      measure: "Se registra la tensión aplicada y el tiempo de sostenimiento, mientras se vigila el comportamiento dieléctrico.",
      obtain: "Se verifica que el aislamiento principal a tierra soporta la tensión especificada durante el tiempo de prueba."
    }
  },
  {
    code: "T50-02376",
    name: "Tension inducida",
    category: "Prueba dielectrica de tension inducida",
    studyStatus: "pending"
  },
  {
    code: "T50-02408",
    name: "Impulso",
    category: "Prueba dielectrica de impulso",
    studyStatus: "studied",
    didacticSummary: {
      apply: "Se aplica al terminal de línea una onda normalizada de impulso, mientras los demás terminales se conectan según la configuración del ensayo.",
      measure: "El sistema registra la forma de onda de tensión aplicada y la respuesta de corriente o tensión transferida.",
      obtain: "Se compara la respuesta entre aplicaciones y se verifica el comportamiento del aislamiento frente a sobretensiones transitorias."
    }
  },
  {
    code: "T50-02338",
    name: "Nivel de ruido audible",
    category: "Prueba de nivel de ruido audible",
    studyStatus: "pending"
  },
  {
    code: "T50-02407",
    name: "Corrientes de excitacion monofasica",
    category: "Medicion de corrientes de excitacion monofasica",
    studyStatus: "pending"
  },
  {
    code: "T50-02692",
    name: "SFRA",
    category: "Analisis de respuesta en frecuencia de barrido",
    studyStatus: "pending"
  },
  {
    code: "T50-02869",
    name: "Impedancia de secuencia cero",
    category: "Medida de la impedancia de secuencia cero",
    studyStatus: "pending"
  },
  {
    code: "T50-04588",
    name: "Armonicos de corriente",
    category: "Medida de armonicos de corriente",
    studyStatus: "pending"
  },
  {
    code: "T50-04590",
    name: "Ensayos electricos en transformadores de corriente",
    category: "Ensayos electricos en transformadores de corriente",
    studyStatus: "pending"
  },
  {
    code: "T50-04598",
    name: "DFR",
    category: "Ensayo de respuesta en frecuencia del dielectrico",
    studyStatus: "studied",
    didacticSummary: {
      apply: "Se aplica una tensión alterna de baja magnitud al aislamiento mientras se realiza un barrido de frecuencia.",
      measure: "El equipo registra la respuesta dieléctrica, incluyendo capacitancia y factor de disipación, a lo largo del barrido.",
      obtain: "Se obtiene una curva de respuesta en frecuencia del dieléctrico para apoyar la evaluación de humedad y condición del aislamiento."
    }
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
