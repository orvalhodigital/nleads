/** @type {import('tailwindcss').Config} */
const orvalhoPalette = {
    50: '#f2faf9',
    100: '#e6f5f3',
    200: '#bfe2dd',
    300: '#73bdaf',
    400: '#62b3a5',
    500: '#57a89a', // Primary Orvalho Digital
    600: '#45857a', // Active / Hover
    700: '#34635b',
    800: '#254842',
    900: '#182f2b',
    950: '#0c1816',
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
                    green: '#57a89a', // Primary Orvalho Digital
                    lightgreen: '#73bdaf', // Light Green / Accent
                    blue: '#45857a', // Active state / Blue substitute
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
