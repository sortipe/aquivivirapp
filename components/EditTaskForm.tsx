
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useCallback } from 'react';
import MapSelector from '@/components/MapSelector';

const EditTaskForm = ({ initialData, properties, workers, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(initialData);
    const [useExistingProperty, setUseExistingProperty] = useState(!!initialData.propertyId);
    const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);

    useEffect(() => {
        setFormData(initialData);
        setUseExistingProperty(!!initialData.propertyId);
        // Initialize selected workers from array or single ID
        const ids = initialData.workerIds || (initialData.workerId ? [initialData.workerId] : []);
        setSelectedWorkerIds(ids);
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleWorkerToggle = (workerId) => {
        setSelectedWorkerIds(prev => 
            prev.includes(workerId) 
                ? prev.filter(id => id !== workerId)
                : [...prev, workerId]
        );
    };

    const handleLocationChange = useCallback((lat, lng) => {
        setFormData(prev => ({
            ...prev,
            latitude: parseFloat(lat.toFixed(6)),
            longitude: parseFloat(lng.toFixed(6))
        }));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedWorkerIds.length === 0) {
            alert("Por favor, seleccione al menos un trabajador.");
            return;
        }

        const dataToSubmit = { 
            ...formData, 
            workerIds: selectedWorkerIds,
            workerId: selectedWorkerIds[0] // Keep for compatibility
        };
        
        if (useExistingProperty) {
            dataToSubmit.customAddress = null;
            dataToSubmit.latitude = null;
            dataToSubmit.longitude = null;
            if (!dataToSubmit.propertyId) {
                alert("Por favor seleccione una propiedad.");
                return;
            }
        } else {
            dataToSubmit.propertyId = null;
            if (!dataToSubmit.customAddress) {
                alert("Por favor ingrese una dirección.");
                return;
            }
        }

        onSubmit(dataToSubmit);
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";
    
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
        _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            _jsxs("div", { children: [
                _jsx("label", { htmlFor: "dueDate", className: "block text-sm font-medium text-slate-700", children: "Fecha de Entrega" }), 
                _jsx("input", { type: "date", id: "dueDate", name: "dueDate", value: formData.dueDate, onChange: handleChange, className: inputStyle })
            ] }), 
            _jsxs("div", { children: [
                _jsx("label", { htmlFor: "time", className: "block text-sm font-medium text-slate-700", children: "Hora" }), 
                _jsx("input", { type: "time", id: "time", name: "time", value: formData.time || '', onChange: handleChange, className: inputStyle })
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
            _jsxs("div", { children: [
                _jsx("label", { htmlFor: "propertyId", className: "block text-sm font-medium text-slate-700", children: "Propiedad" }), 
                _jsxs("select", { id: "propertyId", name: "propertyId", value: formData.propertyId || '', onChange: handleChange, className: inputStyle, required: true, children: [
                    _jsx("option", { value: "", disabled: true, children: "Seleccione una propiedad" }),
                    properties.map(prop => _jsx("option", { value: prop.id, children: prop.name }, prop.id))
                ] })
            ] }) 
        ) : (
            _jsxs("div", { className: "bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm space-y-4", children: [
                _jsxs("div", { children: [
                    _jsx("label", { htmlFor: "customAddress", className: "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Dirección" }),
                    _jsx("input", { type: "text", id: "customAddress", name: "customAddress", value: formData.customAddress || '', onChange: handleChange, required: true, className: inputStyle })
                ]}),
                _jsxs("div", { children: [
                    _jsx("label", { className: "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Ubicación (Pin en mapa)" }),
                    _jsx("div", { className: "h-64 w-full rounded-md overflow-hidden border border-slate-300 shadow-inner relative z-0", children: 
                        _jsx(MapSelector, { 
                            latitude: formData.latitude || -12.046186, 
                            longitude: formData.longitude || -77.042751, 
                            onLocationChange: handleLocationChange 
                        })
                    }),
                    _jsxs("div", { className: "grid grid-cols-2 gap-4 mt-3", children: [
                        _jsxs("div", { children: [
                            _jsx("label", { className: "block text-[10px] font-semibold text-slate-400 uppercase mb-1", children: "Latitud" }),
                            _jsx("input", { type: "number", step: "any", value: formData.latitude, onChange: (e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) })), className: "w-full text-xs border-slate-300 rounded bg-white px-2 py-1.5 text-slate-600 focus:ring-orange-500 focus:border-orange-500" })
                        ]}),
                        _jsxs("div", { children: [
                            _jsx("label", { className: "block text-[10px] font-semibold text-slate-400 uppercase mb-1", children: "Longitud" }),
                            _jsx("input", { type: "number", step: "any", value: formData.longitude, onChange: (e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) })), className: "w-full text-xs border-slate-300 rounded bg-white px-2 py-1.5 text-slate-600 focus:ring-orange-500 focus:border-orange-500" })
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
            _jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-slate-700", children: "Descripción de la Tarea" }), 
            _jsx("textarea", { id: "description", name: "description", value: formData.description, onChange: handleChange, required: true, rows: 3, className: inputStyle })
        ] }), 
        
        _jsxs("div", { className: "flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-6", children: [
            _jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }), 
            _jsx("button", { type: "submit", className: "px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600", children: "Actualizar Tarea" })
        ] })
    ] }));
};
export default EditTaskForm;
