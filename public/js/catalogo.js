/**
 * public/js/catalogo.js
 * Capa de Presentación - Catálogo y Selección de Productos (pasos 1-2 del CU)
 *
 * Lee los productos de GET /productos y agrega la prenda (talla + color)
 * a la bolsa con POST /carrito/prendas.
 */

// Color de cada circulito; si no esta aqui sale gris.
const COLORES = {
  Negro: '#1C1C1C',
  Rojo: '#B3312C',
  Blanco: '#FAFAFA',
  Beige: '#D9C7A7',
  Cafe: '#7A4E2D',
};

let inventario = [];

// Estado local de las selecciones del usuario: { idProducto: { talla, color } }
const selecciones = {};

document.addEventListener('DOMContentLoaded', iniciar);

async function iniciar() {
  try {
    inventario = await api('GET', '/productos');
  } catch (error) {
    avisoDeError(error);
    return;
  }

  // Si solo hay una talla o un color se deja elegido.
  inventario.forEach((p) => {
    const tallas = tallasDe(p);
    const colores = coloresDe(p);
    selecciones[p.idProducto] = {
      talla: tallas.length === 1 ? tallas[0] : null,
      color: colores.length === 1 ? colores[0] : null,
    };
  });

  configurarFiltros();
  const categoria = (parametro('categoria') || 'TODO').toUpperCase();
  marcarFiltro(categoria);
  pintarCatalogo(categoria);
}

function tallasDe(p) {
  return [...new Set(p.variantes.map((v) => v.talla))];
}

function coloresDe(p) {
  return [...new Set(p.variantes.map((v) => v.color))];
}

function varianteDe(p, tallaElegida, colorElegido) {
  return p.variantes.find((v) => v.talla === tallaElegida && v.color === colorElegido);
}

// ¿Hay alguna variante con existencia para esa talla o color?
function hayDe(p, tipo, valor) {
  const otro = tipo === 'talla' ? 'color' : 'talla';
  const elegido = selecciones[p.idProducto][otro];
  return p.variantes.some(
    (v) => v[tipo] === valor && (!elegido || v[otro] === elegido) && v.disponibles > 0,
  );
}

function configurarFiltros() {
  const botones = document.querySelectorAll('#filtros-catalogo span');
  botones.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      marcarFiltro(e.target.dataset.filtro);
      pintarCatalogo(e.target.dataset.filtro);
    });
  });
}

function marcarFiltro(filtro) {
  document.querySelectorAll('#filtros-catalogo span').forEach((b) => {
    b.classList.toggle('sel', b.dataset.filtro === filtro);
  });
}

function pintarCatalogo(filtro) {
  const grilla = document.getElementById('grilla-productos');

  const productosFiltrados =
    filtro === 'TODO'
      ? inventario
      : inventario.filter((p) => p.categoria.toUpperCase() === filtro);

  if (productosFiltrados.length === 0) {
    grilla.innerHTML = '<p class="sub">No hay productos en esta categoría.</p>';
    return;
  }

  grilla.innerHTML = productosFiltrados
    .map((p) => {
      const estado = selecciones[p.idProducto];

      // Construir Tallas
      const chipsTallas = tallasDe(p)
        .map((t) => {
          const claseAgotado = hayDe(p, 'talla', t) ? '' : 'agotado';
          const claseSel = estado.talla === t ? 'sel' : '';
          return `<span class="chip ${claseAgotado} ${claseSel}" onclick="seleccionar(${p.idProducto}, 'talla', '${escapar(t)}')">${talla(t)}</span>`;
        })
        .join('');

      // Construir Colores
      const chipsColores = coloresDe(p)
        .map((c) => {
          const claseSel = estado.color === c ? 'sel' : '';
          const fondo = COLORES[c] || '#BDBDBD';
          return `<span class="color ${claseSel}" style="background:${fondo}" title="${escapar(c)}" onclick="seleccionar(${p.idProducto}, 'color', '${escapar(c)}')"></span>`;
        })
        .join('');

      const colorNombre = estado.color ? escapar(estado.color) : 'Elige color';

      // Construir Texto de Existencias
      const elegida = varianteDe(p, estado.talla, estado.color);
      const disponibles = elegida
        ? elegida.disponibles
        : p.variantes.reduce((suma, v) => suma + v.disponibles, 0);
      let textoExistencia = `${disponibles} disponibles`;
      if (disponibles === 1) textoExistencia = 'Solo queda 1';
      if (disponibles === 0) textoExistencia = 'Agotado';
      const ultimaPieza = !elegida && disponibles === 1;

      return `
      <article class="tarjeta" id="tarjeta-${p.idProducto}">
        <div class="foto">
          ${ultimaPieza ? '<span class="sello">Última pieza</span>' : ''}
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">${PRENDAS[p.categoria] || PRENDAS.Accesorios}</svg>
        </div>
        <h3>${escapar(p.nombre)}</h3>
        <div class="precio">${pesos(p.precio)} MXN</div>

        <div class="chips">${chipsTallas}</div>
        <div class="chips">${chipsColores} <span class="meta" style="margin-left:6px">${colorNombre}</span></div>

        <p class="existencia ${disponibles <= 1 ? 'poca' : ''}">${textoExistencia}</p>

        <button class="btn" onclick="agregarABolsa(${p.idProducto})"${disponibles === 0 ? ' disabled' : ''}>Agregar a la bolsa</button>
      </article>
    `;
    })
    .join('');
}

// Función global (en el objeto window) para que los onclick del HTML la vean
window.seleccionar = function (idProducto, tipo, valor) {
  selecciones[idProducto][tipo] = valor;
  // Re-pintamos el catálogo manteniendo el filtro actual
  const filtroActual = document.querySelector('#filtros-catalogo span.sel').dataset.filtro;
  pintarCatalogo(filtroActual);
};

window.agregarABolsa = async function (idProducto) {
  limpiarAvisos();
  const producto = inventario.find((p) => p.idProducto === idProducto);
  const estado = selecciones[idProducto];

  // 1. Validaciones
  if (!estado.talla || !estado.color) {
    mostrarAviso('error', 'Elige talla y color.', 'Para agregar la prenda a tu bolsa necesitamos las dos cosas.');
    return;
  }
  const variante = varianteDe(producto, estado.talla, estado.color);
  if (!variante || variante.disponibles === 0) {
    mostrarAviso('error', 'Esa combinación está agotada.', 'Prueba con otra talla u otro color.');
    return;
  }

  // 2. Pasos 1-2 del CU: si no hay carrito, el servidor lo crea.
  try {
    await api('POST', '/carrito/prendas', { idVariante: variante.idVariante, cantidad: 1 });
  } catch (error) {
    avisoDeError(error);
    return;
  }

  // 3. Mostrar Toast animado y actualizar botón
  actualizarBolsa();
  mostrarToastNotificacion(producto, estado.talla, estado.color);

  const boton = document.querySelector(`#tarjeta-${idProducto} .btn`);
  boton.innerHTML = '¡Agregado!';
  boton.classList.add('ok');
  setTimeout(() => {
    boton.innerHTML = 'Agregar a la bolsa';
    boton.classList.remove('ok');
  }, 2000);
};

function mostrarToastNotificacion(producto, tallaElegida, colorNombre) {
  const contenedor = document.getElementById('contenedor-toasts');

  const idToast = 'toast-' + Date.now();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.id = idToast;

  toast.innerHTML = `
    <div class="foto-toast">
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">${PRENDAS[producto.categoria] || PRENDAS.Accesorios}</svg>
    </div>
    <div>
      <b>Agregaste a tu bolsa</b>
      <small>${escapar(producto.nombre)} · ${talla(tallaElegida)} · ${escapar(colorNombre)} · 1 pza</small>
      <a href="bolsaCompra.html">Ver bolsa y pagar</a>
    </div>
  `;

  contenedor.appendChild(toast);

  // Auto-eliminar después de 4 segundos
  setTimeout(() => {
    const t = document.getElementById(idToast);
    if (t) {
      t.classList.add('saliendo');
      setTimeout(() => t.remove(), 300); // Esperar que termine la animación
    }
  }, 4000);
}
