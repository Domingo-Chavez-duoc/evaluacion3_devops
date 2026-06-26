package com.citt.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "API de Ventas - InnoTech",
        version = "1.0",
        description = "Documentación de los endpoints para el módulo de Ventas"
    )
)
public class OpenApiConfig { // Corrección 4.3: Nombre de clase corregido uniforme con Despachos
}