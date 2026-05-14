import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';

const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmButtonText = "Confirmar" }) => {
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl p-6 w-full max-w-sm", children: [_jsx("h2", { className: "text-lg font-bold text-slate-900", children: title }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: message }), _jsxs("div", { className: "mt-6 flex justify-end space-x-3", children: [_jsx("button", { onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none", children: "Cancelar" }), _jsx("button", { onClick: onConfirm, className: "px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none", children: confirmButtonText })] })] }) }));
};

export default ConfirmationModal;
