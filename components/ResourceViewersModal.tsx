
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { UserIcon } from '@/components/icons/UserIcon';

const ResourceViewersModal = ({ isOpen, onClose, resource, users }) => {
    if (!isOpen)
        return null;

    const viewers = users.filter(user => (resource.viewedBy || []).includes(user.id));

    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4", onClick: onClose, children: _jsxs("div", { className: "bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0", children: [_jsx("h2", { className: "text-xl font-bold text-slate-800 truncate pr-4", children: "Visto por" }), _jsx("button", { onClick: onClose, className: "p-2 rounded-full text-slate-500 hover:bg-slate-100", "aria-label": "Cerrar modal", children: _jsx(CloseIcon, {}) })] }), _jsxs("div", { className: "p-6 overflow-y-auto", children: [_jsx("p", { className: "text-sm text-slate-500 mb-1", children: "Recurso:" }), _jsx("h3", { className: "text-lg font-semibold text-slate-900 mb-4", children: resource.title }), viewers.length > 0 ? (_jsx("ul", { className: "space-y-3", children: viewers.map(user => (_jsxs("li", { className: "flex items-center p-2 bg-slate-50 rounded-md", children: [_jsx("span", { className: "inline-block h-8 w-8 rounded-full overflow-hidden bg-slate-200", children: _jsx("svg", { className: "h-full w-full text-slate-400", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" }) }) }), _jsx("span", { className: "ml-3 font-medium text-slate-700", children: user.name })] }, user.id))) })) : (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "mx-auto h-12 w-12 flex items-center justify-center bg-slate-100 rounded-full", children: _jsx(UserIcon, {}) }), _jsx("p", { className: "mt-4 text-sm font-medium text-slate-600", children: "Aún no ha sido visto por ningún trabajador." })] }))] })] }) }));
};

export default ResourceViewersModal;
