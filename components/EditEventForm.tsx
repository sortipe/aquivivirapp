
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { EventType } from '@/types';
const EditEventForm = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(initialData);
    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.title) {
            onSubmit(formData);
        }
    };
    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "date", className: "block text-sm font-medium text-slate-700", children: "Fecha" }), _jsx("input", { type: "date", id: "date", name: "date", value: formData.date, onChange: handleChange, required: true, className: inputStyle })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "title", className: "block text-sm font-medium text-slate-700", children: "Título del Evento" }), _jsx("input", { type: "text", id: "title", name: "title", value: formData.title, onChange: handleChange, required: true, className: inputStyle })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "type", className: "block text-sm font-medium text-slate-700", children: "Tipo de Evento" }), _jsx("select", { id: "type", name: "type", value: formData.type, onChange: handleChange, className: inputStyle, children: Object.keys(EventType).map(key => _jsx("option", { value: EventType[key], children: EventType[key] }, key)) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-slate-700", children: "Descripción (Opcional)" }), _jsx("textarea", { id: "description", name: "description", value: formData.description || '', onChange: handleChange, rows: 3, className: inputStyle })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-6", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }), _jsx("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600", children: "Actualizar Evento" })] })] }));
};
export default EditEventForm;
