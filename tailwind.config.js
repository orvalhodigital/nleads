/** @type {import('tailwindcss').Config} */
const orvalhoPalette = {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c084fc',
    400: '#a855f7',
    500: '#8b5cf6', // Primary Orvalho Purple
    600: '#7c3aed', // Active / Hover
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
};

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                slideIn: {
                    from: { transform: 'translateX(100%)', opacity: '0' },
                    to: { transform: 'translateX(0)', opacity: '1' }
                },
                fadeUp: {
                    from: { transform: 'translateY(20px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' }
                }
            },
            animation: {
                slideIn: 'slideIn 0.3s ease-out',
                fadeUp: 'fadeUp 0.5s ease-out'
            },
            colors: {
                // User defined brand palette
                brand: {
                    green: '#8b5cf6', // mapped to purple
                    lightgreen: '#c084fc', // mapped to light purple
                    blue: '#7c3aed', // mapped to dark purple
                    highlight: '#DCFC36', // Yellow/Lime
                    grey: '#D1D1D1', // Grey
                },
                // Mapping standard utility classes to brand colors for instant uptake
                emerald: orvalhoPalette,
                teal: orvalhoPalette,
                // Map blue/indigo utils if used to Orvalho Digital palette
                indigo: {
                    ...require('tailwindcss/colors').indigo,
                    ...orvalhoPalette,
                },
                // Map yellow/lime utils
                lime: {
                    ...require('tailwindcss/colors').lime,
                    400: '#DCFC36', // User's Highlight
                    500: '#c5e32d',
                }
            },
        },
    },
    plugins: [],
}
