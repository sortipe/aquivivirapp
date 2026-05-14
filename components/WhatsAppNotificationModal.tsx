
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { CloseIcon } from '@/components/icons/CloseIcon';

const WhatsAppNotificationModal = ({ isOpen, onClose, recipientName, phone, message, associatedPhone }) => {
  if (!isOpen) return null;

  const handleSend = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    _jsx("div", { className: "fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4", onClick: onClose, children: 
      _jsxs("div", { className: "bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden", onClick: e => e.stopPropagation(), children: [
        _jsxs("div", { className: "bg-[#25D366] p-4 flex justify-between items-center", children: [
           _jsxs("h2", { className: "text-white font-bold text-lg flex items-center", children: [
             _jsx("svg", { viewBox: "0 0 24 24", className: "h-6 w-6 mr-2 fill-current", children: 
               _jsx("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 003.68 3.68c-3.253 3.253-3.663 8.229-1.22 12.008L0 24l8.476-2.416a11.82 11.82 0 005.698 1.471h.005c6.554 0 11.89-5.335 11.893-11.89a11.821 11.821 0 00-3.48-8.413Z" })
             }),
             "Notificación WhatsApp"
           ]}),
           _jsx("button", { onClick: onClose, className: "text-white hover:bg-white/20 rounded-full p-1", children: 
             _jsx(CloseIcon, { className: "h-5 w-5" })
           })
        ]}),
        _jsxs("div", { className: "p-6", children: [
           _jsxs("p", { className: "text-slate-700 mb-4", children: [
             "Se han guardado los cambios correctamente. ¿Deseas enviar la notificación a ", _jsx("strong", { children: recipientName }), "?"
           ]}),
           _jsx("div", { className: "bg-slate-50 p-4 rounded-md border border-slate-200 text-sm text-slate-600 mb-3 max-h-40 overflow-y-auto whitespace-pre-wrap", children: 
             message
           }),
           associatedPhone && (
             _jsxs("p", { className: "text-sm text-slate-500 mb-6 text-right", children: [
                 "Teléfono del Contacto: ", _jsx("strong", { children: associatedPhone })
             ]})
           ),
           _jsxs("div", { className: "flex justify-end space-x-3", children: [
             _jsx("button", { onClick: onClose, className: "px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium transition-colors", children: 
               "No enviar"
             }),
             _jsx("button", { onClick: handleSend, className: "px-4 py-2 bg-[#25D366] text-white rounded-md font-bold hover:bg-[#20b85c] transition-colors flex items-center shadow-sm", children: 
               "Enviar Mensaje"
             })
           ]})
        ]})
      ]})
    })
  );
};

export default WhatsAppNotificationModal;
