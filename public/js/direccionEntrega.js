// Pantalla 02 · Entrega (pasos 7-12 del CU, flujos 2.2.2 y 2.2.8).
// La clienta elige envio a domicilio (direccion guardada o nueva) o recoger en boutique.
// Al continuar se guarda lb.entrega y se pasa a metodoPago.html.

const estado = {
  metodo: 'DOMICILIO', // o 'RECOGER_EN_BOUTIQUE'
  direcciones: [], // direcciones guardadas de la clienta
  zonas: [], // Centro, Norte y Sur con su costo
  idDireccion: null, // direccion guardada que eligio
  nueva: false, // true si esta capturando una direccion nueva
  subtotal: null, // subtotal de la bolsa (null mientras no carga)
};

document.addEventListener('DOMContentLoaded', iniciar);

async function iniciar() {
  document.getElementById('volver').innerHTML = icono('atras') + ' Volver a la bolsa';
  document.getElementById('icono-tienda').innerHTML = icono('tienda');

  // Si regreso desde Pago, se marca lo que ya habia elegido.
  const anterior = leer('lb.entrega');
  if (anterior) {
    estado.metodo = anterior.metodoEntrega;
    estado.idDireccion = anterior.idDireccion;
  }
  document.querySelector(`input[name="metodo"][value="${estado.metodo}"]`).checked = true;

  conectarBotones();

  // 2.2.9: si se acaban los 15 minutos, la bolsa explica que paso.
  alVencerReserva(() => location.assign('bolsaCompra.html?reserva=vencida'));

  try {
    estado.zonas = await api('GET', '/zonas');
    estado.direcciones = await api('GET', '/direcciones');
  } catch (error) {
    avisoDeError(error);
    return;
  }

  // Sin direccion elegida se marca la primera; sin direcciones se pide una nueva.
  if (!buscarDireccion(estado.idDireccion) && estado.direcciones.length > 0) {
    estado.idDireccion = estado.direcciones[0].idDireccion;
  }
  estado.nueva = estado.direcciones.length === 0;

  pintarZonas();
  pintarDirecciones();
  pintar();
  cargarBolsa();
}

function conectarBotones() {
  document.querySelectorAll('input[name="metodo"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      estado.metodo = radio.value;
      limpiarAvisos();
      pintar();
    });
  });
  document.getElementById('btn-nueva').addEventListener('click', () => usarDireccionNueva(true));
  document.getElementById('btn-guardadas').addEventListener('click', () => usarDireccionNueva(false));
  document.getElementById('zona').addEventListener('change', revisarZona);
  document.getElementById('btn-continuar').addEventListener('click', continuar);
}

function buscarDireccion(idDireccion) {
  return estado.direcciones.find((d) => d.idDireccion === idDireccion);
}

function buscarZona(idZona) {
  return estado.zonas.find((z) => z.idZona === idZona);
}

// ---------- Resumen de la bolsa ----------
async function cargarBolsa() {
  let carrito;
  try {
    carrito = await api('GET', '/carrito');
  } catch {
    document.getElementById('resumen-prendas').innerHTML = '<p class="meta">No pudimos cargar tu bolsa.</p>';
    return;
  }

  // No se puede elegir entrega con la bolsa vacia.
  if (!carrito || carrito.detalles.length === 0) {
    location.assign('bolsaCompra.html');
    return;
  }

  let html = '';
  let piezas = 0;
  carrito.detalles.forEach((d) => {
    piezas += d.cantidad;
    html += `
      <div class="mini">${foto(d.categoria, d.imagenURL)}
        <div><b>${escapar(d.nombre)}</b><span class="meta">${talla(d.talla)} · ${escapar(d.color)} · Cant: ${d.cantidad}</span></div>
        <span class="precio">${pesos(d.precioUnitario * d.cantidad)}</span>
      </div>`;
  });
  document.getElementById('resumen-prendas').innerHTML = html;
  document.getElementById('num-prendas').textContent = piezas === 1 ? '1 prenda' : piezas + ' prendas';

  estado.subtotal = carrito.subtotal;
  pintarTotales();
}

// ---------- Direcciones ----------
function pintarZonas() {
  let html = '<option value="">Elige tu zona</option>';
  estado.zonas.forEach((z) => {
    html += `<option value="${z.idZona}">${escapar(z.nombre)} — ${pesos(z.costoEnvio)}</option>`;
  });
  html += '<option value="fuera">Mi colonia no aparece</option>';
  document.getElementById('zona').innerHTML = html;
}

function pintarDirecciones() {
  let html = '';
  estado.direcciones.forEach((d) => {
    const marcada = d.idDireccion === estado.idDireccion ? 'checked' : '';
    let detalle = 'Zona ' + escapar(d.zona.nombre);
    if (d.referencias) {
      detalle += ' · ' + escapar(d.referencias);
    }
    html += `
      <label class="opcion">
        <input type="radio" name="direccion" value="${d.idDireccion}" ${marcada}>
        <span class="radio"></span>
        <span class="txt"><b>${escapar(textoDireccion(d))}</b><small>${detalle}</small></span>
        <span class="der-op">${pesos(d.zona.costoEnvio)}</span>
      </label>`;
  });
  document.getElementById('lista-direcciones').innerHTML = html;

  document.querySelectorAll('input[name="direccion"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      estado.idDireccion = Number(radio.value);
      pintarTotales();
    });
  });
}

function textoDireccion(d) {
  return `${d.calle} ${d.numeroCasa}, Col. ${d.colonia}`;
}

function usarDireccionNueva(nueva) {
  estado.nueva = nueva;
  limpiarAvisos();
  pintar();
  if (nueva) {
    document.getElementById('calle').focus();
  }
}

// 2.2.8: la colonia no esta en ninguna zona de envio.
function revisarZona() {
  const fuera = document.getElementById('zona').value === 'fuera';
  document.getElementById('campo-zona').classList.toggle('error', fuera);

  if (fuera) {
    document.getElementById('ayuda-zona').textContent = 'Esta dirección está fuera de nuestras zonas de envío.';
    mostrarAviso(
      'error',
      'No entregamos en esa dirección.',
      'Por ahora solo hacemos envíos a las zonas Centro, Norte y Sur de Cd. Obregón. Puedes usar otra dirección o recoger tu pedido en la boutique sin costo.',
    );
  } else {
    document.getElementById('ayuda-zona').textContent = 'El costo del envío depende de la zona.';
    limpiarAvisos();
  }
  pintar();
}

// ---------- Pintar la pantalla segun lo elegido ----------
function pintar() {
  const domicilio = estado.metodo === 'DOMICILIO';
  const hayGuardadas = estado.direcciones.length > 0;

  mostrar('seccion-domicilio', domicilio);
  mostrar('seccion-boutique', !domicilio);
  mostrar('bloque-guardadas', hayGuardadas && !estado.nueva);
  mostrar('form-nueva', estado.nueva);
  mostrar('btn-guardadas', hayGuardadas);

  const boton = document.getElementById('btn-continuar');
  if (domicilio && estado.nueva) {
    boton.innerHTML = 'Guardar y continuar ' + icono('flecha');
    boton.disabled = document.getElementById('zona').value === 'fuera';
  } else {
    boton.innerHTML = 'Continuar al método de pago ' + icono('flecha');
    boton.disabled = false;
  }
  pintarTotales();
}

// Zona que aplica segun lo elegido, o undefined si todavia no hay.
function zonaElegida() {
  if (estado.nueva) {
    return buscarZona(Number(document.getElementById('zona').value));
  }
  const direccion = buscarDireccion(estado.idDireccion);
  if (direccion) {
    return direccion.zona;
  }
}

function pintarTotales() {
  const fila = document.getElementById('fila-envio');
  let envio = 0;

  if (estado.metodo === 'RECOGER_EN_BOUTIQUE') {
    fila.className = 'fila cortesia';
    fila.innerHTML = `<span>Recoger en boutique</span><span class="mono">${pesos(0)}</span>`;
  } else {
    const zona = zonaElegida();
    fila.className = 'fila';
    if (zona) {
      envio = zona.costoEnvio;
      fila.innerHTML = `<span>Envío (zona ${escapar(zona.nombre)})</span><span class="mono">${pesos(envio)}</span>`;
    } else {
      fila.innerHTML = '<span>Envío</span><span class="meta">Elige una dirección válida</span>';
    }
  }

  if (estado.subtotal !== null) {
    document.getElementById('subtotal').textContent = pesos(estado.subtotal);
    document.getElementById('total').textContent = pesos(estado.subtotal + envio);
  }
}

// ---------- Continuar ----------
async function continuar() {
  limpiarAvisos();

  // 2.2.2: recoger en boutique no lleva direccion ni costo; no se registra Envio.
  if (estado.metodo === 'RECOGER_EN_BOUTIQUE') {
    irAPago({ metodoEntrega: 'RECOGER_EN_BOUTIQUE', idDireccion: null, costoEnvio: 0, textoDireccion: 'Recoger en boutique' });
    return;
  }

  // Direccion guardada.
  if (!estado.nueva) {
    const direccion = buscarDireccion(estado.idDireccion);
    if (!direccion) {
      mostrarAviso('error', 'Elige una dirección de entrega.');
      return;
    }
    irAPago(entregaA(direccion));
    return;
  }

  // Direccion nueva: primero se guarda en el backend.
  const datos = leerFormulario();
  if (!datos) {
    return;
  }
  const boton = document.getElementById('btn-continuar');
  boton.disabled = true;
  try {
    const direccion = await api('POST', '/direcciones', datos);
    irAPago(entregaA(direccion));
  } catch (error) {
    avisoDeError(error);
    boton.disabled = false;
  }
}

function valor(id) {
  return document.getElementById(id).value.trim();
}

// Regresa los datos para POST /direcciones, o null si falta algo.
function leerFormulario() {
  if (!valor('calle') || !valor('numero') || !valor('colonia')) {
    mostrarAviso('error', 'Faltan datos de la dirección.', 'La calle, el número y la colonia son obligatorios.');
    return null;
  }
  if (!valor('zona')) {
    mostrarAviso('error', 'Elige la zona de envío.');
    return null;
  }

  const datos = {
    idZona: Number(valor('zona')),
    calle: valor('calle'),
    numeroCasa: valor('numero'),
    colonia: valor('colonia'),
  };
  if (valor('referencias')) {
    datos.referencias = valor('referencias');
  }
  return datos;
}

function entregaA(direccion) {
  return {
    metodoEntrega: 'DOMICILIO',
    idDireccion: direccion.idDireccion,
    costoEnvio: direccion.zona.costoEnvio,
    textoDireccion: textoDireccion(direccion),
  };
}

function irAPago(entrega) {
  guardar('lb.entrega', entrega);
  location.assign('metodoPago.html');
}
