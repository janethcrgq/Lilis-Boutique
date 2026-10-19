// Errores de las reglas de negocio. Los services los lanzan y el
// DominioExceptionFilter decide el codigo HTTP segun el tipo.
export abstract class ErrorDeDominio extends Error {}

export abstract class NoEncontradoError extends ErrorDeDominio {}

export abstract class DatoInvalidoError extends ErrorDeDominio {}

export abstract class ConflictoError extends ErrorDeDominio {}

export abstract class ServicioNoDisponibleError extends ErrorDeDominio {}
