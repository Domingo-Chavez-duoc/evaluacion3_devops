package com.citt.service;

import com.citt.persistence.entity.Venta;
import com.citt.persistence.repository.VentaRepository;
import com.citt.exceptions.VentaNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class VentaServiceImpl implements VentaService {

    @Autowired
    private VentaRepository ventaRepository;

    @Override
    public Venta createVenta(Venta venta) {
        return ventaRepository.save(venta);
    }

    @Override
    public List<Venta> getAllVentas() {
        return ventaRepository.findAll();
    }

    @Override
    public Venta getVentaById(Long id) {
        return ventaRepository.findById(id)
                .orElseThrow(() -> new VentaNotFoundException("Venta no encontrada con id: " + id));
    }

    @Override
    public Venta updateVenta(Long id, Venta venta) {
        Venta ventaExistente = getVentaById(id);

        if (Objects.nonNull(venta.getDireccionCompra()) && !"".equalsIgnoreCase(venta.getDireccionCompra())) {
            ventaExistente.setDireccionCompra(venta.getDireccionCompra());
        }

        if (Objects.nonNull(venta.getFechaCompra())) {
            ventaExistente.setFechaCompra(venta.getFechaCompra());
        }

        if (Objects.nonNull(venta.getDespachoGenerado())) {
            ventaExistente.setDespachoGenerado(venta.getDespachoGenerado());
        }

        // Corrección 4.8: Al ser Integer, Objects.nonNull() ahora sí valida correctamente
        // si el usuario mandó explícitamente un 0 o si no mandó nada (null).
        if (Objects.nonNull(venta.getValorCompra())) {
            ventaExistente.setValorCompra(venta.getValorCompra());
        }

        return ventaRepository.save(ventaExistente);
    }

    @Override
    public void deleteVenta(Long id) {
        Venta venta = getVentaById(id);
        ventaRepository.delete(venta);
    }
}