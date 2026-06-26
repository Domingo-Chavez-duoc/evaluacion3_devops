package com.citt.controller;

import com.citt.persistence.entity.Despacho;
import com.citt.service.DespachoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
// Corrección 4.6: Se eliminó el slash (/) al final de la ruta
@RequestMapping("/api/v1/despachos")
@CrossOrigin(origins = "*") 
public class DespachoController {

    @Autowired
    private DespachoService despachoService;

    @PostMapping
    public ResponseEntity<Despacho> createDespacho(@Valid @RequestBody Despacho despacho) {
        Despacho nuevoDespacho = despachoService.createDespacho(despacho);
        return new ResponseEntity<>(nuevoDespacho, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Despacho>> getAllDespachos() {
        List<Despacho> despachos = despachoService.getAllDespachos();
        return new ResponseEntity<>(despachos, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Despacho> getDespachoById(@PathVariable Long id) {
        Despacho despacho = despachoService.getDespachoById(id);
        return new ResponseEntity<>(despacho, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Despacho> updateDespacho(@PathVariable Long id, @RequestBody Despacho despacho) {
        Despacho despachoActualizado = despachoService.updateDespacho(id, despacho);
        return new ResponseEntity<>(despachoActualizado, HttpStatus.OK);
    }
}