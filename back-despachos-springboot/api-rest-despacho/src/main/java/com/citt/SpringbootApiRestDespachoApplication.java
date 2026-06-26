package com.citt;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test") // Corrección 4.2: Activar perfil de base de datos H2
class SpringbootApiRestDespachoApplicationTests {

    @Test
    void contextLoads() {
    }
}