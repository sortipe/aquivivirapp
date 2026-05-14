
// FIX: Added missing JSX runtime import to resolve "_jsx is not defined" errors.
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, formatSupabaseError } from '@/supabaseClient';
import { YesNo, ContractType, ListingType, PropertyCategory, PropertyState, ServiceType, CommonArea, DayOfWeek, CaptacionStatus } from '@/types';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { PhotoIcon } from '@/components/icons/PhotoIcon';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { DocumentIcon } from '@/components/icons/DocumentIcon';
import MapSelector from '@/components/MapSelector';

const emptyState = {
    title: '', description: '', status: CaptacionStatus.DRAFT,
    ownerData: { name: '', phone: '', email: '', relationship: '', authorizedPerson: '', propertyTitleNumber: '', hasMortgage: YesNo.NO, mortgageTime: '', condoName: '', contractType: ContractType.EXCLUSIVO, listingType: ListingType.VENTA },
    propertyData: { address: '', reference: '', nearbyPlaces: '', propertyCategory: PropertyCategory.CASA, independent: '', constructionYears: '', landArea: '', builtArea: '', bedrooms: '', closets: '', bathrooms: '', laundry: YesNo.NO, hasElevator: YesNo.NO, floors: '', parking: '', hasAdditionalAreas: YesNo.NO, latitude: -12.046186, longitude: -77.042751 },
    visitObservations: '',
    propertyStatus: { isOccupied: YesNo.NO, wasRemodeled: YesNo.NO, remodelYear: '', availableServices: [], commonAreas: [], acceptsBankFinancing: YesNo.SI, propertyState: PropertyState.BUENO, saleConditions: '', hasAlcabala: YesNo.SI, maintenanceCost: '', hasFreeSchedule: YesNo.SI, visitDays: [], visitTimeStart: '09:00', visitTimeEnd: '18:00', reasonForSelling: '', specialFeature: '' },
    files: { featuredImage: null, gallery: [], propertyTitleDeed: null, proofOfNoDebt: null, dni: null, authorization: null }
};

const SingleDocUploader = ({ fieldName, label, existingFile, newFile, onFileChange, onRemoveExisting, onRemoveNew, isLocked }) => (
    _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-slate-700 mb-2", children: label }), !isLocked && (_jsxs("label", { htmlFor: fieldName, className: "mt-1 relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 border border-slate-300 px-3 py-2 text-sm shadow-sm w-full block text-center hover:bg-slate-50", children: [_jsx("span", { children: "Subir (PDF, Imagen)" }), _jsx("input", { id: fieldName, type: "file", className: "sr-only", onChange: (e) => onFileChange(e, fieldName) })] })), (newFile?.file || existingFile) && (_jsxs("div", { className: "mt-2 flex items-center justify-between bg-slate-50 p-2 rounded-md border text-sm", children: [_jsxs("div", { className: "flex items-center min-w-0", children: [_jsx("DocumentIcon", { className: "h-4 w-4 mr-2 text-slate-400 flex-shrink-0" }), _jsx("span", { className: "text-slate-700 truncate pr-2", children: newFile?.file?.name || existingFile?.name })] }), !isLocked && (_jsx("button", { type: "button", onClick: () => newFile ? onRemoveNew(fieldName) : onRemoveExisting(fieldName), className: "text-red-500 hover:text-red-700 p-1 flex-shrink-0", children: _jsx(TrashIcon, { className: "h-4 w-4" }) }))] }))] })
);

// FIX: Extracted new files state type for better type safety and readability.
type NewFileWithPreview = { file: File, previewUrl: string };
type NewFile = { file: File };
type NewFilesState = {
    gallery: NewFileWithPreview[];
    featuredImage?: NewFileWithPreview;
    propertyTitleDeed?: NewFile;
    proofOfNoDebt?: NewFile;
    dni?: NewFile;
    authorization?: NewFile;
};

// FIX: Added a helper to safely parse numeric form values.
// This prevents valid inputs like '0' from being incorrectly converted to 'null'.
const parseNumeric = (value: string, isFloat = false) => {
    if (value === null || value === undefined || String(value).trim() === '') {
        return null;
    }
    const num = isFloat ? parseFloat(value) : parseInt(value, 10);
    return isNaN(num) ? null : num;
};

const CaptacionForm = ({ initialData, onSubmit, onCancel, currentUser }) => {
    const [formData, setFormData] = useState(emptyState);
    const [newFiles, setNewFiles] = useState<NewFilesState>({ gallery: [] });
    const [isUploading, setIsUploading] = useState(false);
    const isEditing = !!initialData;
    const isCurrentUserWorker = currentUser.role === 'worker';
    const newFilesRef = useRef(newFiles);

    const isFieldLocked = useCallback((path: string): boolean => {
        if (!isCurrentUserWorker || !isEditing) {
            return false;
        }
        if (initialData.status === CaptacionStatus.COMPLETED) {
            return true;
        }

        const value = path.split('.').reduce((acc, part) => acc && typeof acc === 'object' ? acc[part] : undefined, initialData);

        if (Array.isArray(value)) {
            return value.length > 0;
        }
        if (typeof value === 'object' && value !== null) {
            // For file objects {name, url}
            return !!value.url;
        }
        if (value === YesNo.NO) return true;
        
        return value !== null && value !== undefined && value !== '';
    }, [initialData, isCurrentUserWorker, isEditing]);

    useEffect(() => {
        newFilesRef.current = newFiles;
    }, [newFiles]);

    useEffect(() => {
        if (initialData) {
            const mergedData = JSON.parse(JSON.stringify({ ...emptyState, ...initialData }));
            mergedData.propertyStatus = { ...emptyState.propertyStatus, ...initialData.propertyStatus };
            mergedData.files = { ...emptyState.files, ...initialData.files };
            setFormData(mergedData);
        } else {
            setFormData(JSON.parse(JSON.stringify(emptyState)));
        }
    }, [initialData]);

    useEffect(() => {
        return () => {
            const filesToClean = newFilesRef.current;
            if (filesToClean.featuredImage) {
                URL.revokeObjectURL(filesToClean.featuredImage.previewUrl);
            }
            filesToClean.gallery.forEach(img => URL.revokeObjectURL(img.previewUrl));
        };
    }, []);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleNestedChange = useCallback((section) => (e) => {
        const { name, value } = e.target;
        
        let updatedSection = { ...formData[section], [name]: value };

        if (name === 'hasFreeSchedule' && value === YesNo.NO) {
            updatedSection = { ...updatedSection, visitDays: [], visitTimeStart: '', visitTimeEnd: '' };
        }

        setFormData(prev => ({
            ...prev,
            [section]: updatedSection,
        }));
    }, [formData]);

    const handleLocationChange = useCallback((lat: number, lng: number) => {
        setFormData(prev => ({
            ...prev,
            propertyData: {
                ...prev.propertyData,
                latitude: parseFloat(lat.toFixed(6)),
                longitude: parseFloat(lng.toFixed(6)),
            }
        }));
    }, []);
    
    const handleCheckboxArrayChange = (field, value) => {
        const currentValues = formData.propertyStatus[field] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        setFormData(prev => ({ ...prev, propertyStatus: { ...prev.propertyStatus, [field]: newValues } }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof NewFilesState) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);

        switch (fieldName) {
            case 'gallery': {
                const newUploads = files.map(f => ({ file: f, previewUrl: URL.createObjectURL(f as Blob) }));
                setNewFiles(prev => ({ ...prev, gallery: [...prev.gallery, ...newUploads] }));
                break;
            }
            case 'featuredImage': {
                if (files[0]) {
                    if (newFiles.featuredImage) {
                        URL.revokeObjectURL(newFiles.featuredImage.previewUrl);
                    }
                    const newUpload = { file: files[0], previewUrl: URL.createObjectURL(files[0] as Blob) };
                    setNewFiles(prev => ({ ...prev, featuredImage: newUpload }));
                }
                break;
            }
            case 'propertyTitleDeed':
            case 'proofOfNoDebt':
            case 'dni':
            case 'authorization': {
                if (files[0]) {
                    const newUpload = { file: files[0] };
                    setNewFiles(prev => ({ ...prev, [fieldName]: newUpload }));
                }
                break;
            }
        }
        e.target.value = ''; 
    };

    const handleRemoveNewFile = (fieldName, index) => {
        setNewFiles(prev => {
            if (Array.isArray(prev[fieldName])) {
                const updatedFiles = [...prev[fieldName]];
                URL.revokeObjectURL(updatedFiles[index].previewUrl);
                updatedFiles.splice(index, 1);
                return { ...prev, [fieldName]: updatedFiles };
            } else {
                const fileState = prev[fieldName] as NewFileWithPreview | undefined;
                if (fileState?.previewUrl) {
                    URL.revokeObjectURL(fileState.previewUrl);
                }
                const newState = { ...prev };
                delete newState[fieldName];
                return newState;
            }
        });
    };
    
    const handleRemoveExistingFile = (fieldName, index) => {
        setFormData(prev => {
            const newFilesState = { ...prev.files };
            if (fieldName === 'gallery' && typeof index === 'number') {
                const currentFiles = [...newFilesState[fieldName]];
                currentFiles.splice(index, 1);
                newFilesState[fieldName] = currentFiles;
            } else {
                newFilesState[fieldName] = null;
            }
            return { ...prev, files: newFilesState };
        });
    };

    const uploadFile = async (file) => {
        // Generate a completely new, safe filename ignoring the original filename
        const fileExt = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        // Add random string to avoid collision if uploading multiple files quickly
        const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `captaciones/${currentUser.id}/${safeFileName}`;
        
        const { error } = await supabase.storage.from('captacion-files').upload(filePath, file);
        if (error) throw error;
        const { data } = await supabase.storage.from('captacion-files').getPublicUrl(filePath);
        return { name: file.name, url: data.publicUrl };
    };

    const handleSubmit = async (finalize = false) => {
        setIsUploading(true);
        try {
            const finalFiles = { ...formData.files };
            if (newFiles.featuredImage) finalFiles.featuredImage = await uploadFile(newFiles.featuredImage.file);
            if (newFiles.propertyTitleDeed) finalFiles.propertyTitleDeed = await uploadFile(newFiles.propertyTitleDeed.file);
            if (newFiles.proofOfNoDebt) finalFiles.proofOfNoDebt = await uploadFile(newFiles.proofOfNoDebt.file);
            if (newFiles.dni) finalFiles.dni = await uploadFile(newFiles.dni.file);
            if (newFiles.authorization) finalFiles.authorization = await uploadFile(newFiles.authorization.file);

            const newGalleryUploads = await Promise.all(newFiles.gallery.map(item => uploadFile(item.file)));
            finalFiles.gallery = [...(finalFiles.gallery || []), ...newGalleryUploads];
            
            const submissionData = { ...formData, files: finalFiles };

            let newStatus: CaptacionStatus;
            if (finalize) {
                newStatus = CaptacionStatus.COMPLETED;
            } else if (isEditing) {
                newStatus = initialData.status; // Persist current status
            } else {
                newStatus = CaptacionStatus.DRAFT; // New form is a draft
            }
            submissionData.status = newStatus;

            const { propertyData, propertyStatus } = submissionData;

            // FIX: The following blocks for `propertyData` and `propertyStatus` were causing type errors.
            // 1. Casting to `any` resolves conflicts where property types change (e.g., string to number)
            //    or when adding new snake_case keys for Supabase that don't exist on the TypeScript type.
            // 2. Used the `parseNumeric` helper to fix a bug where a valid input of `0` was converted to `null`.
            submissionData.propertyData = {
                ...propertyData,
                construction_years: parseNumeric(propertyData.constructionYears),
                land_area: parseNumeric(propertyData.landArea, true),
                built_area: parseNumeric(propertyData.builtArea, true),
                bedrooms: parseNumeric(propertyData.bedrooms),
                closets: parseNumeric(propertyData.closets),
                bathrooms: parseNumeric(propertyData.bathrooms),
                floors: parseNumeric(propertyData.floors),
                parking: parseNumeric(propertyData.parking),
            } as any;
            delete submissionData.propertyData.constructionYears;
            delete submissionData.propertyData.landArea;
            delete submissionData.propertyData.builtArea;
            
            submissionData.propertyStatus = {
                ...propertyStatus,
                remodel_year: parseNumeric(propertyStatus.remodelYear),
                maintenance_cost: parseNumeric(propertyStatus.maintenanceCost, true),
            } as any;
            delete submissionData.propertyStatus.remodelYear;
            delete submissionData.propertyStatus.maintenanceCost;

            if (isEditing && initialData) {
                onSubmit({ ...submissionData, id: initialData.id, created_by: initialData.created_by });
            } else {
                onSubmit(submissionData);
            }
        } catch (error) {
            alert(`Error al subir archivos:\n${formatSupabaseError(error)}`);
        } finally {
            setIsUploading(false);
        }
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed";
    const labelStyle = "block text-sm font-medium text-slate-700";
    const fieldsetStyle = "border border-slate-200 rounded-lg p-6";
    const legendStyle = "text-lg font-semibold text-slate-800 px-2";
    const gridStyle = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4";
    
    const featuredImageUrl = newFiles.featuredImage?.previewUrl || formData.files.featuredImage?.url;
    const galleryImages = [
        ...(formData.files.gallery || []),
        ...newFiles.gallery.map(item => ({ name: item.file.name, url: item.previewUrl }))
    ];

    const isDraft = !isEditing || initialData?.status === CaptacionStatus.DRAFT;
    
    return (_jsxs("form", { onSubmit: (e) => e.preventDefault(), className: "bg-white rounded-lg shadow-xl flex flex-col max-h-[calc(100vh-10rem)]", children: [_jsxs("div", { className: "p-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0", children: [_jsx("h2", { className: "text-2xl font-bold text-slate-800", children: isEditing ? 'Editar Captación' : 'Nueva Captación' }), _jsx("button", { type: "button", onClick: onCancel, className: "p-2 rounded-full text-slate-500 hover:bg-slate-100", children: _jsx(CloseIcon, {}) })] }), _jsxs("div", { className: "p-8 space-y-8 flex-grow overflow-y-auto", children: [_jsxs("fieldset", { className: fieldsetStyle, children: [_jsx("legend", { className: legendStyle, children: "Datos Generales" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "title", className: labelStyle, children: "Título de la Captación" }), _jsx("input", { type: "text", id: "title", name: "title", value: formData.title, onChange: handleChange, required: true, className: inputStyle, placeholder: "Ej: Casa en Miraflores", disabled: isFieldLocked('title') })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: labelStyle, children: "Descripción Corta" }), _jsx("textarea", { id: "description", name: "description", value: formData.description, onChange: handleChange, rows: 2, className: inputStyle, placeholder: "Breve descripción para identificar la captación", disabled: isFieldLocked('description') })] })] })] }), _jsxs("fieldset", { className: fieldsetStyle, children: [_jsx("legend", { className: legendStyle, children: "Datos del Propietario" }), _jsxs("div", { className: gridStyle, children: [_jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Nombre" }), _jsx("input", { name: "name", value: formData.ownerData.name, onChange: handleNestedChange('ownerData'), className: inputStyle, disabled: isFieldLocked('ownerData.name') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Teléfono" }), _jsx("input", { name: "phone", value: formData.ownerData.phone, onChange: handleNestedChange('ownerData'), className: inputStyle, disabled: isFieldLocked('ownerData.phone') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Email" }), _jsx("input", { type: "email", name: "email", value: formData.ownerData.email, onChange: handleNestedChange('ownerData'), className: inputStyle, disabled: isFieldLocked('ownerData.email') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Relación" }), _jsx("input", { name: "relationship", value: formData.ownerData.relationship, onChange: handleNestedChange('ownerData'), className: inputStyle, disabled: isFieldLocked('ownerData.relationship') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Persona Autorizada" }), _jsx("input", { name: "authorizedPerson", value: formData.ownerData.authorizedPerson, onChange: handleNestedChange('ownerData'), className: inputStyle, disabled: isFieldLocked('ownerData.authorizedPerson') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "N° Partida Registral" }), _jsx("input", { name: "propertyTitleNumber", value: formData.ownerData.propertyTitleNumber, onChange: handleNestedChange('ownerData'), className: inputStyle, disabled: isFieldLocked('ownerData.propertyTitleNumber') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "¿Hipoteca?" }), _jsx("select", { name: "hasMortgage", value: formData.ownerData.hasMortgage, onChange: handleNestedChange('ownerData'), className: inputStyle, disabled: isFieldLocked('ownerData.hasMortgage'), children: Object.values(YesNo).map(o => _jsx("option", { value: o, children: o }, o as string)) })] }), formData.ownerData.hasMortgage === YesNo.SI && _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Tiempo Hipoteca" }), _jsx("input", { name: "mortgageTime", value: formData.ownerData.mortgageTime || '', onChange: handleNestedChange('ownerData'), className: inputStyle, disabled: isFieldLocked('ownerData.mortgageTime') })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: labelStyle, children: "Nombre Condominio" }), _jsx("input", { name: "condoName", value: formData.ownerData.condoName, onChange: handleNestedChange('ownerData'), className: inputStyle, disabled: isFieldLocked('ownerData.condoName') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Tipo Contrato" }), _jsx("select", { name: "contractType", value: formData.ownerData.contractType, onChange: handleNestedChange('ownerData'), className: inputStyle, disabled: isFieldLocked('ownerData.contractType'), children: Object.values(ContractType).map(o => _jsx("option", { value: o, children: o }, o as string)) })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Tipo Publicación" }), _jsx("select", { name: "listingType", value: formData.ownerData.listingType, onChange: handleNestedChange('ownerData'), className: inputStyle, disabled: isFieldLocked('ownerData.listingType'), children: Object.values(ListingType).map(o => _jsx("option", { value: o, children: o }, o as string)) })] })] })] }), _jsxs("fieldset", { className: fieldsetStyle, children: [_jsx("legend", { className: legendStyle, children: "Datos de la Propiedad" }), _jsxs("div", { className: gridStyle, children: [_jsxs("div", { className: "lg:col-span-3", children: [_jsx("label", { className: labelStyle, children: "Dirección exacta" }), _jsx("input", { name: "address", value: formData.propertyData.address, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.address') })] }), _jsxs("div", { className: "lg:col-span-3", children: [_jsx("label", { className: labelStyle, children: "Referencia" }), _jsx("input", { name: "reference", value: formData.propertyData.reference, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.reference') })] }), _jsxs("div", { className: "lg:col-span-3", children: [_jsx("label", { className: labelStyle, children: "Lugares destacados alrededor" }), _jsx("input", { name: "nearbyPlaces", value: formData.propertyData.nearbyPlaces, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.nearbyPlaces') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Tipo de propiedad" }), _jsx("select", { name: "propertyCategory", value: formData.propertyData.propertyCategory, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.propertyCategory'), children: Object.values(PropertyCategory).map(o => _jsx("option", { value: o, children: o }, o as string)) })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Independización" }), _jsx("input", { name: "independent", value: formData.propertyData.independent, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.independent') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Años de construcción" }), _jsx("input", { type: "number", name: "constructionYears", value: formData.propertyData.constructionYears, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.constructionYears') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Área de terreno (m²)" }), _jsx("input", { type: "number", step: "0.01", name: "landArea", value: formData.propertyData.landArea, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.landArea') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Área construida (m²)" }), _jsx("input", { type: "number", step: "0.01", name: "builtArea", value: formData.propertyData.builtArea, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.builtArea') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Número de habitaciones" }), _jsx("input", { type: "number", name: "bedrooms", value: formData.propertyData.bedrooms, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.bedrooms') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Closets" }), _jsx("input", { type: "number", name: "closets", value: formData.propertyData.closets, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.closets') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Número de baños" }), _jsx("input", { type: "number", name: "bathrooms", value: formData.propertyData.bathrooms, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.bathrooms') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Estacionamientos" }), _jsx("input", { type: "number", name: "parking", value: formData.propertyData.parking, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.parking') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Lavandería" }), _jsx("select", { name: "laundry", value: formData.propertyData.laundry, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.laundry'), children: Object.values(YesNo).map(o => _jsx("option", { value: o, children: o }, o as string)) })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Ascensor" }), _jsx("select", { name: "hasElevator", value: formData.propertyData.hasElevator, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.hasElevator'), children: Object.values(YesNo).map(o => _jsx("option", { value: o, children: o }, o as string)) })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Pisos" }), _jsx("input", { type: "number", name: "floors", value: formData.propertyData.floors, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.floors') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "¿Cuenta con áreas adicionales?" }), _jsx("select", { name: "hasAdditionalAreas", value: formData.propertyData.hasAdditionalAreas, onChange: handleNestedChange('propertyData'), className: inputStyle, disabled: isFieldLocked('propertyData.hasAdditionalAreas'), children: Object.values(YesNo).map(o => _jsx("option", { value: o, children: o }, o as string)) })] }), _jsxs("div", { className: "lg:col-span-3 mt-4 pt-4 border-t", children: [_jsx("label", { className: labelStyle, children: "Ubicación en Mapa" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mt-1", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "latitude", className: "block text-xs font-medium text-slate-600", children: "Latitud" }), _jsx("input", { type: "number", name: "latitude", id: "latitude", value: formData.propertyData.latitude || '', onChange: handleNestedChange('propertyData'), className: inputStyle, step: "any", disabled: isFieldLocked('propertyData.latitude') })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "longitude", className: "block text-xs font-medium text-slate-600", children: "Longitud" }), _jsx("input", { type: "number", name: "longitude", id: "longitude", value: formData.propertyData.longitude || '', onChange: handleNestedChange('propertyData'), className: inputStyle, step: "any", disabled: isFieldLocked('propertyData.longitude') })] })] }), _jsx("div", { className: `mt-2 h-64 w-full rounded-md overflow-hidden border ${isFieldLocked('propertyData.latitude') ? 'pointer-events-none opacity-60' : ''}`, children: _jsx(MapSelector, { latitude: Number(formData.propertyData.latitude) || -12.046186, longitude: Number(formData.propertyData.longitude) || -77.042751, onLocationChange: handleLocationChange }) })] })] })] }), _jsxs("fieldset", { className: fieldsetStyle, children: [_jsx("legend", { className: legendStyle, children: "Observaciones de Visita" }), _jsxs("div", { children: [_jsx("label", { htmlFor: "visitObservations", className: labelStyle, children: "Observaciones visita" }), _jsx("textarea", { id: "visitObservations", name: "visitObservations", value: formData.visitObservations, onChange: handleChange, rows: 4, className: inputStyle, disabled: isFieldLocked('visitObservations') })] })] }), _jsxs("fieldset", { className: fieldsetStyle, children: [_jsx("legend", { className: legendStyle, children: "Estado de la Propiedad" }), _jsxs("div", { className: gridStyle, children: [_jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "¿Propiedad habitada?" }), _jsx("select", { name: "isOccupied", value: formData.propertyStatus.isOccupied, onChange: handleNestedChange('propertyStatus'), className: inputStyle, disabled: isFieldLocked('propertyStatus.isOccupied'), children: Object.values(YesNo).map(o => _jsx("option", { value: o, children: o }, o as string)) })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Estado de propiedad" }), _jsx("select", { name: "propertyState", value: formData.propertyStatus.propertyState, onChange: handleNestedChange('propertyStatus'), className: inputStyle, disabled: isFieldLocked('propertyStatus.propertyState'), children: Object.values(PropertyState).map(o => _jsx("option", { value: o, children: o }, o as string)) })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "¿Ha sido remodelada?" }), _jsx("select", { name: "wasRemodeled", value: formData.propertyStatus.wasRemodeled, onChange: handleNestedChange('propertyStatus'), className: inputStyle, disabled: isFieldLocked('propertyStatus.wasRemodeled'), children: Object.values(YesNo).map(o => _jsx("option", { value: o, children: o }, o as string)) })] }), formData.propertyStatus.wasRemodeled === YesNo.SI && _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "Año Remodelación" }), _jsx("input", { name: "remodelYear", value: formData.propertyStatus.remodelYear, onChange: handleNestedChange('propertyStatus'), className: inputStyle, disabled: isFieldLocked('propertyStatus.remodelYear') })] })] }), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: labelStyle, children: "Servicios Disponibles" }), _jsx("fieldset", { disabled: isFieldLocked('propertyStatus.availableServices'), className: "mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2", children: Object.values(ServiceType).map(service => (_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: (formData.propertyStatus.availableServices || []).includes(service), onChange: () => handleCheckboxArrayChange('availableServices', service), className: "h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" }), _jsx("span", { className: "text-sm text-slate-700", children: service })] }, service as string))) })] }), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: labelStyle, children: "Áreas Comunes" }), _jsx("fieldset", { disabled: isFieldLocked('propertyStatus.commonAreas'), className: "mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2", children: Object.values(CommonArea).map(area => (_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: (formData.propertyStatus.commonAreas || []).includes(area), onChange: () => handleCheckboxArrayChange('commonAreas', area), className: "h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" }), _jsx("span", { className: "text-sm text-slate-700", children: area })] }, area as string))) })] })] }), _jsxs("fieldset", { className: fieldsetStyle, children: [_jsx("legend", { className: legendStyle, children: "Condiciones de Venta" }), _jsxs("div", { className: gridStyle, children: [_jsxs("div", { className: "lg:col-span-3", children: [_jsx("label", { className: labelStyle, children: "Condiciones de ventas estimado" }), _jsx("input", { name: "saleConditions", value: formData.propertyStatus.saleConditions, onChange: handleNestedChange('propertyStatus'), className: inputStyle, disabled: isFieldLocked('propertyStatus.saleConditions') })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "¿Acepta financiamiento bancario?" }), _jsx("select", { name: "acceptsBankFinancing", value: formData.propertyStatus.acceptsBankFinancing, onChange: handleNestedChange('propertyStatus'), className: inputStyle, disabled: isFieldLocked('propertyStatus.acceptsBankFinancing'), children: Object.values(YesNo).map(o => _jsx("option", { value: o, children: o }, o as string)) })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "¿Alcabala?" }), _jsx("select", { name: "hasAlcabala", value: formData.propertyStatus.hasAlcabala, onChange: handleNestedChange('propertyStatus'), className: inputStyle, disabled: isFieldLocked('propertyStatus.hasAlcabala'), children: Object.values(YesNo).map(o => _jsx("option", { value: o, children: o }, o as string)) })] }), _jsxs("div", { children: [_jsx("label", { className: labelStyle, children: "¿Mantenimiento cuánto?" }), _jsx("input", { type: "number", step: "0.01", name: "maintenanceCost", value: formData.propertyStatus.maintenanceCost, onChange: handleNestedChange('propertyStatus'), className: inputStyle, placeholder: "Soles", disabled: isFieldLocked('propertyStatus.maintenanceCost') })] })] }), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: labelStyle, children: "¿Horario libre de visitas?" }), _jsx("select", { name: "hasFreeSchedule", value: formData.propertyStatus.hasFreeSchedule, onChange: handleNestedChange('propertyStatus'), className: inputStyle, disabled: isFieldLocked('propertyStatus.hasFreeSchedule'), children: Object.values(YesNo).map(o => _jsx("option", { value: o, children: o }, o as string)) })] }), formData.propertyStatus.hasFreeSchedule === YesNo.SI && (_jsxs("div", { className: "mt-4 space-y-3 p-4 bg-slate-50 rounded-md border", children: [_jsx("label", { className: "block text-sm font-medium text-slate-700", children: "Especificar Horario" }), _jsx("fieldset", { disabled: isFieldLocked('propertyStatus.visitDays'), className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2", children: Object.values(DayOfWeek).map(day => (_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: (formData.propertyStatus.visitDays || []).includes(day), onChange: () => handleCheckboxArrayChange('visitDays', day), className: "h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" }), _jsx("span", { className: "text-sm text-slate-700", children: day })] }, day as string))) }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { htmlFor: "visitTimeStart", className: "block text-xs font-medium text-slate-600", children: "Desde" }), _jsx("input", { type: "time", id: "visitTimeStart", name: "visitTimeStart", value: formData.propertyStatus.visitTimeStart || '', onChange: handleNestedChange('propertyStatus'), className: inputStyle, disabled: isFieldLocked('propertyStatus.visitTimeStart') })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { htmlFor: "visitTimeEnd", className: "block text-xs font-medium text-slate-600", children: "Hasta" }), _jsx("input", { type: "time", id: "visitTimeEnd", name: "visitTimeEnd", value: formData.propertyStatus.visitTimeEnd || '', onChange: handleNestedChange('propertyStatus'), className: inputStyle, disabled: isFieldLocked('propertyStatus.visitTimeEnd') })] })] })] }))] }), _jsxs("fieldset", { className: fieldsetStyle, children: [_jsx("legend", { className: legendStyle, children: "Otros Detalles" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "reasonForSelling", className: labelStyle, children: "¿Por qué vende la propiedad?" }), _jsx("textarea", { id: "reasonForSelling", name: "reasonForSelling", value: formData.propertyStatus.reasonForSelling, onChange: handleNestedChange('propertyStatus'), rows: 3, className: inputStyle, disabled: isFieldLocked('propertyStatus.reasonForSelling') })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "specialFeature", className: labelStyle, children: "¿Alguna característica especial que desee destacar?" }), _jsx("textarea", { id: "specialFeature", name: "specialFeature", value: formData.propertyStatus.specialFeature, onChange: handleNestedChange('propertyStatus'), rows: 3, className: inputStyle, disabled: isFieldLocked('propertyStatus.specialFeature') })] })] })] }), _jsxs("fieldset", { className: fieldsetStyle, children: [_jsx("legend", { className: legendStyle, children: "Archivos y Multimedia" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-slate-700 mb-2", children: "Imagen Destacada" }), !isFieldLocked('files.featuredImage') && (_jsx("div", { className: "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md", children: _jsxs("div", { className: "space-y-1 text-center", children: [featuredImageUrl ? _jsx("img", { src: featuredImageUrl, alt: "Preview", className: "mx-auto h-24 w-auto object-contain" }) : _jsx(PhotoIcon, {}), _jsx("div", { className: "flex text-sm text-slate-600 justify-center", children: _jsxs("label", { htmlFor: "featuredImage", className: "relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500", children: [_jsx("span", { children: "Subir archivo" }), _jsx("input", { id: "featuredImage", type: "file", className: "sr-only", onChange: (e) => handleFileChange(e, 'featuredImage') })] }) }), _jsx("p", { className: "text-xs text-slate-500", children: "PNG, JPG, GIF" })] }) })), featuredImageUrl && (_jsx("div", { children: [_jsx("img", { src: featuredImageUrl, alt: "Preview", className: `mx-auto h-24 w-auto object-contain ${!isFieldLocked('files.featuredImage') ? '' : 'mt-1'}` }), !isFieldLocked('files.featuredImage') && (_jsx("button", { type: "button", onClick: () => { handleRemoveExistingFile('featuredImage', null); handleRemoveNewFile('featuredImage', null); }, className: "mt-2 text-xs text-red-600 hover:underline", children: "Eliminar imagen" }))] }))] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-slate-700 mb-2", children: "Galería de Imágenes" }), !isFieldLocked('files.gallery') && (_jsxs("label", { htmlFor: "gallery", className: "mt-1 relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 border border-slate-300 px-3 py-2 text-sm shadow-sm w-full block text-center hover:bg-slate-50", children: [_jsx("span", { children: "Subir más imágenes" }), _jsx("input", { id: "gallery", type: "file", className: "sr-only", multiple: true, onChange: (e) => handleFileChange(e, 'gallery') })] })), _jsx("div", { className: "mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2", children: galleryImages.map((img, i) => {
                                        const existingCount = formData.files.gallery?.length || 0;
                                        const isNew = i >= existingCount;
                                        return (_jsxs("div", { className: "relative group", children: [_jsx("img", { src: img.url, className: "h-20 w-20 object-cover rounded-md" }), !isFieldLocked('files.gallery') && (_jsx("button", { type: "button", onClick: () => isNew ? handleRemoveNewFile('gallery', i - existingCount) : handleRemoveExistingFile('gallery', i), className: "absolute top-0 right-0 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100", children: "×" }))] }, `gallery-${i}`));
                                    }) })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsx(SingleDocUploader, { fieldName: "propertyTitleDeed", label: "Título de propiedad PU/HR", existingFile: formData.files.propertyTitleDeed, newFile: newFiles.propertyTitleDeed, onFileChange: handleFileChange, onRemoveExisting: handleRemoveExistingFile, onRemoveNew: handleRemoveNewFile, isLocked: isFieldLocked('files.propertyTitleDeed') }), _jsx(SingleDocUploader, { fieldName: "proofOfNoDebt", label: "Constancia de no adeudo", existingFile: formData.files.proofOfNoDebt, newFile: newFiles.proofOfNoDebt, onFileChange: handleFileChange, onRemoveExisting: handleRemoveExistingFile, onRemoveNew: handleRemoveNewFile, isLocked: isFieldLocked('files.proofOfNoDebt') }), _jsx(SingleDocUploader, { fieldName: "dni", label: "DNI", existingFile: formData.files.dni, newFile: newFiles.dni, onFileChange: handleFileChange, onRemoveExisting: handleRemoveExistingFile, onRemoveNew: handleRemoveNewFile, isLocked: isFieldLocked('files.dni') }), _jsx(SingleDocUploader, { fieldName: "authorization", label: "Autorización de Aquivivir", existingFile: formData.files.authorization, newFile: newFiles.authorization, onFileChange: handleFileChange, onRemoveExisting: handleRemoveExistingFile, onRemoveNew: handleRemoveNewFile, isLocked: isFieldLocked('files.authorization') })] })] })] })] }), _jsxs("div", { className: "p-6 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 flex-shrink-0", children: [_jsx("button", { type: "button", onClick: onCancel, className: "px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50", children: "Cancelar" }), isDraft ? (_jsxs(React.Fragment, { children: [_jsxs("button", { type: "button", onClick: () => handleSubmit(false), disabled: isUploading, className: "px-6 py-2.5 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-200 rounded-md hover:bg-orange-200 disabled:bg-slate-200", children: [isUploading ? 'Guardando...' : 'Guardar Borrador'] }), _jsxs("button", { type: "button", onClick: () => handleSubmit(true), disabled: isUploading, className: "px-6 py-2.5 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 disabled:bg-orange-300", children: [isUploading ? 'Finalizando...' : 'Finalizar Captación'] })] })) : (_jsxs("button", { type: "button", onClick: () => handleSubmit(false), disabled: isUploading, className: "px-6 py-2.5 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 disabled:bg-orange-300", children: [isUploading ? 'Actualizando...' : 'Actualizar Captación'] }))] })] }));
};

export default CaptacionForm;
