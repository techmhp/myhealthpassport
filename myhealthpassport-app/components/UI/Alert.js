"use client"

import React, { useState, useEffect } from "react";

const AlertMessage = ({ text, type }) => {

    const [message, setMessage] = useState(text);

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ');
    }

    useEffect(() => {
        const timer = setTimeout(() => setMessage(""), 5000); // Remove after 3 seconds
        return () => clearTimeout(timer); // Cleanup on unmount
    }, []);

    return (
        <>
            {message &&
                <div className={classNames(type === "success" ? "bg-green-500" : "bg-red-500", "text-center text-white p-4 rounded")}>
                    <div className="break-words rounded-b-lg">
                        {message}
                    </div>
                </div>
            }
        </>
    )
}

export default AlertMessage;