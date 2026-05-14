
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// FIX: Implemented the PropertyDetails component to display comprehensive property information, including related visits and tasks, resolving a module error.
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { supabase, formatSupabaseError } from '@/supabaseClient';
import { UserRole, TaskStatus, PropertySaleStatus, ListingType, ReportSections, PropertyTrafficLight } from '@/types';
import StaticMapDisplay from '@/components/StaticMapDisplay';
import VisitList from '@/components/VisitList';
import PrintablePropertyReport from '@/components/PrintablePropertyReport';
import DownloadReportModal from '@/components/DownloadReportModal';
import DownloadLinkModal from '@/components/DownloadLinkModal';
import { ArrowLeftIcon } from '@/components/icons/ArrowLeftIcon';
import { LocationIcon } from '@/components/icons/LocationIcon';
import { DocumentIcon } from '@/components/icons/DocumentIcon';
import { PlusIcon } from '@/components/icons/PlusIcon';
import { DownloadIcon } from '@/components/icons/DownloadIcon';
import { DocumentArrowDownIcon } from '@/components/icons/DocumentArrowDownIcon';

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


const TaskItem = ({ task, users, currentUser, isCurrentUserAdmin, onOpenVisitEditor, onCompleteTask }) => {
    const worker = users.find(u => u.id === task.workerId);
    const isAssignedToCurrentUser = currentUser.id === task.workerId;
    const isVisitReportTask = !!task.visit_id;

    const handleCompleteClick = () => {
        if (isVisitReportTask && task.visit_id) {
            onOpenVisitEditor(task.visit_id, task.id);
        } else {
            onCompleteTask(task.id);
        }
    };

    return (_jsxs("li", { className: "py-3 flex justify-between items-center space-x-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-slate-800", children: task.description }), isCurrentUserAdmin && worker && _jsxs("p", { className: "text-xs text-slate-500", children: ["Asignado a: ", worker.name] })] }), _jsxs("div", { className: "flex items-center space-x-2 flex-shrink-0", children: [_jsx("span", { className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`, children: task.status }), isAssignedToCurrentUser && task.status === TaskStatus.PENDING && (_jsx("button", { onClick: handleCompleteClick, className: "px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition", children: "Completar" }))] })] }));
};


const PropertyDetails = ({ property, visits, tasks, users, currentUser, onBack, onSelectVisit, onOpenAddVisitModalForProperty, onCompleteTask, onOpenVisitEditor }) => {
    const [isPreparingDownload, setIsPreparingDownload] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadState, setDownloadState] = useState({ isOpen: false, url: '', filename: '' });
    const isCurrentUserAdmin = currentUser.role === UserRole.ADMIN;
    const isSold = property.status === PropertySaleStatus.SOLD;

    const handleCloseDownloadModal = () => {
        setDownloadState({ isOpen: false, url: '', filename: '' });
    };
    
    const handleDownloadPdf = async (sections: ReportSections) => {
        setIsDownloadModalOpen(false);
        setIsPreparingDownload(true);
        let root: ReturnType<typeof ReactDOM.createRoot> | null = null;
        try {
            await loadPdfLibraries();
            
            const printableElement = document.getElementById('printable-container');
            if (!printableElement) {
                throw new Error("No se encontró el contenedor para imprimir.");
            }
    
            root = ReactDOM.createRoot(printableElement);
            root.render(_jsx(PrintablePropertyReport, { property: property, selectedSections: sections }));
    
            await new Promise(resolve => setTimeout(resolve, 500));
    
            const canvas = await (window as any).html2canvas(printableElement, {
                scale: 2,
                useCORS: true,
                logging: false,
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new (window as any).jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
    
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            
            const pdfBlob = pdf.output('blob');
            const filename = `Ficha_${property.propertyIdNumber}_${property.name.replace(/\s+/g, '_')}.pdf`;
            const filePath = `downloads/${Date.now()}-${filename}`;

            const { error: uploadError } = await supabase.storage
                .from('temp-downloads')
                .upload(filePath, pdfBlob);
            
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('temp-downloads')
                .getPublicUrl(filePath);

            setDownloadState({
                isOpen: true,
                url: urlData.publicUrl,
                filename: filename,
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


    const downloadVisitsAsCSV = async () => {
        if (visits.length === 0) {
            alert("No hay visitas para descargar.");
            return;
        }

        setIsPreparingDownload(true);
        try {
            const headers = [
                "Cliente", "Teléfono", "Fecha", "Hora", "Trabajador Asignado",
                "Impresión del Cliente", "Comentarios del Cliente", "Notas Internas",
                "Ubicación Amigable", "Interés"
            ];
            // Changed to comma ',' as per user request
            const csvRows = [headers.join(',')];
            
            const escapeCSV = (str) => {
                const value = str || '';
                const escapedValue = value.replace(/"/g, '""');
                return `"${escapedValue}"`;
            };

            visits.forEach(visit => {
                const worker = users.find(u => u.id === visit.workerId);
                const row = [
                    escapeCSV(visit.clientName),
                    escapeCSV(visit.clientPhone),
                    escapeCSV(visit.date),
                    escapeCSV(visit.time),
                    escapeCSV(worker?.name),
                    escapeCSV(visit.clientImpression),
                    escapeCSV(visit.clientComments),
                    escapeCSV(visit.notes),
                    escapeCSV(visit.friendlyLocation),
                    escapeCSV(visit.interestStatus)
                ].join(','); // Changed to comma ','
                csvRows.push(row);
            });

            const csvString = `\uFEFF${csvRows.join('\n')}`;
            const csvBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const filename = `Visitas_${property.propertyIdNumber}.csv`;
            const filePath = `downloads/${Date.now()}-${filename}`;

            const { error: uploadError } = await supabase.storage
                .from('temp-downloads')
                .upload(filePath, csvBlob);
            
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('temp-downloads')
                .getPublicUrl(filePath);

            setDownloadState({
                isOpen: true,
                url: urlData.publicUrl,
                filename: filename,
            });
        } catch (error: any) {
            console.error("Error preparing CSV for download:", error);
            alert(`Hubo un error al preparar el CSV: ${formatSupabaseError(error) || error.message}`);
        } finally {
            setIsPreparingDownload(false);
        }
    };

    const DetailItem = ({ label, value }) => (_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-slate-500", children: label }), _jsx("p", { className: "mt-1 text-md text-slate-900", children: value })] }));

    const getTrafficLightClass = (color) => {
        switch (color) {
            case PropertyTrafficLight.RED: return 'bg-red-500';
            case PropertyTrafficLight.YELLOW: return 'bg-yellow-400';
            case PropertyTrafficLight.GREEN: return 'bg-green-500';
            default: return 'bg-green-500';
        }
    };

    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("button", { onClick: onBack, className: "inline-flex items-center text-sm font-medium text-slate-600 hover:text-orange-600 group mb-4", children: [_jsx(ArrowLeftIcon, {}), _jsx("span", { className: "ml-2", children: "Volver a la lista" })] }), _jsxs("div", { className: "md:flex md:items-start md:space-x-6", children: [_jsx("img", { src: property.imageUrl, alt: property.name, className: "w-full md:w-80 aspect-square rounded-lg object-cover shadow" }), _jsxs("div", { className: "mt-4 md:mt-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-x-3 flex-wrap gap-y-2", children: [_jsx("p", { className: "font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded text-sm inline-block", children: property.propertyIdNumber }), property.listingType && (_jsx("span", { className: `px-3 py-1 text-sm font-semibold rounded-full ${property.listingType === ListingType.ALQUILER ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`, children: property.listingType })), _jsx("span", { className: `px-3 py-1 text-sm font-semibold rounded-full ${isSold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`, children: property.status }), _jsxs("div", { className: "flex items-center bg-slate-50 px-2 py-1 rounded-full border", children: [_jsx("div", { className: `h-4 w-4 rounded-full border border-white shadow-sm ${getTrafficLightClass(property.trafficLight)}`, title: property.trafficLight || 'Semáforo' }), property.trafficLightReason && (_jsx("span", { className: "ml-2 text-xs text-slate-600", children: property.trafficLightReason }))] })] }), _jsx("h1", { className: "text-3xl font-bold text-slate-800 mt-2", children: property.name }), _jsxs("div", { className: "flex items-center text-md text-slate-500 mt-2", children: [_jsx(LocationIcon, {}), _jsx("span", { className: "ml-2", children: property.address })] }), _jsx("p", { className: "text-3xl font-bold text-orange-600 mt-4", children: new Intl.NumberFormat('en-US', { style: 'currency', currency: property.currency || 'USD', minimumFractionDigits: 0 }).format(property.price) }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-3", children: [_jsxs("button", { onClick: () => setIsDownloadModalOpen(true), disabled: isPreparingDownload, className: "inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-slate-200 disabled:cursor-wait", children: [_jsx(DocumentArrowDownIcon, {}), _jsx("span", { className: "ml-2", children: isPreparingDownload ? 'Preparando...' : 'Descargar Ficha (PDF)' })] }), isCurrentUserAdmin && (_jsxs("button", { onClick: downloadVisitsAsCSV, disabled: isPreparingDownload, className: "inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-slate-200 disabled:cursor-wait", children: [_jsx(DownloadIcon, {}), _jsx("span", { className: "ml-2", children: isPreparingDownload ? 'Preparando...' : 'Descargar Visitas (CSV)' })] }))] })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 bg-white p-6 rounded-lg shadow space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-800 border-b pb-2", children: "Descripción" }), _jsx("p", { className: "mt-3 text-slate-600 whitespace-pre-wrap", children: property.description })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-800 border-b pb-2", children: "Detalles" }), _jsxs("div", { className: "mt-4 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6", children: [_jsx(DetailItem, { label: "Tipo", value: property.propertyType }), _jsx(DetailItem, { label: "Habitaciones", value: property.bedrooms }), _jsx(DetailItem, { label: "Baños", value: property.bathrooms }), _jsx(DetailItem, { label: "Superficie Total", value: `${property.squareMeters} m²` }), _jsx(DetailItem, { label: "Superficie Construida", value: `${property.builtSquareMeters} m²` })] })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-800 border-b pb-2", children: "Galería de Imágenes" }), (property.gallery || []).length > 0 ? (_jsx("div", { className: "mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4", children: (property.gallery || []).map((image, index) => (_jsx("a", { href: image.url, target: "_blank", rel: "noopener noreferrer", className: "group block", children: _jsx("img", { src: image.url, alt: image.name || `Imagen de galería ${index + 1}`, className: "h-32 w-full object-cover rounded-lg shadow-md group-hover:opacity-80 group-hover:ring-2 group-hover:ring-orange-500 transition" }) }, index))) })) : (_jsx("p", { className: "mt-3 text-sm text-slate-500", children: "No hay imágenes en la galería." }))] }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-800 border-b pb-2", children: "Documentos" }), (property.propertyDocuments || []).length > 0 ? (_jsx("ul", { className: "mt-3 space-y-2", children: (property.propertyDocuments || []).map((doc, index) => (_jsx("li", { children: _jsxs("a", { href: doc.url, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center p-2 rounded-md hover:bg-slate-50 group w-full text-left", children: [_jsx(DocumentIcon, {}), _jsx("span", { className: "text-sm font-medium text-slate-700 group-hover:text-orange-600", children: doc.name })] }) }, index))) })) : (_jsx("p", { className: "mt-3 text-sm text-slate-500", children: "No hay documentos adjuntos." }))] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-800 border-b pb-2 mb-4", children: "Ubicación" }), _jsx("div", { className: "h-64 w-full rounded-md overflow-hidden border", children: _jsx(StaticMapDisplay, { latitude: property.latitude, longitude: property.longitude }) })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-800 border-b pb-2 mb-4", children: "Visitas Programadas" }), _jsx(VisitList, { visits: visits, currentUser: currentUser, users: users, onSelectVisit: onSelectVisit })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-800 border-b pb-2 mb-4", children: "Tareas Asociadas" }), tasks.length > 0 ? (_jsx("ul", { className: "divide-y divide-slate-200", children: tasks.map(task => _jsx(TaskItem, { task: task, users: users, currentUser: currentUser, isCurrentUserAdmin: isCurrentUserAdmin, onOpenVisitEditor: onOpenVisitEditor, onCompleteTask: onCompleteTask }, task.id)) })) : (_jsx("p", { className: "text-slate-500 text-sm p-4 bg-slate-50 rounded-md", children: "No hay tareas asociadas." }))] })] })] }), _jsx(DownloadReportModal, { isOpen: isDownloadModalOpen, onClose: () => setIsDownloadModalOpen(false), onGenerate: handleDownloadPdf }), _jsx(DownloadLinkModal, { isOpen: downloadState.isOpen, onClose: handleCloseDownloadModal, downloadUrl: downloadState.url, filename: downloadState.filename })] }));
};

export default PropertyDetails;
