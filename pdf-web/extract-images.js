#!/usr/bin/env node

/**
 * 图片提取脚本 - 将images1.json中的所有图片强制保存为PNG格式
 * 
 * 使用方法:
 * node extract-images.js
 * 
 * 注意: 所有图片都会强制使用PNG扩展名保存，无需任何外部依赖库
 */

const fs = require('fs');
const path = require('path');

// 脚本所在目录
const scriptDir = __dirname;
const imagesJsonPath = path.join(scriptDir, 'images1.json');
const outputDir = path.join(scriptDir, 'images');

/**
 * 统一返回PNG扩展名
 * @param {string} dataUrl - base64数据URL
 * @returns {string} 文件扩展名
 */
function getFileExtension(dataUrl) {
    // 所有图片都输出为PNG格式
    return '.png';
}

/**
 * 从base64数据URL中提取纯base64数据
 * @param {string} dataUrl - base64数据URL
 * @returns {string} 纯base64数据
 */
function extractBase64Data(dataUrl) {
    const base64Match = dataUrl.match(/^data:image\/[a-zA-Z+]+;base64,(.+)$/);
    return base64Match ? base64Match[1] : dataUrl;
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log('开始提取图片...');
        console.log(`读取文件: ${imagesJsonPath}`);
        
        // 检查images1.json是否存在
        if (!fs.existsSync(imagesJsonPath)) {
            console.error('错误: images1.json 文件不存在!');
            process.exit(1);
        }
        
        // 创建输出目录
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`创建目录: ${outputDir}`);
        }
        
        // 读取JSON文件
        console.log('正在读取JSON文件...');
        const jsonData = fs.readFileSync(imagesJsonPath, 'utf8');
        
        let images;
        try {
            images = JSON.parse(jsonData);
        } catch (parseError) {
            console.error('错误: 无法解析JSON文件!', parseError.message);
            process.exit(1);
        }
        
        // 确保是数组
        if (!Array.isArray(images)) {
            console.error('错误: JSON文件内容不是数组格式!');
            process.exit(1);
        }
        
        console.log(`找到 ${images.length} 张图片`);
        
        let successCount = 0;
        let errorCount = 0;
        
        // 处理每张图片
        for (let i = 0; i < images.length; i++) {
            try {
                const imageData = images[i];
                
                // 检查是否是base64数据URL格式
                if (typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
                    console.warn(`跳过第 ${i + 1} 张图片: 不是有效的base64图片数据`);
                    errorCount++;
                    continue;
                }
                
                // 获取文件扩展名
                const extension = getFileExtension(imageData);
                
                // 提取base64数据
                const base64Data = extractBase64Data(imageData);
                
                // 生成文件名
                const fileName = `image_${String(i + 1).padStart(4, '0')}${extension}`;
                const filePath = path.join(outputDir, fileName);
                
                // 将base64数据转换为Buffer并直接保存为PNG格式
                const buffer = Buffer.from(base64Data, 'base64');
                fs.writeFileSync(filePath, buffer);
                
                successCount++;
                
                if (successCount % 100 === 0) {
                    console.log(`已处理 ${successCount} 张图片...`);
                }
                
            } catch (error) {
                console.error(`处理第 ${i + 1} 张图片时出错:`, error.message);
                errorCount++;
            }
        }
        
        console.log('\n提取完成!');
        console.log(`成功: ${successCount} 张图片`);
        console.log(`失败: ${errorCount} 张图片`);
        console.log(`输出目录: ${outputDir}`);
        
    } catch (error) {
        console.error('程序执行出错:', error.message);
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = { main };
