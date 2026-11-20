const Reserva = require("../modelos/reserva");

function crearServicioReservas() {
  // Obtener todas las reservas
  async function obtenerReservas(filtroSala = null) {
    const query = filtroSala ? { sala: filtroSala } : {};
    return await Reserva.find(query);
  }

  // Obtener una reserva por su ID de MongoDB
  async function obtenerReservaPorId(id) {
    return await Reserva.findById(id);
  }

  // Crear una nueva reserva
  async function crearReserva(datosCliente) {
    const nuevaReserva = new Reserva({
      estudiante: datosCliente.estudiante,
      email: datosCliente.email,
      sala: datosCliente.sala,
      fecha: datosCliente.fecha,
      turno: datosCliente.turno,
      personas: datosCliente.personas,
    });

    return await nuevaReserva.save();
  }

  // Actualización completa (PUT): exige los 7 campos editables (incluido estado)
  async function actualizarReservaCompleta(id, datos) {
    const reemplazo = {
      estudiante: datos.estudiante,
      email: datos.email,
      sala: datos.sala,
      fecha: datos.fecha,
      turno: datos.turno,
      personas: datos.personas,
      estado: datos.estado,
    };

    return await Reserva.findByIdAndUpdate(id, reemplazo, {
      new: true, // Devuelve el documento ya actualizado
      runValidators: true, // Aplica las validaciones del esquema de Mongoose
      upsert: false, // Evita crear un documento si el ID no existe
    });
  }

  // Actualización parcial (PATCH): permite modificar solo personas y/o estado
  async function actualizarReservaParcial(id, datos) {
    const actualizacion = {};
    if (datos.personas !== undefined) actualizacion.personas = datos.personas;
    if (datos.estado !== undefined) actualizacion.estado = datos.estado;

    return await Reserva.findByIdAndUpdate(
      id,
      { $set: actualizacion },
      {
        new: true,
        runValidators: true,
        upsert: false,
      },
    );
  }

  // Eliminación física (DELETE): borra el documento por su ID
  async function eliminarReserva(id) {
    return await Reserva.findByIdAndDelete(id);
  }

  // Obtener la cantidad total de reservas (requerido para /estado)
  async function obtenerCantidad() {
    return await Reserva.countDocuments();
  }

  // Obtener las salas permitidas (alineadas con el enum del modelo Mongoose)
  async function obtenerSalasPermitidas() {
    return ["Sala Norte", "Sala Sur", "Sala Multimedia"];
  }

  // Obtener los turnos permitidos (requerido por el formulario web tradicional)
  async function obtenerTurnosPermitidos() {
    return ["Mañana", "Tarde", "Noche"];
  }

  return {
    obtenerReservas,
    obtenerReservaPorId,
    crearReserva,
    actualizarReservaCompleta,
    actualizarReservaParcial,
    eliminarReserva,
    obtenerCantidad,
    obtenerSalasPermitidas,
    obtenerTurnosPermitidos,
    // Alias para compatibilidad total con el controlador web tradicional:
    obtenerTodas: obtenerReservas,
  };
}

module.exports = { crearServicioReservas };
