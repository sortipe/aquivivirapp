import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';

export const CalendarIcon = ({ className = "h-4 w-4 text-slate-400" }) => (
  _jsx("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    children: _jsx("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    })
  })
);