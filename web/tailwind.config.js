/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7C3AED",
          light: "#A855F7",
        },
        accent: {
          DEFAULT: "#F59E0B",
        },
        success: {
          DEFAULT: "#22C55E",
        },
        danger: {
          DEFAULT: "#EF4444",
        },
        background: {
          DEFAULT: "#FFFFFF",
        },
        surface: {
          DEFAULT: "#F8FAFC",
        },
        border: {
          DEFAULT: "#E5E7EB",
        },
        text: {
          DEFAULT: "#111827",
        },
        secondaryText: {
          DEFAULT: "#6B7280",
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        premium: '0 10px 30px -10px rgba(0,0,0,0.08)',
        card:    '0 4px 20px -2px rgba(0,0,0,0.05)',
      },
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm:       '1.5rem',
        md:       '2rem',
        lg:       '2.5rem',
        xl:       '3rem',
      },
      screens: {
        xl: '1440px',
      },
    },
  },
  plugins: [],
}