import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';

export const ClockIcon = ({ className = "h-4 w-4 text-slate-400" }) => (
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
      d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    })
  })
);