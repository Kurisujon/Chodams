import React from 'react'
import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'Laravel';

function AppWithLoading({ children }) {
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const start = () => setLoading(true);
        const finish = () => setLoading(false);

        router.on('start', start);
        router.on('finish', finish);
        router.on('error', finish);
        router.on('invalid', finish);

        return () => {
            router.off('start', start);
            router.off('finish', finish);
            router.off('error', finish);
            router.off('invalid', finish);
        };
    }, []);

    return (
        <>
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl px-8 py-7 sm:px-10 sm:py-8 flex flex-col items-center gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                            <div className="absolute inset-2 rounded-full bg-emerald-50 flex items-center justify-center">
                                <img src="/icons/appicon3.png" alt="CHoDaMS" className="w-7 h-7 rounded-lg" />
                            </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-800 tracking-wide">Please wait...</div>
                    </div>
                </div>
            )}
            {children}
        </>
    );
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <AppWithLoading>
                <App {...props} />
            </AppWithLoading>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
