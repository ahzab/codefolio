/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./src/**/*.{html,ts}",
    ],
    corePlugins: {
        // We define our own .container in src/styles/partials/_base.scss
        // (max-w-6xl + responsive horizontal padding). Tailwind's default
        // .container component would otherwise win by source order and
        // collapse the page to its own responsive widths.
        container: false,
    },
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['"Instrument Serif"', 'Georgia', 'serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
        },
    },
    plugins: [],
}