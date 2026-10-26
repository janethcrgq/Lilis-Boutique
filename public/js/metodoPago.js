/**
 * public/js/metodoPago.js
 * Capa de Presentación - Alejandro (Paso 03: Método de Pago)
 */

const estado = {
  carrito: null,
  entrega: null,
  formaPago: 'TARJETA', // 'TARJETA', 'TRANSFERENCIA', 'CONTRA_ENTREGA'
  comprobanteArchivo: null
};

document.addEventListener('DOMContentLoaded', iniciar);

async function iniciar() {
  if (typeof alVencerReserva === 'function') {
    alVencerReserva(() => location.assign('bolsaCompra.html?reserva=vencida'));
  }

  if (typeof icono === 'function') {
    insertarIconos();
  }

  estado.entrega = typeof leer === 'function' ? leer('lb.entrega') : null;
  if (!estado.entrega) {
    location.assign('direccionEntrega.html');
    return;
  }

  try {
    if (typeof api === 'function') {
      estado.carrito = await api('GET', '/carrito');
    }
  } catch (error) {
    if (typeof avisoDeError === 'function') avisoDeError(error);
  }

  configurarSelectorMetodoPago();
  configurarCamposTarjeta();
  configurarSubidaComprobante();
  configurarBotonesCopiar();

  const btnContinuar = document.getElementById('btn-continuar');
  if (btnContinuar) {
    btnContinuar.addEventListener('click', continuarAConfirmacion);
  }

  pintar();
}

function insertarIconos() {
  const candado = document.getElementById('ico-candado');
  if (candado) candado.innerHTML = icono('candado');

  const atras = document.getElementById('ico-atras');
  if (atras) atras.innerHTML = icono('atras');

  const flecha = document.getElementById('ico-flecha');
  if (flecha) flecha.innerHTML = icono('flecha');

  const subir = document.getElementById('ico-subir');
  if (subir) subir.innerHTML = icono('subir');
}

function pintar() {
  const inputContraEntrega = document.getElementById('radio-contra-entrega');
  const opcionContraEntrega = document.getElementById('opcion-contra-entrega');

  if (estado.entrega && estado.entrega.metodoEntrega === 'DOMICILIO') {
    if (inputContraEntrega) inputContraEntrega.disabled = true;
    if (opcionContraEntrega) opcionContraEntrega.classList.add('deshabilitado');
  }

  actualizarFormularios();
  pintarResumen();
}

function configurarSelectorMetodoPago() {
  const opciones = document.querySelectorAll('.opcion');

  opciones.forEach((opcion) => {
    opcion.addEventListener('click', () => {
      if (opcion.classList.contains('deshabilitado')) return;

      const radio = opcion.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        estado.formaPago = radio.value;
        actualizarFormularios();
      }
    });
  });
}

function actualizarFormularios() {
  if (typeof mostrar === 'function') {
    mostrar('form-tarjeta', estado.formaPago === 'TARJETA');
    mostrar('form-transferencia', estado.formaPago === 'TRANSFERENCIA');
    mostrar('form-contra-entrega', estado.formaPago === 'CONTRA_ENTREGA');
  }

  document.querySelectorAll('.opcion').forEach(op => op.classList.remove('sel'));
  const idActiva = `opcion-${estado.formaPago.toLowerCase().replace('_', '-')}`;
  const opcionActiva = document.getElementById(idActiva);
  if (opcionActiva) opcionActiva.classList.add('sel');
}

function pintarResumen() {
  const contenedor = document.getElementById('resumen-prendas');
  const txtCant = document.getElementById('resumen-cant-prendas');
  const txtSubtotal = document.getElementById('resumen-subtotal');
  const txtEnvio = document.getElementById('resumen-envio');
  const txtTextoEnvio = document.getElementById('resumen-texto-entrega');
  const txtTotal = document.getElementById('resumen-total');

  if (!estado.carrito || !contenedor) return;

  const { prendas, subtotal } = estado.carrito;
  const costoEnvio = (estado.entrega && estado.entrega.costoEnvio) ? estado.entrega.costoEnvio : 0;
  const total = subtotal + costoEnvio;

  const totalPrendas = prendas.reduce((acc, p) => acc + p.cantidad, 0);
  if (txtCant) txtCant.textContent = `${totalPrendas} PRENDA${totalPrendas === 1 ? '' : 'S'}`;
  if (txtTextoEnvio && estado.entrega) txtTextoEnvio.textContent = estado.entrega.textoDireccion || 'Entrega';

  if (typeof foto === 'function' && typeof escapar === 'function') {
    contenedor.innerHTML = prendas.map(item => `
      <div class="mini">
        <div class="foto">${foto(item.categoria, item.imagenUrl)}</div>
        <div>
          <b>${escapar(item.nombre)}</b>
          <span class="meta">${talla(item.talla)} · ${escapar(item.color)} · Cant: ${item.cantidad}</span>
        </div>
        <span class="precio">${pesos(item.precio * item.cantidad)}</span>
      </div>
    `).join('');
  }

  if (typeof pesos === 'function') {
    if (txtSubtotal) txtSubtotal.textContent = pesos(subtotal);
    if (txtEnvio) txtEnvio.textContent = costoEnvio > 0 ? pesos(costoEnvio) : 'Gratis';
    if (txtTotal) txtTotal.textContent = pesos(total);
  }
}

function configurarCamposTarjeta() {
  const numInput = document.getElementById('tarjeta-num');
  const mesInput = document.getElementById('exp-mes');
  const anioInput = document.getElementById('exp-anio');
  const cvvInput = document.getElementById('tarjeta-cvv');

  if (numInput) {
    numInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      v = v.replace(/(.{4})/g, '$1 ').trim();
      e.target.value = v.substring(0, 19);

      const vEl = document.getElementById('marca-visa');
      const mEl = document.getElementById('marca-mc');
      const aEl = document.getElementById('marca-amex');
      [vEl, mEl, aEl].forEach(el => el && el.classList.remove('activa'));

      const numClean = v.replace(/\s/g, '');
      if (/^4/.test(numClean) && vEl) vEl.classList.add('activa');
      else if (/^(5[1-5]|2[2-7])/.test(numClean) && mEl) mEl.classList.add('activa');
      else if (/^3[47]/.test(numClean) && aEl) aEl.classList.add('activa');
    });
  }

  if (mesInput && anioInput) {
    mesInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length === 2 && parseInt(v, 10) > 12) v = '12';
      if (v.length === 2 && v === '00') v = '01';
      e.target.value = v;
      if (v.length === 2) anioInput.focus();
    });

    anioInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 2);
    });

    anioInput.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && anioInput.value === '') {
        mesInput.focus();
      }
    });
  }

  if (cvvInput) {
    cvvInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    });
  }
}

function configurarSubidaComprobante() {
  const fileInput = document.getElementById('input-comprobante');
  const btnQuitar = document.getElementById('btn-quitar-foto');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        procesarArchivoComprobante(file);
      }
    });
  }

  if (btnQuitar) {
    btnQuitar.addEventListener('click', () => {
      estado.comprobanteArchivo = null;
      if (fileInput) fileInput.value = '';
      if (typeof mostrar === 'function') {
        mostrar('area-drop', true);
        mostrar('previsualizacion', false);
        mostrar('err-comprobante', false);
      }
    });
  }
}

function procesarArchivoComprobante(file) {
  estado.comprobanteArchivo = file;

  const nombreEl = document.getElementById('nombre-archivo');
  const imgEl = document.getElementById('img-preview');

  if (nombreEl) nombreEl.textContent = file.name;

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (imgEl) {
        imgEl.src = e.target.result;
        imgEl.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  } else {
    if (imgEl) imgEl.style.display = 'none';
  }

  if (typeof mostrar === 'function') {
    mostrar('area-drop', false);
    mostrar('previsualizacion', true);
    mostrar('err-comprobante', false);
  }
}

function configurarBotonesCopiar() {
  const copiar = (id, texto) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(texto).then(() => {
        const original = btn.textContent;
        btn.textContent = '¡Copiado!';
        btn.style.backgroundColor = '#28a745';
        btn.style.color = '#fff';
        btn.style.borderColor = '#28a745';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.backgroundColor = '#fff';
          btn.style.color = '#000';
          btn.style.borderColor = '#000';
        }, 1500);
      });
    });
  };

  copiar('copiar-banco', 'BBVA México');
  copiar('copiar-clabe', '012180001234567890');
  copiar('copiar-titular', "Ana Lilia - Lili's Boutique S.A. de C.V.");
  copiar('copiar-concepto', 'COMPRA-LILIS');
}

function validarLuhn(num) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num.charAt(i), 10);
    if (shouldDouble && (digit *= 2) > 9) digit -= 9;
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return (sum % 10) === 0;
}

function continuarAConfirmacion() {
  if (typeof limpiarAvisos === 'function') limpiarAvisos();

  let tokenTarjeta = null;
  let terminacion = null;

  if (estado.formaPago === 'TARJETA') {
    const num = (document.getElementById('tarjeta-num')?.value || '').replace(/\s/g, '');
    const mes = document.getElementById('exp-mes')?.value || '';
    const anio = document.getElementById('exp-anio')?.value || '';
    const cvv = document.getElementById('tarjeta-cvv')?.value || '';
    const nombre = document.getElementById('tarjeta-nombre')?.value || '';

    let valido = true;

    if (num.length < 13 || !validarLuhn(num)) {
      if (typeof mostrar === 'function') mostrar('err-tarjeta', true);
      valido = false;
    } else {
      if (typeof mostrar === 'function') mostrar('err-tarjeta', false);
    }

    if (mes.length < 2 || anio.length < 2) {
      if (typeof mostrar === 'function') mostrar('err-exp', true);
      valido = false;
    } else {
      if (typeof mostrar === 'function') mostrar('err-exp', false);
    }

    if (cvv.length < 3) {
      if (typeof mostrar === 'function') mostrar('err-cvv', true);
      valido = false;
    } else {
      if (typeof mostrar === 'function') mostrar('err-cvv', false);
    }

    if (!nombre.trim()) {
      if (typeof mostrar === 'function') mostrar('err-nombre', true);
      valido = false;
    } else {
      if (typeof mostrar === 'function') mostrar('err-nombre', false);
    }

    if (!valido) {
      if (typeof mostrarAviso === 'function') mostrarAviso('error', 'Por favor revisa los datos de tu tarjeta.');
      return;
    }

    terminacion = num.slice(-4);
    tokenTarjeta = `tok_sim_${terminacion}`;

  } else if (estado.formaPago === 'TRANSFERENCIA') {
    if (!estado.comprobanteArchivo) {
      if (typeof mostrar === 'function') mostrar('err-comprobante', true);
      if (typeof mostrarAviso === 'function') mostrarAviso('error', 'Debes adjuntar tu captura de transferencia para continuar.');
      return;
    } else {
      if (typeof mostrar === 'function') mostrar('err-comprobante', false);
    }
  }

  if (typeof guardar === 'function') {
    guardar('lb.pago', {
      formaPago: estado.formaPago,
      tokenTarjeta,
      terminacion,
      comprobanteNombre: estado.comprobanteArchivo ? estado.comprobanteArchivo.name : null
    });
  }

  location.assign('confirmacionPedido.html');
}