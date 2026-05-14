
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DailyLog, User, UserRole } from '@/types';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { isAppCreator } from '@/utils';
import { PaperClipIcon } from "@/components/icons/PaperClipIcon";
import { CloseIcon } from "@/components/icons/CloseIcon";

const BinnacleForm = ({ currentUser, onAddDailyLog }) => {
    const [description, setDescription] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Cleanup function to revoke object URLs
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, []); // Empty dependency array to run only on unmount (or we can manage cleanup in remove handler)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files) as File[];
            setImageFiles(prev => [...prev, ...newFiles]);
            
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
        // Reset input value to allow selecting the same file again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (index: number) => {
        // Revoke the URL to avoid memory leaks
        URL.revokeObjectURL(imagePreviews[index]);
        
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };
    
    const performSubmit = async () => {
        if (!description.trim()) return;
        setIsSubmitting(true);
        // Pass 'files' array instead of single 'file'
        const success = await onAddDailyLog({ description, files: imageFiles });
        if (success) {
            setDescription('');
            // Clear previews and files
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

    const handleAttachClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isAppCreator()) {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('open-file-upload-warning'));
            return;
        }
        fileInputRef.current?.click();
    };


    return (
         _jsxs("div", { className: "bg-white p-6 rounded-lg shadow mb-6", children: [
            _jsx("h3", { className: "text-lg font-semibold text-slate-800 mb-4", children: "Añadir a Bitácora" }),
            _jsxs("form", { onSubmit: handleSubmit, className: "space-y-3", children: [
                _jsx("textarea", {
                    value: description,
                    onChange: (e) => setDescription(e.target.value),
                    placeholder: "¿Qué hiciste hoy?",
                    className: "block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm",
                    rows: 3,
                    disabled: isSubmitting
                }),
                
                // Image Previews Container
                imagePreviews.length > 0 && (
                    _jsx("div", { className: "flex flex-wrap gap-3 mt-2", children: 
                        imagePreviews.map((preview, index) => (
                            _jsxs("div", { className: "relative w-24 h-24 group", children: [
                                _jsx("img", { src: preview, alt: `Vista previa ${index}`, className: "w-full h-full object-cover rounded-md border" }),
                                _jsx("button", {
                                    type: "button",
                                    onClick: () => handleRemoveImage(index),
                                    className: "absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors",
                                    children: _jsx(CloseIcon, { className: "h-3 w-3" })
                                })
                            ]}, index)
                        ))
                    })
                ),

                _jsxs("div", { className: "flex justify-between items-center pt-2", children: [
                     _jsxs("div", { children: [
                        _jsx("input", { 
                            type: "file", 
                            ref: fileInputRef, 
                            className: "hidden", 
                            onChange: handleFileChange, 
                            accept: "image/*", 
                            multiple: true // Enable multiple file selection
                        }),
                        _jsxs("button", { type: "button", onClick: handleAttachClick, className: "inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors", title: "Adjuntar fotos", children: [
                             _jsx(PaperClipIcon, { className: "h-5 w-5 mr-2" }),
                            imageFiles.length > 0 ? `Adjuntar más (${imageFiles.length})` : "Adjuntar Fotos"
                        ] })
                     ]}),
                    _jsx("button", {
                        type: "submit",
                        className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 transition-colors",
                        disabled: isSubmitting || !description.trim(),
                        children: isSubmitting ? "Añadiendo..." : "Añadir Entrada"
                    })
                ]})
            ]})
        ]})
    )
}


const BinnacleView = ({ dailyLogs, users, onDeleteLog, currentUser, onAddDailyLog }: { dailyLogs: DailyLog[], users: User[], onDeleteLog: (id: string) => void, currentUser: User, onAddDailyLog: (log: { description: string, files: File[] }) => Promise<boolean> }) => {
    const [selectedWorkerId, setSelectedWorkerId] = useState('all');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    const isCurrentUserAdmin = currentUser.role === UserRole.ADMIN;
    
    const workers = useMemo(() => users.filter(u => u.role === UserRole.WORKER), [users]);

    const filteredAndGroupedLogs = useMemo(() => {
        const filtered = dailyLogs.filter(log => {
            const matchesDate = !selectedDate || log.log_date === selectedDate;
            const matchesWorker = isCurrentUserAdmin 
                ? (selectedWorkerId === 'all' || log.user_id === selectedWorkerId) 
                : log.user_id === currentUser.id;
            return matchesDate && matchesWorker;
        });

        const grouped = new Map<string, DailyLog[]>();
        filtered.forEach(log => {
            if (!grouped.has(log.user_id)) {
                grouped.set(log.user_id, []);
            }
            grouped.get(log.user_id)!.push(log);
        });

        // Sort logs within each group by time
        grouped.forEach(logs => logs.sort((a, b) => a.log_time.localeCompare(b.log_time)));

        return grouped;

    }, [dailyLogs, selectedDate, selectedWorkerId, isCurrentUserAdmin, currentUser.id]);
    
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

    return (
        _jsxs("div", { className: "space-y-6", children: [
            _jsx("h1", { className: "text-3xl font-bold text-slate-800", children: "Bitácora de Actividades" }),
            _jsx(BinnacleForm, { currentUser: currentUser, onAddDailyLog: onAddDailyLog }),
            _jsxs("div", { className: "bg-white p-4 rounded-lg shadow-sm flex flex-wrap gap-4 items-center", children: [
                _jsxs("div", { children: [
                    _jsx("label", { htmlFor: "date-filter", className: "block text-sm font-medium text-slate-700", children: "Filtrar por Fecha" }),
                    _jsx("input", {
                        type: "date",
                        id: "date-filter",
                        value: selectedDate,
                        onChange: (e) => setSelectedDate(e.target.value),
                        className: "mt-1 block w-full sm:w-auto px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    })
                ]}),
                isCurrentUserAdmin && _jsxs("div", { children: [
                    _jsx("label", { htmlFor: "worker-filter", className: "block text-sm font-medium text-slate-700", children: "Filtrar por Trabajador" }),
                    _jsxs("select", {
                        id: "worker-filter",
                        value: selectedWorkerId,
                        onChange: (e) => setSelectedWorkerId(e.target.value),
                        style: { backgroundColor: 'white', color: '#0f172a' },
                        className: "mt-1 block w-full sm:w-auto pl-3 pr-10 py-2 text-base bg-white text-slate-900 border-slate-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md",
                        children: [
                            _jsx("option", { value: "all", className: "bg-white text-slate-900", style: { backgroundColor: "white", color: "#0f172a" }, children: "Todos" }),
                            workers.map(worker => _jsx("option", { value: worker.id, className: "bg-white text-slate-900", style: { backgroundColor: "white", color: "#0f172a" }, children: worker.name }, worker.id))
                        ]
                    })
                ]})
            ]}),
            _jsx("div", { className: "space-y-8", children: 
                filteredAndGroupedLogs.size > 0 ? (
                    Array.from(filteredAndGroupedLogs.entries()).map(([userId, logs]) => (
                        _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [
                            isCurrentUserAdmin && _jsx("h3", { className: "text-lg font-semibold text-slate-800 mb-4", children: userMap.get(userId) || 'Usuario Desconocido' }),
                            _jsx("div", { className: "space-y-4", children: 
                                logs.map(log => {
                                    // Handle legacy image_url and new images array
                                    const images = log.images || (log.image_url ? [log.image_url] : []);
                                    return (
                                        _jsxs("div", { className: "group flex items-start space-x-4 text-sm hover:bg-slate-50 p-2 -m-2 rounded-md", children: [
                                            _jsx("span", { className: "font-mono text-slate-500 flex-shrink-0 pt-0.5", children: log.log_time.substring(0, 5) }),
                                            _jsxs("div", { className: "flex-grow min-w-0", children: [
                                                _jsx("p", { className: "text-slate-700 whitespace-pre-wrap", children: log.description }),
                                                images.length > 0 && (
                                                    _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: 
                                                        images.map((imgUrl, i) => (
                                                            _jsx("a", { href: imgUrl, target: "_blank", rel: "noopener noreferrer", className: "block w-20 h-20", children: 
                                                                _jsx("img", { src: imgUrl, alt: `Imagen ${i+1}`, className: "w-full h-full object-cover rounded-md border hover:opacity-80 transition-opacity" })
                                                            }, i)
                                                        ))
                                                    })
                                                )
                                            ]}),
                                            isCurrentUserAdmin && _jsx("button", { 
                                                onClick: () => onDeleteLog(log.id),
                                                className: "opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-opacity",
                                                title: "Eliminar entrada",
                                                children: _jsx(TrashIcon, { className: "h-4 w-4" })
                                            })
                                        ]}, log.id)
                                    );
                                })
                            })
                        ]}, userId)
                    ))
                ) : (
                    _jsx("div", { className: "bg-white p-8 rounded-lg shadow text-center", children: 
                        _jsx("p", { className: "text-slate-500", children: "No se encontraron entradas para los filtros seleccionados." })
                    })
                )
            })
        ]})
    );
};

export default BinnacleView;
