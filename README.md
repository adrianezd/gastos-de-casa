# Gastos de casa

Hoja de gastos tipo Excel, por mes y por persona.

Sitio: https://adrianezd.github.io/gastos-de-casa/

- **Mes**: dos hojas, Fijos y Variables. Se escribe directamente en las celdas; la fila de abajo crea una nueva. Enter baja a la fila siguiente. El importe admite sumas (`12,5+8`).
- **Fijos**: se repiten solos cada mes (o cada 2, 3, 6 o 12) desde el mes en que se crean. Cambiar el importe cuenta desde ese mes; quitarlo lo quita desde ese mes y los anteriores lo conservan. Casilla de pagado por mes.
- **Personas**: cada gasto es de una persona o compartido (a partes iguales). Filtro por persona y reparto del mes.
- **Año**: tabla de los 12 meses por persona, por tipo o por categoría, con total y media. Los meses que faltan cuentan solo los fijos previstos. Exporta a CSV para Excel.
- Datos en localStorage (`gastos-de-casa-v1`). Copia de seguridad en JSON desde Ajustes.
