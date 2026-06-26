package com.citt.persistence.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "ventas")
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "La dirección de compra no puede estar en blanco")
    private String direccionCompra;

    @NotNull(message = "La fecha de compra es obligatoria")
    private LocalDate fechaCompra;

    @NotNull(message = "El estado del despacho generado es obligatorio")
    private Boolean despachoGenerado = false;

    // Corrección 4.8: Se cambia 'int' (primitivo) por 'Integer' (Objeto) 
    // para permitir valores nulos en el @PutMapping y evitar que se pise con un 0 por defecto.
    private Integer valorCompra;
}