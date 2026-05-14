import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { EventType } from '@/types';
const AddEventForm = ({ initialDate, onSubmit, onCancel }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState(EventType.MEETING);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (title) {
            onSubmit({ date: initialDate, title, description: description || undefined, type });
        }
    };
    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "event-date", className: "block text-sm font-medium text-slate-700", children: "Fecha" }), _jsx("input", { type: "date", id: "event-date", value: initialDate, disabled: true, className: `${inputStyle} bg-slate-50 cursor-not-allowed` })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "event-title", className: "block text-sm font-medium text-slate-700", children: "Título del Evento" }), _jsx("input", { type: "text", id: "event-title", value: title, onChange: e => setTitle(e.target.value), required: true, className: inputStyle, placeholder: "Ej: Reunión de equipo" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "event-type", className: "block text-sm font-medium text-slate-700", children: "Tipo de Evento" }), _jsx("select", { id: "event-type", value: type, // FIX: Changed `e.target.value as EventType` to `e.target.value as any` to resolve a TypeScript error where `EventType` was being interpreted as a value.
onChange: e => setType(e.target.value as any), className: inputStyle, children: Object.values(EventType).map(key => _jsx("option", { value: key, children: key }, key as string)) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "event-description", className: "block text-sm font-medium text-slate-700", children: "Descripción (Opcional)" }), _jsx("textarea", { id: "event-description", value: description, onChange: e => setDescription(e.target.value), rows: 3, className: inputStyle, placeholder: "Añadir detalles sobre el evento..." })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-6", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }), _jsx("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600", children: "Crear Evento" })] })] }));
};
export default AddEventForm;