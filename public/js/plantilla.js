// Dibuja la cabecera, los pasos 01-04 y el pie en todas las paginas.
// En el <body> se configura con atributos:
//   data-paso="2"        paso del proceso de compra (1 a 4); sin el atributo no hay pasos
//   data-nav="Colección" opcion del menu que se marca
//   data-panel           cabecera de la boutique (Duena y Vendedora) en lugar de la de clientas

const CLIENTAS = [
  { id: 3, nombre: 'María López' },
  { id: 4, nombre: 'Sofía Ramírez' },
  { id: 5, nombre: 'Daniela Torres' },
];

const PERSONAL = [
  { id: 1, nombre: 'Ana Lilia Hermosillo', rol: 'Dueña' },
  { id: 2, nombre: 'Liliana Valdez', rol: 'Vendedora' },
];

const ICONOS = {
  buscar: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  bolsa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>',
  candado: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  reloj: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  check: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  x: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  alerta: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.5"/></svg>',
  info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  ok: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16 10"/></svg>',
  subir: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/></svg>',
  tienda: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9l1.5-5h13L20 9"/><path d="M4 9h16v2a3 3 0 01-6 0 3 3 0 01-4 0 3 3 0 01-6 0z"/><path d="M5 13v7h14v-7"/><path d="M10 20v-4h4v4"/></svg>',
  banco: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 9l9-5 9 5z"/><path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18"/></svg>',
  flecha: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  atras: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  mariposa: '<svg width="34" height="28" viewBox="0 0 40 32"><path d="M20 9C16 3 7 0 3.5 4.5 0.5 9 5 15 12 16c-6 2-8.5 7.5-5 10.5 4 3.2 10-1.5 13-7.5 3 6 9 10.7 13 7.5 3.5-3 1-8.5-5-10.5 7-1 11.5-7 8.5-11.5C33 0 24 3 20 9z" fill="#5B2A86"/><path d="M20 8v19" stroke="#2A0F45" stroke-width="1.6" stroke-linecap="round"/><path d="M20 8l-3-5M20 8l3-5" stroke="#2A0F45" stroke-width="1.2" stroke-linecap="round"/></svg>',
};

// Dibujos de las prendas mientras no hay fotos.
const PRENDAS = {
  Vestidos: '<path d="M19 5h10l-1 9 9 29H11l9-29z"/><path d="M20 14h8"/>',
  Blusas: '<path d="M17 7l-10 6 4 8 5-3v23h16V18l5 3 4-8-10-6c-1 3-4 5-7 5s-6-2-7-5z"/>',
  Calzado: '<path d="M6 34c0-4 4-7 11-7h15c6 0 10 3 10 7v3H6z"/><path d="M15 27l6-12M29 27l-5-12M19 15h7"/>',
  Accesorios: '<path d="M9 19h30l-3 23H12z"/><path d="M17 19v-5a7 7 0 0114 0v5"/>',
};

// icono('flecha') regresa el <svg> para meterlo en innerHTML.
function icono(nombre) {
  return ICONOS[nombre] || '';
}

// foto('Vestidos') pinta el dibujo; foto('Vestidos', '/uploads/vestido.jpg') la foto.
function foto(categoria, url) {
  if (url) {
    return `<div class="foto"><img src="${escapar(url)}" alt=""></div>`;
  }
  const dibujo = PRENDAS[categoria] || PRENDAS.Accesorios;
  return `<div class="foto"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">${dibujo}</svg></div>`;
}

// mostrar('seccion-boutique', true) lo ensena; con false lo esconde.
function mostrar(id, visible) {
  document.getElementById(id).classList.toggle('oculto', !visible);
}

// ---------- Cabecera ----------
function cabeceraClienta(navActivo) {
  const menu = ['Colección', 'Vestidos', 'Blusas', 'Calzado', 'Accesorios']
    .map((n) => {
      const url = n === 'Colección' ? 'catalogo.html' : `catalogo.html?categoria=${n}`;
      return `<a href="${url}"${n === navActivo ? ' class="activo"' : ''}>${n.toUpperCase()}</a>`;
    })
    .join('');
  const actual = CLIENTAS.find((c) => c.id === idCliente()) || CLIENTAS[0];
  const opciones = CLIENTAS.map(
    (c) => `<option value="${c.id}"${c.id === actual.id ? ' selected' : ''}>${c.nombre}</option>`,
  ).join('');

  return `
  <header class="barra">
    <a class="logo" href="catalogo.html">${icono('mariposa')}<span><b>LILI'S</b><small>BOUTIQUE</small></span></a>
    <nav class="nav">${menu}</nav>
    <div class="iconos">${icono('buscar')}
      <span class="sesion"><i>${actual.nombre[0]}</i>
        <label><small>Entrar como</small><select id="selector-clienta">${opciones}</select></label></span>
      <a class="bolsa-ico" href="bolsaCompra.html" title="Bolsa">${icono('bolsa')}<span id="contador-bolsa">0</span></a>
    </div>
  </header>`;
}

function cabeceraPanel() {
  const opciones = PERSONAL.map((p) => `<option value="${p.id}">${p.nombre} · ${p.rol}</option>`).join('');
  return `
  <header class="barra">
    <a class="logo" href="boutique.html">${icono('mariposa')}<span><b>LILI'S</b><small>BOUTIQUE · PANEL</small></span></a>
    <nav class="nav"><span>PEDIDOS</span><a class="activo" href="boutique.html">PAGOS</a><span>ENVÍOS</span><span>CATÁLOGO</span></nav>
    <div class="iconos">
      <span class="sesion"><i>${PERSONAL[0].nombre[0]}</i>
        <label><small>Entrar como</small><select id="selector-personal">${opciones}</select></label></span>
    </div>
  </header>`;
}

function pasos(paso) {
  const nombres = ['01. Bolsa', '02. Envío', '03. Pago', '04. Confirmación'];
  let lista = '';
  nombres.forEach((nombre, i) => {
    let clase = '';
    if (i + 1 < paso) {
      clase = 'hecho';
    } else if (i + 1 === paso) {
      clase = 'activo';
    }
    lista += `<li class="${clase}"><span>${nombre.toUpperCase()}</span></li>`;
  });
  return `<div class="pasos"><ol>${lista}</ol><div id="reloj-reserva" class="seguro">${icono('candado')} PAGO SEGURO</div></div>`;
}

function pie() {
  return `
  <footer class="pie"><b>LILI'S BOUTIQUE</b>
    <nav><a href="misPedidos.html">Mis pedidos</a><a>Envíos y devoluciones</a><a>Privacidad</a><a>Términos</a></nav>
    <span>© 2026 Lili's Boutique · Cd. Obregón, Sonora</span>
  </footer>`;
}

// ---------- Bolsa ----------
// Cuenta las prendas del icono de la bolsa. Llamarla despues de cambiar el carrito.
async function actualizarBolsa() {
  const contador = document.getElementById('contador-bolsa');
  let piezas = 0;
  try {
    const carrito = await api('GET', '/carrito');
    if (carrito) {
      carrito.detalles.forEach((d) => (piezas += d.cantidad));
    }
  } catch {
    // Si no se pudo leer el carrito se queda en 0.
  }
  contador.textContent = piezas;
}

// ---------- Reserva de 15 minutos ----------
// La pagina dice que hacer cuando se acaba el tiempo:
//   alVencerReserva(() => location.assign('bolsaCompra.html?reserva=vencida'));
let funcionAlVencer = null;
let reservaVencida = false;

function alVencerReserva(funcion) {
  funcionAlVencer = funcion;
}

// Cada segundo pinta cuanto falta (lb.reserva lo guarda la bolsa).
function iniciarReloj() {
  const reserva = leer('lb.reserva');
  if (!reserva) {
    return;
  }
  const reloj = document.getElementById('reloj-reserva');
  reloj.className = 'reloj';

  function pintarReloj() {
    let resta = new Date(reserva.expiraEn).getTime() - Date.now();
    if (resta < 0) {
      resta = 0;
    }
    const minutos = String(Math.floor(resta / 60000)).padStart(2, '0');
    const segundos = String(Math.floor((resta % 60000) / 1000)).padStart(2, '0');
    reloj.innerHTML = `${icono('reloj')} PRENDAS APARTADAS POR <b>${minutos}:${segundos}</b>`;

    if (resta === 0 && funcionAlVencer && !reservaVencida) {
      reservaVencida = true;
      reloj.classList.add('vencida');
      funcionAlVencer();
    }
  }

  pintarReloj();
  setInterval(pintarReloj, 1000);
}

// ---------- Armado de la pagina ----------
document.addEventListener('DOMContentLoaded', () => {
  const paso = document.body.dataset.paso;
  const esPanel = document.body.hasAttribute('data-panel');

  let arriba;
  if (esPanel) {
    arriba = cabeceraPanel();
  } else {
    arriba = cabeceraClienta(document.body.dataset.nav);
  }
  if (paso) {
    arriba += pasos(Number(paso));
  }
  document.body.insertAdjacentHTML('afterbegin', arriba);
  document.body.insertAdjacentHTML('beforeend', pie());

  if (esPanel) {
    // Solo cambia la inicial de quien usa el panel (Duena o Vendedora).
    document.getElementById('selector-personal').addEventListener('change', (e) => {
      const persona = PERSONAL.find((p) => p.id === Number(e.target.value));
      document.querySelector('.sesion i').textContent = persona.nombre[0];
    });
  } else {
    // Cambiar de clienta borra lo que llevaba la anterior.
    document.getElementById('selector-clienta').addEventListener('change', (e) => {
      localStorage.setItem('lb.idCliente', e.target.value);
      borrar('lb.reserva');
      borrar('lb.entrega');
      borrar('lb.pago');
      location.reload();
    });
    actualizarBolsa();
  }

  if (paso) {
    iniciarReloj();
  }
});
