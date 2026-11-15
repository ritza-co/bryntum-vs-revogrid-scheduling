import { defineConfig } from 'vite';

export default defineConfig({
    optimizeDeps : {
        include : ['@bryntum/scheduler-enterprise']
    }
});
