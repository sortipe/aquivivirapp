
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from 'react';
import { UserRole, EventType } from '@/types';
import { ChevronLeftIcon } from '@/components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@/components/icons/ChevronRightIcon';
import { BookmarkIcon } from '@/components/icons/BookmarkIcon';
import { ClipboardDocumentListIcon } from '@/components/icons/ClipboardDocumentListIcon';
import { CalendarDaysIcon } from "@/components/icons/CalendarDaysIcon";

const defaultColor = {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    accent: '#64748b' // slate-500
};
const eventTypeColors = {
    [EventType.MEETING]: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', accent: '#3b82f6' }, 
    [EventType.REMINDER]: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', accent: '#8b5cf6' }, 
    [EventType.DEADLINE]: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', accent: '#ef4444' }, 
    [EventType.OTHER]: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', accent: '#6b7280' }, 
};
const taskColors = {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-300',
    accent: '#6366f1' // indigo-500
};

// Simplified color logic as worker count is dynamic
const getWorkerColorStyles = (workerId) => {
    return defaultColor; 
};

const Calendar = ({ currentUser, visits, calendarEvents, tasks, properties, users, onSelectVisit, onOpenCalendarActionModal, onSelectItem }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const isCurrentUserAdmin = currentUser.role === UserRole.ADMIN;
    
    const filteredVisits = useMemo(() => {
        if (isCurrentUserAdmin) {
            return visits;
        }
        return visits.filter(v => v.workerId === currentUser.id);
    }, [visits, currentUser, isCurrentUserAdmin]);

    const filteredTasks = useMemo(() => {
        if (isCurrentUserAdmin) {
            return tasks;
        }
        // Check both single workerId and multiple workerIds
        return tasks.filter(t => 
            (t.workerIds && t.workerIds.includes(currentUser.id)) || 
            t.workerId === currentUser.id
        );
    }, [tasks, currentUser, isCurrentUserAdmin]);
    
    const visitsByDate = useMemo(() => {
        const map = new Map();
        filteredVisits.forEach(visit => {
            const date = visit.date;
            if (!map.has(date)) {
                map.set(date, []);
            }
            map.get(date)?.push(visit);
        });
        return map;
    }, [filteredVisits]);

    const eventsByDate = useMemo(() => {
        const map = new Map();
        calendarEvents.forEach(event => {
            const date = event.date;
            if (!map.has(date)) {
                map.set(date, []);
            }
            map.get(date)?.push(event);
        });
        return map;
    }, [calendarEvents]);
    
    const tasksByDate = useMemo(() => {
        const map = new Map();
        const visitIds = new Set(filteredVisits.map(v => v.id));

        filteredTasks.forEach(task => {
            if (task.visit_id && visitIds.has(task.visit_id)) {
                return;
            }
            
            if (task.dueDate) {
                const date = task.dueDate;
                if (!map.has(date)) {
                    map.set(date, []);
                }
                map.get(date)?.push(task);
            }
        });
        return map;
    }, [filteredTasks, filteredVisits]);

    const changeMonth = (amount) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() + amount);
            if (amount !== 0) { 
                setSelectedDate(newDate);
            }
            return newDate;
        });
    };

    const handleDateClick = (day) => {
        const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newSelectedDate);
    };

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const isToday = (day) => today.getDate() === day &&
        today.getMonth() === month &&
        today.getFullYear() === year;

    const isSelected = (day) => selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;

    const monthFormat = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
    const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

    const getCalendarGrid = (isMobile) => {
        const cells = [];
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth; i > 0; i--) {
            cells.push(_jsx("div", { className: `border-slate-200 bg-slate-50 ${isMobile ? 'h-10' : 'h-28 sm:h-32 border p-2 text-slate-400'}`, children: isMobile ? '' : prevMonthLastDay - i + 1 }, `prev-${i}`));
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            const dayVisits = visitsByDate.get(dateString) || [];
            const dayEvents = eventsByDate.get(dateString) || [];
            const dayTasks = tasksByDate.get(dateString) || [];

            if (isMobile) {
                cells.push(_jsx("div", { className: "flex justify-center items-center h-10", children: _jsxs("button", { onClick: () => handleDateClick(day), className: `h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium relative transition-colors text-slate-900 ${isSelected(day) ? 'bg-orange-500 text-white' : ''} ${!isSelected(day) && isToday(day) ? 'text-orange-600' : ''} ${!isSelected(day) ? 'hover:bg-slate-100' : ''}`, children: [day, (dayVisits.length > 0 || dayEvents.length > 0 || dayTasks.length > 0) && (_jsx("span", { className: `absolute bottom-1 h-1 w-1 rounded-full ${isSelected(day) ? 'bg-white' : 'bg-orange-500'}` }))] }) }, day));
            } else {
                cells.push(_jsxs("div", { className: `group p-1.5 border border-slate-200 h-28 sm:h-32 flex flex-col relative cursor-pointer hover:bg-slate-50 transition-colors ${isSelected(day) ? 'bg-orange-50 ring-2 ring-orange-400' : ''}`, onClick: () => handleDateClick(day), children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("span", { className: `font-semibold text-xs ${isToday(day) ? 'bg-orange-500 text-white rounded-full h-5 w-5 flex items-center justify-center' : 'text-slate-900'}`, children: day }), isCurrentUserAdmin && (_jsx("button", { onClick: (e) => { e.stopPropagation(); onOpenCalendarActionModal(date); }, className: "opacity-0 group-hover:opacity-100 transition-opacity text-orange-600 bg-orange-100 rounded-full h-5 w-5 flex items-center justify-center text-sm font-bold focus:opacity-100 focus:ring-2 focus:ring-orange-400", title: `Añadir el ${day}`, children: "+" }))] }), _jsxs("div", { className: "flex-grow overflow-y-auto text-xs mt-1 space-y-1", children: [dayTasks.map(task => (_jsx("div", { className: `w-full text-left p-1 rounded border ${taskColors.bg} ${taskColors.text} ${taskColors.border}`, children: _jsx("p", { className: "font-semibold truncate", children: task.description }) }, task.id))), dayEvents.map(event => {
                                const eventColors = eventTypeColors[event.type];
                                return (_jsx("div", { className: `w-full text-left p-1 rounded border ${eventColors.bg} ${eventColors.text} ${eventColors.border}`, children: _jsx("p", { className: "font-semibold truncate", children: event.title }) }, event.id));
                            }), dayVisits.map(visit => {
                                const visitColors = getWorkerColorStyles(visit.workerId);
                                return (_jsx("div", { className: `w-full text-left p-1 rounded border ${visitColors.bg} ${visitColors.text} ${visitColors.border}`, children: _jsx("p", { className: "font-semibold truncate", children: visit.clientName }) }, visit.id));
                            })] })] }, day));
            }
        }
        const totalCells = firstDayOfMonth + daysInMonth;
        let nextDaysCount = (7 - (totalCells % 7)) % 7;
        if (totalCells + nextDaysCount < 35 && !isMobile)
            nextDaysCount += 7;
        if (totalCells + nextDaysCount < 42 && !isMobile)
            nextDaysCount += 7;

        for (let i = 1; i <= nextDaysCount; i++) {
            cells.push(_jsx("div", { className: `border-slate-200 bg-slate-50 ${isMobile ? 'h-10' : 'h-28 sm:h-32 border p-2 text-slate-400'}`, children: isMobile ? '' : i }, `next-${i}`));
        }
        return cells;
    };
    
    const AgendaForDay = () => {
        const selectedDateVisits = visitsByDate.get(selectedDate.toISOString().split('T')[0]) || [];
        const selectedDateEvents = eventsByDate.get(selectedDate.toISOString().split('T')[0]) || [];
        const selectedDateTasks = tasksByDate.get(selectedDate.toISOString().split('T')[0]) || [];
        
        return (
            _jsxs("div", { 
                children: [
                    _jsxs("div", { 
                        className: "flex justify-between items-center border-b border-slate-200 pb-2 mb-2", 
                        children: [
                            _jsx("h3", { 
                                className: "font-semibold text-slate-800", 
                                children: `Agenda del ${selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}` 
                            }), 
                            isCurrentUserAdmin && (
                                _jsx("button", { 
                                    onClick: () => onOpenCalendarActionModal(selectedDate), 
                                    className: "px-2 py-1 text-xs font-semibold text-white bg-orange-500 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500", 
                                    children: "Añadir" 
                                })
                            )
                        ] 
                    }), 
                    (selectedDateVisits.length > 0 || selectedDateEvents.length > 0 || selectedDateTasks.length > 0) ? (
                        _jsxs("ul", { 
                            className: "space-y-2", 
                            children: [
                                selectedDateTasks.map(task => {
                                    let workerName = 'Sin asignar';
                                    if (task.workerIds && task.workerIds.length > 0) {
                                        const assignedNames = task.workerIds.map(id => users.find(u => u.id === id)?.name).filter(Boolean);
                                        workerName = assignedNames.length > 1 ? `${assignedNames[0]} (+${assignedNames.length - 1})` : assignedNames[0];
                                    } else if (task.workerId) {
                                        workerName = users.find(u => u.id === task.workerId)?.name || 'Desconocido';
                                    }
                                    const property = properties.find(p => p.id === task.propertyId);
                                    return (
                                        _jsx("li", { 
                                            children: _jsx("button", { 
                                                onClick: () => onSelectItem(task), 
                                                className: "w-full text-left p-3 rounded-lg flex items-center space-x-3 bg-slate-50 hover:bg-slate-100", 
                                                style: { borderLeft: `4px solid ${taskColors.accent}` }, 
                                                children: [
                                                    _jsx("div", { className: "flex-shrink-0 text-slate-500", children: _jsx(ClipboardDocumentListIcon, {}) }), 
                                                    _jsxs("div", { 
                                                        className: "flex-grow min-w-0", 
                                                        children: [
                                                            _jsx("p", { className: "font-semibold text-slate-800 truncate", children: task.description }), 
                                                            _jsx("p", { className: "text-sm text-slate-500 truncate", children: property?.name }), 
                                                            isCurrentUserAdmin && _jsx("p", { className: "text-xs text-slate-500 truncate", children: workerName })
                                                        ] 
                                                    }), 
                                                    _jsx(ChevronRightIcon, {})
                                                ] 
                                            }) 
                                        }, task.id)
                                    );
                                }), 
                                selectedDateEvents.map(event => {
                                    const eventColors = eventTypeColors[event.type];
                                    return (
                                        _jsx("li", { 
                                            children: _jsxs("button", { 
                                                onClick: () => onSelectItem(event), 
                                                className: "w-full text-left p-3 rounded-lg flex items-center space-x-3 bg-slate-50 hover:bg-slate-100", 
                                                style: { borderLeft: `4px solid ${eventColors.accent}` }, 
                                                children: [
                                                    _jsx("div", { className: "flex-shrink-0 text-slate-500", children: _jsx(BookmarkIcon, { className: "h-6 w-6" }) }), 
                                                    _jsxs("div", { 
                                                        className: "flex-grow min-w-0", 
                                                        children: [
                                                            _jsx("p", { className: "font-semibold text-slate-800 truncate", children: event.title }), 
                                                            _jsx("p", { className: "text-sm text-slate-500", children: event.type })
                                                        ] 
                                                    }), 
                                                    _jsx(ChevronRightIcon, {})
                                                ] 
                                            }) 
                                        }, event.id)
                                    );
                                }), 
                                selectedDateVisits.map(visit => {
                                    const worker = users.find(u => u.id === visit.workerId);
                                    const visitColors = getWorkerColorStyles(visit.workerId);
                                    return (
                                        _jsx("li", { 
                                            children: _jsxs("button", { 
                                                onClick: () => onSelectVisit(visit.id), 
                                                className: "w-full text-left p-3 rounded-lg flex items-center space-x-3 bg-slate-50 hover:bg-slate-100", 
                                                style: { borderLeft: `4px solid ${visitColors.accent}` }, 
                                                children: [
                                                    _jsx("div", { className: "flex-shrink-0 text-slate-500", children: _jsx(CalendarDaysIcon, {}) }), 
                                                    _jsxs("div", { 
                                                        className: "flex-grow min-w-0", 
                                                        children: [
                                                            _jsx("p", { className: "font-semibold text-slate-800 truncate", children: visit.clientName }), 
                                                            _jsx("p", { className: "text-sm text-slate-500", children: visit.time }), 
                                                            isCurrentUserAdmin && _jsx("p", { className: "text-xs text-slate-500 truncate", children: worker?.name })
                                                        ] 
                                                    }), 
                                                    _jsx(ChevronRightIcon, {})
                                                ] 
                                            }) 
                                        }, visit.id)
                                    );
                                })
                            ] 
                        })
                    ) : (
                        _jsx("p", { className: "mt-4 text-center text-sm text-slate-500 py-4", children: "No hay nada programado para este día." })
                    )
                ] 
            })
        );
    };

    return (_jsxs("div", { className: "bg-white rounded-lg shadow-xl flex flex-col md:flex-row", children: [_jsxs("div", { className: "p-4 sm:p-6 md:w-2/3 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-xl font-bold text-slate-800 capitalize text-center sm:text-left flex-grow", children: monthFormat.format(currentDate) }), _jsxs("div", { className: 'flex-shrink-0', children: [_jsx("button", { onClick: () => changeMonth(-1), className: "p-2 rounded-full hover:bg-slate-100 text-slate-500", children: _jsx(ChevronLeftIcon, {}) }), _jsx("button", { onClick: () => changeMonth(1), className: "p-2 rounded-full hover:bg-slate-100 text-slate-500", children: _jsx(ChevronRightIcon, {}) })] })] }), _jsx("div", { className: "grid grid-cols-7 gap-1 text-center text-xs sm:text-sm font-semibold text-slate-500 mt-4", children: dayNames.map(day => _jsx("div", { className: "py-2", children: day }, day)) }), _jsx("div", { className: "hidden md:grid grid-cols-7 gap-0 border-t border-l border-slate-200", children: getCalendarGrid(false) }), _jsx("div", { className: "md:hidden mt-4", children: _jsx("div", { className: "grid grid-cols-7 gap-1", children: getCalendarGrid(true) }) })] }), _jsx("div", { className: "p-4 sm:p-6 md:w-1/3 flex-shrink-0 overflow-y-auto", children: _jsx(AgendaForDay, {}) })] }));
};

export default Calendar;
