import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { supabase, formatSupabaseError } from '@/supabaseClient';
import { UserRole, CaptacionStatus } from '@/types';
import PrintableCaptacionReport from '@/components/PrintableCaptacionReport';
import DownloadLinkModal from '@/components/DownloadLinkModal';
import { ArrowLeftIcon } from '@/components/icons/ArrowLeftIcon';
import { DocumentArrowDownIcon } from '@/components/icons/DocumentArrowDownIcon';
import { PencilIcon } from '@/components/icons/PencilIcon';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { PhotoIcon } from '@/components/icons/PhotoIcon';
import { DocumentIcon } from '@/components/icons/DocumentIcon';
import StaticMapDisplay from '@/components/StaticMapDisplay';

const DetailItem = ({ label, value, className }) => (_jsxs("div", { className: className, children: [_jsx("p", { className: "text-sm font-medium text-slate-500", children: label }), _jsx("p", { className: "mt-1 text-md text-slate-900", children: value || '---' })] }));

const Section = ({ title, children }) => (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h3", { className: "text-xl font-semibold text-slate-800 border-b pb-3 mb-4", children: title }), children] }));

// Use a global variable to track the loading state
let pdfLibrariesLoadingPromise: Promise<void> | null = null;

const loadPdfLibraries = (): Promise<void> => {
    // If libraries are already loaded, resolve immediately
    if ((window as any).html2canvas && (window as any).jspdf) {
        return Promise.resolve();
    }

    // If we are already loading them, return the existing promise
    if (pdfLibrariesLoadingPromise) {
        return pdfLibrariesLoadingPromise;
    }

    // Start loading the libraries
    pdfLibrariesLoadingPromise = new Promise((resolve, reject) => {
        let loadedCount = 0;
        const totalScripts = 2;

        const onScriptLoad = () => {
            loadedCount++;
            if (loadedCount === totalScripts) {
                if ((window as any).html2canvas && (window as any).jspdf) {
                    resolve();
                } else {
                    pdfLibrariesLoadingPromise = null; // Reset for retry
                    reject(new Error("Scripts cargados, pero no encontrados en el objeto window."));
                }
            }
        };

        const onScriptError = (event: Event | string) => {
            pdfLibrariesLoadingPromise = null; // Reset for retry
            const target = (event as Event).target as HTMLScriptElement;
            if(target && target.parentNode) {
              target.parentNode.removeChild(target); // Clean up failed script
            }
            reject(new Error(`No se pudo cargar una librería para PDF. Verifique su conexión a internet.`));
        };
        
        // Load html2canvas
        const html2canvasScript = document.createElement('script');
        html2canvasScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        html2canvasScript.onload = onScriptLoad;
        html2canvasScript.onerror = onScriptError;
        document.body.appendChild(html2canvasScript);

        // Load jspdf
        const jspdfScript = document.createElement('script');
        jspdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        jspdfScript.onload = onScriptLoad;
        jspdfScript.onerror = onScriptError;
        document.body.appendChild(jspdfScript);
    });

    return pdfLibrariesLoadingPromise;
};

const CaptacionDetails = ({ captacion, currentUser, onBack, onEdit, onDelete }) => {
    const [isPreparingDownload, setIsPreparingDownload] = useState(false);
    const [downloadState, setDownloadState] = useState({ isOpen: false, url: '', filename: '' });

    if (!captacion) {
        return (_jsxs("div", { className: "text-center py-10", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-700", children: "Captación no encontrada" }), _jsx("p", { className: "text-slate-500 mt-2", children: "Es posible que haya sido eliminada o el enlace no sea correcto." }), _jsxs("button", { onClick: onBack, className: "mt-6 inline-flex items-center text-sm font-medium text-slate-600 hover:text-orange-600 group", children: [_jsx(ArrowLeftIcon, {}), _jsx("span", { className: "ml-2", children: "Volver a la lista" })] })] }));
    }

    const isCurrentUserAdmin = currentUser.role === UserRole.ADMIN;
    const canEdit = isCurrentUserAdmin || (captacion.created_by === currentUser.id && captacion.status === CaptacionStatus.DRAFT);
    const gridStyle = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6";

    const handleCloseDownloadModal = () => {
        setDownloadState({ isOpen: false, url: '', filename: '' });
    };

    const handleDownloadPdf = async () => {
        setIsPreparingDownload(true);
        let root: ReturnType<typeof ReactDOM.createRoot> | null = null;
        try {
            await loadPdfLibraries();

            const printableElement = document.getElementById('printable-container');
            if (!printableElement) {
                throw new Error("No se encontró el contenedor para imprimir.");
            }

            root = ReactDOM.createRoot(printableElement);
            root.render(_jsx(PrintableCaptacionReport, { captacion: captacion }));
            
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await (window as any).html2canvas(printableElement, { scale: 2, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new (window as any).jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            
            const pdfBlob = pdf.output('blob');
            const filename = `Captacion_${captacion.title.replace(/\s+/g, '_')}.pdf`;
            const filePath = `downloads/${Date.now()}-${filename}`;

            const { error: uploadError } = await supabase.storage
                .from('temp-downloads')
                .upload(filePath, pdfBlob);

            if (uploadError) throw uploadError;

            const { data: urlData } = await supabase.storage
                .from('temp-downloads')
                .getPublicUrl(filePath);

            setDownloadState({
                isOpen: true,
                url: urlData.publicUrl,
                filename: filename
            });

        } catch (error: any) {
            console.error("Error generating or uploading PDF:", error);
            alert(`Hubo un error al preparar el PDF: ${formatSupabaseError(error) || error.message || 'Por favor, intente de nuevo.'}`);
        } finally {
            if (root) {
                root.unmount();
            }
            setIsPreparingDownload(false);
        }
    };

    const formatVisitSchedule = () => {
        const { hasFreeSchedule, visitDays, visitTimeStart, visitTimeEnd } = captacion.propertyStatus;
        if (hasFreeSchedule === 'Si' && visitDays && visitDays.length > 0) {
            const daysString = visitDays.join(', ');
            const timeString = visitTimeStart && visitTimeEnd ? ` de ${visitTimeStart} a ${visitTimeEnd}` : '';
            return `${daysString}${timeString}`;
        }
        return hasFreeSchedule || '---';
    };

    const DocumentLink = ({ file, label }) => {
        if (!file || !file.url) return null;
        return (_jsx("li", { children: _jsxs("a", { href: file.url, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center p-2 rounded-md hover:bg-slate-50 group w-full text-left", children: [_jsx(DocumentIcon, {}), _jsxs("div", { className: "ml-2 min-w-0", children: [_jsx("p", { className: "text-xs font-semibold text-slate-500", children: label }), _jsx("p", { className: "text-sm font-medium text-slate-700 group-hover:text-orange-600 truncate", children: file.name })] })] }) }));
    };

    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("button", { onClick: onBack, className: "inline-flex items-center text-sm font-medium text-slate-600 hover:text-orange-600 group mb-4", children: [_jsx(ArrowLeftIcon, {}), _jsx("span", { className: "ml-2", children: "Volver a la lista" })] }), _jsxs("div", { className: "md:flex md:items-start md:justify-between md:space-x-6", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-x-4", children: [_jsx("h1", { className: "text-3xl font-bold text-slate-800", children: captacion.title }), _jsx("span", { className: `px-3 py-1 text-sm font-semibold rounded-full ${captacion.status === 'Borrador' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`, children: captacion.status || 'Completado' })] }), _jsx("p", { className: "mt-1 text-lg text-slate-600", children: captacion.description })] }), _jsxs("div", { className: "mt-4 md:mt-0 flex flex-wrap gap-2 flex-shrink-0", children: [canEdit && (_jsxs("button", { onClick: () => onEdit(captacion), className: "inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50", children: [_jsx(PencilIcon, {}), _jsx("span", { className: "ml-2", children: "Editar" })] })), isCurrentUserAdmin && (_jsxs("button", { onClick: () => onDelete(captacion.id), className: "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700", children: [_jsx(TrashIcon, {}), _jsx("span", { className: "ml-2", children: "Eliminar" })] })), _jsxs("button", { onClick: handleDownloadPdf, disabled: isPreparingDownload, className: "inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 disabled:bg-slate-200 disabled:cursor-wait", children: [_jsx(DocumentArrowDownIcon, {}), _jsx("span", { className: "ml-2", children: isPreparingDownload ? 'Preparando...' : 'Descargar Ficha (PDF)' })] })] })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsx(Section, { title: "Datos del Propietario", children: _jsxs("div", { className: gridStyle, children: [_jsx(DetailItem, { label: "Nombre", value: captacion.ownerData.name }), _jsx(DetailItem, { label: "Teléfono", value: captacion.ownerData.phone }), _jsx(DetailItem, { label: "Email", value: captacion.ownerData.email }), _jsx(DetailItem, { label: "Relación", value: captacion.ownerData.relationship }), _jsx(DetailItem, { label: "Persona Autorizada", value: captacion.ownerData.authorizedPerson }), _jsx(DetailItem, { label: "N° Partida Registral", value: captacion.ownerData.propertyTitleNumber }), _jsx(DetailItem, { label: "¿Hipoteca?", value: captacion.ownerData.hasMortgage }), captacion.ownerData.hasMortgage === 'Si' && _jsx(DetailItem, { label: "Tiempo Hipoteca", value: captacion.ownerData.mortgageTime }), _jsx(DetailItem, { label: "Nombre Condominio", value: captacion.ownerData.condoName, className: "md:col-span-2" }), _jsx(DetailItem, { label: "Tipo Contrato", value: captacion.ownerData.contractType }), _jsx(DetailItem, { label: "Tipo Publicación", value: captacion.ownerData.listingType })] }) }), _jsx(Section, { title: "Datos del Inmueble", children: _jsxs("div", { className: gridStyle, children: [_jsx(DetailItem, { label: "Dirección exacta", value: captacion.propertyData.address, className: "md:col-span-3" }), _jsx(DetailItem, { label: "Referencia", value: captacion.propertyData.reference, className: "md:col-span-3" }), _jsx(DetailItem, { label: "Lugares destacados alrededor", value: captacion.propertyData.nearbyPlaces, className: "md:col-span-3" }), _jsx(DetailItem, { label: "Tipo de propiedad", value: captacion.propertyData.propertyCategory }), _jsx(DetailItem, { label: "Independización", value: captacion.propertyData.independent }), _jsx(DetailItem, { label: "Años de construcción", value: captacion.propertyData.constructionYears }), _jsx(DetailItem, { label: "Área de terreno (m²)", value: captacion.propertyData.landArea }), _jsx(DetailItem, { label: "Área construida (m²)", value: captacion.propertyData.builtArea }), _jsx(DetailItem, { label: "Número de habitaciones", value: captacion.propertyData.bedrooms }), _jsx(DetailItem, { label: "Closets", value: captacion.propertyData.closets }), _jsx(DetailItem, { label: "Número de baños", value: captacion.propertyData.bathrooms }), _jsx(DetailItem, { label: "Lavandería", value: captacion.propertyData.laundry }), _jsx(DetailItem, { label: "Ascensor", value: captacion.propertyData.hasElevator }), _jsx(DetailItem, { label: "N° de Pisos", value: captacion.propertyData.floors }), _jsx(DetailItem, { label: "Estacionamientos", value: captacion.propertyData.parking }), _jsx(DetailItem, { label: "¿Cuenta con áreas adicionales?", value: captacion.propertyData.hasAdditionalAreas })] }) }), captacion.propertyData.latitude && captacion.propertyData.longitude && (_jsx(Section, { title: "Ubicación", children: _jsx("div", { className: "h-80 w-full rounded-md overflow-hidden border", children: _jsx(StaticMapDisplay, { latitude: captacion.propertyData.latitude, longitude: captacion.propertyData.longitude }) }) })), _jsx(Section, { title: "Observaciones de Visita", children: _jsx("p", { className: "text-slate-600 whitespace-pre-wrap", children: captacion.visitObservations || 'No hay observaciones.' }) }), _jsxs(Section, { title: "Estado y Condiciones de Venta", children: [_jsxs("div", { className: gridStyle, children: [_jsx(DetailItem, { label: "¿La propiedad está habitada?", value: captacion.propertyStatus.isOccupied }), _jsx(DetailItem, { label: "Estado de propiedad", value: captacion.propertyStatus.propertyState }), _jsx(DetailItem, { label: "¿Ha sido remodelada?", value: captacion.propertyStatus.wasRemodeled }), captacion.propertyStatus.wasRemodeled === 'Si' && _jsx(DetailItem, { label: "Año Remodelación", value: captacion.propertyStatus.remodelYear }), _jsx(DetailItem, { label: "¿Acepta financiamiento bancario?", value: captacion.propertyStatus.acceptsBankFinancing }), _jsx(DetailItem, { label: "¿Alcabala?", value: captacion.propertyStatus.hasAlcabala }), _jsx(DetailItem, { label: "Mantenimiento", value: captacion.propertyStatus.maintenanceCost ? `S/ ${captacion.propertyStatus.maintenanceCost}` : '---' }), _jsx(DetailItem, { label: "Horario de visitas", value: formatVisitSchedule(), className: "md:col-span-2" })] }), _jsxs("div", { className: "mt-6", children: [_jsx("p", { className: "text-sm font-medium text-slate-500", children: "Servicios Disponibles" }), (captacion.propertyStatus.availableServices || []).length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: (captacion.propertyStatus.availableServices || []).map(service => (_jsx("span", { className: "px-2.5 py-1 text-xs font-medium bg-teal-100 text-teal-800 rounded-full", children: service }, service))) })) : _jsx("p", { className: "mt-1 text-md text-slate-900", children: "No especificado" })] }), _jsxs("div", { className: "mt-6", children: [_jsx("p", { className: "text-sm font-medium text-slate-500", children: "Áreas Comunes" }), (captacion.propertyStatus.commonAreas || []).length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: (captacion.propertyStatus.commonAreas || []).map(area => (_jsx("span", { className: "px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full", children: area }, area))) })) : _jsx("p", { className: "mt-1 text-md text-slate-900", children: "No especificado" })] })] }), _jsx(Section, { title: "Otros Detalles", children: _jsxs("div", { className: "space-y-4", children: [_jsx(DetailItem, { label: "¿Por qué vende la propiedad?", value: captacion.propertyStatus.reasonForSelling }), _jsx(DetailItem, { label: "¿Alguna característica especial que desee destacar?", value: captacion.propertyStatus.specialFeature })] }) }), _jsx(Section, { title: "Archivos y Multimedia", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-slate-700 mb-2", children: "Imagen Destacada" }), captacion.files.featuredImage ? (_jsx("a", { href: captacion.files.featuredImage.url, target: "_blank", rel: "noopener noreferrer", children: _jsx("img", { src: captacion.files.featuredImage.url, alt: "Imagen destacada", className: "w-full h-auto rounded-lg object-cover shadow-sm border" }) })) : (_jsxs("div", { className: "flex items-center justify-center h-48 bg-slate-50 border rounded-lg text-slate-500", children: [_jsx(PhotoIcon, {}), " Sin imagen"] }))] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-slate-700 mb-2", children: "Documentos" }), _jsxs("ul", { className: "space-y-2", children: [_jsx(DocumentLink, { file: captacion.files.propertyTitleDeed, label: "Título de Propiedad PU/HR" }), _jsx(DocumentLink, { file: captacion.files.proofOfNoDebt, label: "Constancia de no adeudo" }), _jsx(DocumentLink, { file: captacion.files.dni, label: "DNI" }), _jsx(DocumentLink, { file: captacion.files.authorization, label: "Autorización de Aquivivir" }), !captacion.files.propertyTitleDeed && !captacion.files.proofOfNoDebt && !captacion.files.dni && !captacion.files.authorization && (_jsx("p", { className: "text-sm text-slate-500 p-2", children: "No hay documentos adjuntos." }))] })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("h4", { className: "font-semibold text-slate-700 mb-2", children: "Galería de Imágenes" }), (captacion.files.gallery || []).length > 0 ? (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2", children: (captacion.files.gallery || []).map((img, index) => (_jsx("a", { href: img.url, target: "_blank", rel: "noopener noreferrer", children: _jsx("img", { src: img.url, alt: `Galería ${index + 1}`, className: "h-24 w-24 object-cover rounded-md border shadow-sm hover:ring-2 hover:ring-orange-400" }) }, index))) })) : _jsx("p", { className: "text-sm text-slate-500", children: "No hay imágenes en la galería." })] })] }) })] }), _jsx(DownloadLinkModal, { isOpen: downloadState.isOpen, onClose: handleCloseDownloadModal, downloadUrl: downloadState.url, filename: downloadState.filename })] }));
};

export default CaptacionDetails;