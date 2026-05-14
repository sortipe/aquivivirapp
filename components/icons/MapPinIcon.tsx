import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';

export const MapPinIcon = ({ className = "h-4 w-4 mr-1 text-slate-400 group-hover:text-orange-500 transition-colors" }) => (
  _jsxs("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: [
      _jsx("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      }),
      _jsx("path", {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      })
    ]
  })
);