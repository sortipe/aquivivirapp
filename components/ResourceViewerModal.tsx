import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { ResourceType } from '@/types';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { ArrowTopRightOnSquareIcon } from '@/components/icons/ArrowTopRightOnSquareIcon';

const ResourceViewerModal = ({ isOpen, onClose, resource, onMarkAsViewed }) => {
    useEffect(() => {
        if (isOpen && resource) {
            onMarkAsViewed(resource.id);
        }
    }, [isOpen, resource, onMarkAsViewed]);

    if (!isOpen)
        return null;

    const getYoutubeEmbedUrl = (url) => {
        let videoId = null;
        const youtubeRegex = /^(?:https-?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(youtubeRegex);
        if (match && match[1]) {
            videoId = match[1];
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    };

    const renderContent = () => {
        const embedUrl = resource.type === ResourceType.VIDEO ? getYoutubeEmbedUrl(resource.url) : null;
        switch (resource.type) {
            case ResourceType.VIDEO:
                if (embedUrl) {
                    return _jsx("iframe", {
                        className: "w-full aspect-video border-0 rounded-lg",
                        src: embedUrl,
                        title: resource.title,
                        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                        allowFullScreen: true
                    });
                }
                return _jsxs("div", {
                    className: "text-center p-4 bg-slate-100 rounded-lg",
                    children: [
                        _jsx("p", { className: "text-slate-700", children: "No se pudo cargar el video. Puedes verlo directamente." }),
                        _jsxs("a", {
                            href: resource.url,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            className: "inline-flex items-center mt-2 text-orange-600 hover:underline",
                            children: ["Ver video ", _jsx(ArrowTopRightOnSquareIcon, {})]
                        })
                    ]
                });
            case ResourceType.DOCUMENT:
                // Assuming browsers can handle PDFs and other common document types in an iframe
                return _jsx("iframe", {
                    className: "w-full h-[60vh] border rounded-lg",
                    src: resource.url,
                    title: resource.title
                });
            case ResourceType.LINK:
                return _jsxs("div", {
                    className: "text-center p-8 bg-slate-50 rounded-lg",
                    children: [
                        _jsx("p", { className: "text-slate-700 mb-4", children: "Este recurso es un enlace a un sitio externo." }),
                        _jsxs("a", {
                            href: resource.url,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            className: "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600",
                            children: ["Abrir Enlace", _jsx("span", { className: "ml-2", children: _jsx(ArrowTopRightOnSquareIcon, {}) })]
                        })
                    ]
                });
            default:
                return _jsx("p", { children: "Tipo de recurso no soportado." });
        }
    };

    return (_jsx("div", {
        className: "fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4",
        onClick: onClose,
        children: _jsxs("div", {
            className: "bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col",
            onClick: e => e.stopPropagation(),
            children: [
                _jsxs("div", {
                    className: "p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0",
                    children: [
                        _jsxs("div", {
                            className: "min-w-0",
                            children: [
                                _jsx("h2", { className: "text-xl font-bold text-slate-800 truncate", children: resource.title }),
                                _jsx("p", { className: "text-sm text-slate-500", children: resource.description })
                            ]
                        }),
                        _jsx("button", {
                            onClick: onClose,
                            className: "p-2 rounded-full text-slate-500 hover:bg-slate-100 ml-4 flex-shrink-0",
                            "aria-label": "Cerrar modal",
                            children: _jsx(CloseIcon, {})
                        })
                    ]
                }),
                _jsx("div", { className: "p-6 overflow-y-auto flex-grow", children: renderContent() }),
                _jsx("div", {
                    className: "p-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0",
                    children: _jsx("button", {
                        onClick: onClose,
                        className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50",
                        children: "Cerrar"
                    })
                })
            ]
        })
    }));
};
export default ResourceViewerModal;
