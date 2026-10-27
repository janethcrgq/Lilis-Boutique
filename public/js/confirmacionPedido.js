/**
 * public/js/confirmacionPedido.js
 * Capa de Presentación - Alejandro (Paso 04: Confirmación del Pedido)
 *
 * Lee sessionStorage ('lb.entrega', 'lb.pago'), obtiene el carrito actual,
 * presenta el resumen y confirma el pedido con POST /pedidos/confirmar.
 * Si se paga con tarjeta, cobra en seguida y manda a estadoPedido.html.
 */

const estado = {
  carrito: null,
  entrega: null,
  pago: null,
  enviando: false,
};

document.addEventListener('DOMContentLoaded', iniciar);

async function iniciar() {
  alVencerReserva(mostrarPantallaVencida);

  insertarIconos();

  estado.entrega = leer('lb.entrega');
  estado.pago = leer('lb.pago');

  if (!estado.entrega) {
    location.assign('direccionEntrega.html');
    return;
  }

  if (!estado.pago) {
    location.assign('metodoPago.html');
    return;
  }

  try {
    estado.carrito = await api('GET', '/carrito');
  } catch (error) {
    avisoDeError(error);
    return;
  }

  if (!estado.carrito || estado.carrito.detalles.length === 0) {
    location.assign('bolsaCompra.html');
    return;
  }

  const btnConfirmar = document.getElementById('btn-confirmar');
  btnConfirmar.addEventListener('click', enviarPedidoFinal);

  pintar();
}

function insertarIconos() {
  const atras = document.getElementById('ico-atras');
  if (atras) atras.innerHTML = icono('atras');

  const flecha = document.getElementById('ico-flecha');
  if (flecha) flecha.innerHTML = icono('flecha');
}

function pintar() {
  const totalPrendas = estado.carrito.detalles.reduce(
    (acc, p) => acc + p.cantidad,
    0,
  );

  pintarPrendas(estado.carrito.detalles, totalPrendas);
  pintarEntrega();
  pintarPago();
  pintarCalculo(totalPrendas);
}

function pintarPrendas(prendas, totalPrendas) {
  const contenedor = document.getElementById('lista-prendas');
  const txtCant = document.getElementById('resumen-cant-prendas');

  txtCant.textContent = `${totalPrendas} PRENDA${totalPrendas === 1 ? '' : 'S'}`;

  contenedor.innerHTML = prendas
    .map(
      (item) => `
      <div class="mini">
        ${foto(item.categoria, item.imagenURL)}
        <div>
          <b>${escapar(item.nombre)}</b>
          <span class="meta">${talla(item.talla)} · ${escapar(item.color)} · Cant: ${item.cantidad}</span>
        </div>
        <span class="precio">${pesos(item.precioUnitario * item.cantidad)}</span>
      </div>
    `,
    )
    .join('');
}

function pintarEntrega() {
  const txtTitulo = document.getElementById('info-entrega-titulo');
  const txtDetalle = document.getElementById('info-entrega-detalle');

  if (estado.entrega.metodoEntrega === 'DOMICILIO') {
    txtTitulo.textContent = 'Envío a domicilio';
    txtDetalle.textContent = `${estado.entrega.textoDireccion || ''} · Cd. Obregón, Sonora`;
  } else {
    txtTitulo.textContent = 'Recoger en boutique';
    txtDetalle.textContent =
      'Centro de Cd. Obregón. Te avisamos por correo cuando tu pedido esté listo.';
  }
}

function pintarPago() {
  const txtTitulo = document.getElementById('info-pago-titulo');
  const txtDetalle = document.getElementById('info-pago-detalle');
  const txtBtn = document.getElementById('txt-btn-confirmar');
  const txtNota = document.getElementById('nota-tiempo-pago');

  const forma = estado.pago.formaPago;

  if (forma === 'TARJETA') {
    txtTitulo.innerHTML = `
      <span class="marca">TARJETA</span> Tarjeta terminación ${escapar(estado.pago.terminacion)}
    `;
    txtDetalle.textContent = 'El cobro se procesa al confirmar el pedido.';
    txtBtn.textContent = 'Confirmar pedido y pagar';
    txtNota.textContent =
      'Si el pago no se completa, tu pedido queda guardado y tienes 48 horas para pagar.';
  } else if (forma === 'TRANSFERENCIA') {
    txtTitulo.textContent = 'Transferencia bancaria (SPEI)';
    txtDetalle.textContent =
      'Al confirmar te damos los datos para transferir; el comprobante lo subes desde tu pedido.';
    txtBtn.textContent = 'Confirmar pedido';
    txtNota.textContent =
      'Tienes 48 horas para transferir. La dueña revisa tu comprobante y te avisamos por correo.';
  } else if (forma === 'CONTRA_ENTREGA') {
    txtTitulo.textContent = 'Pago en la boutique';
    txtDetalle.textContent =
      'Al confirmar te damos un folio para pagar en caja al recoger.';
    txtBtn.textContent = 'Confirmar pedido';
    txtNota.textContent =
      'Tienes 48 horas para pasar a la boutique a pagar y recoger tus prendas.';
  }
}

function pintarCalculo(totalPrendas) {
  const txtCant = document.getElementById('calc-cant');
  const txtSubtotal = document.getElementById('calc-subtotal');
  const txtEnvio = document.getElementById('calc-envio');
  const txtTextoEnvio = document.getElementById('calc-texto-envio');
  const txtTotal = document.getElementById('calc-total');

  const subtotal = estado.carrito.subtotal;
  const costoEnvio = estado.entrega.costoEnvio || 0;
  const total = subtotal + costoEnvio;

  txtCant.textContent = `${totalPrendas} prenda${totalPrendas === 1 ? '' : 's'}`;
  txtSubtotal.textContent = pesos(subtotal);
  txtTextoEnvio.textContent =
    estado.entrega.metodoEntrega === 'DOMICILIO' ? 'a domicilio' : 'recoger';
  txtEnvio.textContent = costoEnvio > 0 ? pesos(costoEnvio) : 'Gratis';
  txtTotal.textContent = pesos(total);
}

function mostrarPantallaVencida() {
  mostrar('vista-resumen', false);
  mostrar('vista-vencida', true);
}

async function enviarPedidoFinal() {
  if (estado.enviando) return;
  limpiarAvisos();

  const btnConfirmar = document.getElementById('btn-confirmar');
  const txtBtn = document.getElementById('txt-btn-confirmar');
  const textoOriginal = txtBtn.textContent;

  estado.enviando = true;
  btnConfirmar.classList.add('cargando');
  txtBtn.textContent = 'Procesando pedido...';

  // Pasos 17-18: el pedido pasa a PENDIENTE_DE_PAGO con su folio.
  const datos = {
    metodoEntrega: estado.entrega.metodoEntrega,
    formaPago: estado.pago.formaPago,
  };
  if (estado.entrega.metodoEntrega === 'DOMICILIO') {
    datos.idDireccion = estado.entrega.idDireccion;
  }

  let idPedido;
  try {
    const resultado = await api('POST', '/pedidos/confirmar', datos);
    idPedido = resultado.pedido.idPedido;
  } catch (error) {
    estado.enviando = false;
    btnConfirmar.classList.remove('cargando');
    txtBtn.textContent = textoOriginal;
    if (error.error === 'ReservaVencidaError') {
      mostrarPantallaVencida();
      return;
    }
    avisoDeError(error);
    return;
  }

  // Pasos 19-21: con tarjeta se cobra en seguida.
  let resultadoPago = '';
  if (estado.pago.formaPago === 'TARJETA') {
    txtBtn.textContent = 'Procesando pago...';
    try {
      await api('POST', `/pedidos/${idPedido}/pago/tarjeta`, {
        tokenTarjeta: estado.pago.tokenTarjeta,
      });
    } catch (error) {
      if (error.error === 'PagoRechazadoError') {
        resultadoPago = 'rechazada'; // 2.2.5
      } else if (error.error === 'PasarelaNoDisponibleError') {
        resultadoPago = 'sin_conexion'; // 2.2.7
      }
    }
  }

  // lb.pago se queda para que estadoPedido muestre la terminación de la tarjeta.
  borrar('lb.entrega');
  borrar('lb.reserva');

  let url = `estadoPedido.html?pedido=${idPedido}`;
  if (resultadoPago) {
    url += `&resultado=${resultadoPago}`;
  }
  location.assign(url);
}
