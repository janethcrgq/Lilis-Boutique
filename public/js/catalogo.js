/**
 * public/js/catalogo.js
 * Capa de Presentación - Catálogo y Selección de Productos
 */

// 1. Base de datos simulada de los productos
const inventario = [
  {
    id: 'p-01',
    categoria: 'VESTIDOS',
    nombre: 'Vestido midi floral',
    precio: 649.0,
    disponibles: 3,
    icono: '<path d="M19 5h10l-1 9 9 29H11l9-29z"/><path d="M20 14h8"/>',
    tallas: [
      { val: 'S', stock: 1 },
      { val: 'M', stock: 2 },
    ],
    colores: [
      { hex: '#1C1C1C', nombre: 'Negro', stock: 2 },
      { hex: '#B3312C', nombre: 'Rojo', stock: 1 },
    ],
  },
  {
    id: 'p-02',
    categoria: 'BLUSAS',
    nombre: 'Blusa de lino',
    precio: 389.0,
    disponibles: 4,
    icono:
      '<path d="M17 7l-10 6 4 8 5-3v23h16V18l5 3 4-8-10-6c-1 3-4 5-7 5s-6-2-7-5z"/>',
    tallas: [
      { val: 'S', stock: 2 },
      { val: 'M', stock: 2 },
    ],
    colores: [
      { hex: '#FAFAFA', nombre: 'Blanco', stock: 3 },
      { hex: '#D9C7A7', nombre: 'Beige', stock: 1 },
    ],
  },
  {
    id: 'p-03',
    categoria: 'CALZADO',
    nombre: 'Sandalia trenzada',
    precio: 459.0,
    disponibles: 3,
    icono:
      '<path d="M6 34c0-4 4-7 11-7h15c6 0 10 3 10 7v3H6z"/><path d="M15 27l6-12M29 27l-5-12M19 15h7"/>',
    tallas: [
      { val: '24', stock: 0 },
      { val: '25', stock: 3 },
    ],
    colores: [
      { hex: '#7A4E2D', nombre: 'Café', stock: 1 },
      { hex: '#1C1C1C', nombre: 'Negro', stock: 2 },
    ],
  },
  {
    id: 'p-04',
    categoria: 'ACCESORIOS',
    nombre: 'Bolsa de mano',
    precio: 529.0,
    disponibles: 1,
    ultimaPieza: true,
    icono: '<path d="M9 19h30l-3 23H12z"/><path d="M17 19v-5a7 7 0 0114 0v5"/>',
    tallas: [{ val: 'Unitalla', stock: 1 }],
    colores: [{ hex: '#1C1C1C', nombre: 'Negro', stock: 1 }],
  },
];

// Estado local de las selecciones del usuario
const selecciones = {};

document.addEventListener('DOMContentLoaded', iniciar);

function iniciar() {
  // Inicializamos el estado vacío para cada producto
  inventario.forEach((p) => {
    selecciones[p.id] = { talla: null, color: null };
  });

  configurarFiltros();
  pintarCatalogo('TODO');
}

function configurarFiltros() {
  const botones = document.querySelectorAll('#filtros-catalogo span');
  botones.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      botones.forEach((b) => b.classList.remove('sel'));
      e.target.classList.add('sel');
      pintarCatalogo(e.target.dataset.filtro);
    });
  });
}

function pintarCatalogo(filtro) {
  const grilla = document.getElementById('grilla-productos');
  if (!grilla) return;

  const productosFiltrados =
    filtro === 'TODO'
      ? inventario
      : inventario.filter((p) => p.categoria === filtro);

  if (productosFiltrados.length === 0) {
    grilla.innerHTML = '<p class="sub">No hay productos en esta categoría.</p>';
    return;
  }

  grilla.innerHTML = productosFiltrados
    .map((p) => {
      const estado = selecciones[p.id];

      // Construir Tallas
      const chipsTallas = p.tallas
        .map((t) => {
          const claseAgotado = t.stock === 0 ? 'agotado' : '';
          const claseSel = estado.talla === t.val ? 'sel' : '';
          return `<span class="chip ${claseAgotado} ${claseSel}" onclick="seleccionar('${p.id}', 'talla', '${t.val}')">${t.val}</span>`;
        })
        .join('');

      // Construir Colores
      const chipsColores = p.colores
        .map((c) => {
          const claseSel = estado.color === c.hex ? 'sel' : '';
          return `<span class="color ${claseSel}" style="background:${c.hex}" title="${c.nombre}" onclick="seleccionar('${p.id}', 'color', '${c.hex}')"></span>`;
        })
        .join('');

      // Etiqueta de color seleccionado
      const colorNombre = estado.color
        ? p.colores.find((c) => c.hex === estado.color).nombre
        : 'Elige color';

      // Construir Texto de Existencias
      let textoExistencia = `${p.disponibles} disponibles`;
      if (p.ultimaPieza) textoExistencia = 'Solo queda 1';

      return `
      <article class="tarjeta" id="tarjeta-${p.id}">
        <div class="foto">
          ${p.ultimaPieza ? '<span class="sello">Última pieza</span>' : ''}
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">${p.icono}</svg>
        </div>
        <h3>${p.nombre}</h3>
        <div class="precio">$${p.precio.toFixed(2)} MXN</div>
        
        <div class="chips">${chipsTallas}</div>
        <div class="chips">${chipsColores} <span class="meta" style="margin-left:6px">${colorNombre}</span></div>
        
        <p class="existencia ${p.ultimaPieza ? 'poca' : ''}">${textoExistencia}</p>
        
        <button class="btn" onclick="agregarABolsa('${p.id}')">Agregar a la bolsa</button>
      </article>
    `;
    })
    .join('');
}

// Función global (en el objeto window) para que los onclick del HTML la vean
window.seleccionar = function (idProducto, tipo, valor) {
  selecciones[idProducto][tipo] = valor;
  // Re-pintamos el catálogo manteniendo el filtro actual
  const filtroActual = document.querySelector('#filtros-catalogo span.sel')
    .dataset.filtro;
  pintarCatalogo(filtroActual);
};

window.agregarABolsa = async function (idProducto) {
  const producto = inventario.find((p) => p.id === idProducto);
  const estado = selecciones[idProducto];

  // 1. Validaciones
  if (!estado.talla || !estado.color) {
    if (typeof mostrarAviso === 'function') {
      mostrarAviso('error', 'Por favor selecciona talla y color.');
    } else {
      alert('Por favor selecciona talla y color.');
    }
    return;
  }

  const nombreColor = producto.colores.find(
    (c) => c.hex === estado.color,
  ).nombre;

  // 2. Simular petición al backend o guardar en sessionStorage
  try {
    if (typeof api === 'function') {
      // Intento con la arquitectura real de Lili's Boutique
      await api('POST', '/carrito', {
        productoId: producto.id,
        talla: estado.talla,
        color: nombreColor,
        cantidad: 1,
      });
    } else {
        console.log("JAJAJAJ")
      // Fallback local: Guardar simulado en sessionStorage para las pruebas
      let carrito = JSON.parse(sessionStorage.getItem('lb.carrito')) || {
        prendas: [],
        subtotal: 0,
      };
      carrito.prendas.push({
        id: producto.id,
        nombre: producto.nombre,
        talla: estado.talla,
        color: nombreColor,
        precio: producto.precio,
        cantidad: 1,
        imagenUrl: 'url_simulada',
        categoria: producto.categoria,
      });
      carrito.subtotal += producto.precio;
      sessionStorage.setItem('lb.carrito', JSON.stringify(carrito));

      // Activar la sesión de reserva si no existe
      if (!sessionStorage.getItem('lb.reserva')) {
        sessionStorage.setItem('lb.reserva', Date.now() + 15 * 60000);
      }
    }

    // 3. Mostrar Toast animado y actualizar botón
    mostrarToastNotificacion(producto, estado.talla, nombreColor);

    const boton = document.querySelector(`#tarjeta-${idProducto} .btn`);
    if (boton) {
      const original = boton.innerHTML;
      boton.innerHTML = '¡Agregado! ✓';
      boton.classList.add('ok');
      setTimeout(() => {
        boton.innerHTML = original;
        boton.classList.remove('ok');
      }, 2000);
    }
  } catch (error) {
    console.error('Error al agregar:', error);
  }
};

function mostrarToastNotificacion(producto, talla, colorNombre) {
  const contenedor = document.getElementById('contenedor-toasts');
  if (!contenedor) return;

  const idToast = 'toast-' + Date.now();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.id = idToast;

  toast.innerHTML = `
    <div class="foto-toast">
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">${producto.icono}</svg>
    </div>
    <div>
      <b>Agregaste a tu bolsa</b>
      <small>${producto.nombre} · ${talla} · ${colorNombre} · 1 pza</small>
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
