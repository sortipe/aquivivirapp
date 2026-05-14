
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ExclamationTriangleIcon } from '@/components/icons/ExclamationTriangleIcon';

const NetworkErrorOverlay = ({ message }: { message: string }) => {
  return (
    _jsx("div", {
      className: "fixed inset-0 bg-slate-900 bg-opacity-95 z-50 flex flex-col items-center justify-center p-8",
      role: "alert",
      "aria-live": "assertive",
      children: _jsxs("div", {
        className: "bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8 text-center",
        children: [
          _jsx("div", {
            className: "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100",
            children: _jsx(ExclamationTriangleIcon, { className: "h-10 w-10 text-red-500" })
          }),
          _jsx("h1", {
            className: "mt-6 text-2xl font-bold text-slate-900",
            children: "Error de Conexión"
          }),
          _jsx("p", {
            className: "mt-4 text-left text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-md border border-slate-200",
            children: message
          }),
          _jsx("p", {
            className: "mt-6 text-sm text-slate-500",
            children: "Por favor, siga las instrucciones para resolver el problema y luego recargue la página."
          })
        ]
      })
    })
  );
};

export default NetworkErrorOverlay;