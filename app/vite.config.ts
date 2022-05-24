import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default ({mode}) => {
    require('dotenv').config({ path: `./.env.${mode}` });
    return defineConfig({
        server: {
            port: 3010,
            hmr: {
                // clientPort: 443
            }
        },
        define: {
            "global": {},
            "process": {"env": {"NEAR_ENV": process.env.NEAR_ENV}},
        },
        plugins: [react()]
    })
}
