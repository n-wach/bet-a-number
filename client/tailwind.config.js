module.exports = {
  content: [
      "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  purge: {
    options: {
      safelist: [
          "text-amber-400",
          "border-amber-400",
          "text-indigo-600",
          "border-indigo-600",
          "text-gray-400",
          "border-gray-400",
      ]
    }
  }
}
