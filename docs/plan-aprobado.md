# Plan aprobado (resumen)

## Alcance

Herramienta personal y educativa para mapear pruebas de transformadores y su conocimiento asociado. No tiene uso operativo para aprobacion o liberacion de equipos.

## Entidades

- Prueba
- Dato
- Relacion
- Fuente

## Tipos de relacion

- prerequisite
- data_dependency
- recommended_order
- independent

## Etapas permitidas

- preparation
- execution
- calculation
- interpretation

Si se requiere mayor detalle, se usa `substage`.

## Estados permitidos

- draft
- pending_review
- uncertain
- verified

## Reglas principales de validacion

- Una relacion no puede estar en `verified` sin fuente y referencia documental concreta.
- `data_dependency` requiere datos transferidos identificados.
- `prerequisite` no implica automaticamente transferencia de datos.
- `recommended_order` debe distinguirse claramente de `mandatory`.
- `technical_explanation` no puede usar fuerza `mandatory`.
- Solo se permiten las cuatro etapas definidas; el detalle adicional va en `substage`.
- Se permiten multiples relaciones entre mismo origen y destino cuando difieren en tipo, etapa, subetapa, condicion o dato transferido.

## Politica de completitud de matriz

- No se infieren relaciones para completar la matriz.
- La ausencia de relacion significa que no existe una conexion documentada.
- `independent` se registra solo cuando aporte claridad explicita.

## Politica documental interna (PDF)

- Los 17 PDF de "Procedimientos Campo de pruebas" son fuente principal practica en modo solo lectura.
- Todo hallazgo extraido automaticamente inicia como `pending_review`.
- Ninguna frase pasa a `verified` sin revision contextual y referencia precisa (archivo y pagina o seccion).
- Si un PDF no puede leerse correctamente: `partially_readable` o `unreadable`, sin completar por inferencia.
