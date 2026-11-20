# TP 09 — Actualización y eliminación de reservas de salas (`tp-09-salas-crud-mongodb`)

Trabajo Práctico 09 del curso de Desarrollo back-end con Node.js, construido a partir de una copia funcional del TP 08. Completa el CRUD de reservas incorporando reemplazo completo (`PUT`), actualización parcial (`PATCH`) y eliminación física (`DELETE`), manteniendo la creación (`POST`), lectura (`GET`), vistas HTML y `/estado`.

---

## 1. Origen de la copia, versiones y configuración del entorno

- **Origen:** copia funcional del TP 08 (`tp-09-salas-crud-mongodb`), conservando código fuente en CommonJS, manifiesto (`package.json`), lockfile (`package-lock.json`), configuración de calidad (`format` / `check`), cierre ordenado del servidor y ajuste DNS autorizado, sin versionar secretos ni `node_modules`.
- **Tecnologías y versiones:** Node.js (con carga nativa `--env-file=.env`), Express (`^4.21.2`), Mongoose (`^8.11.0`), EJS (`^3.1.10`), `express-ejs-layouts` (`^2.5.1`) y Morgan (`^1.10.0`).
- **Base de datos y DNS:** MongoDB Atlas Free, base de datos `reservas_salas_u9` y colección `reservas`, manteniendo el ajuste DNS autorizado (`setServers`) y la conexión establecida antes de iniciar el servidor HTTP, sin inserciones automáticas al iniciar o consultar.
- **Variables de entorno:** configuradas externamente en `.env` (excluido por `.gitignore`, acompañado de plantilla de entorno sin credenciales reales):
  ```env
  PORT=3000
  MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/reservas_salas_u9?retryWrites=true&w=majority
  ```

---

## 2. Comando de inicio y scripts de calidad

- **Instalar dependencias:**
  ```bash
  npm install
  ```
- **Iniciar el servidor:**
  ```bash
  node --env-file=.env src/index.js
  ```
- **Formato y análisis estático:** ejecutar los scripts `format` y `check` sobre `src` y `scripts` antes de la entrega:
  ```bash
  npm run format
  npm run check
  ```

---

## 3. Arquitectura por capas

- **Modelos (`src/modelos/reserva.js`):** define el esquema de Mongoose con los seis campos originales (`estudiante`, `email`, `sala`, `fecha`, `turno`, `personas`) más `estado` (`pendiente` o `confirmada`, con `default: "pendiente"`). Expone `id` textual limpio en JSON ocultando `_id` interno.
- **Servicios (`src/servicios/reservas.js`):** capa asíncrona compartida entre la API REST y las vistas HTML. Construye objetos explícitos para creación, reemplazo (`PUT`) y actualización parcial con `$set` (`PATCH`) usando listas de campos admitidos, sin pasar `req.body` completo al modelo. Configura `runValidators: true`, `new: true` y `upsert: false`.
- **Rutas API (`src/rutas/api-reservas.js`):** valida `ObjectId`, estructura del cuerpo JSON, listas blancas de campos y tipos de datos antes de delegar al servicio, devolviendo códigos HTTP y respuestas JSON consistentes.
- **Vistas HTML y `/estado`:** mantienen la misma base de datos y servicio asíncrono que la API, reflejando en tiempo real las modificaciones y eliminaciones realizadas vía REST.

---

## 4. Reglas de validación

| Campo | Regla de validación |
| :--- | :--- |
| `estudiante` | Texto obligatorio (`trim`). |
| `email` | Texto obligatorio (`trim`) con presencia de `@`. |
| `sala` | Enum estricto: `Sala Norte`, `Sala Sur` o `Sala Multimedia`. |
| `fecha` | Texto obligatorio (`trim`). |
| `turno` | Enum estricto: `Mañana`, `Tarde` o `Noche`. |
| `personas` | Número entero entre `1` y `6` (admite número o texto numérico no vacío comprobando finitud, rango e integridad; rechaza booleanos, arreglos y objetos). |
| `estado` | Enum estricto: `pendiente` o `confirmada` (`default: "pendiente"` al crear). |

- **Controles adicionales:** en `POST` se rechazan `estado` o `_id` enviados por el cliente; en `PUT` y `PATCH` se rechazan cuerpos ausentes, campos desconocidos, `_id` y operadores como `$set` enviados en el body.

---

## 5. Contratos HTTP

| Método y Ruta | Comportamiento y Códigos de Respuesta |
| :--- | :--- |
| `POST /api/reservas` | Crea con los 6 campos originales y asigna `estado: "pendiente"`. Responde `201` con el recurso y cabecera `Location`. |
| `GET /api/reservas` | Devuelve `200` con un arreglo de reservas (sin metadatos adicionales). |
| `GET /api/reservas/:id` | Devuelve `200` con la reserva o `404` JSON si el ID válido no existe (`400` si el ID está mal formado). |
| `PUT /api/reservas/:id` | Exige exactamente los 7 campos editables (incluido `estado`). Responde `200` con el documento reemplazado y mismo ID; `400` si falta algún campo o hay datos inválidos; `404` si el ID válido no existe (`upsert: false`). |
| `PATCH /api/reservas/:id` | Admite solo `personas` y/o `estado` (al menos uno presente). Responde `200` modificando únicamente los campos enviados y conservando el resto; `400` ante body vacío, campo extra o valor inválido; `404` si el ID válido no existe. |
| `DELETE /api/reservas/:id` | Elimina físicamente el documento por ID y responde `204` sin cuerpo. Un segundo `DELETE` o `GET` posterior devuelve `404`. |
| Errores generales | `400` JSON ante entrada/ID/JSON inválido; `404` JSON ante recurso o ruta API inexistente; `500` JSON seguro sin exponer trazas ni secretos. |

---

## 6. Criterio de borrado físico vs. cambio de estado

- **Eliminación física (`DELETE /api/reservas/:id`):** suprime definitivamente el documento de la colección `reservas` en MongoDB mediante `findByIdAndDelete`. No utiliza borrado lógico ni rutas de vaciado masivo.
- **Cambio de estado (`PUT` / `PATCH`):** modifica el atributo `estado` (`pendiente` a `confirmada` o viceversa) por decisión explícita del cliente, conservando el historial y los datos de la reserva sin aplicar validaciones de calendario, disponibilidad de sala, solapamiento, cupo compartido o unicidad.

---

## 7. Ejemplos de solicitudes en Postman

### `POST /api/reservas` (Crear)
```json
{
  "estudiante": "Ana Ejemplo",
  "email": "ana@example.com",
  "sala": "Sala Norte",
  "fecha": "2026-10-28",
  "turno": "Mañana",
  "personas": 2
}
```

### `PUT /api/reservas/:id` (Reemplazo completo)
```json
{
  "estudiante": "Ana Ejemplo Modificada",
  "email": "ana.nueva@example.com",
  "sala": "Sala Sur",
  "fecha": "2026-10-30",
  "turno": "Tarde",
  "personas": 4,
  "estado": "confirmada"
}
```

### `PATCH /api/reservas/:id` (Cambio parcial)
```json
{
  "personas": 3
}
```

---

## 8. Matriz de pruebas observada y evidencia de persistencia

| Caso probado | Resultado observado |
| :--- | :--- |
| `POST` válido | `201 Created`, cabecera `Location: /api/reservas/<id>` y `estado: "pendiente"`. |
| `PUT` completo (7 campos) | `200 OK`, conserva el mismo `id` y actualiza todos los valores. |
| `PUT` incompleto (omitido un campo) | `400 Bad Request` JSON; el documento en Atlas permanece intacto. |
| `PATCH` con `personas` o `estado` | `200 OK`, actualiza solo el campo enviado y conserva los restantes. |
| `PATCH` vacío, campo extra, `_id` o `$set` | `400 Bad Request` JSON sin modificar la base de datos. |
| `personas` (`0`, `7`, `2.5`, `true`, `[]`, `{}`) | `400 Bad Request` JSON sin modificación. |
| `estado` o enum inválido (`sala` / `turno`) | `400 Bad Request` JSON sin modificación. |
| ID mal formado (ej. `/api/reservas/123`) | `400 Bad Request` JSON. |
| ID válido de 24 caracteres ausente en `PUT`/`PATCH` | `404 Not Found` JSON sin crear un documento nuevo (`upsert: false`). |
| JSON mal formado o cuerpo ausente | `400 Bad Request` JSON. |
| `DELETE` sobre ID existente | `204 No Content` sin cuerpo; `GET /api/reservas` refleja una reserva menos. |
| Repetir `DELETE` o `GET` tras eliminar | `404 Not Found` JSON. |
| Reinicio del servidor tras `PUT`/`PATCH` y `DELETE` | Al detener y reiniciar Node.js contra `reservas_salas_u9`, los cambios y eliminaciones persisten en `GET /api/reservas/:id`, las vistas HTML y `/estado`. |
| Sitio HTML, formulario y `/estado` | Formulario crea con redirección `302` y valida con `400` conservando valores; listado, detalle y `/estado` reflejan la cantidad real en MongoDB.