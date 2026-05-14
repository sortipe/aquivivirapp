import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';

export const ArrowLeftIcon = ({ className = "h-5 w-5 text-slate-500 group-hover:text-orange-600 transition" }) => (
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
      d: "M10 19l-7-7m0 0l7-7m-7 7h18"
    })
  })
);