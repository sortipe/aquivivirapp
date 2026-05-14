
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// FIX: Implemented the UserForm component for creating and editing user profiles, resolving a module error.
import React, { useState, useEffect } from 'react';
import { UserRole } from '@/types';
const UserForm = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: UserRole.WORKER,
        phone: '',
        password: '',
    });
    const isEditing = !!initialData;
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                email: initialData.email,
                role: initialData.role,
                phone: initialData.phone || '',
                password: '', // Password is not pre-filled for security
            });
        }
    }, [initialData]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSend = {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            phone: formData.phone,
            // Send password only if it's a new user or the password field is filled for an existing user
            password: formData.password || (initialData?.password || '')
        };
        if (!dataToSend.password) {
            alert("La contraseña es obligatoria para nuevos usuarios.");
            return;
        }
        onSubmit(dataToSend);
    };
    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";
    return (_jsxs("form", { onSubmit: handleSubmit, className: "bg-white p-8 rounded-lg shadow-lg w-full max-w-md space-y-6", children: [_jsx("h2", { className: "text-2xl font-bold text-slate-800", children: isEditing ? 'Editar Usuario' : 'Añadir Nuevo Usuario' }), _jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-slate-700", children: "Nombre Completo" }), _jsx("input", { type: "text", name: "name", id: "name", value: formData.name, onChange: handleChange, required: true, className: inputStyle })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-slate-700", children: "Correo Electrónico" }), _jsx("input", { type: "email", name: "email", id: "email", value: formData.email, onChange: handleChange, required: true, className: inputStyle })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-slate-700", children: "Teléfono (para notificaciones)" }), _jsx("input", { type: "tel", name: "phone", id: "phone", value: formData.phone, onChange: handleChange, className: inputStyle, placeholder: "Ej: 51999888777" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "role", className: "block text-sm font-medium text-slate-700", children: "Rol" }), _jsx("select", { name: "role", id: "role", value: formData.role, onChange: handleChange, required: true, className: inputStyle, children: Object.keys(UserRole).map(key => (_jsx("option", { value: UserRole[key], children: UserRole[key] }, key))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-slate-700", children: "Contraseña" }), _jsx("input", { type: "password", name: "password", id: "password", value: formData.password, onChange: handleChange, required: !isEditing, className: inputStyle, placeholder: isEditing ? 'Dejar en blanco para no cambiar' : '' })] }), _jsxs("div", { className: "pt-6 mt-6 border-t border-slate-200 flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }), _jsx("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600", children: isEditing ? 'Actualizar Usuario' : 'Crear Usuario' })] })] }));
};
export default UserForm;
