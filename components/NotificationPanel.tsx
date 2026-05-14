import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// FIX: Implemented the NotificationPanel component to display user notifications in a sidebar, resolving a module error.
import React from 'react';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { BellIcon } from '@/components/icons/BellIcon';

const NotificationPanel = ({ notifications, currentUser, onClose, onMarkAsRead }) => {
    const myNotifications = notifications
        .filter(n => n.recipientId === currentUser.id || n.recipientId.startsWith('all-'))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-40", onClick: onClose, children: _jsxs("div", { className: "absolute top-0 right-0 h-full w-full max-w-sm bg-white shadow-lg flex flex-col", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0", children: [_jsx("h2", { className: "text-lg font-bold text-slate-800", children: "Notificaciones" }), _jsx("button", { onClick: onClose, className: "p-2 rounded-full text-slate-500 hover:bg-slate-100", children: _jsx(CloseIcon, {}) })] }), myNotifications.length > 0 ? (_jsx("ul", { className: "flex-grow overflow-y-auto divide-y divide-slate-100", children: myNotifications.map(notification => {
                        const isRead = notification.readBy.includes(currentUser.id);
                        return (_jsxs("li", { className: `p-4 transition-colors ${isRead ? 'opacity-70 hover:bg-slate-50' : 'bg-orange-50 hover:bg-orange-100'}`, children: [_jsx("p", { className: "text-sm text-slate-800", children: notification.message }), _jsxs("div", { className: "flex justify-between items-center mt-2", children: [_jsx("span", { className: "text-xs text-slate-500", children: new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(notification.timestamp) }), !isRead && (_jsx("button", { onClick: () => onMarkAsRead(notification.id), className: "text-xs font-semibold text-orange-600 hover:underline", children: "Marcar como leído" }))] })] }, notification.id));
                    }) })) : (_jsxs("div", { className: "flex-grow flex flex-col items-center justify-center text-center p-6", children: [_jsx("div", { className: "p-4 bg-slate-100 rounded-full", children: _jsx(BellIcon, {}) }), _jsx("p", { className: "mt-4 font-semibold text-slate-700", children: "Todo al día" }), _jsx("p", { className: "text-sm text-slate-500", children: "No tienes notificaciones nuevas." })] }))] }) }));
};

export default NotificationPanel;
