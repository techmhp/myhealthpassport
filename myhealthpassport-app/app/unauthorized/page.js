import Link from "next/link";

export default function Unauthorized() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
            <h1 className="text-6xl font-bold text-red-500">501 Error</h1>
            <p className="text-xl text-gray-700 mt-4">🚫 Oops! Unauthorized Route</p>
            <p className="text-gray-500 mt-2">Please check back later or contact support.</p>
            <Link href="/" className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Go Home
            </Link>
        </div>
    );
}