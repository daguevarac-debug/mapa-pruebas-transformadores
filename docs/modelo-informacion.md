# Modelo de informacion (conceptual)

Este documento describe campos conceptuales acordados. No define aun schema formal ni codigo.

## 1) Prueba

Campos conceptuales:

- id
- nombre
- proposito
- categoria_tecnica_primaria
- etiquetas_tecnicas_secundarias (lista)
- clasificacion_normativa_condicionada (lista)
- datos_entrada (referencias a Dato)
- datos_salida (referencias a Dato)
- notas (opcional)

Notas:

- La categoria tecnica es independiente de la clasificacion normativa.
- No se usa un campo fijo de obligatoriedad en la ficha.

## 2) Dato

Campos conceptuales:

- id
- prueba_id
- nombre
- rol: input | output | intermediate
- unidad (si aplica)
- definicion
- estado: draft | pending_review | uncertain | verified
- notas_verificacion (opcional)

Nota para resistencia de devanados (provisional):

- resistencia medida
- temperatura de medicion
- resistencia convertida

Hasta verificacion documental, no se fija variante definitiva.

## 3) Relacion

Campos conceptuales:

- id
- origen_prueba_id
- destino_prueba_id
- tipo: prerequisite | data_dependency | recommended_order | independent
- stage: preparation | execution | calculation | interpretation
- substage (opcional)
- datos_transferidos (lista de ids de Dato)
- condicion_aplicabilidad
- consecuencia_si_falta
- fuentes (lista)
- estado: draft | pending_review | uncertain | verified
- notas_verificacion (opcional)
- observaciones (opcional)

Reglas conceptuales:

- `verified` requiere fuente con referencia concreta.
- Multiples relaciones entre mismo origen-destino estan permitidas si cambian tipo, etapa, subetapa, condicion o dato transferido.
- No se crean relaciones por inferencia para llenar vacios.

## 4) Fuente

Campos conceptuales:

- id
- tipo_fuente: standard | internal_procedure | technical_explanation
- fuerza: mandatory | recommended | informative | not_determined
- documento
- edicion
- clausula
- pagina_o_seccion
- observacion

Regla:

- Si tipo_fuente = technical_explanation, entonces fuerza no puede ser mandatory.

## 5) Clasificacion normativa condicionada

Cada entrada debe incluir:

- sistema_normativo
- documento
- edicion
- clasificacion
- condicion_aplicabilidad
- referencia

Objetivo:

- Permitir que una misma prueba cambie de clasificacion segun potencia, clase, diseno o contrato.
- Conservar edicion de la norma aunque no se implemente versionamiento historico.
