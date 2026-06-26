import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FormDespacho } from './FormDespacho'; 

export const TableCompras = () => {
  const [ventas, setVentas] = useState([]);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchVentas = async () => {
    try {
      // Corrección 4.1: Uso de variable de entorno
      const response = await axios.get(`${import.meta.env.VITE_API_VENTAS}`);
      // Filtrar las ventas que no tienen despacho generado
      const filtradas = response.data.filter(v => !v.despachoGenerado);
      setVentas(filtradas);
    } catch (error) {
      console.error("Error al cargar ventas:", error);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  const handleGenerarDespacho = (venta) => {
    setSelectedVenta(venta);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Compras sin Despacho</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Venta</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {ventas.map((venta) => (
            <tr key={venta.id}>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{venta.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">{venta.direccionCompra}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(venta.fechaCompra).toLocaleDateString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleGenerarDespacho(venta)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  Generar Despacho
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && selectedVenta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full relative">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 font-bold"
            >
              ✕
            </button>
            <FormDespacho 
              venta={selectedVenta} 
              onClose={() => {
                setIsModalOpen(false);
                fetchVentas();
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};