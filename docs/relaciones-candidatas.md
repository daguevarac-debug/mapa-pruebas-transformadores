# Relaciones candidatas entre pruebas (matriz dispersa)

## Objetivo y alcance

Este documento construye una primera matriz **dispersa** de relaciones entre las 10 pruebas cuyas fichas didácticas ya existen en [docs/fichas/](fichas/). La matriz **comenzó a partir de esas fichas didácticas**, incluyendo únicamente lo que estaba expresamente mencionado en su texto (secciones "¿Dónde se utilizan sus resultados?" y "¿Depende de otra prueba?", principalmente); no se generaron relaciones para completar la matriz ni se creó ningún archivo de datos, código o interfaz adicional.

A partir de esa base, algunas relaciones **están siendo verificadas posteriormente contra los PDF originales** de los procedimientos (archivo, versión y página o sección concreta). Las relaciones que aún no se han revisado de esa forma **permanecen en estado `pending_review`** y deben confirmarse contra el procedimiento original antes de usarse para cualquier automatización. Las relaciones para las que ya existe evidencia documental completa en ambos PDF (archivo, versión y página o sección) pueden pasar a estado `verified`.

Pruebas consideradas:

| Código | Nombre |
|---|---|
| T50-02386 | Resistencia de devanados |
| T50-02413 | TTR, grupo vectorial y polaridad |
| T50-02417 | Pérdidas en vacío y corriente de excitación |
| T50-02404 | Pérdidas con carga e impedancia |
| T50-02416 | Resistencia de aislamiento |
| T50-02398 | Tangente delta, factor de potencia y capacitancia |
| T50-02367 | Calentamiento |
| T50-02393 | Tensión aplicada |
| T50-02376 | Tensión inducida |
| T50-02408 | Impulso |

Nota general: casi todas las fichas afirman explícitamente en su sección "¿Depende de otra prueba?" que **no necesitan resultados previos de otra prueba para ejecutarse** (T50-02413, T50-02416, T50-02398, T50-02376, y —para la ejecución física— T50-02417 y T50-02404). Esas afirmaciones no se listan como filas de tipo `independent` porque no aportan una aclaración pedagógica adicional a la ya expresada en cada ficha individual (regla 3); solo se registran como relaciones las dependencias u órdenes que sí están mencionadas expresamente.

Algunas menciones de las fichas no encajan todavía en el modelo de relaciones origen→destino entre dos de las diez pruebas (condiciones de preparación, secuencias internas de una misma prueba, o repetición de una misma prueba en dos momentos). Esas menciones se documentan aparte, en las secciones posteriores a la matriz, y no se representan como filas de la matriz principal.

## Matriz de relaciones candidatas

| Origen | Destino | Tipo candidato | Stage | Substage | Dato transferido | Condición de aplicabilidad | Consecuencia si falta | Evidencia documental | Estado | Notas de revisión |
|---|---|---|---|---|---|---|---|---|---|---|
| T50-02386 | T50-02404 | data_dependency | calculation | Cálculo de pérdidas en el conductor (I²R) a la temperatura de ensayo y su corrección a la temperatura de referencia | Resistencia de devanados medida en frío (Rθ1) y la temperatura a la que fue medida (θ1); no se transfiere una resistencia ya corregida, ya que T50-02404 aplica internamente su propia fórmula de corrección | Se necesita para calcular Pr = 1.5·(I1²R1 + I2²R2) (pérdidas en el conductor) y para referir posteriormente esas pérdidas a la temperatura de referencia θr; en ambos pasos se usa además la constante térmica Tk según el material del devanado (Cu/Al) | No es posible calcular la componente de pérdidas en el conductor (I²R) ni referir las pérdidas con carga a la temperatura de referencia; en cambio, la medición eléctrica en sí (tensión, corriente, pérdidas totales, factor de potencia) sí puede ejecutarse sin este dato, por lo que no constituye un prerequisite de ejecución física | T50-02386 V.13, pág. 4, num. 5.1 "Generalidades": "Calcular la componente I²R de la medición de las pérdidas en carga."; T50-02386 V.13, pág. 9-10, num. 5.6: fórmula Rs = Rm·(Ts+Tk)/(Tm+Tk) y tabla de Tk (Cu 235 °C IEC / 234.5 °C IEEE-NTC; Al 225 °C); T50-02404 V.11, pág. 9, num. 5.6, ecs. (8)-(10): Pr = 1.5·(I1²R1+I2²R2), "Rθ1: Resistencia medida en frío a la temperatura θ1 (Ω)", Rθ2 = Rθ1·(θ2+Tk)/(θ1+Tk); T50-02404 V.11, pág. 9-10: misma tabla de Tk; T50-02404 V.11, pág. 10, ecs. (13)-(15): corrección de Pr y Ps a la temperatura de referencia θr usando Tk | verified | Verificado directamente en ambos procedimientos. T50-02404 utiliza la resistencia medida en frío y su temperatura para los cálculos de pérdidas I²R y corrección térmica. La medición eléctrica puede ejecutarse sin este dato, por lo que no constituye un prerequisite de ejecución. No se identificó una relación adicional de orden. |
| T50-02386 | T50-02367 | data_dependency | calculation | Cálculo de la temperatura media del devanado | Resistencia de devanados medida en frío | Se compara con la resistencia en caliente medida al final del ensayo de calentamiento | No se puede calcular la temperatura media de los devanados a partir de la resistencia en caliente | T50-02386, "¿Dónde se utilizan sus resultados?": "En la prueba de calentamiento, para calcular la temperatura media del devanado"; T50-02367, "¿Depende de otra prueba?": "para calcular la temperatura media de los devanados se necesita la resistencia de devanados medida en frío, con la que se compara la resistencia medida en caliente al final del ensayo" | pending_review | - |
| T50-02417 | T50-02367 | prerequisite | preparation | Definición de la corriente/pérdidas totales a inyectar | Pérdidas en vacío referidas a temperatura de referencia | Dato de entrada obligatorio para el ensayo de calentamiento | La prueba de calentamiento no puede ejecutarse correctamente porque no se puede definir el nivel de corriente/pérdidas a inyectar | T50-02367, "¿Depende de otra prueba?": "Para poder ejecutar la prueba se necesitan, como datos de entrada, las pérdidas en vacío y las pérdidas con carga (referidas a temperatura de referencia), ya que estas definen la corriente o pérdidas totales que se deben inyectar durante el ensayo" | pending_review | - |
| T50-02404 | T50-02367 | prerequisite | preparation | Definición de la corriente/pérdidas totales a inyectar | Pérdidas con carga referidas a temperatura de referencia | Dato de entrada obligatorio para el ensayo de calentamiento | La prueba de calentamiento no puede ejecutarse correctamente porque no se puede definir el nivel de corriente/pérdidas a inyectar | T50-02404, "¿Dónde se utilizan sus resultados?": "sus resultados, junto con los de la prueba de pérdidas en vacío, son base para la prueba de calentamiento"; T50-02367 (misma cita que la fila anterior) | pending_review | - |
| T50-02413 | T50-02408 | recommended_order | preparation | No aplica | No aplica | Antes de iniciar la prueba de impulso, cuando el procedimiento exija haber realizado previamente TTR, grupo vectorial y polaridad. | No se indica una consecuencia técnica explícita en la ficha; debe verificarse en el PDF si es un requisito operativo, de diagnóstico previo o de secuencia. | T50-02408, "¿Depende de otra prueba?": "antes de iniciar la prueba, deben haberse realizado previamente los ensayos de relación de transformación, verificación de polaridad y grupo vectorial, y resistencia de devanados, como parte de las precauciones previas al ensayo (no como datos que alimenten el cálculo del ensayo de impulso)" | pending_review | Verificar en el PDF original si existe una dependencia técnica real o únicamente un orden previo. |
| T50-02386 | T50-02408 | recommended_order | preparation | No aplica | No aplica | Antes de iniciar la prueba de impulso, cuando el procedimiento exija haber realizado previamente resistencia de devanados. | No se indica una consecuencia técnica explícita en la ficha; debe verificarse en el PDF si es un requisito operativo, de diagnóstico previo o de secuencia. | T50-02408, "¿Depende de otra prueba?" (misma cita que la fila anterior) | pending_review | Verificar en el PDF original si existe una dependencia técnica real o únicamente un orden previo. |
| T50-02408 | T50-02393 | recommended_order | preparation | No aplica | No aplica | Cuando los ensayos de impulso atmosférico o de maniobra sean aplicables al transformador. | Se altera la secuencia dieléctrica indicada por el procedimiento; no se menciona transferencia de resultados ni dependencia de cálculo. | T50-02393, "¿Depende de otra prueba?": "este ensayo debe realizarse siempre después de los ensayos de impulso atmosférico e impulso de maniobra, cuando estos también apliquen al transformador bajo prueba. Esto la ubica dentro de una secuencia dieléctrica obligatoria por orden, no como una dependencia de cálculo o de resultados previos" | pending_review | La ficha la describe como una relación de orden; confirmar el alcance exacto en el PDF original. |

La matriz principal contiene exactamente **7 relaciones**.

## Condiciones de preparación pendientes de modelar

- T50-02417 puede requerir desmagnetización del núcleo cuando antes se realizaron la prueba de resistencia de devanados (T50-02386) o el ensayo de impulso atmosférico (T50-02408), ya que ambas dejan el núcleo magnetizado (fuente: T50-02417, "¿Depende de otra prueba?").
- Esta condición no se modela todavía como relación entre pruebas porque no existe transferencia de datos ni una dependencia directa del resultado de la prueba de origen: es una condición de preparación del propio T50-02417, aplicable según el historial de ensayos previos del transformador.

## Secuencias internas de una prueba

- Dentro de T50-02408, el impulso de maniobra se realiza después del impulso atmosférico cuando ambos aplican al transformador (fuente: T50-02408, "¿Depende de otra prueba?": "el impulso de maniobra debe ejecutarse después del impulso atmosférico; este es un orden obligatorio dentro del mismo procedimiento, no una dependencia de resultados").
- Esta secuencia no pertenece a la matriz de relaciones entre pruebas porque ambos son variantes del mismo procedimiento (T50-02408), no dos de las diez pruebas distintas del alcance.

## Patrones de repetición pendientes

- T50-02417 puede realizarse antes y después de las pruebas dieléctricas, como referencia de comparación (fuente: T50-02417, "¿Dónde se utilizan sus resultados?": "esta prueba se realiza antes y después de las pruebas dieléctricas, como referencia de comparación").
- El modelo actual de relaciones origen-destino no representa todavía una misma prueba repetida en dos momentos distintos del proceso de pruebas.
- Debe verificarse en el PDF original cuáles pruebas dieléctricas concretas están incluidas en esa comparación antes/después.
