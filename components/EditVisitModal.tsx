
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { IncomeType, ClientImpression, VisitInterestStatus, UserRole, PaymentMethod, YesNo } from '@/types';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { supabase, formatSupabaseError } from '@/supabaseClient';
import { MapPinIcon } from '@/components/icons/MapPinIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
import { ExclamationTriangleIcon } from '@/components/icons/ExclamationTriangleIcon';

const EditVisitModal = ({ isOpen, onClose, onUpdateVisit, visit, properties, workers, currentUser }) => {
    const [formData, setFormData] = useState(visit);
    const [visitPhotoFile, setVisitPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(visit?.visitPhotoUrl);
    const [cancellationPhotoFile, setCancellationPhotoFile] = useState(null);
    const [cancellationPhotoPreview, setCancellationPhotoPreview] = useState(visit?.cancellation_photo_url);
    const [isUploading, setIsUploading] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [locationError, setLocationError] = useState(null);

    const isCurrentUserWorker = currentUser.role === UserRole.WORKER;

    useEffect(() => {
        if (visit) {
            const initialFormData = {
                ...visit,
                incomeType: Array.isArray(visit.incomeType) ? visit.incomeType : [],
                client_attended: visit.client_attended || '',
                check_in_time: visit.check_in_time || null,
            };
            setFormData(initialFormData);
            setPhotoPreview(visit.visitPhotoUrl);
            setCancellationPhotoPreview(visit.cancellation_photo_url);
            setVisitPhotoFile(null);
            setCancellationPhotoFile(null);
            setLocationError(null);
        }
    }, [visit]);

    if (!isOpen || !visit)
        return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'client_attended' && value === YesNo.SI) {
                newState.cancellation_photo_url = null;
                setCancellationPhotoFile(null);
                setCancellationPhotoPreview(null);
            }
            return newState;
        });
    };

    const handleIncomeTypeChange = (type) => {
        const currentTypes = formData.incomeType || [];
        const newSelectedTypes = currentTypes.includes(type)
            ? currentTypes.filter(t => t !== type)
            : [...currentTypes, type];
        setFormData(prev => ({ ...prev, incomeType: newSelectedTypes }));
    };

    // Helper to promisify geolocation
    const getPosition = (options) => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    };

    // Quick Check-in Function
    const handleCheckIn = async () => {
        if (!navigator.geolocation) {
            alert('Tu navegador no soporta geolocalización.');
            return;
        }

        setIsCheckingIn(true);
        setLocationError(null);
        
        try {
            let position;
            
            // Intento 1: Alta Precisión (GPS ideal)
            try {
                position = await getPosition({ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
            } catch (err) {
                // Si el error es permiso denegado (código 1), no tiene sentido reintentar
                if (err.code === 1) throw err;
                
                console.warn("GPS de alta precisión falló, intentando baja precisión...", err);
                // Intento 2: Baja Precisión (Wifi/Red, más rápido y compatible)
                position = await getPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
            }

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const now = new Date();
            const checkInTime = now.toISOString(); 
            
            const updatedData = {
                ...formData,
                latitude,
                longitude,
                check_in_time: checkInTime
            };

            setFormData(updatedData);

            try {
                await onUpdateVisit(updatedData, false);
            } catch (error) {
                console.error("Check-in failed", error);
                alert("Error al guardar en base de datos, pero se actualizó localmente.");
            }

        } catch (error) {
            console.error("Geolocation fatal error:", error);
            let msg = 'No se pudo obtener la ubicación.';
            
            if (error.code === 1) {
                msg = 'Permiso denegado. El navegador ha bloqueado el acceso a la ubicación.';
            } else if (error.code === 2) {
                msg = 'Ubicación no disponible en este dispositivo/red.';
            } else if (error.code === 3) {
                msg = 'Se agotó el tiempo de espera.';
            }

            setLocationError(msg);
            alert(`⚠️ ${msg}\n\nPuedes usar el botón "Registrar solo Hora" que aparecerá ahora.`);
        } finally {
            setIsCheckingIn(false);
        }
    };

    const handleForceCheckIn = async () => {
        const now = new Date();
        const checkInTime = now.toISOString(); 
        
        const updatedData = {
            ...formData,
            check_in_time: checkInTime
            // Mantenemos lat/long anteriores si existían, o null si no
        };

        setFormData(updatedData);
        setLocationError(null);

        try {
            await onUpdateVisit(updatedData, false);
        } catch (error) {
            console.error("Force Check-in failed", error);
        }
    };
    
    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setVisitPhotoFile(file);
            if (photoPreview && photoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
            }
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleCancellationPhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCancellationPhotoFile(file);
            if (cancellationPhotoPreview && cancellationPhotoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(cancellationPhotoPreview);
            }
            setCancellationPhotoPreview(URL.createObjectURL(file));
        }
    };
    
    const performSubmit = async () => {
        setIsUploading(true);
        try {
            let finalPhotoUrl = formData.visitPhotoUrl;
            if (visitPhotoFile) {
                // Generate a completely new, safe filename ignoring the original filename
                // to prevent "Invalid Key" errors with special characters
                const fileExt = visitPhotoFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
                const safeFileName = `${Date.now()}-visit.${fileExt}`;
                const filePath = `visits/${safeFileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('visit-photos')
                    .upload(filePath, visitPhotoFile);
                if (uploadError)
                    throw uploadError;
                const { data: urlData } = supabase.storage
                    .from('visit-photos')
                    .getPublicUrl(filePath);
                finalPhotoUrl = urlData.publicUrl;
            }

            let finalCancellationPhotoUrl = formData.cancellation_photo_url;
            if (cancellationPhotoFile) {
                // Generate a completely new, safe filename
                const fileExt = cancellationPhotoFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
                const safeFileName = `${Date.now()}-cancellation.${fileExt}`;
                const filePath = `cancellations/${safeFileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('visit-photos')
                    .upload(filePath, cancellationPhotoFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage
                    .from('visit-photos')
                    .getPublicUrl(filePath);
                finalCancellationPhotoUrl = urlData.publicUrl;
            }

            if (formData.client_attended === YesNo.SI) {
                finalCancellationPhotoUrl = null;
            }

            const finalIncomeType = formData.incomeType && formData.incomeType.length > 0 ? formData.incomeType : undefined;
            const updatedVisitData = { ...formData, visitPhotoUrl: finalPhotoUrl, client_attended: formData.client_attended || null, cancellation_photo_url: finalCancellationPhotoUrl, incomeType: finalIncomeType };
            onUpdateVisit(updatedVisitData, true); // Pass true to close modal on final save
        } catch (error) {
            console.error("Error updating visit:", error);
            alert(`Error al actualizar la visita:\n${formatSupabaseError(error)}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        performSubmit();
    };
    
    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";
    const fieldsetStyle = "border border-slate-200 rounded-lg p-4 space-y-4";
    const legendStyle = "text-md font-semibold text-slate-700 px-2";

    const checkInDate = formData.check_in_time ? new Date(formData.check_in_time) : null;

    return (
        _jsx("div", { 
            className: "fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4", 
            onClick: onClose, 
            children: _jsxs("div", { 
                className: "bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col", 
                onClick: e => e.stopPropagation(), 
                children: [
                    _jsxs("div", { 
                        className: "p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0", 
                        children: [
                            _jsx("h2", { className: "text-xl font-bold text-slate-800", children: "Editar Visita" }), 
                            _jsx("button", { 
                                onClick: onClose, 
                                className: "p-2 rounded-full text-slate-500 hover:bg-slate-100", 
                                "aria-label": "Cerrar modal", 
                                children: _jsx(CloseIcon, {}) 
                            })
                        ] 
                    }), 
                    _jsx("div", { 
                        className: "p-6 overflow-y-auto", 
                        children: _jsxs("form", { 
                            onSubmit: handleSubmit, 
                            className: "space-y-6", 
                            children: [
                                _jsxs("fieldset", { 
                                    className: fieldsetStyle, 
                                    children: [
                                        _jsx("legend", { className: legendStyle, children: "Detalles de la Visita" }), 
                                        _jsxs("div", { 
                                            children: [
                                                _jsx("label", { htmlFor: "propertyId", className: "block text-sm font-medium text-slate-700", children: "Propiedad" }), 
                                                _jsx("select", { 
                                                    id: "propertyId", 
                                                    name: "propertyId", 
                                                    value: formData.propertyId, 
                                                    onChange: handleChange, 
                                                    className: inputStyle, 
                                                    required: true, 
                                                    disabled: isCurrentUserWorker, 
                                                    children: properties.map(prop => _jsx("option", { value: prop.id, children: prop.name }, prop.id)) 
                                                })
                                            ] 
                                        }), 
                                        _jsxs("div", { 
                                            className: "grid grid-cols-2 gap-4", 
                                            children: [
                                                _jsxs("div", { 
                                                    children: [
                                                        _jsx("label", { htmlFor: "clientName", className: "block text-sm font-medium text-slate-700", children: "Nombre del Cliente" }), 
                                                        _jsx("input", { type: "text", id: "clientName", name: "clientName", value: formData.clientName, onChange: handleChange, className: inputStyle, required: true, disabled: isCurrentUserWorker })
                                                    ] 
                                                }), 
                                                _jsxs("div", { 
                                                    children: [
                                                        _jsx("label", { htmlFor: "clientPhone", className: "block text-sm font-medium text-slate-700", children: "Número del Cliente" }), 
                                                        _jsx("input", { type: "tel", id: "clientPhone", name: "clientPhone", value: formData.clientPhone || '', onChange: handleChange, className: inputStyle, disabled: isCurrentUserWorker })
                                                    ] 
                                                })
                                            ] 
                                        }), 
                                        _jsxs("div", { 
                                            className: "grid grid-cols-2 gap-4", 
                                            children: [
                                                _jsxs("div", { 
                                                    children: [
                                                        _jsx("label", { htmlFor: "client_dni", className: "block text-sm font-medium text-slate-700", children: "Número de DNI" }), 
                                                        _jsx("input", { type: "text", id: "client_dni", name: "client_dni", value: formData.client_dni || '', onChange: handleChange, className: inputStyle, placeholder: "8 dígitos numéricos", pattern: "[0-9]{8}", maxLength: 8, title: "Debe contener 8 dígitos numéricos", disabled: isCurrentUserWorker })
                                                    ] 
                                                }), 
                                                _jsxs("div", { 
                                                    children: [
                                                        _jsx("label", { htmlFor: "payment_method", className: "block text-sm font-medium text-slate-700", children: "Forma de Compra" }), 
                                                        _jsxs("select", { 
                                                            id: "payment_method", 
                                                            name: "payment_method", 
                                                            value: formData.payment_method || '', 
                                                            onChange: handleChange, 
                                                            className: inputStyle, 
                                                            disabled: isCurrentUserWorker, 
                                                            children: [
                                                                _jsx("option", { value: "", children: "Seleccionar..." }), 
                                                                _jsx("option", { value: PaymentMethod.CONTADO, children: PaymentMethod.CONTADO }), 
                                                                _jsx("option", { value: PaymentMethod.CREDITO, children: PaymentMethod.CREDITO })
                                                            ] 
                                                        })
                                                    ] 
                                                })
                                            ] 
                                        }), 
                                        _jsxs("div", { 
                                            className: "grid grid-cols-2 gap-4", 
                                            children: [
                                                _jsxs("div", { 
                                                    children: [
                                                        _jsx("label", { htmlFor: "date", className: "block text-sm font-medium text-slate-700", children: "Fecha" }), 
                                                        _jsx("input", { type: "date", id: "date", name: "date", value: formData.date, onChange: handleChange, className: inputStyle, required: true, disabled: isCurrentUserWorker })
                                                    ] 
                                                }), 
                                                _jsxs("div", { 
                                                    children: [
                                                        _jsx("label", { htmlFor: "time", className: "block text-sm font-medium text-slate-700", children: "Hora" }), 
                                                        _jsx("input", { type: "time", id: "time", name: "time", value: formData.time, onChange: handleChange, className: inputStyle, required: true, disabled: isCurrentUserWorker })
                                                    ] 
                                                })
                                            ] 
                                        }), 
                                        _jsxs("div", { 
                                            children: [
                                                _jsx("label", { htmlFor: "workerId", className: "block text-sm font-medium text-slate-700", children: "Asignar a" }), 
                                                _jsx("select", { 
                                                    id: "workerId", 
                                                    name: "workerId", 
                                                    value: formData.workerId, 
                                                    onChange: handleChange, 
                                                    className: inputStyle, 
                                                    required: true, 
                                                    disabled: isCurrentUserWorker, 
                                                    children: [
                                                        _jsx("option", { value: "", disabled: true, children: "Seleccione un trabajador" }), 
                                                        workers.map(worker => _jsx("option", { value: worker.id, children: worker.name }, worker.id))
                                                    ] 
                                                })
                                            ] 
                                        }),
                                        (isCurrentUserWorker || !checkInDate) && (
                                            _jsxs("div", { 
                                                className: `my-4 p-4 rounded-lg border ${locationError ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`, 
                                                children: [
                                                    _jsxs("div", { 
                                                        className: "flex justify-between items-center mb-2", 
                                                        children: [
                                                            _jsx("h3", { className: `font-medium ${locationError ? 'text-red-800' : 'text-blue-800'}`, children: "Registro de Asistencia" }),
                                                            checkInDate && _jsx("span", { className: "text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold", children: "¡Registrado!" })
                                                        ]
                                                    }),
                                                    !checkInDate ? (
                                                        _jsxs("div", { 
                                                            className: "space-y-3", 
                                                            children: [
                                                                _jsxs("button", { 
                                                                    type: "button", 
                                                                    onClick: handleCheckIn, 
                                                                    disabled: isCheckingIn,
                                                                    className: "w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold shadow-sm transition-colors disabled:bg-blue-400",
                                                                    children: [
                                                                        isCheckingIn ? _jsx("span", { className: "animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full" }) : _jsx(MapPinIcon, { className: "h-5 w-5 mr-2 text-white" }),
                                                                        isCheckingIn ? "Obteniendo GPS..." : "📍 Marcar Llegada"
                                                                    ]
                                                                }),
                                                                locationError && (
                                                                    _jsxs("div", { 
                                                                        className: "animate-fade-in", 
                                                                        children: [
                                                                            _jsxs("p", { className: "text-sm text-red-600 mb-2 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "h-4 w-4 mr-1" }), locationError] }),
                                                                            _jsx("button", {
                                                                                type: "button",
                                                                                onClick: handleForceCheckIn,
                                                                                className: "w-full flex items-center justify-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium text-sm shadow-sm transition-colors",
                                                                                children: "Registrar solo Hora (Sin GPS)"
                                                                            })
                                                                        ]
                                                                    })
                                                                )
                                                            ]
                                                        })
                                                    ) : (
                                                        _jsxs("div", { 
                                                            className: "flex flex-col space-y-1 text-sm text-blue-900 bg-white p-3 rounded border border-blue-100", 
                                                            children: [
                                                                _jsxs("div", { 
                                                                    className: "flex items-center", 
                                                                    children: [
                                                                        _jsx(ClockIcon, { className: "h-4 w-4 mr-2 text-blue-500" }),
                                                                        _jsxs("span", { children: ["Hora: ", _jsx("strong", { children: checkInDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) })] })
                                                                    ]
                                                                }),
                                                                formData.latitude && formData.longitude ? (
                                                                    _jsxs("div", { 
                                                                        className: "flex items-center", 
                                                                        children: [
                                                                            _jsx(MapPinIcon, { className: "h-4 w-4 mr-2 text-blue-500" }),
                                                                            _jsxs("span", { children: ["GPS: ", formData.latitude.toFixed(5), ", ", formData.longitude.toFixed(5)] })
                                                                        ]
                                                                    })
                                                                ) : (
                                                                    _jsxs("div", { 
                                                                        className: "flex items-center text-orange-600", 
                                                                        children: [
                                                                            _jsx(ExclamationTriangleIcon, { className: "h-4 w-4 mr-2" }),
                                                                            _jsx("span", { className: "italic", children: "Ubicación no registrada (Solo hora)" })
                                                                        ]
                                                                    })
                                                                )
                                                            ]
                                                        })
                                                    )
                                                ]
                                            })
                                        ),
                                        _jsxs("div", { 
                                            children: [
                                                _jsx("label", { htmlFor: "friendlyLocation", className: "block text-sm font-medium text-slate-700", children: "Ubicación amigable" }), 
                                                _jsx("textarea", { id: "friendlyLocation", name: "friendlyLocation", value: formData.friendlyLocation || '', onChange: handleChange, rows: 2, className: inputStyle })
                                            ] 
                                        }), 
                                        _jsxs("div", { 
                                            children: [
                                                _jsx("label", { htmlFor: "notes", className: "block text-sm font-medium text-slate-700", children: "Notas Internas (Opcional)" }), 
                                                _jsx("textarea", { id: "notes", name: "notes", value: formData.notes || '', onChange: handleChange, rows: 2, className: inputStyle })
                                            ] 
                                        })
                                    ] 
                                }), 
                                _jsxs("fieldset", { 
                                    className: fieldsetStyle, 
                                    children: [
                                        _jsx("legend", { className: legendStyle, children: "Asistencia del Cliente" }), 
                                        _jsxs("div", { 
                                            children: [
                                                _jsx("label", { htmlFor: "client_attended", className: "block text-sm font-medium text-slate-700", children: "¿El cliente asistió?" }), 
                                                _jsxs("select", { 
                                                    id: "client_attended", 
                                                    name: "client_attended", 
                                                    value: formData.client_attended || '', 
                                                    onChange: handleChange, 
                                                    className: inputStyle, 
                                                    children: [
                                                        _jsx("option", { value: "", children: "Seleccionar..." }), 
                                                        _jsx("option", { value: YesNo.SI, children: "Sí" }), 
                                                        _jsx("option", { value: YesNo.NO, children: "No" })
                                                    ] 
                                                })
                                            ] 
                                        }), 
                                        formData.client_attended === YesNo.NO && (
                                            _jsxs("div", { 
                                                className: "mt-4", 
                                                children: [
                                                    _jsx("label", { htmlFor: "cancellationPhoto", className: "block text-sm font-medium text-slate-700", children: "Subir constancia de cancelación" }), 
                                                    _jsx("input", { type: "file", id: "cancellationPhoto", onChange: handleCancellationPhotoChange, className: `${inputStyle} p-0 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100` }), 
                                                    cancellationPhotoPreview && (
                                                        _jsx("img", { src: cancellationPhotoPreview, alt: "Vista previa de constancia", className: "mt-2 rounded-md max-h-40 w-auto" })
                                                    )
                                                ] 
                                            })
                                        )
                                    ] 
                                }), 
                                _jsxs("fieldset", { 
                                    className: fieldsetStyle, 
                                    children: [
                                        _jsx("legend", { className: legendStyle, children: "Registro de Visita (Opcional)" }), 
                                        _jsxs("div", { 
                                            children: [
                                                _jsx("label", { htmlFor: "visitPhoto", className: "block text-sm font-medium text-slate-700", children: "Subir foto de la visita" }), 
                                                _jsx("input", { type: "file", id: "visitPhoto", onChange: handlePhotoChange, className: `${inputStyle} p-0 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100` }), 
                                                photoPreview && _jsx("img", { src: photoPreview, alt: "Vista previa", className: "mt-2 rounded-md max-h-40 w-auto" })
                                            ] 
                                        })
                                    ] 
                                }), 
                                _jsxs("fieldset", { 
                                    className: fieldsetStyle, 
                                    children: [
                                        _jsx("legend", { className: legendStyle, children: "Acompañante (Opcional)" }), 
                                        _jsxs("div", { 
                                            className: "grid grid-cols-2 gap-4", 
                                            children: [
                                                _jsxs("div", { 
                                                    children: [
                                                        _jsx("label", { htmlFor: "companionName", className: "block text-sm font-medium text-slate-700", children: "Nombre" }), 
                                                        _jsx("input", { type: "text", id: "companionName", name: "companionName", value: formData.companionName || '', onChange: handleChange, className: inputStyle })
                                                    ] 
                                                }), 
                                                _jsxs("div", { 
                                                    children: [
                                                        _jsx("label", { htmlFor: "companionPhone", className: "block text-sm font-medium text-slate-700", children: "Teléfono" }), 
                                                        _jsx("input", { type: "tel", id: "companionPhone", name: "companionPhone", value: formData.companionPhone || '', onChange: handleChange, className: inputStyle })
                                                    ] 
                                                })
                                            ] 
                                        })
                                    ] 
                                }), 
                                _jsxs("fieldset", { 
                                    className: fieldsetStyle, 
                                    children: [
                                        _jsx("legend", { className: legendStyle, children: "Feedback del Cliente" }), 
                                        _jsxs("div", { 
                                            children: [
                                                _jsx("label", { htmlFor: "interestStatus", className: "block text-sm font-medium text-slate-700", children: "Interés" }), 
                                                _jsxs("select", { 
                                                    id: "interestStatus", 
                                                    name: "interestStatus", 
                                                    value: formData.interestStatus || '', 
                                                    onChange: handleChange, 
                                                    className: inputStyle, 
                                                    children: [
                                                        _jsx("option", { value: "", children: "Seleccionar..." }), 
                                                        Object.values(VisitInterestStatus).map(val => _jsx("option", { value: val, children: val }, String(val)))
                                                    ] 
                                                })
                                            ] 
                                        }), 
                                        _jsxs("div", { 
                                            children: [
                                                _jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Tipo de ingreso" }), 
                                                _jsx("div", { 
                                                    className: "mt-2 grid grid-cols-2 gap-x-4 gap-y-2", 
                                                    children: Object.values(IncomeType).map(type => (
                                                        _jsxs("label", { 
                                                            className: "flex items-center space-x-2", 
                                                            children: [
                                                                _jsx("input", { type: "checkbox", checked: (formData.incomeType || []).includes(type), onChange: () => handleIncomeTypeChange(type), className: "h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" }), 
                                                                _jsx("span", { className: "text-sm text-slate-700", children: type })
                                                            ] 
                                                        }, String(type))
                                                    )) 
                                                })
                                            ] 
                                        }), 
                                        _jsx("div", { 
                                            className: "grid grid-cols-1 sm:grid-cols-2 gap-4", 
                                            children: _jsxs("div", { 
                                                children: [
                                                    _jsx("label", { htmlFor: "clientImpression", className: "block text-sm font-medium text-slate-700", children: "Impresión del cliente" }), 
                                                    _jsxs("select", { 
                                                        id: "clientImpression", 
                                                        name: "clientImpression", 
                                                        value: formData.clientImpression || '', 
                                                        onChange: handleChange, 
                                                        className: inputStyle, 
                                                        children: [
                                                            _jsx("option", { value: "", children: "Seleccionar..." }), 
                                                            Object.values(ClientImpression).map(val => _jsx("option", { value: val, children: val }, String(val)))
                                                        ] 
                                                    })
                                                ] 
                                            }) 
                                        }), 
                                        _jsxs("div", { 
                                            children: [
                                                _jsx("label", { htmlFor: "clientComments", className: "block text-sm font-medium text-slate-700", children: "Comentarios del cliente" }), 
                                                _jsx("textarea", { id: "clientComments", name: "clientComments", value: formData.clientComments || '', onChange: handleChange, rows: 3, className: inputStyle })
                                            ] 
                                        })
                                    ] 
                                }), 
                                _jsxs("div", { 
                                    className: "flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-6", 
                                    children: [
                                        _jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }), 
                                        _jsx("button", { type: "submit", disabled: isUploading, className: "px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 disabled:bg-orange-300", children: isUploading ? 'Guardando...' : 'Guardar Cambios' })
                                    ] 
                                })
                            ] 
                        }) 
                    })
                ] 
            }) 
        })
    );
};

export default EditVisitModal;
