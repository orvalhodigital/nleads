/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // User defined brand palette
                brand: {
                    green: '#088253', // Primary
                    lightgreen: '#6EF0BE', // Light Green
                    blue: '#4165E8', // Blue
                    highlight: '#DCFC36', // Yellow/Lime
                    grey: '#D1D1D1', // Grey
                },
                // Mapping standard utility classes to brand colors for instant uptake
                emerald: {
                    50: '#f0fdf7', // Keep standard for very light bg
                    100: '#dbfceb',
                    200: '#aff8d8',
                    300: '#6EF0BE', // User's Light Green
                    400: '#2dcc8e', // Generated intermediate
                    500: '#088253', // User's Primary Green
                    600: '#056b44', // Darker shade
                    700: '#045536',
                    800: '#06432c',
                    900: '#063724',
                    950: '#021f14',
                },
                // Map blue utils if used
                indigo: {
                    ...require('tailwindcss/colors').indigo,
                    500: '#4165E8', // User's Blue
                    600: '#3553bf', // Darker User Blue
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
