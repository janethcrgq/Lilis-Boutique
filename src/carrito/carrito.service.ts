import { Inject, Injectable } from '@nestjs/common';
import type { Carrito, DetalleCarrito } from './dominio/entidades';
import type { CarritoRepository } from './dominio/carrito.repository';
import {
  CarritoVacioError,
  DetalleNoEncontradoError,
  PrendaNoEncontradaError,
  SinExistenciaError,
} from './dominio/errores';
import { AgregarPrendaDto } from './dto/agregar-prenda.dto';
import { CambiarCantidadDto } from './dto/cambiar-cantidad.dto';
import { CARRITO_REPOSITORY } from './carrito.tokens';

const MINUTOS_RESERVA = 15;

@Injectable()
export class CarritoService {
  constructor(
    @Inject(CARRITO_REPOSITORY)
    private readonly repo: CarritoRepository,
  ) {}

  verCarrito(idCliente: number): Promise<Carrito | null> {
    return this.repo.buscarCarrito(idCliente);
  }

  // Pasos 1-2 del CU.
  async agregarPrenda(
    idCliente: number,
    dto: AgregarPrendaDto,
  ): Promise<Carrito> {
    const prenda = await this.repo.buscarPrenda(dto.idVariante);
    if (!prenda) {
      throw new PrendaNoEncontradaError(dto.idVariante);
    }

    // Si la clienta no tenia carrito se crea un pedido EN_CARRITO.
    const carrito =
      (await this.repo.buscarCarrito(idCliente)) ??
      (await this.repo.crearCarrito(idCliente));

    // Si la prenda ya estaba en el carrito solo se suma la cantidad.
    const yaEsta = carrito.detalles.find(
      (d) => d.idVariante === dto.idVariante,
    );
    if (yaEsta) {
      await this.repo.cambiarCantidad(
        yaEsta.idDetallePedido,
        yaEsta.cantidad + dto.cantidad,
      );
    } else {
      await this.repo.agregarDetalle(
        carrito.idPedido,
        dto.idVariante,
        dto.cantidad,
        prenda.precio,
      );
    }

    return this.actualizar(idCliente);
  }

  // 2.2.1: modificar la cantidad de una prenda.
  async cambiarCantidad(
    idCliente: number,
    idDetallePedido: number,
    dto: CambiarCantidadDto,
  ): Promise<Carrito> {
    if (dto.cantidad === 0) {
      return this.eliminarPrenda(idCliente, idDetallePedido);
    }

    const carrito = await this.carritoDe(idCliente);
    this.detalleDe(carrito, idDetallePedido);
    await this.repo.cambiarCantidad(idDetallePedido, dto.cantidad);
    return this.actualizar(idCliente);
  }

  // 2.2.1: eliminar una prenda del carrito.
  async eliminarPrenda(
    idCliente: number,
    idDetallePedido: number,
  ): Promise<Carrito> {
    const carrito = await this.carritoDe(idCliente);
    this.detalleDe(carrito, idDetallePedido);
    await this.repo.eliminarDetalle(idDetallePedido);
    return this.actualizar(idCliente);
  }

  // Paso 6 del CU: validar existencia y apartar el stock 15 minutos.
  async procederAlPago(
    idCliente: number,
  ): Promise<{ carrito: Carrito; expiraEn: Date }> {
    const carrito = await this.carritoDe(idCliente);
    if (carrito.detalles.length === 0) {
      throw new CarritoVacioError();
    }

    const expiraEn = await this.reservar(carrito);
    return { carrito, expiraEn };
  }

  private async actualizar(idCliente: number): Promise<Carrito> {
    const carrito = await this.carritoDe(idCliente);
    const subtotal = carrito.detalles.reduce(
      (suma, d) => suma + d.precioUnitario * d.cantidad,
      0,
    );
    carrito.subtotal = Math.round(subtotal * 100) / 100;
    await this.repo.guardarSubtotal(carrito.idPedido, carrito.subtotal);

    // REGLA (2.2.6-B): si el carrito queda vacio se libera la reserva.
    if (carrito.detalles.length === 0) {
      await this.repo.liberarReservas(carrito.idPedido);
      return carrito;
    }

    // REGLA (2.2.1): si ya habia reserva activa se ajusta a las nuevas cantidades.
    const reservas = await this.repo.buscarReservas(
      carrito.idPedido,
      new Date(),
    );
    if (reservas.length > 0) {
      await this.reservar(carrito);
    }
    return carrito;
  }

  private async reservar(carrito: Carrito): Promise<Date> {
    const ahora = new Date();

    // REGLA (2.2.6-A): lo disponible es el stock menos lo que otras
    // clientas tienen reservado en este momento.
    for (const d of carrito.detalles) {
      const reservado = await this.repo.reservadoPorOtros(
        d.idVariante,
        carrito.idPedido,
        ahora,
      );
      const disponibles = d.stock - reservado;
      if (d.cantidad > disponibles) {
        throw new SinExistenciaError(
          d.nombre,
          d.talla,
          d.color,
          Math.max(disponibles, 0),
        );
      }
    }

    const expiraEn = new Date(ahora.getTime() + MINUTOS_RESERVA * 60 * 1000);
    await this.repo.reservar(
      carrito.idPedido,
      carrito.detalles.map((d) => ({
        idVariante: d.idVariante,
        cantidad: d.cantidad,
      })),
      expiraEn,
    );
    return expiraEn;
  }

  private async carritoDe(idCliente: number): Promise<Carrito> {
    const carrito = await this.repo.buscarCarrito(idCliente);
    if (!carrito) {
      throw new CarritoVacioError();
    }
    return carrito;
  }

  private detalleDe(carrito: Carrito, idDetallePedido: number): DetalleCarrito {
    const detalle = carrito.detalles.find(
      (d) => d.idDetallePedido === idDetallePedido,
    );
    if (!detalle) {
      throw new DetalleNoEncontradoError(idDetallePedido);
    }
    return detalle;
  }
}
