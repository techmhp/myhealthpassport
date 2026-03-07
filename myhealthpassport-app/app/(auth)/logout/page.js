"use client"

import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation';

function Logout() {
    const router = useRouter();
    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' });
        router.push('/')
    };
    useEffect(() => {
        localStorage.clear();
        handleLogout();
    }, []);
    return (
        <>
            <Head>
                <title>Logout</title>
                <link rel='manifest' href='/manifest.json' />
            </Head>
        </>
    )
}

export default Logout
