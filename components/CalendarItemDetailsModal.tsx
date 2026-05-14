
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { UserRole } from '@/types';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { PencilIcon } from '@/components/icons/PencilIcon';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { BuildingOfficeIcon } from '@/components/icons/BuildingOfficeIcon';
import { UserIcon } from '@/components/icons/UserIcon';
import { ClipboardDocumentListIcon } from '@/components/icons/ClipboardDocumentListIcon';
import { BookmarkIcon } from '@/components/icons/BookmarkIcon';
import { CalendarDaysIcon } from '@/components/icons/CalendarDaysIcon';
import { ChevronRightIcon } from '@/components/icons/ChevronRightIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
import { LocationIcon } from "@/components/icons/LocationIcon";
import StaticMapDisplay from '@/components/StaticMapDisplay';

const isTask = (item) => {
    return 'workerId' in item || 'workerIds' in item;
};

const CalendarItemDetailsModal = ({ isOpen, item, users, properties, currentUser, onClose, onEdit, onDelete, onNavigateToProperty, onResendWhatsApp }) => {
    if (!isOpen)
        return null;
    const isCurrentUserAdmin = currentUser.role === UserRole.ADMIN;
    const itemIsTask = isTask(item);
    let title = '';
    let icon = null;
    if (itemIsTask) {
        title = 'Detalles de la Tarea';
        icon = _jsx(ClipboardDocumentListIcon, {});
    }
    else {
        title = 'Detalles del Evento';
        icon = _jsx(BookmarkIcon, { className: "h-6 w-6" });
    }
    const DetailItem = ({ label, value, icon }) => (_jsxs("div", { children: [_jsxs("p", { className: "text-sm text-slate-500 flex items-center", children: [icon && _jsx("span", { className: "mr-2", children: icon }), label] }), _jsx("p", { className: "font-medium text-slate-800 mt-1 pl-6", children: value || 'N/A' })] }));
    
    const renderContent = () => {
        if (itemIsTask) {
            const task = item;
            const property = task.propertyId ? properties.find(p => p.id === task.propertyId) : null;
            
            // Handle multiple workers
            let assignedWorkers = [];
            if (task.workerIds && task.workerIds.length > 0) {
                assignedWorkers = task.workerIds.map(id => users.find(u => u.id === id)).filter(Boolean);
            } else if (task.workerId) {
                const w = users.find(u => u.id === task.workerId);
                if (w) assignedWorkers.push(w);
            }

            return (_jsxs("div", { className: "space-y-4", children: [
                _jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-500", children: "Descripción" }), _jsx("p", { className: "text-lg font-semibold text-slate-900", children: task.description })] }), 
                _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t", children: [
                    _jsx(DetailItem, { label: "Fecha de Entrega", value: task.dueDate, icon: _jsx(CalendarDaysIcon, { className: "h-4 w-4" }) }), 
                    task.time && _jsx(DetailItem, { label: "Hora", value: task.time, icon: _jsx(ClockIcon, { className: "h-4 w-4" }) }), 
                    
                    /* Assigned Workers Section */
                    _jsxs("div", { className: "sm:col-span-2", children: [
                        _jsxs("div", { className: "flex items-center justify-between", children: [
                            _jsxs("div", { children: [
                                _jsxs("p", { className: "text-sm text-slate-500 flex items-center", children: [_jsx(UserIcon, { className: "mr-2" }), "Asignado a"] }),
                                _jsx("div", { className: "pl-6 mt-1", children: 
                                    assignedWorkers.length > 0 ? (
                                        _jsx("ul", { className: "list-disc list-inside text-slate-800 font-medium", children: 
                                            assignedWorkers.map(worker => (
                                                _jsx("li", { children: worker.name }, worker.id)
                                            ))
                                        })
                                    ) : "N/A"
                                })
                            ]}),
                            (onResendWhatsApp && isCurrentUserAdmin && assignedWorkers.length > 0) && (
                                _jsx("button", { 
                                    onClick: () => {
                                        // For multiple workers, this simple button might need to change to send to all or select one.
                                        // Current implementation sends to the first valid worker for simplicity or iterates.
                                        // A specialized modal for multi-send would be better, but for now, we send to the first one or trigger notifications for all.
                                        // To keep it simple and functional:
                                        assignedWorkers.forEach(w => {
                                            // We create a temp task object with single workerId to reuse the handler
                                            onResendWhatsApp({ ...task, workerId: w.id });
                                        });
                                        alert(`Se ha abierto WhatsApp para ${assignedWorkers.length} trabajador(es).`);
                                    }, 
                                    className: "text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100 border border-green-200 transition-colors self-start mt-1",
                                    title: "Enviar WhatsApp a todos",
                                    children: "Enviar WhatsApp" 
                                })
                            )
                        ]})
                    ]}),

                    _jsxs("div", { className: "sm:col-span-2", children: [
                        _jsxs("p", { className: "text-sm text-slate-500 flex items-center", children: [_jsx(BuildingOfficeIcon, { className: "h-4 w-4 mr-2" }), "Propiedad / Ubicación"] }), 
                        property ? (
                            _jsxs("button", { onClick: () => onNavigateToProperty(property.id), className: "group w-full flex justify-between items-center text-left font-medium text-slate-800 mt-1 hover:text-orange-600 transition-colors focus:outline-none focus:text-orange-600 pl-6", children: [
                                _jsx("span", { className: "group-hover:underline", children: property.name }), 
                                _jsx("ChevronRightIcon", { className: "h-5 w-5 text-slate-400 group-hover:text-orange-500 transition-colors" })
                            ] })
                        ) : task.customAddress ? (
                            _jsxs("div", { className: "pl-6 mt-1", children: [
                                _jsx("p", { className: "font-medium text-slate-800", children: task.customAddress }),
                                task.latitude && task.longitude && (
                                    _jsx("div", { className: "mt-2 h-32 w-full rounded-md overflow-hidden border border-slate-200", children: 
                                        _jsx(StaticMapDisplay, { latitude: task.latitude, longitude: task.longitude })
                                    })
                                )
                            ]})
                        ) : (
                            _jsx("p", { className: "font-medium text-slate-800 mt-1 pl-6", children: "N/A" })
                        )
                    ] })
                ] })
            ] }));
        }
        else {
            const event = item;
            return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-500", children: "Título" }), _jsx("p", { className: "text-lg font-semibold text-slate-900", children: event.title })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t", children: [_jsx(DetailItem, { label: "Fecha", value: event.date, icon: _jsx(CalendarDaysIcon, { className: "h-4 w-4" }) }), _jsx(DetailItem, { label: "Tipo", value: event.type, icon: _jsx(BookmarkIcon, { className: "h-4 w-4" }) })] }), event.description && (_jsxs("div", { className: "pt-4 border-t", children: [_jsx("p", { className: "text-sm text-slate-500", children: "Descripción Adicional" }), _jsx("p", { className: "text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-200 mt-1 text-sm", children: event.description })] }))] }));
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4", onClick: onClose, children: _jsxs("div", { className: "bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-slate-500", children: icon }), _jsx("h2", { className: "text-xl font-bold text-slate-800 ml-3", children: title })] }), _jsx("button", { onClick: onClose, className: "p-2 rounded-full text-slate-500 hover:bg-slate-100", "aria-label": "Cerrar modal", children: _jsx(CloseIcon, {}) })] }), _jsx("div", { className: "p-6 overflow-y-auto", children: renderContent() }), isCurrentUserAdmin && (_jsxs("div", { className: "p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center flex-shrink-0 space-x-3", children: [_jsxs("button", { onClick: () => onEdit(item), className: "inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: [_jsx(PencilIcon, {}), _jsx("span", { className: "ml-2", children: "Editar" })] }), _jsxs("button", { onClick: () => onDelete(item), className: "inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100", children: [_jsx(TrashIcon, {}), _jsx("span", { className: "ml-2", children: "Eliminar" })] })] }))] }) }));
};
export default CalendarItemDetailsModal;
