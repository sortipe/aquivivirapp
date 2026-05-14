import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';

export const CloseIcon = ({ className = "h-5 w-5" }) => (
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
      d: "M6 18L18 6M6 6l12 12"
    })
  })
);