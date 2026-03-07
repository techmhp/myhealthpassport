"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const Loader = () => (
    <div role="status" className="absolute -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2">
        <div className="w-full mx-auto font-sans">
            <div className="text-center">
                <div className="inline-flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Loading...</span>
                </div>
            </div>
        </div>
    </div>

);

const Spinner = ({ status }) => {

    const router = useRouter();
    const [loading, setLoading] = useState({ status });

    useEffect(() => {
        const handleStart = (url) => setLoading(true);
        const handleComplete = (url) => setLoading(false);

        router.events?.on('routeChangeStart', handleStart);
        router.events?.on('routeChangeComplete', handleComplete);
        router.events?.on('routeChangeError', handleComplete);

        return () => {
            router.events?.off('routeChangeStart', handleStart);
            router.events?.off('routeChangeComplete', handleComplete);
            router.events?.off('routeChangeError', handleComplete);
        };
    }, [router]);

    return loading ? <Loader /> : null;
}
export default Spinner;
