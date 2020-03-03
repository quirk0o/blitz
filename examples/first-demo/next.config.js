const path = require('path')

// HACK: https://github.com/zeit/next.js/issues/7935
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

// NOTE: This is ONLY needed in this Blitz monorepo so that package hot reloading works properly
const withTM = require('next-transpile-modules')(['@blitzjs/core'])
module.exports = withTM({
  webpack: (config, {buildId, dev, isServer, defaultLoaders, webpack}) => {
    // HACK: https://github.com/zeit/next.js/issues/7935
    if (config.resolve.plugins) {
      config.resolve.plugins.push(new TsconfigPathsPlugin())
    } else {
      config.resolve.plugins = [new TsconfigPathsPlugin()]
    }
    if (!isServer) {
      // Noop resolution of @prisma/client in the browser
      // since setting an alias to false does not work
      config.resolve.alias['@prisma/client'] = path.join(__dirname, 'noop.js')
    }

    return config
  },
})
