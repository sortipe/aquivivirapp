
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { IncomeType, ClientImpression, UserRole, VisitInterestStatus, PaymentMethod } from '@/types';
import { supabase, formatSupabaseError } from '@/supabaseClient';

const AddVisitForm = ({ properties, workers, onSubmit, onCancel, initialDate, initialPropertyId, currentUser }) => {
    const isCurrentUserAdmin = currentUser.role === UserRole.ADMIN;
    const [propertyId, setPropertyId] = useState(initialPropertyId || properties[0]?.id || '');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientDni, setClientDni] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('10:00');
    const [notes, setNotes] = useState('');
    const [workerId, setWorkerId] = useState(isCurrentUserAdmin ? (workers[0]?.id || '') : currentUser.id);
    // New fields state
    const [companionName, setCompanionName] = useState('');
    const [companionPhone, setCompanionPhone] = useState('');
    const [incomeType, setIncomeType] = useState([]);
    const [clientImpression, setClientImpression] = useState('');
    const [clientComments, setClientComments] = useState('');
    const [visitPhotoPreview, setVisitPhotoPreview] = useState(undefined);
    const [visitPhotoFile, setVisitPhotoFile] = useState(null);
    const [latitude, setLatitude] = useState(undefined);
    const [longitude, setLongitude] = useState(undefined);
    const [locationStatus, setLocationStatus] = useState('');
    const [friendlyLocation, setFriendlyLocation] = useState('');
    const [interestStatus, setInterestStatus] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleIncomeTypeChange = (type) => {
        setIncomeType(prev => prev.includes(type)
            ? prev.filter(t => t !== type)
            : [...prev, type]);
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            setLocationStatus('Obteniendo ubicación...');
            navigator.geolocation.getCurrentPosition((position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
                setLocationStatus(`Ubicación obtenida: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
            }, () => {
                setLocationStatus('No se pudo obtener la ubicación. Verifique los permisos.');
            }, { enableHighAccuracy: true });
        }
        else {
            setLocationStatus('Geolocalización no es soportada por este navegador.');
        }
    };

    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setVisitPhotoFile(file);
            if (visitPhotoPreview) {
                URL.revokeObjectURL(visitPhotoPreview);
            }
            setVisitPhotoPreview(URL.createObjectURL(file));
        }
    };

    const performSubmit = async () => {
        if (propertyId && clientName && date && time && workerId) {
            setIsUploading(true);
            try {
                let finalPhotoUrl = undefined;
                if (visitPhotoFile) {
                    // Generate a completely new, safe filename ignoring the original filename
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

                onSubmit({
                    propertyId, clientName, date, time, notes, workerId,
                    clientPhone: clientPhone || undefined,
                    client_dni: clientDni || undefined,
                    payment_method: paymentMethod || undefined,
                    visitPhotoUrl: finalPhotoUrl,
                    latitude: latitude,
                    longitude: longitude,
                    companionName: companionName || undefined,
                    companionPhone: companionPhone || undefined,
                    incomeType: incomeType.length > 0 ? incomeType : undefined,
                    clientImpression: clientImpression || undefined,
                    clientComments: clientComments || undefined,
                    friendlyLocation: friendlyLocation || undefined,
                    interestStatus: interestStatus || undefined,
                });

            }
            catch (error) {
                console.error("Error adding visit:", error);
                alert(`Error al añadir la visita:\n${formatSupabaseError(error)}`);
            }
            finally {
                setIsUploading(false);
            }
        }
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        performSubmit();
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
    const fieldsetStyle = "border border-slate-200 rounded-lg p-4 space-y-4";
    const legendStyle = "text-md font-semibold text-slate-700 px-2";

    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("fieldset", { className: fieldsetStyle, children: [_jsx("legend", { className: legendStyle, children: "Detalles de la Visita" }), _jsxs("div", { children: [_jsx("label", { htmlFor: "propertyId", className: "block text-sm font-medium text-slate-700", children: "Propiedad" }), _jsxs("select", { id: "propertyId", value: propertyId, onChange: (e) => setPropertyId(e.target.value), className: inputStyle, required: true, disabled: !!initialPropertyId, children: [_jsx("option", { value: "", disabled: true, children: "Seleccione una propiedad" }), properties.map(prop => _jsx("option", { value: prop.id, children: prop.name }, prop.id))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "clientName", className: "block text-sm font-medium text-slate-700", children: "Nombre del Cliente" }), _jsx("input", { type: "text", id: "clientName", value: clientName, onChange: (e) => setClientName(e.target.value), className: inputStyle, required: true, placeholder: "Ej: Juan Pérez" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "clientPhone", className: "block text-sm font-medium text-slate-700", children: "Número del Cliente" }), _jsx("input", { type: "tel", id: "clientPhone", value: clientPhone, onChange: (e) => setClientPhone(e.target.value), className: inputStyle, placeholder: "Ej: 987 654 321" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "clientDni", className: "block text-sm font-medium text-slate-700", children: "Número de DNI" }), _jsx("input", { type: "text", id: "clientDni", value: clientDni, onChange: (e) => setClientDni(e.target.value), className: inputStyle, placeholder: "8 dígitos numéricos", pattern: "[0-9]{8}", maxLength: 8, title: "Debe contener 8 dígitos numéricos" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "paymentMethod", className: "block text-sm font-medium text-slate-700", children: "Forma de Compra" }), _jsxs("select", { id: "paymentMethod", value: paymentMethod, onChange: (e) => setPaymentMethod(e.target.value), className: inputStyle, children: [_jsx("option", { value: "", children: "Seleccionar..." }), _jsx("option", { value: PaymentMethod.CONTADO, children: PaymentMethod.CONTADO }), _jsx("option", { value: PaymentMethod.CREDITO, children: PaymentMethod.CREDITO })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "date", className: "block text-sm font-medium text-slate-700", children: "Fecha" }), _jsx("input", { type: "date", id: "date", value: date, onChange: (e) => setDate(e.target.value), className: inputStyle, required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "time", className: "block text-sm font-medium text-slate-700", children: "Hora" }), _jsx("input", { type: "time", id: "time", value: time, onChange: (e) => setTime(e.target.value), className: inputStyle, required: true })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "workerId", className: "block text-sm font-medium text-slate-700", children: "Asignar a" }), _jsx("select", { id: "workerId", value: workerId, onChange: (e) => setWorkerId(e.target.value), className: inputStyle, required: true, disabled: !isCurrentUserAdmin, children: isCurrentUserAdmin ? (_jsxs(_Fragment, { children: [_jsx("option", { value: "", disabled: true, children: "Seleccione un trabajador" }), workers.map(worker => _jsx("option", { value: worker.id, children: worker.name }, worker.id))] })) : (_jsx("option", { value: currentUser.id, children: currentUser.name })) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "friendlyLocation", className: "block text-sm font-medium text-slate-700", children: "Ubicación amigable" }), _jsx("textarea", { id: "friendlyLocation", value: friendlyLocation, onChange: (e) => setFriendlyLocation(e.target.value), rows: 2, className: inputStyle, placeholder: "Ej: Cerca al parque, frente a la tienda..." })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "notes", className: "block text-sm font-medium text-slate-700", children: "Notas Internas (Opcional)" }), _jsx("textarea", { id: "notes", value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, className: inputStyle, placeholder: "Añadir notas sobre la visita..." })] })] }), _jsxs("fieldset", { className: fieldsetStyle, children: [_jsx("legend", { className: legendStyle, children: "Registro de Visita (Opcional)" }), _jsxs("div", { children: [_jsx("label", { htmlFor: "visitPhoto", className: "block text-sm font-medium text-slate-700", children: "Subir foto de la visita" }), _jsx("input", { type: "file", id: "visitPhoto", onChange: handlePhotoChange, className: `${inputStyle} p-0 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100` }), visitPhotoPreview && _jsx("img", { src: visitPhotoPreview, alt: "Vista previa", className: "mt-2 rounded-md max-h-40 w-auto" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Ubicación Actual" }), _jsx("button", { type: "button", onClick: handleGetLocation, className: "mt-1 w-full flex justify-center items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50", children: "Obtener Ubicación Actual" }), locationStatus && _jsx("p", { className: "mt-2 text-xs text-slate-500", children: locationStatus })] })] }), _jsxs("fieldset", { className: fieldsetStyle, children: [_jsx("legend", { className: legendStyle, children: "Acompañante (Opcional)" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "companionName", className: "block text-sm font-medium text-slate-700", children: "Nombre" }), _jsx("input", { type: "text", id: "companionName", value: companionName, onChange: (e) => setCompanionName(e.target.value), className: inputStyle })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "companionPhone", className: "block text-sm font-medium text-slate-700", children: "Teléfono" }), _jsx("input", { type: "tel", id: "companionPhone", value: companionPhone, onChange: (e) => setCompanionPhone(e.target.value), className: inputStyle })] })] })] }), _jsxs("fieldset", { className: fieldsetStyle, children: [_jsx("legend", { className: legendStyle, children: "Feedback del Cliente" }), _jsxs("div", { children: [_jsx("label", { htmlFor: "interestStatus", className: "block text-sm font-medium text-slate-700", children: "Interés" }), _jsxs("select", { id: "interestStatus", value: interestStatus, onChange: (e) => setInterestStatus(e.target.value), className: inputStyle, children: [_jsx("option", { value: "", children: "Seleccionar..." }), Object.values(VisitInterestStatus).map(val => _jsx("option", { value: val, children: val }, String(val)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Tipo de ingreso" }), _jsx("div", { className: "mt-2 grid grid-cols-2 gap-x-4 gap-y-2", children: Object.values(IncomeType).map(type => (_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: incomeType.includes(type), onChange: () => handleIncomeTypeChange(type), className: "h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" }), _jsx("span", { className: "text-sm text-slate-700", children: type })] }, String(type)))) })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: _jsxs("div", { children: [_jsx("label", { htmlFor: "clientImpression", className: "block text-sm font-medium text-slate-700", children: "Impresión del cliente" }), _jsxs("select", { id: "clientImpression", value: clientImpression, onChange: (e) => setClientImpression(e.target.value), className: inputStyle, children: [_jsx("option", { value: "", children: "Seleccionar..." }), Object.values(ClientImpression).map(val => _jsx("option", { value: val, children: val }, String(val)))] })] }) }), _jsxs("div", { children: [_jsx("label", { htmlFor: "clientComments", className: "block text-sm font-medium text-slate-700", children: "Comentarios del cliente" }), _jsx("textarea", { id: "clientComments", value: clientComments, onChange: (e) => setClientComments(e.target.value), rows: 3, className: inputStyle, placeholder: "¿Qué le pareció la propiedad al cliente?" })] })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-6", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }), _jsx("button", { type: "submit", disabled: isUploading, className: "px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 disabled:bg-orange-300", children: isUploading ? 'Guardando...' : 'Generar Visita' })] })] }));
};

export default AddVisitForm;
