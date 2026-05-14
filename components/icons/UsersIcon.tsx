
import { jsx as _jsx } from "react/jsx-runtime";
// FIX: Implemented component to resolve module error and provide an icon.
import React from 'react';
// FIX: Update component to accept a className prop to resolve type error.
export const UsersIcon = ({ className = "h-6 w-6" }) => (_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" }) }));
