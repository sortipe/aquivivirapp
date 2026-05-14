import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { UserRole } from '@/types';
import { PlusIcon } from '@/components/icons/PlusIcon';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { DownloadIcon } from '@/components/icons/DownloadIcon';
import { DocumentTextIcon } from '@/components/icons/DocumentTextIcon';
import { PencilIcon } from '@/components/icons/PencilIcon';

const Formatos = ({ currentUser, formats, onAddFormat, onEditFormat, onDeleteFormat }) => {
    const isCurrentUserAdmin = currentUser.role === UserRole.ADMIN;

    return (
        _jsxs("div", { className: "space-y-6", children: [
            _jsxs("div", { className: "flex justify-between items-center", children: [
                _jsx("h1", { className: "text-3xl font-bold text-slate-800", children: "Formatos" }),
                isCurrentUserAdmin && (
                    _jsxs("button", {
                        onClick: onAddFormat,
                        className: "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500",
                        children: [
                            _jsx(PlusIcon, {}),
                            _jsx("span", { className: "ml-2", children: "Añadir Formato" })
                        ]
                    })
                )
            ]}),
            formats.length > 0 ? (
                _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: 
                    formats.map(format => (
                        _jsxs("div", { className: "bg-white shadow rounded-lg flex flex-col overflow-hidden", children: [
                            _jsxs("div", { className: "p-5 flex-grow", children: [
                                _jsxs("div", { className: "flex items-start", children: [
                                    _jsx("div", { className: "text-slate-400 flex-shrink-0", children: _jsx(DocumentTextIcon, {}) }),
                                    _jsx("p", { className: "ml-3 text-lg font-bold text-slate-800 truncate", children: format.title })
                                ]}),
                                _jsx("p", { className: "mt-3 text-sm text-slate-600", children: format.description })
                            ]}),
                            _jsx("div", { className: "bg-slate-50 px-5 py-3 border-t", children: 
                                isCurrentUserAdmin ? (
                                    _jsxs("div", { className: "flex justify-end items-center space-x-1", children: [
                                        _jsx("button", {
                                            onClick: () => onEditFormat(format),
                                            className: "p-2 text-slate-400 hover:text-orange-600 rounded-full hover:bg-slate-100",
                                            title: "Editar",
                                            children: _jsx(PencilIcon, {})
                                        }),
                                        _jsx("button", {
                                            onClick: () => onDeleteFormat(format),
                                            className: "p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100",
                                            title: "Eliminar",
                                            children: _jsx(TrashIcon, {})
                                        })
                                    ] })
                                ) : (
                                    _jsxs("a", {
                                        href: format.file_url,
                                        download: format.file_name,
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        className: "w-full text-center inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none",
                                        children: [
                                            _jsx(DownloadIcon, { className: "h-5 w-5 mr-2" }),
                                            "Descargar"
                                        ]
                                    })
                                )
                            })
                        ]}, format.id)
                    ))
                })
            ) : (
                _jsxs("div", { className: "text-center py-16 bg-white rounded-lg shadow", children: [
                    _jsx("h3", { className: "text-lg font-medium text-slate-800", children: "No hay formatos disponibles." }),
                    _jsx("p", { className: "text-sm text-slate-500 mt-1", children: isCurrentUserAdmin ? "Haz clic en 'Añadir Formato' para empezar." : "Vuelve a consultar más tarde." })
                ]})
            )
        ]})
    );
};

export default Formatos;