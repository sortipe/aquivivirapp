import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { UserRole } from '@/types';
import { CalendarIcon } from '@/components/icons/CalendarIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
import { MapPinIcon } from '@/components/icons/MapPinIcon';

const VisitList = ({ visits, currentUser, users, onSelectVisit }) => {
    if (visits.length === 0) {
        return _jsx("p", { className: "text-slate-500 text-sm p-4 bg-slate-50 rounded-md", children: "No hay visitas programadas." });
    }
    return (_jsx("div", { className: "space-y-3 max-h-96 overflow-y-auto pr-2", children: visits.map(visit => {
            const worker = users.find(u => u.id === visit.workerId);
            return (_jsxs("button", { onClick: () => onSelectVisit(visit.id), className: "w-full text-left bg-slate-50 p-4 rounded-lg border border-slate-200 hover:bg-slate-100 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transition", children: [_jsx("p", { className: "font-semibold text-slate-800", children: visit.clientName }), currentUser.role === UserRole.ADMIN && worker && (_jsxs("p", { className: "text-xs text-slate-500 mt-1", children: ["Asignado a: ", _jsx("span", { className: "font-medium", children: worker.name })] })), _jsxs("div", { className: "flex items-center text-sm text-slate-600 mt-2", children: [_jsxs("div", { className: "flex items-center mr-4", children: [_jsx(CalendarIcon, {}), _jsx("span", { className: "ml-1.5", children: visit.date })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(ClockIcon, {}), _jsx("span", { className: "ml-1.5", children: visit.time })] })] }), visit.notes && _jsxs("p", { className: "text-sm text-slate-500 mt-2 italic", children: ["\"", visit.notes, "\""] }), visit.visitPhotoUrl && (_jsx("img", { src: visit.visitPhotoUrl, alt: `Visita de ${visit.clientName}`, className: "mt-3 rounded-lg w-full h-auto max-h-40 object-cover border border-slate-200" })), visit.latitude && visit.longitude && (_jsx("div", { className: "mt-3", children: _jsxs("div", { className: "inline-flex items-center text-xs text-slate-500 font-medium", children: [_jsx(MapPinIcon, {}), _jsx("span", { children: "Ubicación registrada" })] }) }))] }, visit.id));
        }) }));
};

export default VisitList;
