const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/lib", // Match everything starting with /lib
    createProxyMiddleware({
      target: "http://nzen", // Actual backend
      changeOrigin: true,
      pathRewrite: {
        "^/lib": "/lib", // Keep path as is
      },
    })
  );
};
