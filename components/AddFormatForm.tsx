
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { supabase, formatSupabaseError } from '@/supabaseClient';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { isAppCreator } from '@/utils';

const AddFormatForm = ({ initialData, onSubmit, onCancel }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const isEditing = !!initialData;

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setDescription(initialData.description || '');
        } else {
            setTitle('');
            setDescription('');
        }
        setFile(null); // Always reset file input
    }, [initialData]);

    const handleAttachClick = (e) => {
        if (isAppCreator()) {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('open-file-upload-warning'));
        }
    };
    
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const performSubmit = async () => {
        if (!file && !isEditing) {
            alert('Por favor, seleccione un archivo.');
            return;
        }

        setIsUploading(true);
        try {
            let fileUrl = isEditing ? initialData.file_url : '';
            let fileName = isEditing ? initialData.file_name : '';

            if (file) {
                // Generate a safe filename ignoring original name to prevent "Invalid Key" errors
                const fileExt = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'dat';
                const safeFileName = `${Date.now()}-format.${fileExt}`;
                const filePath = `format-files/${safeFileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('format-files')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('format-files')
                    .getPublicUrl(filePath);
                
                fileUrl = urlData.publicUrl;
                fileName = file.name; // Keep original name for display
            }

            const submissionData = {
                ...(isEditing ? { id: initialData.id, created_by: initialData.created_by } : {}),
                title,
                description,
                file_url: fileUrl,
                file_name: fileName,
            };

            onSubmit(submissionData);

        } catch (error) {
            alert(`Error al subir el archivo:\n${formatSupabaseError(error)}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        performSubmit();
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";

    return (
        _jsxs("form", { onSubmit: handleSubmit, className: "bg-white p-8 rounded-lg shadow-lg w-full max-w-lg space-y-6", children: [
            _jsx("h2", { className: "text-2xl font-bold text-slate-800", children: isEditing ? 'Editar Formato' : 'Añadir Nuevo Formato' }),
            _jsxs("div", { children: [
                _jsx("label", { htmlFor: "title", className: "block text-sm font-medium text-slate-700", children: "Título" }),
                _jsx("input", { type: "text", name: "title", id: "title", value: title, onChange: e => setTitle(e.target.value), required: true, className: inputStyle })
            ]}),
            _jsxs("div", { children: [
                _jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-slate-700", children: "Descripción" }),
                _jsx("textarea", { name: "description", id: "description", value: description, onChange: e => setDescription(e.target.value), required: true, rows: 3, className: inputStyle })
            ]}),
            _jsxs("div", { children: [
                _jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Archivo (PDF o Imagen)" }),
                isEditing && !file && initialData?.file_name && (
                     _jsxs("div", { className: "mt-1 text-sm text-slate-600", children: [
                         _jsx("span", { className: "font-medium", children: "Archivo actual: " }),
                         _jsx("a", { href: initialData.file_url, target: "_blank", rel: "noopener noreferrer", className: "text-orange-600 hover:underline break-all", children: initialData.file_name })
                     ]})
                ),
                file ? (
                    _jsxs("div", { className: "mt-1 flex items-center justify-between bg-blue-50 p-2 rounded-md border text-sm", children: [
                        _jsx("span", { className: "text-slate-700 truncate pr-2", children: file.name }),
                        _jsx("button", { type: "button", onClick: () => setFile(null), className: "text-red-500 hover:text-red-700 p-1", children: _jsx(TrashIcon, { className: "h-4 w-4" }) })
                    ]})
                ) : (
                    _jsxs("label", { htmlFor: "file-upload", onClick: handleAttachClick, className: "mt-2 relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 border border-slate-300 px-3 py-2 text-sm shadow-sm w-full block text-center hover:bg-slate-50", children: [
                        _jsx("span", { children: isEditing ? 'Reemplazar Archivo' : 'Seleccionar Archivo' }),
                        _jsx("input", { id: "file-upload", type: "file", className: "sr-only", onChange: handleFileChange, required: !isEditing })
                    ]})
                )
            ]}),
            _jsxs("div", { className: "pt-6 mt-6 border-t border-slate-200 flex justify-end space-x-3", children: [
                _jsx("button", { type: "button", onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }),
                _jsx("button", { type: "submit", disabled: isUploading, className: "px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-wait", children: isUploading ? 'Guardando...' : (isEditing ? 'Actualizar Formato' : 'Añadir Formato') })
            ]})
        ]})
    );
};

export default AddFormatForm;
