// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ensure service worker is included in build
      return webpackConfig;
    }
  }
};