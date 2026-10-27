// Mis pedidos: lista los pedidos de la clienta y lleva a estadoPedido.html.
const ESTADOS = {
  PENDIENTE_DE_PAGO: { texto: 'Pendiente de pago', clase: 'pendiente' },
  PAGADO: { texto: 'Pagado', clase: 'pagado' },
  ENVIADO: { texto: 'Enviado', clase: 'pagado' },
  ENTREGADO: { texto: 'Entregado', clase: 'pagado' },
  CANCELADO: { texto: 'Cancelado', clase: 'cancelado' },
};

document.addEventListener('DOMContentLoaded', cargar);

async function cargar() {
  let pedidos;
  try {
    pedidos = await api('GET', '/pedidos');
  } catch (error) {
    avisoDeError(error);
    return;
  }

  mostrar('tabla', pedidos.length > 0);
  mostrar('sin-pedidos', pedidos.length === 0);

  document.getElementById('filas').innerHTML = pedidos
    .map((p) => {
      const piezas = p.detalles.reduce((suma, d) => suma + d.cantidad, 0);
      const estado = ESTADOS[p.estadoPedido];
      const entrega = p.metodoEntrega === 'RECOGER_EN_BOUTIQUE' ? 'Recoger en boutique' : 'A domicilio';
      const accion = p.estadoPedido === 'PENDIENTE_DE_PAGO' ? 'Pagar' : 'Ver';
      return `
      <tr>
        <td class="mono">${escapar(p.numPedido)}</td>
        <td>${fecha(p.fecha)}</td>
        <td>${piezas === 1 ? '1 prenda' : piezas + ' prendas'}</td>
        <td>${entrega}</td>
        <td class="mono">${pesos(p.total)}</td>
        <td><span class="estado ${estado.clase}">${estado.texto}</span></td>
        <td><a class="btn ${accion === 'Pagar' ? '' : 'sec '}chico" href="estadoPedido.html?pedido=${p.idPedido}">${accion}</a></td>
      </tr>`;
    })
    .join('');
}
