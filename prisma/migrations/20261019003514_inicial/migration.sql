-- CreateTable
CREATE TABLE `Usuario` (
    `idUsuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `correo` VARCHAR(191) NOT NULL,
    `contraseniaHash` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `rol` ENUM('CLIENTE', 'DUEÑA', 'VENDEDORA') NOT NULL,

    UNIQUE INDEX `Usuario_correo_key`(`correo`),
    PRIMARY KEY (`idUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cliente` (
    `idUsuario` INTEGER NOT NULL,

    PRIMARY KEY (`idUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ZonaEnvio` (
    `idZona` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `costoEnvio` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`idZona`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Direccion` (
    `idDireccion` INTEGER NOT NULL AUTO_INCREMENT,
    `idCliente` INTEGER NOT NULL,
    `idZona` INTEGER NOT NULL,
    `calle` VARCHAR(191) NOT NULL,
    `numeroCasa` VARCHAR(191) NOT NULL,
    `colonia` VARCHAR(191) NOT NULL,
    `referencias` VARCHAR(191) NULL,

    PRIMARY KEY (`idDireccion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categoria` (
    `idCategoria` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,

    PRIMARY KEY (`idCategoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Producto` (
    `idProducto` INTEGER NOT NULL AUTO_INCREMENT,
    `idCategoria` INTEGER NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `precio` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`idProducto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VarianteProducto` (
    `idVariante` INTEGER NOT NULL AUTO_INCREMENT,
    `idProducto` INTEGER NOT NULL,
    `talla` ENUM('XS', 'S', 'M', 'L', 'XL', '22', '22.5', '23', '23.5', '24', '24.5', '25', '25.5', '26', '26.5', '27', 'UNITALLA') NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `imagenURL` VARCHAR(191) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`idVariante`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resena` (
    `idResena` INTEGER NOT NULL AUTO_INCREMENT,
    `idCliente` INTEGER NOT NULL,
    `idProducto` INTEGER NOT NULL,
    `calificacion` INTEGER NOT NULL,
    `comentario` TEXT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`idResena`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SalidaInventario` (
    `idSalida` INTEGER NOT NULL AUTO_INCREMENT,
    `idVariante` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `motivo` VARCHAR(191) NOT NULL,
    `cantidad` INTEGER NOT NULL,

    PRIMARY KEY (`idSalida`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pedido` (
    `idPedido` INTEGER NOT NULL AUTO_INCREMENT,
    `idCliente` INTEGER NOT NULL,
    `numPedido` VARCHAR(191) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `estadoPedido` ENUM('EN_CARRITO', 'PENDIENTE_DE_PAGO', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO') NOT NULL DEFAULT 'EN_CARRITO',
    `metodoEntrega` ENUM('DOMICILIO', 'RECOGER_EN_BOUTIQUE') NULL,
    `fechaLimitePago` DATETIME(3) NULL,

    UNIQUE INDEX `Pedido_numPedido_key`(`numPedido`),
    PRIMARY KEY (`idPedido`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetallePedido` (
    `idDetallePedido` INTEGER NOT NULL AUTO_INCREMENT,
    `idPedido` INTEGER NOT NULL,
    `idVariante` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precioUnitario` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`idDetallePedido`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reserva` (
    `idReserva` INTEGER NOT NULL AUTO_INCREMENT,
    `idPedido` INTEGER NOT NULL,
    `idVariante` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `expiraEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`idReserva`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Apartado` (
    `idPedido` INTEGER NOT NULL,
    `folio` VARCHAR(191) NOT NULL,
    `fechaLimite` DATETIME(3) NOT NULL,
    `montoApartado` DECIMAL(10, 2) NOT NULL,
    `estadoApartado` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Apartado_folio_key`(`folio`),
    PRIMARY KEY (`idPedido`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Envio` (
    `idEnvio` INTEGER NOT NULL AUTO_INCREMENT,
    `idPedido` INTEGER NOT NULL,
    `idDireccion` INTEGER NOT NULL,
    `linkSeguimiento` VARCHAR(191) NULL,
    `nombreRepartidor` VARCHAR(191) NULL,
    `placas` VARCHAR(191) NULL,
    `costoEnvio` DECIMAL(10, 2) NOT NULL,
    `estadoEnvio` ENUM('PREPARANDO', 'EN_CAMINO', 'ENTREGADO') NOT NULL DEFAULT 'PREPARANDO',

    UNIQUE INDEX `Envio_idPedido_key`(`idPedido`),
    PRIMARY KEY (`idEnvio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pago` (
    `idPago` INTEGER NOT NULL AUTO_INCREMENT,
    `idPedido` INTEGER NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estadoPago` ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    `metodo` ENUM('TARJETA', 'TRANSFERENCIA', 'CONTRA_ENTREGA') NOT NULL,

    PRIMARY KEY (`idPago`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PagoTarjeta` (
    `idPago` INTEGER NOT NULL,
    `idTransaccion` VARCHAR(191) NULL,
    `respuestaPasarela` TEXT NULL,

    PRIMARY KEY (`idPago`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PagoTransferencia` (
    `idPago` INTEGER NOT NULL,
    `numeroReferencia` VARCHAR(191) NULL,
    `comprobanteURL` VARCHAR(191) NULL,

    PRIMARY KEY (`idPago`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PagoContraEntrega` (
    `idPago` INTEGER NOT NULL,
    `folio` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `PagoContraEntrega_folio_key`(`folio`),
    PRIMARY KEY (`idPago`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Proveedor` (
    `idProveedor` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `correo` VARCHAR(191) NULL,

    PRIMARY KEY (`idProveedor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Compra` (
    `idCompra` INTEGER NOT NULL AUTO_INCREMENT,
    `idUsuario` INTEGER NOT NULL,
    `idProveedor` INTEGER NOT NULL,
    `folio` VARCHAR(191) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `total` DECIMAL(10, 2) NOT NULL,

    UNIQUE INDEX `Compra_folio_key`(`folio`),
    PRIMARY KEY (`idCompra`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetalleCompra` (
    `idDetalleCompra` INTEGER NOT NULL AUTO_INCREMENT,
    `idCompra` INTEGER NOT NULL,
    `idVariante` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `costo` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`idDetalleCompra`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Devolucion` (
    `idDevolucion` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `motivo` VARCHAR(191) NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `estadoProducto` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`idDevolucion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DevolucionCliente` (
    `idDevolucion` INTEGER NOT NULL,
    `idDetallePedido` INTEGER NOT NULL,
    `idVarianteCambio` INTEGER NULL,

    PRIMARY KEY (`idDevolucion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DevolucionProveedor` (
    `idDevolucion` INTEGER NOT NULL,
    `idDetalleCompra` INTEGER NOT NULL,

    PRIMARY KEY (`idDevolucion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Direccion` ADD CONSTRAINT `Direccion_idCliente_fkey` FOREIGN KEY (`idCliente`) REFERENCES `Cliente`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Direccion` ADD CONSTRAINT `Direccion_idZona_fkey` FOREIGN KEY (`idZona`) REFERENCES `ZonaEnvio`(`idZona`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_idCategoria_fkey` FOREIGN KEY (`idCategoria`) REFERENCES `Categoria`(`idCategoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VarianteProducto` ADD CONSTRAINT `VarianteProducto_idProducto_fkey` FOREIGN KEY (`idProducto`) REFERENCES `Producto`(`idProducto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resena` ADD CONSTRAINT `Resena_idCliente_fkey` FOREIGN KEY (`idCliente`) REFERENCES `Cliente`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resena` ADD CONSTRAINT `Resena_idProducto_fkey` FOREIGN KEY (`idProducto`) REFERENCES `Producto`(`idProducto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SalidaInventario` ADD CONSTRAINT `SalidaInventario_idVariante_fkey` FOREIGN KEY (`idVariante`) REFERENCES `VarianteProducto`(`idVariante`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido` ADD CONSTRAINT `Pedido_idCliente_fkey` FOREIGN KEY (`idCliente`) REFERENCES `Cliente`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetallePedido` ADD CONSTRAINT `DetallePedido_idPedido_fkey` FOREIGN KEY (`idPedido`) REFERENCES `Pedido`(`idPedido`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetallePedido` ADD CONSTRAINT `DetallePedido_idVariante_fkey` FOREIGN KEY (`idVariante`) REFERENCES `VarianteProducto`(`idVariante`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_idPedido_fkey` FOREIGN KEY (`idPedido`) REFERENCES `Pedido`(`idPedido`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_idVariante_fkey` FOREIGN KEY (`idVariante`) REFERENCES `VarianteProducto`(`idVariante`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Apartado` ADD CONSTRAINT `Apartado_idPedido_fkey` FOREIGN KEY (`idPedido`) REFERENCES `Pedido`(`idPedido`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Envio` ADD CONSTRAINT `Envio_idPedido_fkey` FOREIGN KEY (`idPedido`) REFERENCES `Pedido`(`idPedido`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Envio` ADD CONSTRAINT `Envio_idDireccion_fkey` FOREIGN KEY (`idDireccion`) REFERENCES `Direccion`(`idDireccion`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_idPedido_fkey` FOREIGN KEY (`idPedido`) REFERENCES `Pedido`(`idPedido`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PagoTarjeta` ADD CONSTRAINT `PagoTarjeta_idPago_fkey` FOREIGN KEY (`idPago`) REFERENCES `Pago`(`idPago`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PagoTransferencia` ADD CONSTRAINT `PagoTransferencia_idPago_fkey` FOREIGN KEY (`idPago`) REFERENCES `Pago`(`idPago`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PagoContraEntrega` ADD CONSTRAINT `PagoContraEntrega_idPago_fkey` FOREIGN KEY (`idPago`) REFERENCES `Pago`(`idPago`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Compra` ADD CONSTRAINT `Compra_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Compra` ADD CONSTRAINT `Compra_idProveedor_fkey` FOREIGN KEY (`idProveedor`) REFERENCES `Proveedor`(`idProveedor`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetalleCompra` ADD CONSTRAINT `DetalleCompra_idCompra_fkey` FOREIGN KEY (`idCompra`) REFERENCES `Compra`(`idCompra`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetalleCompra` ADD CONSTRAINT `DetalleCompra_idVariante_fkey` FOREIGN KEY (`idVariante`) REFERENCES `VarianteProducto`(`idVariante`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DevolucionCliente` ADD CONSTRAINT `DevolucionCliente_idDevolucion_fkey` FOREIGN KEY (`idDevolucion`) REFERENCES `Devolucion`(`idDevolucion`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DevolucionCliente` ADD CONSTRAINT `DevolucionCliente_idDetallePedido_fkey` FOREIGN KEY (`idDetallePedido`) REFERENCES `DetallePedido`(`idDetallePedido`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DevolucionCliente` ADD CONSTRAINT `DevolucionCliente_idVarianteCambio_fkey` FOREIGN KEY (`idVarianteCambio`) REFERENCES `VarianteProducto`(`idVariante`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DevolucionProveedor` ADD CONSTRAINT `DevolucionProveedor_idDevolucion_fkey` FOREIGN KEY (`idDevolucion`) REFERENCES `Devolucion`(`idDevolucion`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DevolucionProveedor` ADD CONSTRAINT `DevolucionProveedor_idDetalleCompra_fkey` FOREIGN KEY (`idDetalleCompra`) REFERENCES `DetalleCompra`(`idDetalleCompra`) ON DELETE RESTRICT ON UPDATE CASCADE;
