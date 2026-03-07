// tailwind.config.js

// 1. Create/Modify your tailwind.config.js file
module.exports = {
    theme: {
        extend: {
            colors: {
                // Define your company's brand colors here
                // This will override or extend Tailwind's default colors
                indigo: {
                    50: '#eef2ff',  // Lightest shade
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',  // This is the main brand color
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',  // Darkest shade
                    950: '#1e1b4b',
                },
                // Add any other brand colors you need
                // Example:
                brand: {
                    primary: '#YOUR-PRIMARY-COLOR',
                    secondary: '#YOUR-SECONDARY-COLOR',
                    // etc.
                }
            },
            fontFamily: {
                // Define your company's font choices
                sans: ['Your-Brand-Font', 'sans-serif'],
                serif: ['Your-Serif-Font', 'serif'],
                // You can also define specific font families
                brandHeading: ['Your-Heading-Font', 'sans-serif'],
                brandBody: ['Your-Body-Font', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

// 2. Use semantic class names in your components (optional but recommended)
// Example component using semantic class names

const ProfileHeader = () => {
    return (
        // Example component using semantic class names
        <button
            className="rounded-[5px] bg-brand-primary text-white shadow-xs hover:bg-brand-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
            Save changes
        </button>
    )
}

// tailwind.config.js
module.exports = {
    theme: {
        extend: {
            colors: {
                primary: 'var(--color-primary)',
                secondary: 'var(--color-secondary)',
                // etc.
            },
        },
    },
}

// :root {
//     --color-primary: #YOUR-PRIMARY-COLOR;
//     --color-secondary: #YOUR-SECONDARY-COLOR;
//     /* etc. */
//   }