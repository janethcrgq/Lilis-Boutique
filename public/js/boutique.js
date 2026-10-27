// Panel de pagos: la Duena aprueba transferencias y la Vendedora cobra con folio.
let pagoEncontrado = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ico-listo').innerHTML = icono('ok');
  document.getElementById('tab-transferencias').addEventListener('click', () => cambiarTab('transferencias'));
  document.getElementById('tab-cobro').addEventListener('click', () => cambiarTab('cobro'));
  document.getElementById('form-folio').addEventListener('submit', buscarFolio);
  document.getElementById('btn-cobrar').addEventListener('click', cobrar);
  document.getElementById('btn-otro').addEventListener('click', otroFolio);

  // La Duena entra a transferencias y la Vendedora a cobro.
  document.getElementById('selector-personal').addEventListener('change', (e) => {
    cambiarTab(e.target.value === '2' ? 'cobro' : 'transferencias');
  });

  cargarTransferencias();
});

function cambiarTab(tab) {
  limpiarAvisos();
  document.getElementById('tab-transferencias').classList.toggle('sel', tab === 'transferencias');
  document.getElementById('tab-cobro').classList.toggle('sel', tab === 'cobro');
  mostrar('vista-transferencias', tab === 'transferencias');
  mostrar('vista-cobro', tab === 'cobro');
  if (tab === 'transferencias') {
    cargarTransferencias();
  } else {
    document.getElementById('folio').focus();
  }
}

// ---------- 2.2.3: transferencias ----------
async function cargarTransferencias() {
  let pagos;
  try {
    pagos = await api('GET', '/boutique/transferencias');
  } catch (error) {
    avisoDeError(error);
    return;
  }

  const cuantas = document.getElementById('cuantas');
  cuantas.textContent = pagos.length;
  cuantas.classList.toggle('oculto', pagos.length === 0);
  mostrar('sin-transferencias', pagos.length === 0);

  document.getElementById('filas').innerHTML = pagos
    .map((p) => {
      const ext = p.comprobanteURL.split('.').pop().toUpperCase();
      return `
      <tr>
        <td class="mono">${escapar(p.numPedido)}</td>
        <td>${escapar(p.nombreClienta)}</td>
        <td class="mono">${pesos(p.monto)}</td>
        <td class="mono">${escapar(p.numeroReferencia || '—')}</td>
        <td><a class="archivo" style="padding:6px 10px" href="${escapar(p.comprobanteURL)}" target="_blank" rel="noopener"><span class="ext">${escapar(ext)}</span>Ver comprobante</a></td>
        <td>${fechaHora(p.fechaLimitePago)}</td>
        <td><button type="button" class="btn chico" onclick="aprobar(${p.idPago}, this)">Aprobar pago</button></td>
      </tr>`;
    })
    .join('');
}

async function aprobar(idPago, boton) {
  limpiarAvisos();
  boton.disabled = true;
  try {
    const pago = await api('POST', `/boutique/transferencias/${idPago}/aprobar`);
    mostrarAviso('ok', `Pago del pedido ${pago.numPedido} aprobado.`, `El pedido quedó pagado y le avisamos a ${pago.nombreClienta} por correo.`);
  } catch (error) {
    boton.disabled = false;
    avisoDeError(error);
    return;
  }
  cargarTransferencias();
}

// ---------- 2.2.4: cobro con folio ----------
async function buscarFolio(e) {
  e.preventDefault();
  limpiarAvisos();
  const campo = document.getElementById('campo-folio');
  const folio = document.getElementById('folio').value.trim();

  try {
    pagoEncontrado = await api('GET', `/boutique/folios/${encodeURIComponent(folio)}`);
  } catch (error) {
    pagoEncontrado = null;
    mostrar('pago-encontrado', false);
    if (error.estado === 404) {
      campo.classList.add('error');
      mostrar('ayuda-folio', true);
      return;
    }
    avisoDeError(error);
    return;
  }

  campo.classList.remove('error');
  mostrar('ayuda-folio', false);
  document.getElementById('cobro-pedido').textContent = pagoEncontrado.numPedido;
  document.getElementById('cobro-clienta').textContent = pagoEncontrado.nombreClienta;
  document.getElementById('cobro-limite').textContent = fechaHora(pagoEncontrado.fechaLimitePago);
  document.getElementById('cobro-monto').textContent = pesos(pagoEncontrado.monto);
  mostrar('pago-encontrado', true);
}

async function cobrar() {
  limpiarAvisos();
  const boton = document.getElementById('btn-cobrar');
  boton.disabled = true;
  try {
    await api('POST', `/boutique/folios/${encodeURIComponent(pagoEncontrado.folio)}/cobrar`);
  } catch (error) {
    boton.disabled = false;
    avisoDeError(error);
    return;
  }
  boton.disabled = false;

  document.getElementById('listo-detalle').innerHTML =
    `Folio <span class="mono">${escapar(pagoEncontrado.folio)}</span> · Pedido <span class="mono">${escapar(pagoEncontrado.numPedido)}</span> · ${pesos(pagoEncontrado.monto)}`;
  document.getElementById('listo-entregar').textContent = `Ya puedes entregarle sus prendas a ${pagoEncontrado.nombreClienta}.`;
  mostrar('cobro-buscar', false);
  mostrar('cobro-listo', true);
}

function otroFolio() {
  pagoEncontrado = null;
  document.getElementById('folio').value = '';
  mostrar('pago-encontrado', false);
  mostrar('cobro-listo', false);
  mostrar('cobro-buscar', true);
  document.getElementById('folio').focus();
}

function fechaHora(valor) {
  if (!valor) return '—';
  const f = new Date(valor);
  const dia = f.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dia} ${hora}`;
}
