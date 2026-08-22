-- Datos iniciales para el Sistema de Voto Electrónico Escolar.
-- Ejecutar después de schema.sql.

insert into institucion (
  nombre,
  proceso_electoral,
  mensaje_bienvenida,
  anio_escolar
)
select
  'Institución Educativa',
  'Elecciones del Municipio Escolar',
  'Bienvenido(a). Presenta tu carnet frente a la cámara para votar.',
  to_char(current_date, 'YYYY')
where not exists (select 1 from institucion);
