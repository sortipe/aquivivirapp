import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { DownloadIcon } from '@/components/icons/DownloadIcon';

const DownloadLinkModal = ({ isOpen, onClose, downloadUrl, filename }) => {
  if (!isOpen) return null;

  const handleDownloadClick = () => {
    // We close the modal after the click, giving the browser time to process.
    setTimeout(onClose, 500);
  };

  return (
    _jsx("div", { className: "fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4", onClick: onClose, children: 
      _jsxs("div", { className: "bg-white rounded-lg shadow-2xl w-full max-w-sm", onClick: e => e.stopPropagation(), children: [
        _jsxs("div", { className: "p-4 border-b border-slate-200 flex justify-between items-center", children: [
          _jsx("h2", { className: "text-xl font-bold text-slate-800", children: "Archivo Listo para Descargar" }),
          _jsx("button", { onClick: onClose, className: "p-2 rounded-full text-slate-500 hover:bg-slate-100", "aria-label": "Cerrar modal", children: _jsx(CloseIcon, {}) })
        ]}),
        _jsxs("div", { className: "p-6 text-center", children: [
          _jsx("p", { className: "text-slate-600 mb-6", children: "Tu archivo está listo. Por favor, haz clic en el botón de abajo para iniciar la descarga." }),
          _jsxs("a", {
            href: downloadUrl,
            download: filename,
            onClick: handleDownloadClick,
            className: "inline-flex items-center justify-center w-full px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500",
            children: [_jsx(DownloadIcon, { className: "h-5 w-5 mr-3" }), "Descargar Archivo"]
          }),
          _jsx("p", { className: "text-xs text-slate-400 mt-4", children: "Si la descarga no comienza, es posible que necesites mantener presionado el botón y seleccionar \"Guardar enlace\"." })
        ]})
      ]})
    })
  );
};

export default DownloadLinkModal;