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
                'brand-gray': '#1A1A1A',
                'brand-gray-light': '#2A2A2A'
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                heading: ['Space Grotesk', 'Inter', 'sans-serif'],
                mono: ['monospace']
            },
            animation: {
                'fadeIn': 'fadeIn 0.5s ease-out',
                'slideUp': 'slideUp 0.6s ease-out',
                'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
                'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite'
            },
            keyframes: {
                fadeIn: {
                    'from': { opacity: '0', transform: 'translateY(10px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' }
                },
                slideUp: {
                    'from': { opacity: '0', transform: 'translateY(20px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' }
                },
                'pulse-slow': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' }
                },
                'bounce-gentle': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' }
                }
            }
        },
    },
    plugins: [],
}
