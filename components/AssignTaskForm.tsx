
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// FIX: Implemented the AssignTaskForm component to allow users to create and assign tasks, resolving a module error.
import React, { useState } from 'react';
const AssignTaskForm = ({ workers, onSubmit, onCancel }) => {
    const [description, setDescription] = useState('');
    const [workerId, setWorkerId] = useState(workers[0]?.id || '');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (description && workerId) {
            onSubmit(description, workerId);
        }
    };
    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-slate-700", children: "Descripción de la Tarea" }), _jsx("textarea", { id: "description", value: description, onChange: (e) => setDescription(e.target.value), rows: 3, className: inputStyle, required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "workerId", className: "block text-sm font-medium text-slate-700", children: "Asignar a" }), _jsxs("select", { id: "workerId", value: workerId, onChange: (e) => setWorkerId(e.target.value), className: inputStyle, required: true, children: [_jsx("option", { value: "", disabled: true, children: "Seleccione un trabajador" }), workers.map(worker => (_jsx("option", { value: worker.id, children: worker.name }, worker.id)))] })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-6", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }), _jsx("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600", children: "Asignar Tarea" })] })] }));
};
export default AssignTaskForm;
