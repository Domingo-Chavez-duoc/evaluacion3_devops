package com.citt.persistence.services;

import com.citt.exceptions.DespachoNotFoundException;
import com.citt.persistence.entity.Despacho;

import java.util.List;

public interface DespachoService {
    List<Despacho> getAllDespachos();
    Despacho createDespacho(Despacho despacho);
    Despacho updateDespacho(Long idDespacho, Despacho despacho);
    void deleteDespacho(Long idDespacho) throws DespachoNotFoundException, DespachoNotFoundException;
    Despacho getDespachoById(Long idDespacho);}