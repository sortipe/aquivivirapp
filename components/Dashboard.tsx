
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// FIX: Implemented component to display summary statistics and resolve module error.
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UserRole, TaskStatus, PropertySaleStatus } from '@/types';
import { BuildingOfficeIcon } from '@/components/icons/BuildingOfficeIcon';
import { ClipboardDocumentListIcon } from '@/components/icons/ClipboardDocumentListIcon';
import { CalendarDaysIcon } from '@/components/icons/CalendarDaysIcon';
import { CheckCircleIcon } from '@/components/icons/CheckCircleIcon';
import { PlusIcon } from '@/components/icons/PlusIcon';
import { UsersIcon } from '@/components/icons/UsersIcon';
import { TagIcon } from '@/components/icons/TagIcon';
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import { PaperClipIcon } from "@/components/icons/PaperClipIcon";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { isAppCreator } from '@/utils';

const CalculatorCard = () => {
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('USD');

    const handleAmountChange = (e) => {
        const value = e.target.value;
        // Allow only numbers and a single decimal point
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const numericAmount = parseFloat(amount) || 0;
    const alcabala = numericAmount * 0.03;
    const renta = numericAmount * 0.05;
    
    const formatCurrency = (value) => {
        return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-PE', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    return (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [
        _jsx("h3", { key: "header", className: "text-sm font-medium text-slate-500 border-b border-slate-200 pb-3 mb-4", children: "Calculadora de Impuestos" }), 
        _jsxs("div", { key: "body", className: "space-y-4", children: [
            _jsxs("div", { key: "input-group", children: [
                _jsx("label", { key: "label", htmlFor: "amount", className: "sr-only", children: "Monto" }), 
                _jsxs("div", { key: "input-wrapper", className: "relative rounded-md shadow-sm", children: [
                    _jsx("div", { key: "icon", className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx("span", { className: "text-slate-500 text-lg", children: currency === 'USD' ? '$' : 'S/' }) }), 
                    _jsx("input", { key: "input", type: "text", name: "amount", id: "amount", className: "focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 pr-20 py-2 text-lg bg-white text-slate-900 border-slate-300 rounded-md", placeholder: "0.00", value: amount, onChange: handleAmountChange, inputMode: "decimal", "aria-label": "Monto a calcular" }), 
                    _jsx("div", { key: "currency-select", className: "absolute inset-y-0 right-0 flex items-center", children: [
                        _jsxs("div", { key: "select-wrapper", className: "flex items-center", children: [
                            _jsx("label", { key: "currency-label", htmlFor: "currency", className: "sr-only", children: "Moneda" }), 
                            _jsxs("select", { key: "select", id: "currency", name: "currency", className: "focus:ring-orange-500 focus:border-orange-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-slate-500 text-base rounded-md", value: currency, onChange: (e) => setCurrency(e.target.value), children: [
                                _jsx("option", { key: "USD", children: "USD" }), 
                                _jsx("option", { key: "PEN", children: "PEN" })
                            ] })
                        ] })
                    ] })
                ] })
            ] }), 
            _jsxs("div", { key: "results", className: "space-y-2 pt-2", children: [
                _jsxs("div", { key: "alcabala", className: "flex justify-between items-center bg-slate-50 p-2 rounded-md", children: [
                    _jsx("p", { key: "label", className: "text-sm font-medium text-slate-700", children: "Alcabala (3%)" }), 
                    _jsx("p", { key: "value", className: "text-sm font-semibold text-slate-800", children: formatCurrency(alcabala) })
                ] }), 
                _jsxs("div", { key: "renta", className: "flex justify-between items-center bg-slate-50 p-2 rounded-md", children: [
                    _jsx("p", { key: "label", className: "text-sm font-medium text-slate-700", children: "Renta (5%)" }), 
                    _jsx("p", { key: "value", className: "text-sm font-semibold text-slate-800", children: formatCurrency(renta) })
                ] })
            ] }), 
            _jsx("div", { key: "footer", className: "flex justify-end pt-1", children: _jsx("button", { onClick: () => setAmount(''), className: "text-xs text-orange-600 hover:underline focus:outline-none", children: "Limpiar" }) })
        ] })
    ] }));
};

const WorkerBinnacleCard = ({ currentUser, dailyLogs, onAddDailyLog }) => {
    const [description, setDescription] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Cleanup
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    const today = new Date().toISOString().split('T')[0];

    const todaysLogs = useMemo(() => {
        return dailyLogs
            .filter(log => log.user_id === currentUser.id && log.log_date === today)
            .sort((a, b) => a.log_time.localeCompare(b.log_time));
    }, [dailyLogs, currentUser.id, today]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles: File[] = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...newFiles]);
            
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveImage = (index: number) => {
        URL.revokeObjectURL(imagePreviews[index]);
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };
    
    const performSubmit = async () => {
        if (!description.trim()) return;
        setIsSubmitting(true);
        const success = await onAddDailyLog({ description, files: imageFiles });
        if (success) {
            setDescription('');
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
            setImagePreviews([]);
            setImageFiles([]);
        }
        setIsSubmitting(false);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        performSubmit();
    };

    const handleAttachClick = (e: React.MouseEvent) => {
        if (isAppCreator()) {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('open-file-upload-warning'));
            return;
        }
        fileInputRef.current?.click();
    };

    return (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [
            _jsx("h3", { className: "text-lg font-semibold text-slate-800 mb-4", children: "Bitácora del Día" }),
            _jsxs("form", { onSubmit: handleSubmit, className: "mb-4", children: [
                _jsxs("div", { className: "flex space-x-2", children: [
                    _jsx("input", {
                        type: "text",
                        value: description,
                        onChange: (e) => setDescription(e.target.value),
                        placeholder: "¿Qué hiciste?",
                        className: "flex-grow block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm",
                        disabled: isSubmitting
                    }),
                    _jsx("input", { type: "file", ref: fileInputRef, className: "hidden", onChange: handleFileChange, accept: "image/*", multiple: true }),
                    _jsx("button", { type: "button", onClick: handleAttachClick, className: "p-2 border border-slate-300 rounded-md text-slate-500 hover:bg-slate-50", title: "Adjuntar foto", children: _jsx(PaperClipIcon, {}) }),
                    _jsx("button", {
                        type: "submit",
                        className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300",
                        disabled: isSubmitting || !description.trim(),
                        children: isSubmitting ? "..." : "Añadir"
                    })
                ]}),
                imagePreviews.length > 0 && (
                    _jsx("div", { className: "mt-3 flex gap-2 overflow-x-auto pb-2", children: 
                        imagePreviews.map((preview, index) => (
                            _jsxs("div", { className: "relative flex-shrink-0 w-20 h-20", children: [
                                _jsx("img", { src: preview, alt: "Vista previa", className: "w-full h-full object-cover rounded-md border" }),
                                _jsx("button", {
                                    type: "button",
                                    onClick: () => handleRemoveImage(index),
                                    className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm",
                                    children: _jsx(CloseIcon, { className: "h-3 w-3" })
                                })
                            ]}, index)
                        ))
                    })
                )
            ]}),
            _jsx("div", { className: "max-h-60 overflow-y-auto pr-2 space-y-4", children: 
                todaysLogs.length > 0 ? (
                    todaysLogs.map(log => {
                        const images = log.images || (log.image_url ? [log.image_url] : []);
                        return (
                            _jsxs("div", { className: "flex items-start space-x-3 text-sm", children: [
                                _jsx("span", { className: "font-mono text-slate-500 pt-0.5 flex-shrink-0", children: log.log_time.substring(0, 5) }),
                                _jsxs("div", { className: "flex-grow min-w-0", children: [
                                    _jsx("p", { className: "text-slate-700 break-words", children: log.description }),
                                    images.length > 0 && (
                                        _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: 
                                            images.map((imgUrl, i) => (
                                                _jsx("a", { href: imgUrl, target: "_blank", rel: "noopener noreferrer", className: "block", children: 
                                                    _jsx("img", { src: imgUrl, alt: "Imagen de bitácora", className: "h-16 w-16 rounded-md object-cover border hover:opacity-80 transition-opacity" }) 
                                                }, i)
                                            ))
                                        })
                                    )
                                ]})
                            ]}, log.id)
                        );
                    })
                ) : (
                    _jsx("p", { className: "text-center text-sm text-slate-500 py-4", children: "No hay entradas para hoy." })
                )
            })
        ]}));
};


const Dashboard = ({ currentUser, properties, visits, users, tasks, dailyLogs, onAddDailyLog, onGoToTaskProperty, onSelectVisit, onOpenAddVisitModal, onCompleteTask, onOpenVisitEditor }) => {
    const isCurrentUserAdmin = currentUser.role === UserRole.ADMIN;
    // Admin Stats
    const availableProperties = properties.filter(p => p.status === PropertySaleStatus.AVAILABLE).length;
    const soldProperties = properties.filter(p => p.status === PropertySaleStatus.SOLD).length;
    const totalVisits = visits.length;
    const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING).length;
    const totalWorkers = users.filter(u => u.role === UserRole.WORKER).length;
    // Worker Stats
    const myVisits = visits.filter(v => v.workerId === currentUser.id);
    const myTasks = tasks.filter(t => {
        // Check if worker is in array (new) or matches single ID (old)
        const isAssigned = (t.workerIds && t.workerIds.includes(currentUser.id)) || t.workerId === currentUser.id;
        return isAssigned;
    });
    const myPendingTasks = myTasks.filter(t => t.status === TaskStatus.PENDING);
    const myCompletedTasks = myTasks.filter(t => t.status === TaskStatus.COMPLETED);

    const StatCard = ({ title, value, icon, color }) => (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow flex items-center", children: [_jsx("div", { className: `p-3 rounded-full ${color}`, children: icon }), _jsxs("div", { className: "ml-4", children: [_jsx("p", { className: "text-sm font-medium text-slate-500", children: title }), _jsx("p", { className: "text-2xl font-bold text-slate-800", children: value })] })] }));

    const TaskItem = ({ task, isWorker = false, onGoTo, onComplete, onOpenVisitEditor }) => {
        const property = properties.find(p => p.id === task.propertyId);
        const isVisitReportTask = !!task.visit_id;
        // Display first worker or 'Varios'
        let workerName = 'Sin asignar';
        if (task.workerIds && task.workerIds.length > 0) {
            const assignedNames = task.workerIds.map(id => users.find(u => u.id === id)?.name).filter(Boolean);
            workerName = assignedNames.length > 1 ? `${assignedNames[0]} (+${assignedNames.length - 1})` : assignedNames[0];
        } else if (task.workerId) {
            workerName = users.find(u => u.id === task.workerId)?.name || 'Desconocido';
        }
    
        const handleCompleteClick = () => {
            if (isVisitReportTask && onOpenVisitEditor) {
                onOpenVisitEditor(task.visit_id, task.id);
            } else if (onComplete) {
                onComplete(task.id);
            }
        };
    
        return (_jsxs("li", { className: "flex items-center space-x-3 py-3", children: [_jsx("div", { className: `mt-1 flex-shrink-0 h-5 w-5 rounded-full ${task.status === TaskStatus.PENDING ? 'bg-yellow-400' : 'bg-green-400'} border-2 border-white` }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-sm text-slate-800", children: task.description }), property && _jsxs("p", { className: "text-xs text-slate-500 mt-0.5", children: ["Propiedad: ", property.name] }), !isWorker && _jsxs("p", { className: "text-xs text-slate-500 mt-0.5", children: ["Asignado a: ", workerName] })] }), isWorker && task.status === TaskStatus.PENDING && onGoTo && (_jsxs("div", { className: "ml-auto flex-shrink-0 flex items-center space-x-2", children: [_jsx("button", { onClick: () => onGoTo(task.propertyId), className: "px-3 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition", children: "Ver Propiedad" }), _jsx("button", { onClick: handleCompleteClick, className: "px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition", children: isVisitReportTask ? "Llenar Reporte" : "Completar" })] }))] }));
    };

    const VisitItem = ({ visit, onSelect }) => {
        const property = properties.find(p => p.id === visit.propertyId);
        return (_jsx("li", { children: _jsxs("button", { onClick: () => onSelect(visit.id), className: "w-full text-left flex items-center space-x-3 py-3 px-1 -mx-1 rounded-md hover:bg-slate-50 transition focus:outline-none focus:bg-slate-100", children: [_jsx("div", { className: "flex-shrink-0 text-slate-400", children: _jsx(CalendarDaysIcon, {}) }), _jsxs("div", { className: "flex-grow min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-slate-800", children: visit.clientName }), _jsxs("p", { className: "text-sm text-slate-500", children: [visit.date, " a las ", visit.time] }), property && _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: property.name })] }), _jsx(ChevronRightIcon, {})] }) }));
    };

    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-slate-800", children: "Dashboard" }), _jsxs("p", { className: "mt-1 text-lg text-slate-600", children: ["Bienvenido de nuevo, ", currentUser.name, "."] })] }), isCurrentUserAdmin && (_jsxs("button", { onClick: () => onOpenAddVisitModal(), className: "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500", children: [_jsx(PlusIcon, {}), _jsx("span", { className: "ml-2", children: "Generar Visita" })] }))] }), isCurrentUserAdmin ? (
        // Admin View
        _jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", children: [_jsx(StatCard, { title: "Propiedades Disponibles", value: availableProperties, icon: _jsx(BuildingOfficeIcon, {}), color: "bg-green-100 text-green-600" }), _jsx(StatCard, { title: "Propiedades Vendidas", value: soldProperties, icon: _jsx(TagIcon, {}), color: "bg-red-100 text-red-600" }), _jsx(StatCard, { title: "Trabajadores Activos", value: totalWorkers, icon: _jsx(UsersIcon, {}), color: "bg-indigo-100 text-indigo-600" }), _jsx(StatCard, { title: "Visitas Programadas", value: totalVisits, icon: _jsx(CalendarDaysIcon, {}), color: "bg-orange-100 text-orange-600" }), _jsx(StatCard, { title: "Tareas Pendientes", value: pendingTasks, icon: _jsx(ClipboardDocumentListIcon, {}), color: "bg-yellow-100 text-yellow-600" }), _jsx(CalculatorCard, {})] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800 mb-4", children: "Tareas Recientes" }), _jsx("ul", { className: "divide-y divide-slate-200", children: tasks.slice(0, 5).map(task => _jsx(TaskItem, { task: task }, task.id)) }), tasks.length === 0 && _jsx("p", { className: "text-sm text-slate-500", children: "No hay tareas." })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800 mb-4", children: "Próximas Visitas" }), _jsx("ul", { className: "divide-y divide-slate-200", children: visits.slice(0, 5).map(visit => _jsx(VisitItem, { visit: visit, onSelect: onSelectVisit }, visit.id)) }), visits.length === 0 && _jsx("p", { className: "text-sm text-slate-500", children: "No hay visitas programadas." })] })] })] })) : (
        // Worker View
        _jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6", children: [_jsx(StatCard, { title: "Mis Visitas", value: myVisits.length, icon: _jsx(CalendarDaysIcon, {}), color: "bg-green-100 text-green-600" }), _jsx(StatCard, { title: "Tareas Pendientes", value: myPendingTasks.length, icon: _jsx(ClipboardDocumentListIcon, {}), color: "bg-yellow-100 text-yellow-600" }), _jsx(StatCard, { title: "Tareas Completadas", value: myCompletedTasks.length, icon: _jsx(CheckCircleIcon, {}), color: "bg-orange-100 text-orange-600" })] }), _jsx(WorkerBinnacleCard, { currentUser: currentUser, dailyLogs: dailyLogs, onAddDailyLog: onAddDailyLog }), _jsx(CalculatorCard, {})] }), _jsxs("div", { className: "mt-8 bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-800 mb-4", children: "Mis Tareas Pendientes" }), _jsx("ul", { className: "divide-y divide-slate-200", children: myPendingTasks.length > 0 ? (myPendingTasks.map(task => _jsx(TaskItem, { task: task, isWorker: true, onGoTo: onGoToTaskProperty, onComplete: onCompleteTask, onOpenVisitEditor: onOpenVisitEditor }, task.id))) : (_jsx("p", { className: "text-sm text-slate-500 text-center py-4", children: "No tienes tareas pendientes." })) })] })] })
    )] }));
};

export default Dashboard;
