// Funciones que usan todas las paginas: llamar al backend, avisos y formatos.
// Cargar en este orden: api.js, plantilla.js y luego el js de la pagina.

// ---------- Sesion de prueba ----------
// Mientras no existe Iniciar Sesion (C2), la clienta se elige en "Entrar como".
// Despues de "npm run seed": Maria 3, Sofia 4, Daniela 5.
function idCliente() {
  return Number(localStorage.getItem('lb.idCliente')) || 3;
}

// ---------- Llamadas al backend ----------
// api('GET', '/zonas') o api('POST', '/direcciones', { ... }).
// Si datos es un FormData (para subir archivos) se manda tal cual.
// Si el backend responde con error, lanza un Error con:
//   error.estado  codigo HTTP (0 si no hubo conexion)
//   error.error   nombre del error del service, por ejemplo 'FueraDeZonaError'
//   error.message texto para la clienta
async function api(metodo, url, datos) {
  const opciones = { method: metodo, headers: { 'x-id-cliente': String(idCliente()) } };
  if (datos instanceof FormData) {
    opciones.body = datos;
  } else if (datos) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(datos);
  }

  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch {
    const error = new Error('No pudimos conectar con el servidor. Revisa que esté encendido.');
    error.estado = 0;
    throw error;
  }

  const texto = await respuesta.text();
  const cuerpo = texto ? JSON.parse(texto) : null;

  if (!respuesta.ok) {
    let mensaje = cuerpo ? cuerpo.message : 'Algo salió mal.';
    // El ValidationPipe manda una lista de mensajes.
    if (Array.isArray(mensaje)) {
      mensaje = mensaje.join('. ');
    }
    const error = new Error(mensaje);
    error.estado = respuesta.status;
    error.error = cuerpo ? cuerpo.error : '';
    throw error;
  }
  return cuerpo;
}

// ---------- Datos entre paginas (sessionStorage) ----------
// Claves: lb.reserva, lb.entrega, lb.pago.
function leer(clave) {
  return JSON.parse(sessionStorage.getItem(clave));
}

function guardar(clave, valor) {
  sessionStorage.setItem(clave, JSON.stringify(valor));
}

function borrar(clave) {
  sessionStorage.removeItem(clave);
}

// ---------- Formatos ----------
// pesos(1956) -> '$1,956.00'
function pesos(n) {
  return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// talla('T25_5') -> '25.5', talla('UNITALLA') -> 'Unitalla'
function talla(t) {
  if (t === 'UNITALLA') {
    return 'Unitalla';
  }
  return t.replace('T', '').replace('_', '.');
}

// fecha(pedido.fechaLimitePago) -> '25/10/26, 18:30'
function fecha(valor) {
  return new Date(valor).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

// Todo texto de la BD que vaya dentro de innerHTML pasa por aqui,
// para que un "<" en una referencia no rompa la pagina.
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto || '';
  return div.innerHTML;
}

// En estadoPedido.html?pedido=5, parametro('pedido') -> '5'
function parametro(nombre) {
  return new URLSearchParams(location.search).get(nombre);
}

// ---------- Avisos ----------
// Salen en el <div id="avisos"></div> de la pagina.
// tipo: 'error' (rojo), 'ok' (verde), 'info' (lila) o 'alerta' (amarillo).
function mostrarAviso(tipo, titulo, texto) {
  const iconos = { error: 'alerta', ok: 'ok', info: 'info', alerta: 'reloj' };
  let html = `<div class="aviso ${tipo}">${icono(iconos[tipo])}<div><b>${escapar(titulo)}</b>`;
  if (texto) {
    html += `<p>${escapar(texto)}</p>`;
  }
  html += '</div></div>';

  const caja = document.getElementById('avisos');
  caja.innerHTML = html;
  caja.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function limpiarAvisos() {
  document.getElementById('avisos').innerHTML = '';
}

// Para el catch de api(): muestra el error que mando el backend.
function avisoDeError(error) {
  // Sin estado no vino del backend: es un error del codigo de la pagina.
  if (error.estado === undefined) {
    console.error(error);
    mostrarAviso('error', 'Algo salió mal.', 'Intenta de nuevo.');
    return;
  }
  const titulos = {
    0: 'Sin conexión.',
    400: 'Revisa los datos.',
    404: 'No lo encontramos.',
    409: 'No se pudo completar.',
    503: 'El servicio no está disponible.',
  };
  mostrarAviso('error', titulos[error.estado] || 'Algo salió mal.', error.message);
}
