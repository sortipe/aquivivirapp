import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PaymentMethod } from '@/types';
import { SearchIcon } from '@/components/icons/SearchIcon';

const ScheduleVisitForm = ({ properties, workers, onSubmit, onCancel, initialDate }) => {
    // Original state
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientDni, setClientDni] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [time, setTime] = useState('10:00');
    const [workerId, setWorkerId] = useState(workers[0]?.id || '');
    const [friendlyLocation, setFriendlyLocation] = useState('');
    const [notes, setNotes] = useState('');

    // New state for searchable property dropdown
    const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
    const [propertySearch, setPropertySearch] = useState('');
    const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);
    const propertyDropdownRef = useRef(null);

    // Effect to initialize property search text
    useEffect(() => {
        const initialProperty = properties.find(p => p.id === propertyId);
        if (initialProperty) {
            setPropertySearch(initialProperty.name);
        }
    }, [properties, propertyId]);

    const filteredProperties = useMemo(() => {
        if (!isPropertyDropdownOpen) return [];
        
        const lowercasedSearch = propertySearch.toLowerCase();
        
        const currentSelectedProperty = properties.find(p => p.id === propertyId);
        if (currentSelectedProperty && currentSelectedProperty.name.toLowerCase() === lowercasedSearch) {
            return [];
        }
        
        if (!lowercasedSearch) return properties;

        return properties.filter(prop => 
            prop.name.toLowerCase().includes(lowercasedSearch) || 
            (prop.propertyIdNumber && prop.propertyIdNumber.toLowerCase().includes(lowercasedSearch))
        );
    }, [propertySearch, properties, isPropertyDropdownOpen, propertyId]);

    const handlePropertySelect = (prop) => {
        setPropertyId(prop.id);
        setPropertySearch(prop.name);
        setIsPropertyDropdownOpen(false);
    };
    
    // Effect to handle clicks outside the property dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (propertyDropdownRef.current && !propertyDropdownRef.current.contains(event.target)) {
                setIsPropertyDropdownOpen(false);
                const selectedProperty = properties.find(p => p.id === propertyId);
                if (selectedProperty) {
                    setPropertySearch(selectedProperty.name);
                } else if (properties.length > 0) {
                    // If nothing is selected, reset to the first property
                    setPropertyId(properties[0].id);
                    setPropertySearch(properties[0].name);
                } else {
                    setPropertySearch('');
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [propertyId, properties]);


    const handleSubmit = (e) => {
        e.preventDefault();
        if (propertyId && clientName && initialDate && time && workerId) {
            onSubmit({
                propertyId,
                clientName,
                clientPhone: clientPhone || undefined,
                client_dni: clientDni || undefined,
                payment_method: paymentMethod || undefined,
                date: initialDate,
                time,
                workerId,
                friendlyLocation: friendlyLocation || undefined,
                notes: notes || undefined,
            });
        } else if (!propertyId) {
            alert("Por favor, busque y seleccione una propiedad de la lista.");
        }
    };
    
    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm disabled:bg-slate-50";

    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        _jsxs("div", { className: "relative", ref: propertyDropdownRef, children: [
            _jsx("label", { htmlFor: "propertySearch", className: "block text-sm font-medium text-slate-700", children: "Propiedad" }),
            _jsxs("div", { className: "relative", children: [
                _jsx("input", {
                    type: "text",
                    id: "propertySearch",
                    value: propertySearch,
                    onChange: (e) => {
                        setPropertySearch(e.target.value);
                        if (propertyId) setPropertyId('');
                        setIsPropertyDropdownOpen(true);
                    },
                    onFocus: () => setIsPropertyDropdownOpen(true),
                    placeholder: "Buscar por nombre o ID...",
                    className: inputStyle,
                    required: !propertyId,
                    autoComplete: "off"
                }),
                _jsx("div", { className: "absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none", children: 
                    _jsx(SearchIcon, { className: "h-5 w-5 text-gray-400" })
                })
            ]}),
            isPropertyDropdownOpen && _jsx("ul", { className: "absolute z-20 w-full bg-white border border-slate-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg", children: 
                filteredProperties.length > 0 ? (
                    filteredProperties.map(prop => _jsxs("li", {
                        className: "cursor-pointer hover:bg-orange-50 p-3",
                        onClick: () => handlePropertySelect(prop),
                        onMouseDown: (e) => e.preventDefault(),
                        children: [
                            _jsx("p", { className: "font-semibold text-sm text-slate-800", children: prop.name }),
                            _jsx("p", { className: "text-xs text-slate-500", children: `ID: ${prop.propertyIdNumber}` })
                        ]
                    }, prop.id))
                ) : (
                    _jsx("li", { className: "p-3 text-sm text-slate-500", children: "No se encontraron propiedades." })
                )
            })
        ]}),
        _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            _jsxs("div", { children: [
                _jsx("label", { htmlFor: "clientName", className: "block text-sm font-medium text-slate-700", children: "Nombre del Cliente" }),
                _jsx("input", { type: "text", id: "clientName", value: clientName, onChange: (e) => setClientName(e.target.value), required: true, className: inputStyle, placeholder: "Ej: Juan Pérez" })
            ]}),
            _jsxs("div", { children: [
                _jsx("label", { htmlFor: "clientPhone", className: "block text-sm font-medium text-slate-700", children: "Número del Cliente" }),
                _jsx("input", { type: "tel", id: "clientPhone", value: clientPhone, onChange: (e) => setClientPhone(e.target.value), className: inputStyle, placeholder: "Ej: 987 654 321" })
            ]})
        ]}),
        _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            _jsxs("div", { children: [
                _jsx("label", { htmlFor: "clientDni", className: "block text-sm font-medium text-slate-700", children: "Número de DNI" }),
                _jsx("input", { type: "text", id: "clientDni", value: clientDni, onChange: (e) => setClientDni(e.target.value), className: inputStyle, placeholder: "8 dígitos numéricos", pattern: "[0-9]{8}", maxLength: 8, title: "Debe contener 8 dígitos numéricos" })
            ]}),
            _jsxs("div", { children: [
                _jsx("label", { htmlFor: "paymentMethod", className: "block text-sm font-medium text-slate-700", children: "Forma de Compra" }),
                _jsxs("select", { id: "paymentMethod", value: paymentMethod, onChange: (e) => setPaymentMethod(e.target.value), className: inputStyle, children: [
                    _jsx("option", { value: "", children: "Seleccionar..." }),
                    _jsx("option", { value: PaymentMethod.CONTADO, children: PaymentMethod.CONTADO }),
                    _jsx("option", { value: PaymentMethod.CREDITO, children: PaymentMethod.CREDITO })
                ]})
            ]})
        ]}),
        _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            _jsxs("div", { children: [
                _jsx("label", { htmlFor: "date", className: "block text-sm font-medium text-slate-700", children: "Fecha" }),
                _jsx("input", { type: "date", id: "date", value: initialDate, className: inputStyle, required: true, disabled: true })
            ]}),
            _jsxs("div", { children: [
                _jsx("label", { htmlFor: "time", className: "block text-sm font-medium text-slate-700", children: "Hora" }),
                _jsx("input", { type: "time", id: "time", value: time, onChange: (e) => setTime(e.target.value), className: inputStyle, required: true })
            ]})
        ]}),
        _jsxs("div", { children: [
            _jsx("label", { htmlFor: "workerId", className: "block text-sm font-medium text-slate-700", children: "Asignar a" }),
            _jsxs("select", { id: "workerId", value: workerId, onChange: (e) => setWorkerId(e.target.value), className: inputStyle, required: true, children: [
                _jsx("option", { value: "", disabled: true, children: "Seleccione un trabajador" }),
                workers.map(worker => _jsx("option", { value: worker.id, children: worker.name }, worker.id))
            ]})
        ]}),
        _jsxs("div", { children: [
            _jsx("label", { htmlFor: "friendlyLocation", className: "block text-sm font-medium text-slate-700", children: "Ubicación amigable" }),
            _jsx("textarea", { id: "friendlyLocation", value: friendlyLocation, onChange: (e) => setFriendlyLocation(e.target.value), rows: 2, className: inputStyle, placeholder: "Ej: Cerca al parque, frente a la tienda..." })
        ]}),
        _jsxs("div", { children: [
            _jsx("label", { htmlFor: "notes", className: "block text-sm font-medium text-slate-700", children: "Notas Internas (Opcional)" }),
            _jsx("textarea", { id: "notes", value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, className: inputStyle, placeholder: "Añadir notas sobre la visita..." })
        ]}),
        _jsxs("div", { className: "flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-6", children: [
            _jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }),
            _jsx("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600", children: "Agendar Visita" })
        ]})
    ]}));
};

export default ScheduleVisitForm;