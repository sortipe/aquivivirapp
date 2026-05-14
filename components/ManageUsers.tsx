
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// FIX: Implemented the ManageUsers component for administrators to add, edit, and delete user accounts, resolving a module error.
import React, { useState } from 'react';
import { UserRole } from '@/types';
import UserForm from '@/components/UserForm';
import { PlusIcon } from '@/components/icons/PlusIcon';
import { PencilIcon } from '@/components/icons/PencilIcon';
import { TrashIcon } from '@/components/icons/TrashIcon';
const ManageUsers = ({ users, currentUser, onAddUser, onUpdateUser, onDeleteUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const handleOpenModal = (user = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };
    const handleFormSubmit = (userData) => {
        if (editingUser) {
            onUpdateUser({ ...userData, id: editingUser.id });
        }
        else {
            onAddUser(userData);
        }
        handleCloseModal();
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-3xl font-bold text-slate-800", children: "Gestionar Usuarios" }), _jsxs("button", { onClick: () => handleOpenModal(), className: "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600", children: [_jsx(PlusIcon, {}), _jsx("span", { className: "ml-2", children: "Añadir Usuario" })] })] }), _jsx("div", { className: "bg-white shadow overflow-hidden sm:rounded-lg", children: _jsx("ul", { className: "divide-y divide-slate-200", children: users.map((user) => (_jsx("li", { children: _jsxs("div", { className: "px-4 py-4 sm:px-6 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center min-w-0", children: [_jsx("span", { className: "inline-block h-10 w-10 rounded-full overflow-hidden bg-slate-100", children: _jsx("svg", { className: "h-full w-full text-slate-300", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" }) }) }), _jsxs("div", { className: "ml-4 min-w-0", children: [_jsx("p", { className: "text-md font-medium text-slate-900 truncate", children: user.name }), _jsx("p", { className: "text-sm text-slate-500 truncate", children: user.email })] })] }), _jsxs("div", { className: "ml-4 flex-shrink-0 flex items-center space-x-4", children: [_jsx("span", { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'}`, children: user.role }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => handleOpenModal(user), className: "p-2 text-slate-500 hover:text-orange-600 rounded-full hover:bg-slate-100", title: "Editar", children: _jsx(PencilIcon, {}) }), user.id !== currentUser.id && (_jsx("button", { onClick: () => onDeleteUser(user.id), className: "p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100", title: "Eliminar", children: _jsx(TrashIcon, {}) }))] })] })] }) }, user.id))) }) }), isModalOpen && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4", children: _jsx(UserForm, { initialData: editingUser, onSubmit: handleFormSubmit, onCancel: handleCloseModal }) }))] }));
};
export default ManageUsers;
