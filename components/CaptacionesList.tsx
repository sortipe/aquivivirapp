import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from 'react';
import { SearchIcon } from '@/components/icons/SearchIcon';
import { PlusIcon } from '@/components/icons/PlusIcon';
import { ClipboardDocumentCheckIcon } from '@/components/icons/ClipboardDocumentCheckIcon';

const CaptacionesList = ({ captaciones, onSelectCaptacion, onAddCaptacion }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCaptaciones = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) {
            return captaciones;
        }
        return captaciones.filter(c =>
            (c.title && c.title.toLowerCase().includes(lowercasedFilter)) ||
            (c.description && c.description.toLowerCase().includes(lowercasedFilter)) ||
            (c.ownerData && c.ownerData.name && c.ownerData.name.toLowerCase().includes(lowercasedFilter)) ||
            (c.propertyData && c.propertyData.address && c.propertyData.address.toLowerCase().includes(lowercasedFilter))
        );
    }, [captaciones, searchTerm]);

    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-3xl font-bold text-slate-800", children: "Listado de Captaciones" }), _jsxs("button", { onClick: onAddCaptacion, className: "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500", children: [_jsx(PlusIcon, {}), _jsx("span", { className: "ml-2", children: "Nueva Captación" })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "p-4 border-b border-slate-200", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(SearchIcon, {}) }), _jsx("input", { type: "text", placeholder: "Buscar por título, propietario, dirección...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500" })] }) }), filteredCaptaciones.length > 0 ? (_jsx("ul", { className: "divide-y divide-slate-200", children: filteredCaptaciones.map(captacion => (_jsx("li", { children: _jsx("button", { onClick: () => onSelectCaptacion(captacion.id), className: "w-full text-left p-4 hover:bg-slate-50 focus:outline-none focus:bg-slate-100 transition", children: _jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "flex-shrink-0 h-10 w-10 flex items-center justify-center bg-orange-100 rounded-lg text-orange-600", children: _jsx(ClipboardDocumentCheckIcon, { className: "h-6 w-6" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-x-3", children: [_jsx("p", { className: "text-md font-semibold text-slate-800 truncate", children: captacion.title || 'Captación sin Título' }), _jsx("span", { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${captacion.status === 'Borrador' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`, children: captacion.status || 'Completado' })] }), _jsx("p", { className: "text-sm text-slate-500 truncate mt-1", children: captacion.propertyData?.address || 'Sin dirección' }), _jsxs("p", { className: "text-sm text-slate-500", children: ["Propietario: ", _jsx("span", { className: "font-medium text-slate-700", children: captacion.ownerData?.name || 'No asignado' })] })] })] }) }) }, captacion.id))) })) : (_jsx("p", { className: "text-center text-slate-500 p-8", children: "No se encontraron captaciones." }))] })] }));
};

export default CaptacionesList;