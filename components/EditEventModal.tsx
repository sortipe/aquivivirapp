
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import EditEventForm from '@/components/EditEventForm';
import { CloseIcon } from '@/components/icons/CloseIcon';
const EditEventModal = ({ isOpen, onClose, onUpdateEvent, event }) => {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4", onClick: onClose, children: _jsxs("div", { className: "bg-white rounded-lg shadow-2xl w-full max-w-lg", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "p-4 border-b border-slate-200 flex justify-between items-center", children: [_jsx("h2", { className: "text-xl font-bold text-slate-800", children: "Editar Evento" }), _jsx("button", { onClick: onClose, className: "p-2 rounded-full text-slate-500 hover:bg-slate-100", "aria-label": "Cerrar modal", children: _jsx(CloseIcon, {}) })] }), _jsx("div", { className: "p-6", children: _jsx(EditEventForm, { initialData: event, onSubmit: onUpdateEvent, onCancel: onClose }) })] }) }));
};
export default EditEventModal;
