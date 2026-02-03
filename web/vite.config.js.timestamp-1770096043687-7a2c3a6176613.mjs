// vite.config.js
import react from "file:///D:/Python/anti/new-api-radical/web/node_modules/@vitejs/plugin-react/dist/index.js";
import { defineConfig, transformWithEsbuild } from "file:///D:/Python/anti/new-api-radical/web/node_modules/vite/dist/node/index.js";
import pkg from "file:///D:/Python/anti/new-api-radical/web/node_modules/@douyinfe/vite-plugin-semi/lib/index.js";
import path from "path";
import { codeInspectorPlugin } from "file:///D:/Python/anti/new-api-radical/web/node_modules/code-inspector-plugin/dist/index.mjs";
var __vite_injected_original_dirname = "D:\\Python\\anti\\new-api-radical\\web";
var { vitePluginSemi } = pkg;
var vite_config_default = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  plugins: [
    codeInspectorPlugin({
      bundler: "vite"
    }),
    {
      name: "treat-js-files-as-jsx",
      async transform(code, id) {
        if (!/src\/.*\.js$/.test(id)) {
          return null;
        }
        return transformWithEsbuild(code, id, {
          loader: "jsx",
          jsx: "automatic"
        });
      }
    },
    react(),
    vitePluginSemi({
      cssLayer: true
    })
  ],
  optimizeDeps: {
    force: true,
    esbuildOptions: {
      loader: {
        ".js": "jsx",
        ".json": "json"
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-core": ["react", "react-dom", "react-router-dom"],
          "semi-ui": ["@douyinfe/semi-icons", "@douyinfe/semi-ui"],
          tools: ["axios", "history", "marked"],
          "react-components": [
            "react-dropzone",
            "react-fireworks",
            "react-telegram-login",
            "react-toastify",
            "react-turnstile"
          ],
          i18n: [
            "i18next",
            "react-i18next",
            "i18next-browser-languagedetector"
          ]
        }
      }
    }
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      },
      "/mj": {
        target: "http://localhost:3000",
        changeOrigin: true
      },
      "/pg": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQeXRob25cXFxcYW50aVxcXFxuZXctYXBpLXJhZGljYWxcXFxcd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxQeXRob25cXFxcYW50aVxcXFxuZXctYXBpLXJhZGljYWxcXFxcd2ViXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9QeXRob24vYW50aS9uZXctYXBpLXJhZGljYWwvd2ViL3ZpdGUuY29uZmlnLmpzXCI7LypcclxuQ29weXJpZ2h0IChDKSAyMDI1IFF1YW50dW1Ob3VzXHJcblxyXG5UaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBBZmZlcm8gR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhc1xyXG5wdWJsaXNoZWQgYnkgdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGVcclxuTGljZW5zZSwgb3IgKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcblRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuIFNlZSB0aGVcclxuR05VIEFmZmVybyBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgQWZmZXJvIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uIElmIG5vdCwgc2VlIDxodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcblxyXG5Gb3IgY29tbWVyY2lhbCBsaWNlbnNpbmcsIHBsZWFzZSBjb250YWN0IHN1cHBvcnRAcXVhbnR1bW5vdXMuY29tXHJcbiovXHJcblxyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIHRyYW5zZm9ybVdpdGhFc2J1aWxkIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCBwa2cgZnJvbSAnQGRvdXlpbmZlL3ZpdGUtcGx1Z2luLXNlbWknO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgY29kZUluc3BlY3RvclBsdWdpbiB9IGZyb20gJ2NvZGUtaW5zcGVjdG9yLXBsdWdpbic7XHJcbmNvbnN0IHsgdml0ZVBsdWdpblNlbWkgfSA9IHBrZztcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICBjb2RlSW5zcGVjdG9yUGx1Z2luKHtcclxuICAgICAgYnVuZGxlcjogJ3ZpdGUnLFxyXG4gICAgfSksXHJcbiAgICB7XHJcbiAgICAgIG5hbWU6ICd0cmVhdC1qcy1maWxlcy1hcy1qc3gnLFxyXG4gICAgICBhc3luYyB0cmFuc2Zvcm0oY29kZSwgaWQpIHtcclxuICAgICAgICBpZiAoIS9zcmNcXC8uKlxcLmpzJC8udGVzdChpZCkpIHtcclxuICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVXNlIHRoZSBleHBvc2VkIHRyYW5zZm9ybSBmcm9tIHZpdGUsIGluc3RlYWQgb2YgZGlyZWN0bHlcclxuICAgICAgICAvLyB0cmFuc2Zvcm1pbmcgd2l0aCBlc2J1aWxkXHJcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybVdpdGhFc2J1aWxkKGNvZGUsIGlkLCB7XHJcbiAgICAgICAgICBsb2FkZXI6ICdqc3gnLFxyXG4gICAgICAgICAganN4OiAnYXV0b21hdGljJyxcclxuICAgICAgICB9KTtcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICByZWFjdCgpLFxyXG4gICAgdml0ZVBsdWdpblNlbWkoe1xyXG4gICAgICBjc3NMYXllcjogdHJ1ZSxcclxuICAgIH0pLFxyXG4gIF0sXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBmb3JjZTogdHJ1ZSxcclxuICAgIGVzYnVpbGRPcHRpb25zOiB7XHJcbiAgICAgIGxvYWRlcjoge1xyXG4gICAgICAgICcuanMnOiAnanN4JyxcclxuICAgICAgICAnLmpzb24nOiAnanNvbicsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAncmVhY3QtY29yZSc6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcclxuICAgICAgICAgICdzZW1pLXVpJzogWydAZG91eWluZmUvc2VtaS1pY29ucycsICdAZG91eWluZmUvc2VtaS11aSddLFxyXG4gICAgICAgICAgdG9vbHM6IFsnYXhpb3MnLCAnaGlzdG9yeScsICdtYXJrZWQnXSxcclxuICAgICAgICAgICdyZWFjdC1jb21wb25lbnRzJzogW1xyXG4gICAgICAgICAgICAncmVhY3QtZHJvcHpvbmUnLFxyXG4gICAgICAgICAgICAncmVhY3QtZmlyZXdvcmtzJyxcclxuICAgICAgICAgICAgJ3JlYWN0LXRlbGVncmFtLWxvZ2luJyxcclxuICAgICAgICAgICAgJ3JlYWN0LXRvYXN0aWZ5JyxcclxuICAgICAgICAgICAgJ3JlYWN0LXR1cm5zdGlsZScsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgaTE4bjogW1xyXG4gICAgICAgICAgICAnaTE4bmV4dCcsXHJcbiAgICAgICAgICAgICdyZWFjdC1pMThuZXh0JyxcclxuICAgICAgICAgICAgJ2kxOG5leHQtYnJvd3Nlci1sYW5ndWFnZWRldGVjdG9yJyxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6ICcwLjAuMC4wJyxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICAnL21qJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICAnL3BnJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQW1CQSxPQUFPLFdBQVc7QUFDbEIsU0FBUyxjQUFjLDRCQUE0QjtBQUNuRCxPQUFPLFNBQVM7QUFDaEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsMkJBQTJCO0FBdkJwQyxJQUFNLG1DQUFtQztBQXdCekMsSUFBTSxFQUFFLGVBQWUsSUFBSTtBQUczQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxvQkFBb0I7QUFBQSxNQUNsQixTQUFTO0FBQUEsSUFDWCxDQUFDO0FBQUEsSUFDRDtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sTUFBTSxVQUFVLE1BQU0sSUFBSTtBQUN4QixZQUFJLENBQUMsZUFBZSxLQUFLLEVBQUUsR0FBRztBQUM1QixpQkFBTztBQUFBLFFBQ1Q7QUFJQSxlQUFPLHFCQUFxQixNQUFNLElBQUk7QUFBQSxVQUNwQyxRQUFRO0FBQUEsVUFDUixLQUFLO0FBQUEsUUFDUCxDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFBQSxJQUNBLE1BQU07QUFBQSxJQUNOLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxJQUNaLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixPQUFPO0FBQUEsSUFDUCxnQkFBZ0I7QUFBQSxNQUNkLFFBQVE7QUFBQSxRQUNOLE9BQU87QUFBQSxRQUNQLFNBQVM7QUFBQSxNQUNYO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLGNBQWMsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsVUFDdkQsV0FBVyxDQUFDLHdCQUF3QixtQkFBbUI7QUFBQSxVQUN2RCxPQUFPLENBQUMsU0FBUyxXQUFXLFFBQVE7QUFBQSxVQUNwQyxvQkFBb0I7QUFBQSxZQUNsQjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxNQUFNO0FBQUEsWUFDSjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLE1BQ0EsT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsTUFDQSxPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
