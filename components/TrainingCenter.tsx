import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { UserRole, ResourceType } from '@/types';
import { PlusIcon } from '@/components/icons/PlusIcon';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { EyeIcon } from '@/components/icons/EyeIcon';
import { VideoCameraIcon } from '@/components/icons/VideoCameraIcon';
import { DocumentTextIcon } from '@/components/icons/DocumentTextIcon';
import { LinkIcon } from '@/components/icons/LinkIcon';
import { CheckCircleIcon } from '@/components/icons/CheckCircleIcon';
import { PencilIcon } from '@/components/icons/PencilIcon';
import AddResourceForm from '@/components/AddResourceForm';
import ResourceViewersModal from '@/components/ResourceViewersModal';
import ResourceViewerModal from '@/components/ResourceViewerModal';

const TrainingCenter = ({ currentUser, resources, users, onAddResource, onUpdateResource, onDeleteResource, onMarkAsViewed }) => {
    const isCurrentUserAdmin = currentUser.role === UserRole.ADMIN;
    const workers = users.filter(u => u.role === UserRole.WORKER);
    const [modal, setModal] = useState<{ type: string | null; data?: any; }>({ type: null });

    const handleAddSubmit = (resourceData) => {
        onAddResource(resourceData);
        setModal({ type: null });
    };

    const handleUpdateSubmit = (resourceData) => {
        onUpdateResource(resourceData);
        setModal({ type: null });
    };

    const getResourceTypeIcon = (type) => {
        switch (type) {
            case ResourceType.VIDEO: return _jsx(VideoCameraIcon, {});
            case ResourceType.DOCUMENT: return _jsx(DocumentTextIcon, {});
            case ResourceType.LINK: return _jsx(LinkIcon, {});
            default: return null;
        }
    };
    
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-3xl font-bold text-slate-800", children: "Capacitaciones" }), isCurrentUserAdmin && (_jsxs("button", { onClick: () => setModal({ type: 'add-resource' }), className: "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500", children: [_jsx(PlusIcon, {}), _jsx("span", { className: "ml-2", children: "Añadir Recurso" })] }))] }), resources.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: resources.map(resource => {
                    const hasViewed = (resource.viewedBy || []).includes(currentUser.id);
                    return (_jsxs("div", { className: "bg-white shadow rounded-lg flex flex-col overflow-hidden", children: [_jsxs("div", { className: "p-5 flex-grow", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center min-w-0", children: [_jsx("div", { className: "text-slate-400 flex-shrink-0", children: getResourceTypeIcon(resource.type) }), _jsx("p", { className: "ml-3 text-lg font-bold text-slate-800 truncate", children: resource.title })] }), !isCurrentUserAdmin && hasViewed && (_jsx("div", { className: "flex-shrink-0 text-green-500", title: "Visto", children: _jsx(CheckCircleIcon, {}) }))] }), _jsx("p", { className: "mt-3 text-sm text-slate-600", children: resource.description })] }), _jsx("div", { className: "bg-slate-50 px-5 py-3 border-t", children: isCurrentUserAdmin ? (_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("button", { onClick: () => setModal({ type: 'view-viewers', data: resource }), className: "inline-flex items-center text-sm font-medium text-slate-600 hover:text-orange-600", children: [_jsx(EyeIcon, {}), _jsxs("span", { className: "ml-2", children: ["Visto por ", (resource.viewedBy || []).length, " / ", workers.length] })] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("button", { onClick: () => setModal({ type: 'edit-resource', data: resource }), className: "p-2 text-slate-400 hover:text-orange-600 rounded-full hover:bg-slate-100", title: "Editar", children: _jsx(PencilIcon, {}) }), _jsx("button", { onClick: () => onDeleteResource(resource.id), className: "p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100", title: "Eliminar", children: _jsx(TrashIcon, {}) })] })] })) : (_jsx("button", { onClick: () => setModal({ type: 'view-resource', data: resource }), className: "w-full text-center px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none", children: hasViewed ? 'Ver de Nuevo' : 'Ver Recurso' })) })] }, resource.id));
                }) })) : (_jsxs("div", { className: "text-center py-16 bg-white rounded-lg shadow", children: [_jsx("h3", { className: "text-lg font-medium text-slate-800", children: "No hay recursos de capacitación disponibles." }), _jsx("p", { className: "text-sm text-slate-500 mt-1", children: isCurrentUserAdmin ? "Haz clic en 'Añadir Recurso' para empezar." : "Vuelve a consultar más tarde." })] })), (modal.type === 'add-resource' || modal.type === 'edit-resource') && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4", children: _jsx(AddResourceForm, { initialData: modal.type === 'edit-resource' ? modal.data : null, onSubmit: modal.type === 'edit-resource' ? handleUpdateSubmit : handleAddSubmit, onCancel: () => setModal({ type: null }) }) })), modal.type === 'view-viewers' && (_jsx(ResourceViewersModal, { isOpen: true, onClose: () => setModal({ type: null }), resource: modal.data, users: users })), modal.type === 'view-resource' && (_jsx(ResourceViewerModal, { isOpen: true, onClose: () => setModal({ type: null }), resource: modal.data, onMarkAsViewed: onMarkAsViewed }))] }));
};

export default TrainingCenter;