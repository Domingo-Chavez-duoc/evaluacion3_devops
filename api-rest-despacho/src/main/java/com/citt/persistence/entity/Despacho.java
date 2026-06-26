package com.citt.persistence.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Entity
@Table(name = "despachos")
public class Despacho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDespacho;

    @NotNull(message = "El ID de la venta no puede ser nulo")
    private Long idVenta;

    @NotBlank(message = "La dirección de envío no puede estar vacía")
    private String direccion;

    // Corrección 4.4: Cambiado de @NotBlank a @NotNull para tipos Boolean
    @NotNull(message = "El estado despachado es obligatorio")
    private Boolean despachado = false;

    private Integer intento = 1;
}