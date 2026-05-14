
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// FIX: Implemented the AddVisitModal component to provide a modal interface for adding new visits, resolving a module error.
import React from 'react';
import AddVisitForm from '@/components/AddVisitForm';
import { CloseIcon } from '@/components/icons/CloseIcon';

const AddVisitModal = ({ isOpen, onClose, onAddVisit, properties, workers, initialDate, initialPropertyId, currentUser }) => {
    if (!isOpen)
        return null;

    const handleFormSubmit = (visitData) => {
        onAddVisit(visitData);
        onClose();
    };

    const dateString = initialDate ? new Date(initialDate).toISOString().split('T')[0] : undefined;
    
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4", onClick: onClose, children: _jsxs("div", { className: "bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0", children: [_jsx("h2", { className: "text-xl font-bold text-slate-800", children: "Generar Nueva Visita" }), _jsx("button", { onClick: onClose, className: "p-2 rounded-full text-slate-500 hover:bg-slate-100 focus:outline-none", "aria-label": "Cerrar modal", children: _jsx(CloseIcon, {}) })] }), _jsx("div", { className: "p-6 overflow-y-auto", children: _jsx(AddVisitForm, { properties: properties, workers: workers, onSubmit: handleFormSubmit, onCancel: onClose, initialDate: dateString, initialPropertyId: initialPropertyId, currentUser: currentUser }) })] }) }));
};

export default AddVisitModal;
