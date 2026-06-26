import React from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import Swal from 'sweetalert2';

export const FormDespacho = ({ venta, onClose }) => {
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    try {
      // Corrección 4.1: Uso de variables de entorno
      // 1. Marcar despachoGenerado: true en la API de Ventas
      await axios.put(`${import.meta.env.VITE_API_VENTAS}/${venta.id}`, {
        ...venta,
        despachoGenerado: true
      });

      // Corrección 4.5: unificar el campo usando 'despachado' en vez de 'entregado'
      const nuevoDespacho = {
        idVenta: venta.id,
        direccion: venta.direccionCompra,
        despachado: false, 
        intento: 1,
        ...data
      };

      await axios.post(`${import.meta.env.VITE_API_DESPACHOS}`, nuevoDespacho);

      Swal.fire({
        title: '¡Éxito!',
        text: 'Despacho generado correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      onClose();
    } catch (error) {
      console.error("Error al generar despacho:", error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al procesar el despacho.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Generar Despacho para Venta #{venta.id}</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">Dirección de Envío</label>
        <input
          type="text"
          disabled
          defaultValue={venta.direccionCompra}
          className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded p-2 text-gray-600"
        />
      </div>
      <div className="flex justify-end space-x-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded text-gray-700 hover:bg-gray-400 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700 transition-colors"
        >
          Confirmar Despacho
        </button>
      </div>
    </form>
  );
};