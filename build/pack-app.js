'use strict'

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

// 目标目录
const targetDir = '/Users/ryan/Documents/HBuilderProjects/html/exam/hybrid/html/'

// 源目录
const distDir = path.resolve(__dirname, '../dist')
const staticDir = path.join(distDir, 'static')
const indexFile = path.join(distDir, 'index.html')

// 目标路径
const targetStaticDir = path.join(targetDir, 'static')
const targetIndexFile = path.join(targetDir, 'index.html')

console.log(chalk.cyan('开始复制文件到HBuilderProjects...'))

// 递归复制目录的函数
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(chalk.red(`源目录不存在: ${src}`))
    return false
  }

  // 创建目标目录
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const files = fs.readdirSync(src)
  
  files.forEach(file => {
    const srcPath = path.join(src, file)
    const destPath = path.join(dest, file)
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  })
  
  return true
}

// 复制文件的函数
function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(chalk.red(`源文件不存在: ${src}`))
    return false
  }

  // 确保目标目录存在
  const destDir = path.dirname(dest)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  fs.copyFileSync(src, dest)
  return true
}

// 检查dist目录是否存在
if (!fs.existsSync(distDir)) {
  console.log(chalk.red('dist目录不存在，请先运行 npm run build'))
  process.exit(1)
}

// 确保目标目录存在
if (!fs.existsSync(targetDir)) {
  console.log(chalk.yellow(`创建目标目录: ${targetDir}`))
  fs.mkdirSync(targetDir, { recursive: true })
}

// 删除目标目录中的旧文件
console.log(chalk.blue('清理目标目录...'))

// 删除static目录
if (fs.existsSync(targetStaticDir)) {
  console.log(chalk.yellow('删除旧的static目录...'))
  fs.rmSync(targetStaticDir, { recursive: true, force: true })
  console.log(chalk.green('✓ 旧的static目录已删除'))
}

// 删除index.html
if (fs.existsSync(targetIndexFile)) {
  console.log(chalk.yellow('删除旧的index.html...'))
  fs.unlinkSync(targetIndexFile)
  console.log(chalk.green('✓ 旧的index.html已删除'))
}

let success = true

// 复制static目录
if (fs.existsSync(staticDir)) {
  console.log(chalk.blue('复制static目录...'))
  if (copyDir(staticDir, targetStaticDir)) {
    console.log(chalk.green(`✓ static目录复制成功: ${targetStaticDir}`))
  } else {
    success = false
  }
} else {
  console.log(chalk.yellow('static目录不存在，跳过复制'))
}

// 复制index.html
if (fs.existsSync(indexFile)) {
  console.log(chalk.blue('复制index.html...'))
  if (copyFile(indexFile, targetIndexFile)) {
    console.log(chalk.green(`✓ index.html复制成功: ${targetIndexFile}`))
  } else {
    success = false
  }
} else {
  console.log(chalk.red('index.html不存在'))
  success = false
}

if (success) {
  console.log(chalk.green('\n🎉 文件复制完成！'))
  console.log(chalk.cyan(`目标目录: ${targetDir}`))
} else {
  console.log(chalk.red('\n❌ 文件复制过程中出现错误'))
  process.exit(1)
}
