
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { ResourceType } from '@/types';
import { supabase, formatSupabaseError } from '@/supabaseClient';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { isAppCreator } from '@/utils';

const AddResourceForm = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: ResourceType.VIDEO,
        url: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const isEditing = !!initialData;

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                type: initialData.type || ResourceType.VIDEO,
                url: initialData.url || '',
            });
        }
        setFile(null); // Reset file on modal open
    }, [initialData]);

    const handleAttachClick = (e: React.MouseEvent) => {
        if (isAppCreator()) {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('open-file-upload-warning'));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // When type changes, clear the irrelevant field
        if (name === 'type') {
            if (value === ResourceType.DOCUMENT) {
                setFormData(prev => ({ ...prev, url: '' }));
            } else {
                setFile(null);
            }
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const performSubmit = async () => {
        if (formData.type === ResourceType.DOCUMENT && !file && !isEditing) {
            alert('Por favor, seleccione un archivo para el recurso de tipo "Documento".');
            return;
        }

        setIsUploading(true);
        try {
            let submissionData = { ...formData };
            if (isEditing) {
                submissionData = { ...initialData, ...formData };
            }

            if (formData.type === ResourceType.DOCUMENT && file) {
                // Generate safe filename
                const fileExt = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'dat';
                const safeFileName = `${Date.now()}-resource.${fileExt}`;
                const filePath = `training-files/${safeFileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('training-files')
                    .upload(filePath, file);
                
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('training-files')
                    .getPublicUrl(filePath);
                
                submissionData.url = urlData.publicUrl;
            }

            onSubmit(submissionData);
        } catch (error) {
            console.error("Error submitting resource:", error);
            alert(`Error al guardar el recurso:\n${formatSupabaseError(error)}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        performSubmit();
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";

    return (_jsxs("form", { onSubmit: handleSubmit, className: "bg-white p-8 rounded-lg shadow-lg w-full max-w-lg space-y-6", children: [_jsx("h2", { className: "text-2xl font-bold text-slate-800", children: isEditing ? 'Editar Recurso' : 'Añadir Nuevo Recurso' }), _jsxs("div", { children: [_jsx("label", { htmlFor: "title", className: "block text-sm font-medium text-slate-700", children: "Título" }), _jsx("input", { type: "text", name: "title", id: "title", value: formData.title, onChange: handleChange, required: true, className: inputStyle })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-slate-700", children: "Descripción" }), _jsx("textarea", { name: "description", id: "description", value: formData.description, onChange: handleChange, required: true, rows: 3, className: inputStyle })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "type", className: "block text-sm font-medium text-slate-700", children: "Tipo de Recurso" }), _jsx("select", { name: "type", id: "type", value: formData.type, onChange: handleChange, required: true, className: inputStyle, children: Object.values(ResourceType).map(type => (_jsx("option", { value: type, children: type }, String(type)))) })] }), formData.type === ResourceType.DOCUMENT ? (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Archivo de Documento" }), isEditing && !file && formData.url && (_jsxs("div", { className: "mt-1 text-sm text-slate-600", children: [_jsx("span", { className: "font-medium", children: "Archivo actual: " }), _jsx("a", { href: formData.url, target: "_blank", rel: "noopener noreferrer", className: "text-orange-600 hover:underline break-all", children: formData.url.split('/').pop()?.split('?')[0].substring(14) || 'archivo' })] })), file && (_jsxs("div", { className: "mt-1 flex items-center justify-between bg-blue-50 p-2 rounded-md border text-sm", children: [_jsx("span", { className: "text-slate-700 truncate pr-2", children: `Nuevo: ${file.name}` }), _jsx("button", { type: "button", onClick: () => setFile(null), className: "text-red-500 hover:text-red-700 p-1", children: _jsx(TrashIcon, { className: "h-4 w-4" }) })] })), _jsxs("label", { htmlFor: "file-upload", onClick: handleAttachClick, className: "mt-2 relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 border border-slate-300 px-3 py-2 text-sm shadow-sm w-full block text-center hover:bg-slate-50", children: [_jsx("span", { children: isEditing && formData.url ? 'Reemplazar Archivo' : 'Seleccionar Archivo' }), _jsx("input", { id: "file-upload", type: "file", className: "sr-only", onChange: handleFileChange })] })] })) : (_jsxs("div", { children: [_jsx("label", { htmlFor: "url", className: "block text-sm font-medium text-slate-700", children: "URL / Enlace" }), _jsx("input", { type: "url", name: "url", id: "url", value: formData.url, onChange: handleChange, required: true, className: inputStyle, placeholder: "https://example.com/recurso" })] })), _jsxs("div", { className: "pt-6 mt-6 border-t border-slate-200 flex justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }), _jsx("button", { type: "submit", disabled: isUploading, className: "px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-wait", children: isUploading ? 'Guardando...' : (isEditing ? 'Actualizar Recurso' : 'Añadir Recurso') })] })] }));
};

export default AddResourceForm;
