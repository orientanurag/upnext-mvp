/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-black': '#0B0B0B',
                'brand-lime': '#D4F23F',
                'brand-gray': '#1A1A1A'
            },
            fontFamily: {
                mono: ['monospace'] // Placeholder, would load distinct font
            }
        },
    },
    plugins: [],
}
