import React from 'react';

export const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose} // Sugerencia 4.14: Cerrar al hacer click afuera
    >
      <div 
        className="bg-white p-6 rounded shadow-lg max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()} // Corrección 4.14: Paréntesis añadidos a stopPropagation()
      >
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 font-bold"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};