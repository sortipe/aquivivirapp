
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useState, useEffect } from 'react';
import { supabase, formatSupabaseError } from '@/supabaseClient';
import { DownloadIcon } from '@/components/icons/DownloadIcon';
import { UserRole, PropertySaleStatus, Currency } from '@/types';
import DownloadLinkModal from '@/components/DownloadLinkModal';

const ReportCard = ({ title, onDownload, children, isPreparingDownload }) => (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsxs("div", { className: "flex justify-between items-center border-b border-slate-200 pb-3 mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-800", children: title }), _jsxs("button", { onClick: onDownload, disabled: isPreparingDownload, className: "inline-flex items-center px-3 py-1.5 border border-slate-300 text-xs font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 disabled:bg-slate-200 disabled:cursor-wait", children: [_jsx("DownloadIcon", {}), _jsx("span", { className: "ml-2", children: isPreparingDownload ? 'Preparando...' : 'Descargar CSV' })] })] }), _jsx("div", { className: "max-h-64 overflow-y-auto pr-2", children: children })] }));

const Reports = ({ properties, visits, users }) => {
    const [downloadState, setDownloadState] = useState({ isOpen: false, url: '', filename: '' });
    const [isPreparingDownload, setIsPreparingDownload] = useState(false);

    const handleCloseDownloadModal = () => {
        setDownloadState({ isOpen: false, url: '', filename: '' });
    };

    const handleDownloadRequest = async (data, filename) => {
        if (!data || data.length === 0) {
            alert("No hay datos para descargar.");
            return;
        }

        setIsPreparingDownload(true);
        try {
            const headers = Object.keys(data[0]);
            // Changed to comma ',' as per user request for better column separation in their Excel version
            const separator = ',';
            
            const csvRows = [
                headers.join(separator),
                ...data.map(row => headers.map(header => {
                    const value = String(row[header] === null || row[header] === undefined ? '' : row[header]);
                    // Escapar comillas dobles
                    const escaped = value.replace(/"/g, '""');
                    // Envolver valores en comillas
                    return `"${escaped}"`;
                }).join(separator))
            ];
            
            // Agregar BOM para soporte UTF-8 (tildes y ñ)
            const csvString = `\uFEFF${csvRows.join('\n')}`;
            const csvBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const fullFilename = `${filename}.csv`;
            const filePath = `downloads/${Date.now()}-${fullFilename}`;
            
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
                filename: fullFilename
            });
        } catch (error: any) {
             alert(`Error al preparar el reporte CSV: ${formatSupabaseError(error) || error.message}`);
        } finally {
            setIsPreparingDownload(false);
        }
    };

    const propertyMap = useMemo(() => new Map(properties.map(p => [p.id, p.name])), [properties]);

    const visitsPerProperty = useMemo(() => {
        const counts = new Map();
        visits.forEach(visit => {
            counts.set(visit.propertyId, (counts.get(visit.propertyId) || 0) + 1);
        });
        return Array.from(counts.entries())
            .map(([propertyId, count]) => ({
            'Propiedad': propertyMap.get(propertyId) || `ID: ${propertyId}`,
            'Cantidad de Visitas': count,
        }))
            .sort((a, b) => b['Cantidad de Visitas'] - a['Cantidad de Visitas']);
    }, [visits, propertyMap]);
    
    // Data for the UI List AND CSV (Aggregated Count + Amounts + Details)
    const salesPerWorkerSummary = useMemo(() => {
        const workerMap = new Map(users.filter(u => u.role === UserRole.WORKER).map(w => [w.id, w.name]));
        const salesData = new Map<string, { count: number, totalUSD: number, totalPEN: number, properties: string[] }>();

        properties.forEach(property => {
            if (property.status === PropertySaleStatus.SOLD && property.sold_by_worker_id) {
                const current = salesData.get(property.sold_by_worker_id) || { count: 0, totalUSD: 0, totalPEN: 0, properties: [] };
                
                current.count += 1;
                
                const price = property.price || 0;
                if (property.currency === Currency.PEN) {
                    current.totalPEN += price;
                } else {
                    current.totalUSD += price;
                }
                
                // Add formatted property detail
                current.properties.push(`${property.name} (ID: ${property.propertyIdNumber})`);
                
                salesData.set(property.sold_by_worker_id, current);
            }
        });

        return Array.from(salesData.entries())
            .map(([workerId, data]) => ({
                'Trabajador': workerMap.get(workerId) || `ID Desconocido: ${workerId}`,
                'Ventas Realizadas': data.count,
                'Monto Total (USD)': data.totalUSD > 0 ? data.totalUSD : 0,
                'Monto Total (PEN)': data.totalPEN > 0 ? data.totalPEN : 0,
                'Detalle Propiedades': data.properties.join(' | ')
            }))
            .sort((a, b) => b['Ventas Realizadas'] - a['Ventas Realizadas']);
    }, [properties, users]);

    // Helper to format currency for display
    const formatMoney = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: currency, 
            maximumFractionDigits: 0 
        }).format(amount);
    };

    const visitsToCloseRatio = useMemo(() => {
        if (visits.length === 0)
            return { 'Métrica': 'Visitas Promedio por Propiedad Visitada', 'Valor': 'N/A' };
        const visitedProperties = new Set(visits.map(v => v.propertyId));
        const ratio = (visits.length / visitedProperties.size).toFixed(2);
        return { 'Métrica': 'Visitas Promedio por Propiedad Visitada', 'Valor': ratio };
    }, [visits]);

    const visitsPerMonth = useMemo(() => {
        const counts = new Map();
        visits.forEach(visit => {
            const month = new Date(visit.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            counts.set(month, (counts.get(month) || 0) + 1);
        });
        return Array.from(counts.entries()).map(([month, count]) => ({
            'Mes': month.charAt(0).toUpperCase() + month.slice(1),
            'Total de Visitas': count,
        }));
    }, [visits]);

    const mostVisitedPropertyPerMonth = useMemo(() => {
        const visitsByMonth = new Map();
        visits.forEach(visit => {
            const month = new Date(visit.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            if (!visitsByMonth.has(month))
                visitsByMonth.set(month, []);
            visitsByMonth.get(month)?.push(visit);
        });
        const result = [];
        visitsByMonth.forEach((monthVisits, month) => {
            const propertyCounts = new Map();
            monthVisits.forEach(visit => {
                propertyCounts.set(visit.propertyId, (propertyCounts.get(visit.propertyId) || 0) + 1);
            });
            const mostVisited = Array.from(propertyCounts.entries()).sort((a, b) => b[1] - a[1])[0];
            if (mostVisited) {
                result.push({
                    'Mes': month.charAt(0).toUpperCase() + month.slice(1),
                    'Propiedad más Visitada': propertyMap.get(mostVisited[0]) || `ID: ${mostVisited[0]}`,
                    'Cantidad de Visitas': mostVisited[1],
                });
            }
        });
        return result;
    }, [visits, propertyMap]);

    const visitsByDayOfWeek = useMemo(() => {
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const counts = new Array(7).fill(0);
        visits.forEach(visit => {
            // getDay() returns 0 for Sunday, we adjust it to be Monday-first (0-6)
            const dayIndex = (new Date(visit.date).getDay() + 6) % 7;
            counts[dayIndex]++;
        });
        return dayNames.map((day, index) => ({
            'Día de la Semana': day,
            'Total de Visitas': counts[index],
        }));
    }, [visits]);

    const DataList = ({ data }) => (_jsx("ul", { className: "divide-y divide-slate-100", children: data.map((item, index) => (_jsxs("li", { className: "flex justify-between items-center py-2 text-sm", children: [_jsx("span", { className: "text-slate-600 truncate pr-4", children: Object.values(item)[0] }), _jsx("span", { className: "font-semibold text-slate-800 flex-shrink-0", children: Object.values(item)[1] })] }, index))) }));

    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-3xl font-bold text-slate-800", children: "Centro de Reportes" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
        _jsx(ReportCard, { 
            title: "Ventas por Trabajador", 
            onDownload: () => handleDownloadRequest(salesPerWorkerSummary, 'ventas_por_trabajador_resumen'), 
            isPreparingDownload: isPreparingDownload, 
            children: salesPerWorkerSummary.length > 0 ? (
                _jsx("ul", { className: "divide-y divide-slate-100", children: salesPerWorkerSummary.map((item, index) => (
                    _jsxs("li", { className: "flex flex-col py-3 text-sm border-b border-slate-50 last:border-0", children: [
                        _jsxs("div", { className: "flex justify-between items-start", children: [
                            _jsx("span", { className: "text-slate-600 font-medium truncate pr-4", children: item['Trabajador'] }),
                            _jsxs("div", { className: "text-right flex flex-col items-end", children: [
                                _jsxs("span", { className: "font-bold text-slate-800", children: [item['Ventas Realizadas'], " ventas"] }),
                                _jsxs("span", { className: "text-xs text-slate-500", children: [
                                    item['Monto Total (USD)'] > 0 && formatMoney(item['Monto Total (USD)'], 'USD'),
                                    item['Monto Total (USD)'] > 0 && item['Monto Total (PEN)'] > 0 && ' + ',
                                    item['Monto Total (PEN)'] > 0 && formatMoney(item['Monto Total (PEN)'], 'PEN')
                                ] })
                            ]})
                        ]}),
                        item['Detalle Propiedades'] && (
                            _jsxs("div", { className: "mt-2 pl-2 border-l-2 border-slate-200", children: [
                                _jsx("p", { className: "text-xs font-semibold text-slate-500 mb-1", children: "Propiedades:" }),
                                _jsx("ul", { className: "text-xs text-slate-600 space-y-0.5", children: 
                                    item['Detalle Propiedades'].split(' | ').map((prop, i) => (
                                        _jsx("li", { children: prop }, i)
                                    ))
                                })
                            ]})
                        )
                    ] }, index)
                )) })
            ) : (
                _jsx("p", { className: "text-slate-500 text-sm", children: "No hay datos de ventas registradas." }) 
            ) 
        }), 
        _jsx(ReportCard, { title: "Cantidad de Visitas por Propiedad", onDownload: () => handleDownloadRequest(visitsPerProperty, 'visitas_por_propiedad'), isPreparingDownload: isPreparingDownload, children: visitsPerProperty.length > 0 ? _jsx(DataList, { data: visitsPerProperty }) : _jsx("p", { className: "text-slate-500 text-sm", children: "No hay datos de visitas." }) }), _jsx(ReportCard, { title: "Visitas por Día de la Semana", onDownload: () => handleDownloadRequest(visitsByDayOfWeek, 'visitas_por_dia_semana'), isPreparingDownload: isPreparingDownload, children: _jsx(DataList, { data: visitsByDayOfWeek }) }), _jsx(ReportCard, { title: "Visitas Totales por Mes", onDownload: () => handleDownloadRequest(visitsPerMonth, 'visitas_totales_por_mes'), isPreparingDownload: isPreparingDownload, children: visitsPerMonth.length > 0 ? _jsx(DataList, { data: visitsPerMonth }) : _jsx("p", { className: "text-slate-500 text-sm", children: "No hay datos de visitas." }) }), _jsx(ReportCard, { title: "Propiedad más Visitada por Mes", onDownload: () => handleDownloadRequest(mostVisitedPropertyPerMonth, 'propiedad_mas_visitada_por_mes'), isPreparingDownload: isPreparingDownload, children: mostVisitedPropertyPerMonth.length > 0 ? (_jsx("ul", { className: "divide-y divide-slate-100", children: mostVisitedPropertyPerMonth.map((item, index) => (_jsxs("li", { className: "py-2 text-sm", children: [_jsx("p", { className: "text-slate-600 font-medium", children: item.Mes }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-slate-600 truncate pr-4", children: item['Propiedad más Visitada'] }), _jsxs("span", { className: "font-semibold text-slate-800 flex-shrink-0", children: [item['Cantidad de Visitas'], " visitas"] })] })] }, index))) })) : _jsx("p", { className: "text-slate-500 text-sm", children: "No hay datos de visitas." }) }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow lg:col-span-2", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-800 mb-2", children: "Métrica Clave" }), _jsxs("div", { className: "flex justify-between items-center bg-orange-50 p-4 rounded-md border border-orange-200", children: [_jsx("p", { className: "font-medium text-orange-800", children: visitsToCloseRatio.Métrica }), _jsx("p", { className: "text-2xl font-bold text-orange-900", children: visitsToCloseRatio.Valor })] }), _jsx("p", { className: "text-xs text-slate-500 mt-2", children: "Esta métrica indica cuántas visitas se necesitan en promedio para las propiedades que han sido visitadas. Un número más bajo es generalmente mejor." })] })] }), _jsx(DownloadLinkModal, { isOpen: downloadState.isOpen, onClose: handleCloseDownloadModal, downloadUrl: downloadState.url, filename: downloadState.filename })] }));
};

export default Reports;
