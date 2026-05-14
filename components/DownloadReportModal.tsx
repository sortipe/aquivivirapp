import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { ReportSections } from '@/types';

const DownloadReportModal = ({ isOpen, onClose, onGenerate }) => {
  if (!isOpen) return null;

  const [sections, setSections] = useState<ReportSections>({
    description: true,
    details: true,
    gallery: true,
    location: true,
    documents: false, // Default off as it's new
  });

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSections(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = () => {
    onGenerate(sections);
  };

  const checkboxOptions = [
    { name: 'description', label: 'Descripción' },
    { name: 'details', label: 'Detalles y Características' },
    { name: 'gallery', label: 'Galería de Imágenes' },
    { name: 'location', label: 'Ubicación (Mapa)' },
    { name: 'documents', label: 'Documentos' },
  ];

  return (
    _jsx("div", { className: "fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4", onClick: onClose, children: 
      _jsxs("div", { className: "bg-white rounded-lg shadow-2xl w-full max-w-md", onClick: e => e.stopPropagation(), children: [
        _jsxs("div", { className: "p-4 border-b border-slate-200 flex justify-between items-center", children: [
          _jsx("h2", { className: "text-xl font-bold text-slate-800", children: "Personalizar Reporte PDF" }),
          _jsx("button", { onClick: onClose, className: "p-2 rounded-full text-slate-500 hover:bg-slate-100", "aria-label": "Cerrar modal", children: _jsx(CloseIcon, {}) })
        ]}),
        _jsxs("div", { className: "p-6 space-y-4", children: [
          _jsx("p", { className: "text-sm text-slate-600", children: "Seleccione las secciones que desea incluir en el archivo PDF." }),
          _jsx("div", { className: "space-y-3", children: 
            checkboxOptions.map(option => (
              _jsxs("label", { className: "flex items-center space-x-3 p-3 bg-slate-50 rounded-md hover:bg-slate-100 cursor-pointer", children: [
                _jsx("input", {
                  type: "checkbox",
                  name: option.name,
                  checked: sections[option.name as keyof ReportSections],
                  onChange: handleCheckboxChange,
                  className: "h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                }),
                _jsx("span", { className: "font-medium text-slate-700", children: option.label })
              ] }, option.name)
            ))
          })
        ]}),
        _jsxs("div", { className: "p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center space-x-3", children: [
          _jsx("button", { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }),
          _jsx("button", { onClick: handleSubmit, className: "px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600", children: "Generar PDF" })
        ]})
      ]})
    })
  );
};

export default DownloadReportModal;
