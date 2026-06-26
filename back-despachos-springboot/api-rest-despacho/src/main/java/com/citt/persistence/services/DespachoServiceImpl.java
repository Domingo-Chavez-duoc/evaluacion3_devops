package com.citt.persistence.services;

import com.citt.exceptions.DespachoNotFoundException;
import com.citt.persistence.entity.Despacho;
import com.citt.persistence.repository.DespachoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DespachoServiceImpl implements DespachoService{

    @Autowired
    private DespachoRepository DespachoRepository;

    @Override
    public List<Despacho> getAllDespachos() {
        return DespachoRepository.findAll();
    }

    @Override
    public Despacho createDespacho(Despacho despacho) {
        return DespachoRepository.save(despacho);
    }

    @Override
    public Despacho updateDespacho(Long idDespacho, Despacho despacho) {
        return DespachoRepository.findById(idDespacho).map(existingDespacho -> {
            //existingDespacho.setFechaDespacho(despacho.getFechaDespacho());
            //existingDespacho.setPatenteCamion(despacho.getPatenteCamion());
            existingDespacho.setIntento(despacho.getIntento());
            existingDespacho.setIdVenta(despacho.getIdVenta());
            existingDespacho.setDireccion(despacho.getDireccion());
            //existingDespacho.setValorCompra(despacho.getValorCompra());
            //existingDespacho.setDespachado(despacho.isDespachado());
            return DespachoRepository.save(existingDespacho);
    }).orElse(null);}

    @Override
    public void deleteDespacho(Long idDespacho) throws DespachoNotFoundException {
        Optional<Despacho> despacho = DespachoRepository.findById(idDespacho);
        if(!despacho.isPresent()){
            throw new DespachoNotFoundException("¡No es posible eliminar! No existe despacho con el ID:" + idDespacho);
        }else {
            DespachoRepository.deleteById(idDespacho);
        }
    }

    @Override
    public Despacho getDespachoById(Long idDespacho){
        Optional<Despacho> despacho = DespachoRepository.findById(idDespacho);
        return despacho.get();
    }
}
