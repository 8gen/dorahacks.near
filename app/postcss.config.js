module.exports = {
    plugins: {
        autoprefixer: {},
        tailwindcss: {},
        cssnano: {
            preset: [
                "default",
                {
                    discardComments: {
                        removeAll: true,
                    },
                },
            ],
        },
    }
}
