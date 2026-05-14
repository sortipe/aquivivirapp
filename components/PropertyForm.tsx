
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useCallback } from 'react';
import { PropertyType, PropertySaleStatus, Currency, ListingType, PropertyTrafficLight } from '@/types';
import { PhotoIcon } from '@/components/icons/PhotoIcon';
import { supabase, formatSupabaseError } from '@/supabaseClient';
import { TrashIcon } from '@/components/icons/TrashIcon';
import MapSelector from '@/components/MapSelector';

const PropertyForm = ({ initialData, onSubmit, onCancel, workers }) => {
    const [formData, setFormData] = useState({
        name: '', address: '', price: '', bedrooms: '', bathrooms: '',
        squareMeters: '', description: '', imageUrl: '',
        gallery: [],
        latitude: -12.046186267780133,
        longitude: -77.04275089398834,
        propertyIdNumber: '', builtSquareMeters: '',
        propertyType: PropertyType.CASA,
        status: PropertySaleStatus.AVAILABLE,
        trafficLight: PropertyTrafficLight.GREEN,
        trafficLightReason: '',
        listingType: ListingType.VENTA,
        currency: Currency.USD,
        propertyDocuments: [],
        sold_by_worker_id: null,
    });
    const [featuredImageFile, setFeaturedImageFile] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [docFiles, setDocFiles] = useState([]);
    const [featuredImagePreview, setFeaturedImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                price: String(initialData.price),
                bedrooms: String(initialData.bedrooms),
                bathrooms: String(initialData.bathrooms),
                squareMeters: String(initialData.squareMeters || initialData.square_meters),
                builtSquareMeters: String(initialData.builtSquareMeters || initialData.built_square_meters),
                gallery: initialData.gallery || [],
                status: initialData.status || PropertySaleStatus.AVAILABLE,
                trafficLight: initialData.trafficLight || PropertyTrafficLight.GREEN,
                trafficLightReason: initialData.trafficLightReason || '',
                listingType: initialData.listingType || ListingType.VENTA,
                currency: initialData.currency || Currency.USD,
                sold_by_worker_id: initialData.sold_by_worker_id || null,
            });
            setFeaturedImagePreview(initialData.imageUrl);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'status' && value !== PropertySaleStatus.SOLD) {
                newState.sold_by_worker_id = null;
            }
            return newState;
        });
    };

    const handleTrafficLightChange = (color) => {
        setFormData(prev => ({ ...prev, trafficLight: color }));
    };

    const handleLocationChange = useCallback((lat, lng) => {
        setFormData(prev => ({
            ...prev,
            latitude: parseFloat(lat.toFixed(6)),
            longitude: parseFloat(lng.toFixed(6))
        }));
    }, []);

    const handleFeaturedImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFeaturedImageFile(file);
            setFeaturedImagePreview(URL.createObjectURL(file));
        }
    };

    const handleGalleryFilesChange = (e) => {
        if (e.target.files) {
            setGalleryFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };
    
    const handleDocumentsChange = (e) => {
        if (e.target.files) {
            setDocFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };
    
    const handleRemoveExistingGalleryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, i) => i !== index),
        }));
    };

    const handleRemoveNewGalleryFile = (index) => {
        setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveDocument = (index, isNew) => {
        if (isNew) {
            setDocFiles(prev => prev.filter((_, i) => i !== index));
        } else {
            setFormData(prev => ({
                ...prev,
                propertyDocuments: prev.propertyDocuments.filter((_, i) => i !== index),
            }));
        }
    };

    const uploadFile = async (file, bucket) => {
        // Generate a completely safe, unique filename ignoring the original filename
        const fileExt = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        // Add random string to avoid collision if uploading multiple files quickly
        const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `properties/${safeFileName}`;
        
        const { error } = await supabase.storage.from(bucket).upload(filePath, file);
        if (error)
            throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return { name: file.name, url: data.publicUrl }; // Keep original name for display, use safe path for storage
    };

    const performSubmit = async () => {
        setIsUploading(true);
        try {
            let finalImageUrl = formData.imageUrl;
            if (featuredImageFile) {
                const uploadedImage = await uploadFile(featuredImageFile, 'property-files');
                finalImageUrl = uploadedImage.url;
            }
            if (!finalImageUrl) {
                alert('Por favor, suba una imagen destacada para la propiedad.');
                setIsUploading(false);
                return;
            }
            const newGalleryImages = await Promise.all(galleryFiles.map(file => uploadFile(file, 'property-files')));
            const newDocuments = await Promise.all(docFiles.map(file => uploadFile(file, 'property-files')));
            
            const propertyData = {
                ...formData,
                imageUrl: finalImageUrl,
                gallery: [...(formData.gallery || []), ...newGalleryImages],
                propertyDocuments: [...(formData.propertyDocuments || []), ...newDocuments],
                price: parseFloat(String(formData.price)) || 0,
                bedrooms: parseInt(String(formData.bedrooms), 10) || 0,
                bathrooms: parseInt(String(formData.bathrooms), 10) || 0,
                squareMeters: parseFloat(String(formData.squareMeters)) || 0,
                builtSquareMeters: parseFloat(String(formData.builtSquareMeters)) || 0,
                latitude: Number(formData.latitude) || 0,
                longitude: Number(formData.longitude) || 0,
            };

            onSubmit(propertyData);
        }
        catch (error) {
            alert(`Error al subir archivos:\n${formatSupabaseError(error)}`);
        }
        finally {
            setIsUploading(false);
        }
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        performSubmit();
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";

    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 bg-white p-8 rounded-lg shadow-lg", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-slate-700", children: "Nombre" }), _jsx("input", { type: "text", name: "name", id: "name", value: formData.name, onChange: handleChange, required: true, className: inputStyle })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "address", className: "block text-sm font-medium text-slate-700", children: "Dirección" }), _jsx("input", { type: "text", name: "address", id: "address", value: formData.address, onChange: handleChange, required: true, className: inputStyle })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "propertyIdNumber", className: "block text-sm font-medium text-slate-700", children: "ID de Propiedad" }), _jsx("input", { type: "text", name: "propertyIdNumber", id: "propertyIdNumber", value: formData.propertyIdNumber, onChange: handleChange, required: true, className: inputStyle })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "propertyType", className: "block text-sm font-medium text-slate-700", children: "Tipo de Propiedad" }), _jsx("select", { name: "propertyType", id: "propertyType", value: formData.propertyType, onChange: handleChange, required: true, className: inputStyle, children: Object.values(PropertyType).map(type => _jsx("option", { value: type, children: type }, String(type))) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "status", className: "block text-sm font-medium text-slate-700", children: "Estado" }), _jsx("select", { name: "status", id: "status", value: formData.status, onChange: handleChange, required: true, className: inputStyle, children: Object.values(PropertySaleStatus).map(status => _jsx("option", { value: status, children: status }, String(status))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "listingType", className: "block text-sm font-medium text-slate-700", children: "Operación" }), _jsx("select", { name: "listingType", id: "listingType", value: formData.listingType, onChange: handleChange, required: true, className: inputStyle, children: [_jsx("option", { value: ListingType.VENTA, children: "Venta" }), _jsx("option", { value: ListingType.ALQUILER, children: "Alquiler" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: "Semáforo de Estado" }), _jsxs("div", { className: "flex space-x-4 mb-2", children: [_jsx("button", { type: "button", onClick: () => handleTrafficLightChange(PropertyTrafficLight.GREEN), className: `w-8 h-8 rounded-full bg-green-500 focus:outline-none transition-transform transform hover:scale-110 ${formData.trafficLight === PropertyTrafficLight.GREEN ? 'ring-4 ring-green-200 scale-110' : ''}`, title: "Verde" }), _jsx("button", { type: "button", onClick: () => handleTrafficLightChange(PropertyTrafficLight.YELLOW), className: `w-8 h-8 rounded-full bg-yellow-400 focus:outline-none transition-transform transform hover:scale-110 ${formData.trafficLight === PropertyTrafficLight.YELLOW ? 'ring-4 ring-yellow-200 scale-110' : ''}`, title: "Amarillo" }), _jsx("button", { type: "button", onClick: () => handleTrafficLightChange(PropertyTrafficLight.RED), className: `w-8 h-8 rounded-full bg-red-500 focus:outline-none transition-transform transform hover:scale-110 ${formData.trafficLight === PropertyTrafficLight.RED ? 'ring-4 ring-red-200 scale-110' : ''}`, title: "Rojo" })] }), _jsx("textarea", { name: "trafficLightReason", value: formData.trafficLightReason, onChange: handleChange, placeholder: "Motivo del color seleccionado...", rows: 2, className: `${inputStyle} text-xs` })] }), formData.status === PropertySaleStatus.SOLD && (_jsxs("div", { children: [_jsx("label", { htmlFor: "sold_by_worker_id", className: "block text-sm font-medium text-slate-700", children: "Vendido por" }), _jsxs("select", { name: "sold_by_worker_id", id: "sold_by_worker_id", value: formData.sold_by_worker_id || '', onChange: handleChange, required: true, className: inputStyle, children: [_jsx("option", { value: "", disabled: true, children: "Seleccione un trabajador" }), workers.map(worker => (_jsx("option", { value: worker.id, children: worker.name }, worker.id)))] })] })), _jsxs("div", { className: "grid grid-cols-3 gap-x-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx("label", { htmlFor: "price", className: "block text-sm font-medium text-slate-700", children: "Precio" }), _jsx("input", { type: "number", name: "price", id: "price", value: formData.price, onChange: handleChange, required: true, className: inputStyle, min: "0", step: "0.01" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "currency", className: "block text-sm font-medium text-slate-700", children: "Moneda" }), _jsx("select", { name: "currency", id: "currency", value: formData.currency, onChange: handleChange, required: true, className: inputStyle, children: [_jsx("option", { value: Currency.USD, children: "USD" }), _jsx("option", { value: Currency.PEN, children: "Soles" })] })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "squareMeters", className: "block text-sm font-medium text-slate-700", children: "Superficie (m²)" }), _jsx("input", { type: "number", name: "squareMeters", id: "squareMeters", value: formData.squareMeters, onChange: handleChange, className: inputStyle, min: "0", step: "0.01" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "builtSquareMeters", className: "block text-sm font-medium text-slate-700", children: "Construido (m²)" }), _jsx("input", { type: "number", name: "builtSquareMeters", id: "builtSquareMeters", value: formData.builtSquareMeters, onChange: handleChange, className: inputStyle, min: "0", step: "0.01" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "bedrooms", className: "block text-sm font-medium text-slate-700", children: "Habitaciones" }), _jsx("input", { type: "number", name: "bedrooms", id: "bedrooms", value: formData.bedrooms, onChange: handleChange, className: inputStyle, min: "0" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "bathrooms", className: "block text-sm font-medium text-slate-700", children: "Baños" }), _jsx("input", { type: "number", name: "bathrooms", id: "bathrooms", value: formData.bathrooms, onChange: handleChange, className: inputStyle, min: "0" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-slate-700", children: "Descripción" }), _jsx("textarea", { name: "description", id: "description", value: formData.description, onChange: handleChange, required: true, rows: 4, className: inputStyle })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Documentos de la Propiedad" }), _jsx("div", { className: "mt-1", children: _jsxs("label", { htmlFor: "propertyDocuments", className: "relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 border border-slate-300 px-3 py-2 text-sm shadow-sm w-full block text-center hover:bg-slate-50", children: [_jsx("span", { children: "Subir archivos (PDF, Imagen)" }), _jsx("input", { id: "propertyDocuments", name: "propertyDocuments", type: "file", className: "sr-only", multiple: true, onChange: (e) => handleDocumentsChange(e) })] }) }), _jsxs("div", { className: "mt-3 space-y-2 max-h-28 overflow-y-auto pr-2", children: [formData.propertyDocuments.map((doc, index) => (_jsxs("div", { className: "flex items-center justify-between bg-slate-50 p-2 rounded-md border text-xs", children: [_jsx("span", { className: "text-slate-700 truncate pr-2", children: doc.name }), _jsx("button", { type: "button", onClick: () => handleRemoveDocument(index, false), className: "text-red-500 hover:text-red-700 p-1", children: _jsx(TrashIcon, {}) })] }, `doc-exist-${index}`))), docFiles.map((file, index) => (_jsxs("div", { className: "flex items-center justify-between bg-blue-50 p-2 rounded-md border text-xs", children: [_jsx("span", { className: "text-slate-700 truncate pr-2", children: file.name }), _jsx("button", { type: "button", onClick: () => handleRemoveDocument(index, true), className: "text-red-500 hover:text-red-700 p-1", children: _jsx(TrashIcon, {}) })] }, `doc-new-${index}`)))] })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Imagen Destacada" }), _jsx("div", { className: "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md", children: _jsxs("div", { className: "space-y-1 text-center", children: [featuredImagePreview ? _jsx("img", { src: featuredImagePreview, alt: "Preview", className: "mx-auto h-32 w-auto object-contain rounded-md" }) : _jsx(PhotoIcon, {}), _jsx("div", { className: "flex text-sm text-slate-600 justify-center", children: _jsxs("label", { htmlFor: "imageUrl", className: "relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500", children: [_jsx("span", { children: "Subir un archivo" }), _jsx("input", { id: "imageUrl", name: "imageUrl", type: "file", className: "sr-only", onChange: handleFeaturedImageChange })] }) }), _jsx("p", { className: "text-xs text-slate-500", children: "PNG, JPG, GIF" })] }) }), featuredImagePreview && _jsx("button", { type: "button", onClick: () => { setFeaturedImageFile(null); setFeaturedImagePreview(null); setFormData(p => ({ ...p, imageUrl: '' })); }, className: "mt-2 text-xs text-red-600 hover:underline", children: "Eliminar imagen" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Galería de Imágenes" }), _jsx("div", { className: "mt-1", children: _jsxs("label", { htmlFor: "gallery", className: "relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 border border-slate-300 px-3 py-2 text-sm shadow-sm w-full block text-center hover:bg-slate-50", children: [_jsx("span", { children: "Añadir imágenes a la galería" }), _jsx("input", { id: "gallery", name: "gallery", type: "file", className: "sr-only", multiple: true, onChange: handleGalleryFilesChange })] }) }), _jsx("div", { className: "mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2", children: [formData.gallery.map((image, i) => (_jsxs("div", { className: "relative group", children: [_jsx("img", { src: image.url, className: "h-20 w-20 object-cover rounded-md" }), _jsx("button", { type: "button", onClick: () => handleRemoveExistingGalleryImage(i), className: "absolute top-0 right-0 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100", children: "×" })] }, `gal-exist-${i}`))), galleryFiles.map((file, i) => (_jsxs("div", { className: "relative group", children: [_jsx("img", { src: URL.createObjectURL(file), className: "h-20 w-20 object-cover rounded-md" }), _jsx("button", { type: "button", onClick: () => handleRemoveNewGalleryFile(i), className: "absolute top-0 right-0 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100", children: "×" })] }, `gal-new-${i}`)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Ubicación" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mt-1", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "latitude", className: "block text-xs font-medium text-slate-600", children: "Latitud" }), _jsx("input", { type: "number", name: "latitude", id: "latitude", value: formData.latitude, onChange: handleChange, className: inputStyle, step: "any" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "longitude", className: "block text-xs font-medium text-slate-600", children: "Longitud" }), _jsx("input", { type: "number", name: "longitude", id: "longitude", value: formData.longitude, onChange: handleChange, className: inputStyle, step: "any" })] })] }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Mueva el pin en el mapa o ingrese las coordenadas manualmente." }), _jsx("div", { className: "mt-2 h-64 w-full rounded-md overflow-hidden border", children: _jsx(MapSelector, { latitude: Number(formData.latitude) || 0, longitude: Number(formData.longitude) || 0, onLocationChange: handleLocationChange }) })] })] })] }), _jsx("div", { className: "pt-6 mt-6 border-t border-slate-200", children: _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }), _jsx("button", { type: "submit", disabled: isUploading, className: "px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 disabled:bg-orange-300", children: isUploading ? 'Guardando...' : (initialData ? 'Actualizar Propiedad' : 'Añadir Propiedad') })] }) })] }));
};

export default PropertyForm;
