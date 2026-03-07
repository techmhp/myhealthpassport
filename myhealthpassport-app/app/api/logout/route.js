// app/api/logout/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const response = NextResponse.json({ message: 'Logged out' });

    allCookies.forEach(({ name }) => {
        cookieStore.delete(name);
    });

    // Set the cookie to expire in the past
    // response.cookies.delete('role');
    // response.cookies.delete('root');
    // response.cookies.delete('access_token');

    return response;
}
