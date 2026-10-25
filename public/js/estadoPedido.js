const idPedido = Number(parametro('pedido'));
let datos = null; 

document.addEventListener('DOMContentLoaded', cargar);

async function cargar() {
  if (!idPedido) {
    mostrarAviso('error', 'No sabemos qué pedido mostrar.', 'Abre tu pedido desde Mis pedidos.');
    mostrar('cargando', false);
    return;
  }

  try {
    datos = await api('GET', `/pedidos/${idPedido}/pago`);
  } catch (error) {
    mostrar('cargando', false);
    avisoDeError(error);
    return;
  }

  mostrar('cargando', false);
  limpiarAvisos();
  pintarEstado(elegirEstado());
}

function elegirEstado() {
  const pago = datos.pago;

  if (datos.estadoPedido === 'CANCELADO') {
    return 'cancelado'; 
  }
  if (datos.estadoPedido !== 'PENDIENTE_DE_PAGO') {
    return 'pagado'; 
  }
  if (pago.metodo === 'TRANSFERENCIA') {
    return pago.comprobanteURL ? 'comprobante' : 'transferencia'; 
  }
  if (pago.metodo === 'CONTRA_ENTREGA') {
    return 'folio'; 
  }
  if (parametro('resultado') === 'sin_conexion') {
    return 'sin-conexion'; 
  }
  return 'rechazada';
}

function pintarEstado(nombre) {
  const plantilla = document.getElementById('t-' + nombre);
  const vista = document.getElementById('vista');
  vista.replaceChildren(plantilla.content.cloneNode(true));

  vista.querySelectorAll('[data-icono]').forEach((el) => {
    el.innerHTML = icono(el.dataset.icono);
  });
  const lado = vista.querySelector('[data-lado]');
  if (lado) {
    lado.innerHTML = resumen(lado.dataset.lado);
  }

  const llenar = {
    pagado: llenarPagado,
    rechazada: llenarRechazada,
    'sin-conexion': llenarSinConexion,
    transferencia: llenarTransferencia,
    comprobante: llenarComprobante,
    folio: llenarFolio,
    cancelado: llenarCancelado,
  };
  llenar[nombre]();
  window.scrollTo(0, 0);
}

function campo(nombre, texto) {
  document.querySelector(`#vista [data-campo="${nombre}"]`).textContent = texto;
}

function cambiarResultado(resultado) {
  const url = new URL(location.href);
  if (resultado) {
    url.searchParams.set('resultado', resultado);
  } else {
    url.searchParams.delete('resultado');
  }
  history.replaceState(null, '', url);
}


function fechaHora(valor) {
  const f = new Date(valor);
  const dia = f.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dia} · ${hora}`;
}

function fechaLimite() {
  return fechaHora(datos.fechaLimitePago).replace(' · ', ' a las ');
}

function textoEntrega() {
  if (datos.metodoEntrega === 'RECOGER_EN_BOUTIQUE') {
    return 'Recoger en boutique · Centro de Cd. Obregón';
  }
  return datos.direccion ? `Envío a domicilio · ${datos.direccion}` : 'Envío a domicilio';
}

function piezas() {
  return datos.prendas.reduce((suma, p) => suma + p.cantidad, 0);
}


function resumen(tipo) {
  const n = piezas();
  const cuantas = `<span class="rotulo">${n === 1 ? '1 prenda' : n + ' prendas'}</span>`;
  const pendiente = '<span class="estado pendiente">Pendiente de pago</span>';
  const titulos = {
    pagado: `<h2>Tu pedido</h2>${cuantas}`,
    pendiente: `<h2>Pedido ${escapar(datos.numPedido)}</h2>${pendiente}`,
    transferencia: `<h2>Pedido ${escapar(datos.numPedido)}</h2>${pendiente}`,
    cancelado: `<h2>Prendas</h2>${cuantas}`,
  };

  let html = `<div class="cabeza">${titulos[tipo]}</div>`;
  datos.prendas.forEach((p) => {
    html += `
      <div class="mini">${foto(p.categoria, p.imagenURL)}
        <div><b>${escapar(p.nombre)}</b><span class="meta">${talla(p.talla)} · ${escapar(p.color)} · Cant: ${p.cantidad}</span></div>
        <span class="precio">${pesos(p.precioUnitario * p.cantidad)}</span>
      </div>`;
  });

  if (tipo === 'pagado' || tipo === 'transferencia') {
    html += `<div class="totales"><div class="fila"><span>Subtotal</span><span class="mono">${pesos(datos.subtotal)}</span></div>`;
    if (datos.metodoEntrega === 'RECOGER_EN_BOUTIQUE') {
      html += '<div class="fila cortesia"><span>Recoger en boutique</span><span class="mono">GRATIS</span></div>';
    } else {
      const zona = datos.zona ? ` (zona ${escapar(datos.zona)})` : '';
      html += `<div class="fila"><span>Envío${zona}</span><span class="mono">${pesos(datos.costoEnvio)}</span></div>`;
    }
    html += '</div>';
  }

  const etiqueta = tipo === 'pagado' ? 'Total pagado' : 'Total';
  const tachado = tipo === 'cancelado' ? ' class="tachado"' : '';
  html += `<div class="total"><strong>${etiqueta.toUpperCase()}</strong><span${tachado}>${pesos(datos.total)}</span></div>`;
  return html;
}


function llenarPagado() {
  const pago = datos.pago;
  campo('nombre', datos.nombreClienta);
  campo('correo', datos.correoClienta);
  campo('numPedido', datos.numPedido);
  campo('estado', { PAGADO: 'Pagado', ENVIADO: 'Enviado', ENTREGADO: 'Entregado' }[datos.estadoPedido]);
  campo('fechaPago', fechaHora(pago ? pago.fecha : datos.fecha));

  const formas = { TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia', CONTRA_ENTREGA: 'Pago en boutique' };
  let forma = pago ? formas[pago.metodo] : 'Pago';
  const lbPago = leer('lb.pago');
  if (pago && pago.metodo === 'TARJETA' && lbPago && lbPago.terminacion) {
    forma += ' terminación ' + lbPago.terminacion;
  }
  campo('pago', `${forma} · ${pesos(datos.total)}`);
  campo('entrega', textoEntrega());

  if (datos.metodoEntrega === 'RECOGER_EN_BOUTIQUE') {
    campo('aviso', 'Te avisaremos por correo cuando tu pedido esté listo para recoger.');
  } else {
    campo('aviso', 'Te avisaremos por correo cuando tu pedido salga a entrega.');
  }

  borrar('lb.reserva');
}

function llenarRechazada() {
  if (parametro('resultado') !== 'rechazada') {
    campo('titulo', 'Completa el pago de tu pedido');
  }
  const detalle = document.querySelector('#vista [data-campo="detalle"]');
  detalle.innerHTML =
    `No se hizo ningún cargo. Tu pedido <span class="mono">${escapar(datos.numPedido)}</span> está guardado; ` +
    `tienes hasta el <b>${escapar(fechaLimite())}</b> para pagarlo.`;

  document.getElementById('btn-reintentar').textContent = `Reintentar pago · ${pesos(datos.total)}`;
  document.getElementById('form-tarjeta').addEventListener('submit', (e) => {
    e.preventDefault();
    pagarConOtraTarjeta();
  });
  document.getElementById('btn-transferencia').addEventListener('click', () => cambiarForma('TRANSFERENCIA'));
}

async function pagarConOtraTarjeta() {
  limpiarAvisos();
  if (typeof tokenizarTarjeta !== 'function') {
    mostrarAviso('error', 'No se pudo leer la tarjeta.', 'Falta cargar js/tarjeta.js.');
    return;
  }

  let tarjeta;
  try {
    tarjeta = tokenizarTarjeta({
      numero: document.getElementById('numero').value,
      vencimiento: document.getElementById('vencimiento').value,
      cvv: document.getElementById('cvv').value,
      titular: document.getElementById('titular').value,
    });
  } catch (error) {
    mostrarAviso('error', 'Revisa los datos de la tarjeta.', error.message);
    return;
  }

  guardar('lb.pago', { formaPago: 'TARJETA', tokenTarjeta: tarjeta.tokenTarjeta, terminacion: tarjeta.terminacion });
  await cobrar(tarjeta.tokenTarjeta, document.getElementById('btn-reintentar'));
}

async function cobrar(tokenTarjeta, boton) {
  const texto = boton.textContent;
  boton.disabled = true;
  boton.textContent = 'Procesando pago…';

  try {
    await api('POST', `/pedidos/${idPedido}/pago/tarjeta`, { tokenTarjeta });
    cambiarResultado(null);
  } catch (error) {
    boton.disabled = false;
    boton.textContent = texto;
    if (error.error === 'PagoRechazadoError') {
      cambiarResultado('rechazada');
    } else if (error.error === 'PasarelaNoDisponibleError') {
      cambiarResultado('sin_conexion');
    } else {
      avisoDeError(error);
      return;
    }
  }
  await cargar();
  if (parametro('resultado') === 'rechazada') {
    mostrarAviso('error', 'Tu banco volvió a rechazar el pago.', 'Prueba con otra tarjeta o paga con transferencia.');
  }
}

async function cambiarForma(formaPago) {
  limpiarAvisos();
  try {
    await api('PUT', `/pedidos/${idPedido}/pago/forma`, { formaPago });
  } catch (error) {
    avisoDeError(error);
    return;
  }
  borrar('lb.pago');
  cambiarResultado(null);
  await cargar();
}

function llenarSinConexion() {
  const detalle = document.querySelector('#vista [data-campo="detalle"]');
  detalle.innerHTML =
    `El servicio de pagos no respondió. No se hizo ningún cargo y tu pedido <span class="mono">${escapar(datos.numPedido)}</span> está guardado. ` +
    `Intenta de nuevo en unos minutos o elige otra forma de pago. Tienes hasta el ${escapar(fechaLimite())}.`;

  if (datos.metodoEntrega !== 'RECOGER_EN_BOUTIQUE') {
    document.querySelector('#vista input[value="CONTRA_ENTREGA"]').disabled = true;
    campo('ayudaContraEntrega', 'Solo si recoges tu pedido en la boutique');
  }

  document.getElementById('btn-reintentar-token').addEventListener('click', (e) => {
    const lbPago = leer('lb.pago');
    if (lbPago && lbPago.tokenTarjeta) {
      cobrar(lbPago.tokenTarjeta, e.currentTarget);
    } else {
      cambiarResultado(null);
      pintarEstado('rechazada');
    }
  });
  document.getElementById('btn-cambiar').addEventListener('click', () => {
    mostrar('cambiar-forma', true);
    document.getElementById('cambiar-forma').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  document.getElementById('btn-confirmar-forma').addEventListener('click', () => {
    const forma = document.querySelector('#vista input[name="forma"]:checked').value;
    if (forma === 'TARJETA') {
      cambiarResultado(null);
      pintarEstado('rechazada');
      return;
    }
    cambiarForma(forma);
  });
}

const TIPOS_COMPROBANTE = { 'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WEBP', 'application/pdf': 'PDF' };
const MAXIMO_BYTES = 5 * 1024 * 1024;
let archivoElegido = null;

function llenarTransferencia() {
  const ins = datos.instrucciones;
  campo('limite', fechaLimite());
  campo('banco', ins.banco || 'Banco de la boutique');
  campo('clabe', ins.clabe || '—');
  campo('monto', `${pesos(ins.monto)} MXN`);
  campo('concepto', ins.concepto);

  archivoElegido = null;
  const input = document.getElementById('archivo');
  input.addEventListener('change', () => elegirArchivo(input.files[0]));

  const zona = document.getElementById('zona-subir');
  zona.addEventListener('dragover', (e) => e.preventDefault());
  zona.addEventListener('drop', (e) => {
    e.preventDefault();
    elegirArchivo(e.dataTransfer.files[0]);
  });

  document.getElementById('btn-otro-archivo').addEventListener('click', () => input.click());
  document.getElementById('referencia').addEventListener('input', () => {
    document.getElementById('campo-referencia').classList.remove('error');
    mostrar('ayuda-referencia', false);
  });
  document.getElementById('form-comprobante').addEventListener('submit', (e) => {
    e.preventDefault();
    enviarComprobante();
  });
}

function elegirArchivo(archivo) {
  if (!archivo) {
    return;
  }
  limpiarAvisos();
  if (!TIPOS_COMPROBANTE[archivo.type]) {
    mostrarAviso('error', 'Ese archivo no sirve.', 'El comprobante debe ser una imagen (JPG, PNG o WEBP) o un PDF.');
    return;
  }
  if (archivo.size > MAXIMO_BYTES) {
    mostrarAviso('error', 'El archivo es muy grande.', 'El comprobante debe pesar máximo 5 MB.');
    return;
  }

  archivoElegido = archivo;
  document.getElementById('archivo-ext').textContent = TIPOS_COMPROBANTE[archivo.type];
  document.getElementById('archivo-nombre').textContent = archivo.name;
  mostrar('zona-subir', false);
  mostrar('archivo-elegido', true);
}

async function enviarComprobante() {
  limpiarAvisos();
  const referencia = document.getElementById('referencia').value.trim();
  if (!referencia) {
    document.getElementById('campo-referencia').classList.add('error');
    mostrar('ayuda-referencia', true);
    mostrarAviso('error', 'Falta el número de referencia.', 'Lo encuentras en el comprobante que te dio tu banco.');
    return;
  }
  if (!archivoElegido) {
    mostrarAviso('error', 'Falta tu comprobante.', 'Sube una imagen o PDF de tu transferencia.');
    return;
  }

  const formulario = new FormData();
  formulario.append('numeroReferencia', referencia);
  formulario.append('comprobante', archivoElegido);

  const boton = document.getElementById('btn-enviar');
  boton.disabled = true;
  boton.textContent = 'Enviando…';
  try {
    await api('POST', `/pedidos/${idPedido}/pago/comprobante`, formulario);
  } catch (error) {
    boton.disabled = false;
    boton.textContent = 'Enviar comprobante';
    avisoDeError(error);
    return;
  }
  await cargar(); 
}


function llenarComprobante() {
  const pago = datos.pago;
  campo('correo', datos.correoClienta);
  campo('numPedido', datos.numPedido);
  campo('referencia', pago.numeroReferencia || '—');

  
  const extension = pago.comprobanteURL.slice(pago.comprobanteURL.lastIndexOf('.'));
  const enlace = document.querySelector('#vista [data-campo="comprobante"]');
  enlace.textContent = `comprobante-${datos.numPedido}${extension}`;
  enlace.href = pago.comprobanteURL;
}

function llenarFolio() {
  campo('folio', datos.pago.folio);
  campo('detalle', `Pedido ${datos.numPedido} · Total ${pesos(datos.total)}`);
  campo('limite', `Recógelo antes del ${fechaLimite()}.`);
  const prenda = piezas() === 1 ? 'la prenda regresa' : 'las prendas regresan';
  campo('consecuencia', `Si no pasas por él, el pedido se cancela y ${prenda} al inventario.`);
}

function llenarCancelado() {
  const pago = datos.pago;
  campo('correo', datos.correoClienta);
  campo('numPedido', datos.numPedido);
  campo('fecha', fechaHora(datos.fecha));
  campo('limite', datos.fechaLimitePago ? fechaHora(datos.fechaLimitePago) : '—');

  let forma = '—';
  if (pago && pago.metodo === 'TRANSFERENCIA') {
    forma = pago.comprobanteURL ? 'Transferencia' : 'Transferencia (sin comprobante)';
  } else if (pago && pago.metodo === 'TARJETA') {
    forma = 'Tarjeta';
  } else if (pago && pago.metodo === 'CONTRA_ENTREGA') {
    forma = `Pago en boutique · ${pago.folio}`;
  }
  campo('forma', forma);
}