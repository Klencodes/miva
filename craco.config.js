// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ensure proper caching of build files
      webpackConfig.output.filename = 'static/js/[name].[contenthash:8].js';
      webpackConfig.output.chunkFilename = 'static/js/[name].[contenthash:8].chunk.js';
      
      // Add manifest for caching
      webpackConfig.plugins.forEach(plugin => {
        if (plugin.constructor.name === 'ManifestPlugin') {
          plugin.options.generate = (seed, files) => {
            const manifestFiles = files.reduce((manifest, file) => {
              manifest[file.name] = file.path;
              return manifest;
            }, seed);
            
            // Cache these files in service worker
            return manifestFiles;
          };
        }
      });
      
      return webpackConfig;
    }
  }
};