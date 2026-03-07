import React from "react";

const CircularProgress = ({ percentage }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progress = ((100 - percentage) / 100) * circumference;

    return (
        <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#E6EFFF"
                strokeWidth="12"
                fill="none"
            />
            <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#5389FF"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={progress}
                strokeLinecap="round"
            />
        </svg>
    );
};

export default CircularProgress;
