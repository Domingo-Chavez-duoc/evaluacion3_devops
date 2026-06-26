package com.citt;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test") // Corrección 4.2: Fuerza el uso del perfil de test
class SpringbootApiRestApplicationTests {

    @Test
    void contextLoads() {
        // La prueba pasa si el contexto de Spring arranca correctamente con H2
    }
}