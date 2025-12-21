const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
  target: 'web',
  entry: './webview/main.ts',
  output: {
    path: path.resolve(__dirname, 'media'),
    filename: 'editor.js'
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue'],
    alias: {
      'vue': 'vue/dist/vue.runtime.esm-bundler.js'
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/],
          configFile: path.resolve(__dirname, 'tsconfig.webview.json')
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin()
  ],
  externals: {
    vscode: 'commonjs vscode'
  }
};
