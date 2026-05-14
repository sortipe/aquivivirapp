
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { supabase, formatSupabaseError } from '@/supabaseClient';
import { PhotoIcon } from '@/components/icons/PhotoIcon';
import { isAppCreator } from '@/utils';

const Settings = ({ currentSettings, onUpdateSetting }) => {
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(currentSettings.app_logo_url || null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setLogoPreview(currentSettings.app_logo_url || null);
    }, [currentSettings.app_logo_url]);
    
    // Cleanup blob URL on component unmount
    useEffect(() => {
      return () => {
        if (logoPreview && logoPreview.startsWith('blob:')) {
          URL.revokeObjectURL(logoPreview);
        }
      }
    }, [logoPreview]);

    const handleAttachClick = (e: React.MouseEvent) => {
        if (isAppCreator()) {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('open-file-upload-warning'));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            if (logoPreview && logoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(logoPreview);
            }
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!logoFile) return;

        setIsUploading(true);
        try {
            // Remove old logo if it exists
            const oldUrl = currentSettings.app_logo_url;
            if (oldUrl) {
                try {
                    const oldFilePath = new URL(oldUrl).pathname.split('/').slice(2).join('/');
                     if (oldFilePath) {
                        await supabase.storage.from('app-assets').remove([oldFilePath]);
                    }
                } catch(e) {
                    console.warn("Could not parse or delete old logo file path:", oldUrl, e);
                }
            }
            
            // Upload new logo with safe generated filename
            const fileExt = logoFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
            const safeFileName = `${Date.now()}-logo.${fileExt}`;
            const filePath = `public/${safeFileName}`;
            
            const { error: uploadError } = await supabase.storage.from('app-assets').upload(filePath, logoFile);
            if (uploadError) throw uploadError;
            
            const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(filePath);
            
            const success = await onUpdateSetting('app_logo_url', urlData.publicUrl);
            if (success) {
                setLogoFile(null); // Reset file input state on success
            }

        } catch (error) {
            alert(`Error al guardar el logo:\n${formatSupabaseError(error)}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        _jsxs("div", { className: "space-y-6", children: [
            _jsx("h1", { className: "text-3xl font-bold text-slate-800", children: "Ajustes Generales" }),
            _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [
                _jsx("h3", { className: "text-lg font-semibold text-slate-800 border-b pb-3 mb-4", children: "Logo de la Aplicación" }),
                _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 items-center", children: [
                    _jsxs("div", { children: [
                        _jsx("p", { className: "text-sm text-slate-600 mb-4", children: "Este logo aparecerá en la página de inicio de sesión. Se recomienda una imagen horizontal con fondo transparente (PNG)." }),
                        _jsx("input", {
                            id: "logo-upload",
                            type: "file",
                            className: "sr-only",
                            onChange: handleFileChange,
                            disabled: isUploading
                        }),
                        _jsx("label", {
                            htmlFor: "logo-upload",
                            onClick: handleAttachClick,
                            className: "cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50",
                            children: "Cambiar logo"
                        }),
                        _jsxs("button", {
                            onClick: handleSave,
                            disabled: !logoFile || isUploading,
                            className: "ml-3 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed",
                            children: [
                                isUploading ? 'Guardando...' : 'Guardar Cambios'
                            ]
                        })
                    ] }),
                    _jsx("div", { className: "flex justify-center items-center bg-slate-100 p-4 rounded-lg h-32 border", children: logoPreview ? (
                            _jsx("img", { src: logoPreview, alt: "Vista previa del logo", className: "max-h-full max-w-full" })
                        ) : (
                            _jsxs("div", { className: "text-center text-slate-500", children: [
                                _jsx(PhotoIcon, { className: "mx-auto h-10 w-10 text-slate-400" }),
                                _jsx("span", { className: "mt-2 block text-sm", children: "Sin logo" })
                            ] })
                        ) })
                ] })
            ] })
        ] })
    );
};

export default Settings;
