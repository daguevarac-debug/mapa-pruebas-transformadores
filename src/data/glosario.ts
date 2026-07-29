export interface GlossaryTerm {
  id: string;
  label: string;
  aliases: string[];
  definition: string;
  analogy: string;
}

/**
 * Apoyos de estudio derivados de los términos ya presentes en las fichas.
 * No establecen criterios de aceptación, secuencias ni relaciones nuevas.
 */
export const glossaryTerms: GlossaryTerm[] = [
  {
    id: "ttr",
    label: "TTR",
    aliases: ["TTR"],
    definition: "Relación de transformación medida entre los devanados; permite contrastar cómo cambia la tensión de un lado del transformador al otro.",
    analogy: "Como una caja de cambios: transforma una magnitud en otra proporción, sin cambiar la función principal del conjunto."
  },
  {
    id: "grupo-vectorial",
    label: "Grupo vectorial",
    aliases: ["grupo vectorial"],
    definition: "Forma normalizada de expresar la conexión de los devanados y el desfase angular entre sus tensiones.",
    analogy: "Como indicar qué engranajes están conectados y en qué posición relativa giran."
  },
  {
    id: "perdidas-vacio",
    label: "Pérdidas en vacío",
    aliases: ["pérdidas en vacío", "perdidas en vacio"],
    definition: "Potencia que absorbe el transformador al estar energizado sin alimentar una carga; se asocia principalmente con el comportamiento del núcleo.",
    analogy: "Como el consumo de un carro encendido en punto muerto: no mueve una carga, pero sigue gastando energía."
  },
  {
    id: "corriente-excitacion",
    label: "Corriente de excitación",
    aliases: ["corriente de excitación", "corrientes de excitación", "corriente de magnetización"],
    definition: "Corriente que aparece al energizar el transformador en vacío y que establece el flujo magnético en el núcleo.",
    analogy: "Es la corriente mínima que pone a trabajar el imán interno antes de que el transformador entregue energía a una carga."
  },
  {
    id: "tangente-delta",
    label: "Tangente delta",
    aliases: ["tangente delta"],
    definition: "Indicador de las pérdidas dieléctricas del aislamiento al aplicarle tensión alterna; se interpreta junto con la capacitancia y el historial comparable.",
    analogy: "Como medir cuánta energía se escapa en forma de calor de una capa aislante mientras debería responder casi solo como un capacitor."
  },
  {
    id: "ivpd",
    label: "IVPD",
    aliases: ["IVPD"],
    definition: "Modalidad de tensión inducida que incorpora la medición de descargas parciales durante el ensayo.",
    analogy: "Es la misma revisión de aislamiento entre espiras, pero con un micrófono extra para captar pequeñas señales internas."
  },
  {
    id: "descargas-parciales",
    label: "Descargas parciales",
    aliases: ["descargas parciales"],
    definition: "Pequeños fenómenos eléctricos localizados dentro o cerca del aislamiento que se miden durante la modalidad aplicable de tensión inducida.",
    analogy: "Como chispas muy pequeñas dentro de una capa aislante: no equivalen por sí solas a una falla total, pero ayudan a observar su comportamiento."
  },
  {
    id: "bil",
    label: "BIL",
    aliases: ["BIL"],
    definition: "Nivel básico de aislamiento asignado para representar la capacidad del aislamiento frente a impulsos atmosféricos normalizados.",
    analogy: "Como la resistencia nominal de un paraguas frente a una tormenta definida en laboratorio."
  },
  {
    id: "sfra",
    label: "SFRA",
    aliases: ["SFRA"],
    definition: "Análisis de respuesta en frecuencia de barrido que genera una huella de la respuesta eléctrica del transformador en un rango amplio de frecuencias.",
    analogy: "Como escuchar cómo resuena un instrumento a distintas notas para reconocer si su estructura cambió."
  },
  {
    id: "z0",
    label: "Z0",
    aliases: ["Z0", "impedancia de secuencia cero"],
    definition: "Impedancia que representa cómo responde el transformador cuando las tres fases se comportan en secuencia cero, situación relevante en fallas a tierra.",
    analogy: "Como medir la resistencia del camino común que seguirían tres corrientes que avanzan juntas."
  },
  {
    id: "indice-polarizacion",
    label: "Índice de polarización",
    aliases: ["índice de polarización", "índice de absorción"],
    definition: "Relación entre lecturas de resistencia de aislamiento tomadas en instantes distintos; es un indicador complementario del comportamiento del aislamiento.",
    analogy: "Como observar no solo cuánto absorbe una esponja, sino cómo cambia esa absorción con el tiempo."
  },
  {
    id: "impedancia-cortocircuito",
    label: "Impedancia de cortocircuito",
    aliases: ["impedancia de cortocircuito"],
    definition: "Tensión relativa necesaria para hacer circular la corriente nominal cuando el otro devanado está cortocircuitado, expresada habitualmente en porcentaje.",
    analogy: "Como la presión mínima que se necesita para hacer pasar un caudal fijado a través de una tubería cerrada por el otro extremo."
  },
  {
    id: "punto-codo",
    label: "Punto de codo",
    aliases: ["punto de codo", "curva de magnetización"],
    definition: "Referencia de la curva de magnetización de un transformador de corriente, usada junto con otras verificaciones de su secundario.",
    analogy: "Como el punto de una pendiente donde aumentar el esfuerzo empieza a producir una respuesta mucho menos proporcional."
  }
];
