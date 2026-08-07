console.log("=== MAIN.JSX STARTING ===");

window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error("GLOBAL ERROR:", msg, "at", url, lineNo);
    document.body.innerHTML = `
        <div style="font-family: sans-serif; padding: 40px; text-align: center; background: #fee;">
            <h1 style="color: #e11d48;">JavaScript Error Detected</h1>
            <p style="color: #64748b;">The application failed to start:</p>
            <pre style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: left; display: inline-block; margin-top: 20px; max-width: 600px; overflow: auto;">
${msg}
At: ${url}:${lineNo}
            </pre>
            <p style="margin-top: 20px;"><button onclick="location.reload()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">Reload Application</button></p>
        </div>
    `;
    return false;
};

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { BrowserRouter } from 'react-router-dom'

console.log("=== IMPORTS SUCCESSFUL ===");

try {
    const root = document.getElementById('root');
    if (!root) {
        console.error("ROOT ELEMENT NOT FOUND!");
        document.body.innerHTML = '<div style="padding: 40px; color: red; font-size: 20px;">ERROR: Root element not found!</div>';
        throw new Error('Root element not found');
    }

    console.log("=== ROOT ELEMENT FOUND ===");
    console.log("=== CREATING REACT ROOT ===");

    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <BrowserRouter>
                <AuthProvider>
                    <NotificationProvider>
                        <App />
                    </NotificationProvider>
                </AuthProvider>
            </BrowserRouter>
        </React.StrictMode>,
    )

    console.log("=== REACT RENDER CALLED ===");
} catch (e) {
    console.error("=== CRITICAL RENDER ERROR ===", e);
    document.getElementById('root').innerHTML = `
        <div style="padding: 40px; background: #fee; font-family: sans-serif;">
            <h2 style="color: #e11d48;">React Failed to Initialize</h2>
            <p>Error: ${e.message}</p>
            <pre style="background: #f1f5f9; padding: 10px; border-radius: 4px; overflow: auto;">${e.stack}</pre>
        </div>
    `;
}
