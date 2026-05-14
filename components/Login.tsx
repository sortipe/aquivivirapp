import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';

const Login = ({ logoUrl }: { logoUrl?: string }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            setError(error.message);
        }
        setIsLoading(false);
    };

    return (
        _jsx("div", { className: "min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsxs("div", { className: "h-16 flex justify-center items-center mb-4", children: [logoUrl ? (
                            _jsx("img", { src: logoUrl, alt: "Logo de la Inmobiliaria", className: "max-h-16 w-auto" })) : (
                            _jsx("div", { className: "h-16 w-48 bg-slate-200 rounded-md flex items-center justify-center", children: _jsx("span", { className: "text-sm text-slate-500", children: "Logo de la Empresa" }) }))] }), _jsx("h1", { className: "text-3xl font-bold text-slate-800 mt-2", children: "AquivivirApp" }), _jsx("p", { className: "text-slate-500 mt-1", children: "Por favor, inicie sesión para continuar" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "bg-white shadow-xl rounded-lg p-8 space-y-6", children: [error && (_jsxs("div", { className: "bg-red-100 border-l-4 border-red-500 text-red-700 p-4", role: "alert", children: [_jsx("p", { className: "font-bold", children: "Error de Autenticación" }), _jsx("p", { children: error })] })), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-slate-700", children: "Correo Electrónico" }), _jsx("input", { type: "email", id: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm", placeholder: "Ej: admin@inmo.pro", required: true, disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-slate-700", children: "Contraseña" }), _jsx("input", { type: "password", id: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm", placeholder: "••••••••", required: true, disabled: isLoading })] }), _jsx("button", { type: "submit", disabled: isLoading, className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors", children: isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' })] })] }) })
    );
};

export default Login;
