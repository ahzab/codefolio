/** @type {import('tailwindcss').Config} */
export default {
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
                sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
                dot: ['Doto', '"Geist Mono"', 'monospace'],
            },
        },
    },
    plugins: [],
}