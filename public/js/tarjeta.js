// Simula la pasarela en el navegador: la tarjeta se vuelve un token
// y el numero nunca llega al servidor.
//   termina en 0002 -> rechazada (2.2.5)
//   termina en 0119 -> sin conexion (2.2.7)
//   cualquier otra  -> aprobada

function luhnValido(numero) {
  let suma = 0;
  let doble = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let digito = Number(numero[i]);
    if (doble) {
      digito *= 2;
      if (digito > 9) {
        digito -= 9;
      }
    }
    suma += digito;
    doble = !doble;
  }
  return suma % 10 === 0;
}

// vencimiento en formato MM/AA. Si algo esta mal lanza un Error con el motivo.
function tokenizarTarjeta({ numero, vencimiento, cvv, titular }) {
  numero = numero.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(numero) || !luhnValido(numero)) {
    throw new Error('El número de tarjeta no es válido.');
  }
  const [mes, anio] = vencimiento.split('/').map(Number);
  const hoy = new Date();
  const vence = new Date(2000 + anio, mes); // primer dia del mes siguiente
  if (!mes || mes > 12 || !anio || vence <= hoy) {
    throw new Error('La fecha de vencimiento no es válida.');
  }
  if (!/^\d{3,4}$/.test(cvv)) {
    throw new Error('El CVV no es válido.');
  }
  if (!titular.trim()) {
    throw new Error('Falta el nombre del titular.');
  }

  const terminacion = numero.slice(-4);
  let tokenTarjeta = 'tok_' + Date.now();
  if (terminacion === '0002') {
    tokenTarjeta = 'tok_rechazada';
  } else if (terminacion === '0119') {
    tokenTarjeta = 'tok_sin_conexion';
  }
  return { tokenTarjeta, terminacion };
}
