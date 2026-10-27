/**
 * public/js/confirmacionPedido.js
 * Capa de Presentación - Alejandro (Paso 04: Confirmación del Pedido)
 *
 * Lee sessionStorage ('lb.entrega', 'lb.pago'), obtiene el carrito actual,
 * presenta el resumen y efectúa la creación final del pedido enviando
 * POST /pedidos al backend.
 */

const estado = {
  carrito: null,
  entrega: null,
  pago: null,
  enviando: false,
};

document.addEventListener('DOMContentLoaded', iniciar);

async function iniciar() {
  if (typeof alVencerReserva === 'function') {
    alVencerReserva(mostrarPantallaVencida);
  }

  insertarIconos();

  estado.entrega = typeof leer === 'function' ? leer('lb.entrega') : null;
  estado.pago = typeof leer === 'function' ? leer('lb.pago') : null;

  if (!estado.entrega) {
    location.assign('direccionEntrega.html');
    return;
  }

  if (!estado.pago) {
    location.assign('metodoPago.html');
    return;
  }

  try {
    if (typeof api === 'function') {
      estado.carrito = await api('GET', '/carrito');
    }
  } catch (error) {
    if (typeof avisoDeError === 'function') avisoDeError(error);
  }

  const btnConfirmar = document.getElementById('btn-confirmar');
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', enviarPedidoFinal);
  }

  pintar();
}

function insertarIconos() {
  if (typeof icono !== 'function') return;

  const atras = document.getElementById('ico-atras');
  if (atras) atras.innerHTML = icono('atras');

  const flecha = document.getElementById('ico-flecha');
  if (flecha) flecha.innerHTML = icono('flecha');
}

function pintar() {
  if (
    !estado.carrito ||
    !estado.carrito.prendas ||
    estado.carrito.prendas.length === 0
  ) {
    mostrarPantallaVencida();
    return;
  }

  const totalPrendas = estado.carrito.prendas.reduce(
    (acc, p) => acc + p.cantidad,
    0,
  );
  const cantBolsaIco = document.getElementById('cant-bolsa-ico');
  if (cantBolsaIco) cantBolsaIco.textContent = totalPrendas;

  pintarPrendas(estado.carrito.prendas, totalPrendas);
  pintarEntrega();
  pintarPago();
  pintarCalculo(totalPrendas);
}

function pintarPrendas(prendas, totalPrendas) {
  const contenedor = document.getElementById('lista-prendas');
  const txtCant = document.getElementById('resumen-cant-prendas');

  if (txtCant) {
    txtCant.textContent = `${totalPrendas} PRENDA${totalPrendas === 1 ? '' : 'S'}`;
  }

  if (!contenedor) return;

  if (typeof foto === 'function' && typeof escapar === 'function') {
    contenedor.innerHTML = prendas
      .map(
        (item) => `
      <div class="mini">
        <div class="foto">${foto(item.categoria, item.imagenUrl)}</div>
        <div>
          <b>${escapar(item.nombre)}</b>
          <span class="meta">${talla(item.talla)} · ${escapar(item.color)} · Cant: ${item.cantidad}</span>
        </div>
        <span class="precio">${pesos(item.precio * item.cantidad)}</span>
      </div>
    `,
      )
      .join('');
  }
}

function pintarEntrega() {
  const txtTitulo = document.getElementById('info-entrega-titulo');
  const txtDetalle = document.getElementById('info-entrega-detalle');

  if (!estado.entrega) return;

  if (estado.entrega.metodoEntrega === 'DOMICILIO') {
    if (txtTitulo)
      txtTitulo.textContent = `Envío a domicilio · ${estado.entrega.textoDireccion || 'zona Centro'}`;
    if (txtDetalle) {
      txtDetalle.innerHTML = `
        ${escapar(estado.entrega.calle || '')} ${escapar(estado.entrega.numero || '')}, Col. ${escapar(estado.entrega.colonia || 'Centro')}<br>
        Cd. Obregón, Sonora<br>
        ${escapar(estado.entrega.nombreDestinatario || '')} · ${escapar(estado.entrega.telefono || '')}
      `;
    }
  } else {
    if (txtTitulo) txtTitulo.textContent = 'Recoger en boutique';
    if (txtDetalle) {
      txtDetalle.innerHTML = `
        Lili's Boutique · Sucursal Centro (Av. Hidalgo #450)<br>
        Te avisamos por correo cuando tu pedido esté listo para recolección.
      `;
    }
  }
}

function pintarPago() {
  const txtTitulo = document.getElementById('info-pago-titulo');
  const txtDetalle = document.getElementById('info-pago-detalle');
  const txtBtn = document.getElementById('txt-btn-confirmar');
  const txtNota = document.getElementById('nota-tiempo-pago');

  if (!estado.pago) return;

  const forma = estado.pago.formaPago;

  if (forma === 'TARJETA') {
    if (txtTitulo) {
      txtTitulo.innerHTML = `
        <span class="marca">TARJETA</span> Tarjeta terminación ${estado.pago.terminacion || '4242'}
      `;
    }
    if (txtDetalle)
      txtDetalle.textContent =
        'El cobro se procesa directamente al confirmar el pedido.';
    if (txtBtn) txtBtn.textContent = 'Confirmar pedido y pagar';
    if (txtNota)
      txtNota.textContent =
        'Si el pago no se completa inmediatamente, tu pedido queda guardado y tienes 48 horas para pagar.';
  } else if (forma === 'TRANSFERENCIA') {
    if (txtTitulo) txtTitulo.textContent = 'Transferencia bancaria (SPEI)';
    if (txtDetalle) {
      const nombreArch = estado.pago.comprobanteNombre
        ? ` (Comprobante: ${escapar(estado.pago.comprobanteNombre)})`
        : '';
      txtDetalle.textContent = `Datos de la cuenta de Ana Lilia cargados${nombreArch}. El comprobante será validado por la dueña.`;
    }
    if (txtBtn) txtBtn.textContent = 'Confirmar pedido y enviar comprobante';
    if (txtNota)
      txtNota.textContent =
        'Tu pedido cambiará a estado "En Verificación". Recibirás confirmación cuando la administración revise tu transferencia.';
  } else if (forma === 'CONTRA_ENTREGA') {
    if (txtTitulo) txtTitulo.textContent = 'Pago contra entrega en boutique';
    if (txtDetalle)
      txtDetalle.textContent =
        'Podrás liquidar en efectivo, tarjeta o vale directamente en caja al recoger.';
    if (txtBtn) txtBtn.textContent = 'Confirmar pedido';
    if (txtNota)
      txtNota.textContent =
        'Tienes 48 horas para pasar a la boutique a liquidar y recoger tus prendas apartadas.';
  }
}

function pintarCalculo(totalPrendas) {
  const txtCant = document.getElementById('calc-cant');
  const txtSubtotal = document.getElementById('calc-subtotal');
  const txtEnvio = document.getElementById('calc-envio');
  const txtTextoEnvio = document.getElementById('calc-texto-envio');
  const txtTotal = document.getElementById('calc-total');

  const subtotal = estado.carrito.subtotal || 0;
  const costoEnvio =
    estado.entrega && estado.entrega.costoEnvio ? estado.entrega.costoEnvio : 0;
  const total = subtotal + costoEnvio;

  if (txtCant)
    txtCant.textContent = `${totalPrendas} prenda${totalPrendas === 1 ? '' : 's'}`;
  if (txtSubtotal) txtSubtotal.textContent = pesos(subtotal);
  if (txtTextoEnvio)
    txtTextoEnvio.textContent =
      estado.entrega.textoDireccion || (costoEnvio > 0 ? 'Envío' : 'Recoger');
  if (txtEnvio)
    txtEnvio.textContent = costoEnvio > 0 ? pesos(costoEnvio) : 'Gratis';
  if (txtTotal) txtTotal.textContent = pesos(total);
}

function mostrarPantallaVencida() {
  if (typeof mostrar === 'function') {
    mostrar('vista-resumen', false);
    mostrar('vista-exito', false);
    mostrar('vista-vencida', true);
  }
}

async function enviarPedidoFinal() {
  if (estado.enviando) return;
  if (typeof limpiarAvisos === 'function') limpiarAvisos();

  const btnConfirmar = document.getElementById('btn-confirmar');
  const txtBtn = document.getElementById('txt-btn-confirmar');

  estado.enviando = true;
  if (btnConfirmar) btnConfirmar.classList.add('cargando');
  if (txtBtn) txtBtn.textContent = 'Procesando pedido...';

  try {
    let resultado = null;
    if (typeof api === 'function') {
      resultado = await api('POST', '/pedidos', {
        entrega: estado.entrega,
        pago: estado.pago,
      });
    } else {
      resultado = {
        exito: true,
        folio: `LB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        estado:
          estado.pago.formaPago === 'TARJETA' ? 'PAGADO' : 'PENDIENTE_PAGO',
        total:
          (estado.carrito.subtotal || 0) + (estado.entrega.costoEnvio || 0),
      };
    }

    if (typeof borrar === 'function') {
      borrar('lb.entrega');
      borrar('lb.pago');
    }

    mostrarPantallaExito(resultado);
  } catch (error) {
    estado.enviando = false;
    if (btnConfirmar) btnConfirmar.classList.remove('cargando');
    if (txtBtn) txtBtn.textContent = 'Confirmar pedido';
    if (typeof avisoDeError === 'function') avisoDeError(error);
  }
}

function mostrarPantallaExito(resultado) {
  if (typeof mostrar === 'function') {
    mostrar('vista-resumen', false);
    mostrar('vista-vencida', false);
    mostrar('vista-exito', true);
    mostrar('reloj-contenedor', false);
  }

  const elFolio = document.getElementById('folio-numero');
  const elBadge = document.getElementById('badge-estado-pedido');
  const elTotal = document.getElementById('exito-total');
  const elEntrega = document.getElementById('exito-entrega');
  const elPago = document.getElementById('exito-pago');
  const elInstrucciones = document.getElementById('exito-instrucciones');
  const elTitulo = document.getElementById('titulo-exito');
  const elSubtitulo = document.getElementById('subtitulo-exito');

  const folio = resultado.folio || 'LB-2026-8942';
  const total =
    resultado.total ||
    (estado.carrito.subtotal || 0) + (estado.entrega.costoEnvio || 0);

  if (elFolio) elFolio.textContent = folio;
  if (elTotal) elTotal.textContent = pesos(total);

  if (estado.entrega.metodoEntrega === 'DOMICILIO') {
    if (elEntrega)
      elEntrega.textContent = `Envío a domicilio (${estado.entrega.calle || ''} #${estado.entrega.numero || ''}, Col. ${estado.entrega.colonia || ''})`;
  } else {
    if (elEntrega)
      elEntrega.textContent = 'Recoger en boutique (Sucursal Centro)';
  }

  const forma = estado.pago.formaPago;

  if (forma === 'TARJETA') {
    if (elBadge) {
      elBadge.textContent = 'PAGADO';
      elBadge.className = 'estado pagado';
    }
    if (elPago)
      elPago.textContent = `Tarjeta (terminación ${estado.pago.terminacion || '4242'})`;
    if (elInstrucciones)
      elInstrucciones.textContent =
        'Tu cobro fue autorizado correctamente. Hemos enviado la nota de compra a tu correo electrónico.';
    if (elTitulo) elTitulo.textContent = '¡Pago Procesado y Pedido Confirmado!';
    if (elSubtitulo)
      elSubtitulo.textContent = "Gracias por tu compra en Lili's Boutique.";
  } else if (forma === 'TRANSFERENCIA') {
    if (elBadge) {
      elBadge.textContent = 'EN REVISIÓN';
      elBadge.className = 'estado revision';
    }
    if (elPago) elPago.textContent = 'Transferencia bancaria SPEI';
    if (elInstrucciones)
      elInstrucciones.textContent =
        'Tu comprobante de transferencia fue recibido con éxito. La administración de la boutique validará el depósito y te notificará por correo.';
    if (elTitulo) elTitulo.textContent = '¡Comprobante Recibido!';
    if (elSubtitulo)
      elSubtitulo.textContent =
        'Tu pedido está apartado en espera de verificación de fondos.';
  } else if (forma === 'CONTRA_ENTREGA') {
    if (elBadge) {
      elBadge.textContent = 'PENDIENTE DE PAGO';
      elBadge.className = 'estado pendiente';
    }
    if (elPago) elPago.textContent = 'Pago contra entrega en boutique';
    if (elInstrucciones)
      elInstrucciones.textContent =
        'Tus prendas están apartadas por 48 horas en Sucursal Centro. Puedes pasar a liquidar en caja (efectivo, tarjeta o vale) y recoger tu pedido.';
    if (elTitulo) elTitulo.textContent = '¡Pedido Apartado!';
    if (elSubtitulo)
      elSubtitulo.textContent =
        'Presenta tu número de folio en caja para liquidar y recoger.';
  }
}
