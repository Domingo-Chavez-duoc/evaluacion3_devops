import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FormCierreDespacho } from './FormCierreDespacho';

export const TableDespachos = () => {
  const [despachos, setDespachos] = useState([]);
  const [selectedDespacho, setSelectedDespacho] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDespachos = async () => {
    try {
      // Corrección 4.1: Variable de entorno
      const response = await axios.get(`${import.meta.env.VITE_API_DESPACHOS}`);
      setDespachos(response.data);
    } catch (error) {
      console.error("Error al cargar despachos:", error);
    }
  };

  useEffect(() => {
    fetchDespachos();
  }, []);

  const handleCerrarDespacho = (despacho) => {
    setSelectedDespacho(despacho);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Listado de Despachos</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Despacho</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {despachos.map((despacho) => (
            <tr key={despacho.idDespacho || despacho.id}>
              <td className="px-6 py-4 whitespace-nowrap text-gray-900">{despacho.idDespacho || despacho.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">{despacho.direccion}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {/* Corrección 4.5: leer despacho.despachado de la entidad */}
                {despacho.despachado ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Entregado
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Despacho pendiente
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {!despacho.despachado && (
                  <button
                    onClick={() => handleCerrarDespacho(despacho)}
                    className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 transition-colors"
                  >
                    Cerrar Despacho
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && selectedDespacho && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full relative">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 font-bold"
            >
              ✕
            </button>
            <FormCierreDespacho 
              despacho={selectedDespacho} 
              onClose={() => {
                setIsModalOpen(false);
                fetchDespachos();
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};