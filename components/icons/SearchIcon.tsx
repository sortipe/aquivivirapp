import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';

export const SearchIcon = ({ className = "h-5 w-5 text-slate-400" }) => (
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
      d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    })
  })
);