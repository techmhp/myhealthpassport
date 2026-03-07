// app/not-found.js
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
            <h1 className="text-6xl font-bold text-black-500">404 Error</h1>
            <p className="text-xl text-gray-700 mt-4">Oops! Page Not Found</p>
            <p className="text-gray-500 mt-2">The page you're looking for doesn't exist.</p>
            <Link href="/" className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Go Home
            </Link>
        </div>
    );
}