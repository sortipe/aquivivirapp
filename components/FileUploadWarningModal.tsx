import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { ExclamationTriangleIcon } from '@/components/icons/ExclamationTriangleIcon';
import { LinkIcon } from '@/components/icons/LinkIcon';
import { ArrowTopRightOnSquareIcon } from '@/components/icons/ArrowTopRightOnSquareIcon';

const FileUploadWarningModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) {
        return null;
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpenInBrowser = () => {
        window.open(window.location.href, '_blank');
        onClose();
    };

    return (
        _jsx("div", {
            className: "fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4",
            onClick: onClose,
            "aria-modal": "true",
            role: "dialog",
            children: _jsxs("div", {
                className: "bg-white rounded-lg shadow-2xl w-full max-w-md",
                onClick: e => e.stopPropagation(),
                children: [
                    _jsxs("div", {
                        className: "p-4 border-b border-slate-200 flex justify-between items-center",
                        children: [
                            _jsxs("div", {
                                className: "flex items-center",
                                children: [
                                    _jsx(ExclamationTriangleIcon, { className: "h-6 w-6 text-yellow-500" }),
                                    _jsx("h2", { className: "ml-3 text-xl font-bold text-slate-800", children: "Función no disponible" })
                                ]
                            }),
                            _jsx("button", {
                                onClick: onClose,
                                className: "p-2 rounded-full text-slate-500 hover:bg-slate-100",
                                "aria-label": "Cerrar modal",
                                children: _jsx(CloseIcon, {})
                            })
                        ]
                    }),
                    _jsxs("div", {
                        className: "p-6 space-y-4",
                        children: [
                            _jsx("p", { className: "text-slate-700", children: "La subida de archivos no es compatible con esta versión de la aplicación." }),
                            _jsx("p", { className: "text-slate-600", children: _jsxs("strong", { children: ["Para subir archivos, por favor, abra esta página en el navegador de su móvil ", _jsx("br", {}), "(Chrome, Safari, etc)."] }) }),
                            _jsxs("div", {
                                className: "mt-6 space-y-3",
                                children: [
                                    _jsxs("button", {
                                        onClick: handleCopy,
                                        className: "w-full inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50",
                                        children: [
                                            _jsx(LinkIcon, { className: "h-5 w-5 mr-2" }),
                                            copied ? '¡Enlace Copiado!' : 'Copiar Enlace'
                                        ]
                                    }),
                                    _jsxs("button", {
                                        onClick: handleOpenInBrowser,
                                        className: "w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600",
                                        children: [
                                            _jsx(ArrowTopRightOnSquareIcon, { className: "h-5 w-5 mr-2" }),
                                            "Abrir en el Navegador"
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        })
    );
};

export default FileUploadWarningModal;
