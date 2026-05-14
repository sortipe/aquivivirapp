// This utility function checks the browser's user agent string to determine
// if the web app is running inside the specific WebView used by AppCreator24.
// This is crucial for applying workarounds for environment-specific bugs,
// such as the file input issue on mobile APKs.
export const isAppCreator = (): boolean => {
    return navigator.userAgent.includes('AppCreator24');
};
