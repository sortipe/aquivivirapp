import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';

const StaticMapDisplay = ({ latitude, longitude }) => {
    // Construct the Google Maps embed URL
    const mapSrc = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

    return (_jsx("div", { className: "h-full w-full bg-slate-200", children: _jsx("iframe", { title: "Property Location", className: "w-full h-full border-0", loading: "lazy", allowFullScreen: true, referrerPolicy: "no-referrer-when-downgrade", src: mapSrc }) }));
};

export default StaticMapDisplay;
