// Bolsa de compra: ver, cambiar cantidad, eliminar y proceder al pago.
let carrito = null;
// idDetallePedido -> piezas que si hay, cuando no alcanza la existencia (2.2.6-A).
let sinExistencia = {};

document.addEventListener('DOMContentLoaded', iniciar);

async function iniciar() {
  document.getElementById('ico-vacia').innerHTML = icono('bolsa');
  document.getElementById('ico-atras').innerHTML = icono('atras');
  document.getElementById('ico-flecha').innerHTML = icono('flecha');
  document.getElementById('btn-proceder').addEventListener('click', procederAlPago);

  // 2.2.9: venimos de otra pagina porque la reserva vencio.
  if (parametro('reserva') === 'vencida') {
    borrar('lb.reserva');
    mostrarAviso(
      'alerta',
      'Se terminó el tiempo para completar tu compra.',
      'Liberamos las prendas que tenías apartadas; tu bolsa sigue aquí. Vuelve a proceder al pago para apartarlas otra vez.',
    );
  }

  try {
    carrito = await api('GET', '/carrito');
  } catch (error) {
    avisoDeError(error);
    return;
  }
  pintar();
}

function pintar() {
  // 2.2.6-B: sin prendas no se puede seguir.
  if (!carrito || carrito.detalles.length === 0) {
    mostrar('vista-bolsa', false);
    mostrar('vista-vacia', true);
    return;
  }
  mostrar('vista-vacia', false);
  mostrar('vista-bolsa', true);

  let piezas = 0;
  let html = '';
  carrito.detalles.forEach((d) => {
    piezas += d.cantidad;
    const hay = sinExistencia[d.idDetallePedido];
    const falta = hay !== undefined && d.cantidad > hay;
    let nota = '';
    if (falta) {
      nota = `<p class="nota-error">Pediste ${d.cantidad} y solo ${hay === 1 ? 'hay 1 disponible' : `hay ${hay} disponibles`}.</p>`;
    }
    html += `
      <div class="item${falta ? ' error' : ''}">
        ${foto(d.categoria, d.imagenURL)}
        <div>
          <h3>${escapar(d.nombre)}</h3>
          <p class="meta">Talla: ${talla(d.talla)} · Color: ${escapar(d.color)}</p>
          <p class="meta mono">${pesos(d.precioUnitario)} c/u</p>
          <div class="cant">
            <button type="button" onclick="cambiarCantidad(${d.idDetallePedido}, ${d.cantidad - 1})" aria-label="Quitar una">−</button>
            <b>${d.cantidad}</b>
            <button type="button" onclick="cambiarCantidad(${d.idDetallePedido}, ${d.cantidad + 1})" aria-label="Agregar una">+</button>
          </div>
          ${nota}
        </div>
        <div class="der">
          <button type="button" class="quitar" onclick="eliminar(${d.idDetallePedido})" aria-label="Eliminar">×</button>
          <div><p class="rotulo" style="text-align:right">Subtotal</p><p class="precio">${pesos(d.precioUnitario * d.cantidad)}</p></div>
        </div>
      </div>`;
  });
  document.getElementById('prendas').innerHTML = html;

  const texto = piezas === 1 ? '1 prenda' : `${piezas} prendas`;
  document.getElementById('cuantas').textContent = texto;
  document.getElementById('cuantas-resumen').textContent = texto;
  document.getElementById('subtotal').textContent = pesos(carrito.subtotal);
  document.getElementById('total').textContent = pesos(carrito.subtotal);

  // 02-C: mientras haya una prenda marcada no se puede proceder.
  const hayError = carrito.detalles.some((d) => {
    const hay = sinExistencia[d.idDetallePedido];
    return hay !== undefined && d.cantidad > hay;
  });
  document.getElementById('btn-proceder').disabled = hayError;
  document.getElementById('nota-proceder').textContent = hayError
    ? 'Corrige la cantidad marcada para continuar.'
    : 'Al continuar apartamos tus prendas por 15 minutos mientras terminas tu compra.';
  actualizarBolsa();
}

// 2.2.1: cambiar cantidad. Con 0 el servidor elimina la prenda.
async function cambiarCantidad(idDetallePedido, cantidad) {
  limpiarAvisos();
  try {
    carrito = await api('PATCH', `/carrito/prendas/${idDetallePedido}`, { cantidad });
  } catch (error) {
    avisoDeError(error);
    return;
  }
  pintar();
}

async function eliminar(idDetallePedido) {
  limpiarAvisos();
  try {
    carrito = await api('DELETE', `/carrito/prendas/${idDetallePedido}`);
  } catch (error) {
    avisoDeError(error);
    return;
  }
  pintar();
}

// Paso 6: validar existencia y apartar las prendas 15 minutos.
async function procederAlPago() {
  limpiarAvisos();
  const boton = document.getElementById('btn-proceder');
  boton.disabled = true;

  try {
    const respuesta = await api('POST', '/carrito/proceder-al-pago');
    guardar('lb.reserva', { expiraEn: respuesta.expiraEn });
    location.assign('direccionEntrega.html');
  } catch (error) {
    boton.disabled = false;
    if (error.error === 'SinExistenciaError') {
      marcarSinExistencia(error.message);
      mostrarAviso(
        'error',
        'Una prenda ya no tiene suficiente existencia.',
        'Ajusta la cantidad o elimínala para continuar. No apartamos nada todavía.',
      );
      pintar();
      return;
    }
    if (error.error === 'CarritoVacioError') {
      carrito = null;
      pintar();
      return;
    }
    avisoDeError(error);
  }
}

// El servidor responde "Solo quedan N piezas de <nombre> talla <talla> color <color>".
function marcarSinExistencia(mensaje) {
  const hay = Number((mensaje.match(/Solo quedan (\d+)/) || [])[1] || 0);
  carrito.detalles.forEach((d) => {
    if (mensaje.endsWith(`${d.nombre} talla ${d.talla} color ${d.color}`)) {
      sinExistencia[d.idDetallePedido] = hay;
    }
  });
}
