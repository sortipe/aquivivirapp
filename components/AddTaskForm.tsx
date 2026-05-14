
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { SearchIcon } from '@/components/icons/SearchIcon';
import MapSelector from '@/components/MapSelector';

const AddTaskForm = ({ initialDate, properties, workers, onSubmit, onCancel }) => {
    // State for multiple workers
    const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
    
    const [description, setDescription] = useState('');
    const [time, setTime] = useState('10:00');

    // New state for location toggle
    const [useExistingProperty, setUseExistingProperty] = useState(true);

    // State for searchable property dropdown
    const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
    const [propertySearch, setPropertySearch] = useState('');
    const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);
    const propertyDropdownRef = useRef(null);

    // State for custom location
    const [customAddress, setCustomAddress] = useState('');
    const [latitude, setLatitude] = useState(-12.046186);
    const [longitude, setLongitude] = useState(-77.042751);

    // Initialize first worker if available
    useEffect(() => {
        if (workers.length > 0 && selectedWorkerIds.length === 0) {
            setSelectedWorkerIds([workers[0].id]);
        }
    }, [workers]);

    // Effect to initialize property search text
    useEffect(() => {
        if (useExistingProperty) {
            const initialProperty = properties.find(p => p.id === propertyId);
            if (initialProperty) {
                setPropertySearch(initialProperty.name);
            }
        }
    }, [properties, propertyId, useExistingProperty]);

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
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (propertyDropdownRef.current && !propertyDropdownRef.current.contains(event.target)) {
                setIsPropertyDropdownOpen(false);
                const selectedProperty = properties.find(p => p.id === propertyId);
                if (selectedProperty) {
                    setPropertySearch(selectedProperty.name);
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

    const handleLocationChange = useCallback((lat, lng) => {
        setLatitude(parseFloat(lat.toFixed(6)));
        setLongitude(parseFloat(lng.toFixed(6)));
    }, []);

    const handleWorkerToggle = (workerId) => {
        setSelectedWorkerIds(prev => 
            prev.includes(workerId) 
                ? prev.filter(id => id !== workerId)
                : [...prev, workerId]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedWorkerIds.length === 0) {
            alert("Por favor, seleccione al menos un trabajador.");
            return;
        }
        if (!description) return;

        const submissionData: any = { 
            dueDate: initialDate, 
            time, 
            workerIds: selectedWorkerIds,
            workerId: selectedWorkerIds[0], // Fallback for old logic
            description 
        };

        if (useExistingProperty) {
            if (!propertyId) {
                alert("Por favor, seleccione una propiedad o cambie a 'Ubicación Manual'.");
                return;
            }
            submissionData.propertyId = propertyId;
        } else {
            if (!customAddress) {
                alert("Por favor, ingrese una dirección.");
                return;
            }
            submissionData.propertyId = null;
            submissionData.customAddress = customAddress;
            submissionData.latitude = latitude;
            submissionData.longitude = longitude;
        }
        
        onSubmit(submissionData);
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";
    
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
        _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            _jsxs("div", { children: [
                _jsx("label", { htmlFor: "task-date", className: "block text-sm font-medium text-slate-700", children: "Fecha de Entrega" }),
                _jsx("input", { type: "date", id: "task-date", value: initialDate, disabled: true, className: `${inputStyle} bg-slate-50 cursor-not-allowed` })
            ] }),
            _jsxs("div", { children: [
                _jsx("label", { htmlFor: "task-time", className: "block text-sm font-medium text-slate-700", children: "Hora" }),
                _jsx("input", { type: "time", id: "task-time", value: time, onChange: (e) => setTime(e.target.value), required: true, className: inputStyle })
            ] })
        ] }),
        
        _jsxs("div", { className: "flex items-center space-x-2 py-2 border-b border-slate-100", children: [
            _jsx("input", { 
                type: "checkbox", 
                id: "useExistingProperty", 
                checked: useExistingProperty, 
                onChange: (e) => setUseExistingProperty(e.target.checked),
                className: "h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            }),
            _jsx("label", { htmlFor: "useExistingProperty", className: "text-sm font-medium text-slate-700 select-none cursor-pointer", children: "Asignar a una propiedad del inventario" })
        ]}),

        useExistingProperty ? (
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
                        required: true,
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
            ]})
        ) : (
            _jsxs("div", { className: "bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm space-y-4", children: [
                _jsxs("div", { children: [
                    _jsx("label", { htmlFor: "customAddress", className: "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Dirección" }),
                    _jsx("input", { type: "text", id: "customAddress", value: customAddress, onChange: (e) => setCustomAddress(e.target.value), required: true, className: inputStyle, placeholder: "Ej: Av. Larco 123, Of. 405" })
                ]}),
                _jsxs("div", { children: [
                    _jsx("label", { className: "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Ubicación (Pin en mapa)" }),
                    _jsx("div", { className: "h-64 w-full rounded-md overflow-hidden border border-slate-300 shadow-inner relative z-0", children: 
                        _jsx(MapSelector, { latitude: latitude, longitude: longitude, onLocationChange: handleLocationChange })
                    }),
                    _jsxs("div", { className: "grid grid-cols-2 gap-4 mt-3", children: [
                        _jsxs("div", { children: [
                            _jsx("label", { className: "block text-[10px] font-semibold text-slate-400 uppercase mb-1", children: "Latitud" }),
                            _jsx("input", { type: "number", step: "any", value: latitude, onChange: (e) => setLatitude(parseFloat(e.target.value)), className: "w-full text-xs border-slate-300 rounded bg-white px-2 py-1.5 text-slate-600 focus:ring-orange-500 focus:border-orange-500" })
                        ]}),
                        _jsxs("div", { children: [
                            _jsx("label", { className: "block text-[10px] font-semibold text-slate-400 uppercase mb-1", children: "Longitud" }),
                            _jsx("input", { type: "number", step: "any", value: longitude, onChange: (e) => setLongitude(parseFloat(e.target.value)), className: "w-full text-xs border-slate-300 rounded bg-white px-2 py-1.5 text-slate-600 focus:ring-orange-500 focus:border-orange-500" })
                        ]})
                    ]})
                ]})
            ]})
        ),
        
        _jsxs("div", { children: [
            _jsx("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: "Asignar a (Puede seleccionar varios)" }),
            _jsx("div", { className: "max-h-40 overflow-y-auto border border-slate-300 rounded-md p-2 bg-white", children: 
                workers.map(worker => (
                    _jsxs("label", { className: "flex items-center space-x-3 p-2 hover:bg-slate-50 rounded cursor-pointer", children: [
                        _jsx("input", {
                            type: "checkbox",
                            value: worker.id,
                            checked: selectedWorkerIds.includes(worker.id),
                            onChange: () => handleWorkerToggle(worker.id),
                            className: "h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        }),
                        _jsx("span", { className: "text-sm text-slate-700 font-medium", children: worker.name })
                    ] }, worker.id)
                ))
            }),
            selectedWorkerIds.length === 0 && _jsx("p", { className: "text-xs text-red-500 mt-1", children: "Debes seleccionar al menos un trabajador." })
        ] }),
        
        _jsxs("div", { children: [
            _jsx("label", { htmlFor: "task-description", className: "block text-sm font-medium text-slate-700", children: "Trabajo a realizar" }),
            _jsx("textarea", { id: "task-description", value: description, onChange: e => setDescription(e.target.value), required: true, rows: 3, className: inputStyle, placeholder: "Ej: Tomar fotos de fachada, Reparación de baño, Recoger llaves..." })
        ] }),
        
        _jsxs("div", { className: "flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-6", children: [
            _jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }),
            _jsx("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600", children: "Crear Trabajo" })
        ]})
    ]}));
};

export default AddTaskForm;
