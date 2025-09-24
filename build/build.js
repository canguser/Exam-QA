'use strict'
require('./check-versions')()

process.env.NODE_ENV = 'production'

const ora = require('ora')
const rm = require('rimraf')
const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
const fs = require('fs')
const config = require('../config')
const webpackConfig = require('./webpack.prod.conf')
const packageConfig = require('../package.json')

// 在打包前更新版本号到config文件
const configPath = path.resolve(__dirname, '../src/config/index.js')
let configContent = fs.readFileSync(configPath, 'utf8')

// 使用正则表达式只替换version字段，保留其他配置
configContent = configContent.replace(
  /version:\s*['"`][^'"`]*['"`]/,
  `version: '${packageConfig.version}'`
)

fs.writeFileSync(configPath, configContent, 'utf8')
console.log(chalk.green(`Version updated to ${packageConfig.version} in src/config/index.js`))

const spinner = ora('building for production...')
spinner.start()

rm(path.join(config.build.assetsRoot, config.build.assetsSubDirectory), err => {
  if (err) throw err
  webpack(webpackConfig, (err, stats) => {
    spinner.stop()
    if (err) throw err
    process.stdout.write(stats.toString({
      colors: true,
      modules: false,
      children: false, // If you are using ts-loader, setting this to true will make TypeScript errors show up during build.
      chunks: false,
      chunkModules: false
    }) + '\n\n')

    if (stats.hasErrors()) {
      console.log(chalk.red('  Build failed with errors.\n'))
      process.exit(1)
    }

    console.log(chalk.cyan('  Build complete.\n'))
    console.log(chalk.yellow(
      '  Tip: built files are meant to be served over an HTTP server.\n' +
      '  Opening index.html over file:// won\'t work.\n'
    ))
  })
})
