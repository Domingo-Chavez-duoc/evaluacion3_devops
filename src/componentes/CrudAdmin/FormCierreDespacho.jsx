import React from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import Swal from 'sweetalert2';

export const FormCierreDespacho = ({ despacho, onClose }) => {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      intento: despacho.intento || 1,
      despachado: despacho.despachado || false
    }
  });

  const onSubmit = async (data) => {
    try {
      const id = despacho.idDespacho || despacho.id;
      
      // Corrección 4.1 y 4.5: URL limpia y envío de parámetros consistentes
      await axios.put(`${import.meta.env.VITE_API_DESPACHOS}/${id}`, {
        ...despacho,
        intento: parseInt(data.intento),
        despachado: data.despachado === "true" || data.despachado === true
      });

      Swal.fire({
        title: '¡Actualizado!',
        text: 'El estado del despacho ha sido modificado.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      onClose();
    } catch (error) {
      console.error("Error al cerrar despacho:", error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar el despacho.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Cerrar Despacho #{despacho.idDespacho || despacho.id}</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Número de Intentos</label>
        <input
          type="number"
          {...register('intento')}
          className="mt-1 block w-full border border-gray-300 rounded p-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">¿Fue entregado con éxito?</label>
        <select
          {...register('despachado')}
          className="mt-1 block w-full border border-gray-300 rounded p-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="false">No, sigue pendiente / fallido</option>
          <option value="true">Sí, despachado con éxito</option>
        </select>
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
          className="bg-orange-600 px-4 py-2 rounded text-white hover:bg-orange-700 transition-colors"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
};