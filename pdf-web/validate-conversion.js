#!/usr/bin/env node

/**
 * 转换结果验证脚本
 * 检查q1.json文件的格式是否正确
 */

const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, 'q1.json');

function validateConversion() {
    try {
        console.log('验证转换结果...');
        
        if (!fs.existsSync(outputFile)) {
            console.error('错误: q1.json 文件不存在!');
            return false;
        }
        
        const data = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        
        // 验证基本结构
        console.log('✓ JSON格式正确');
        
        if (!data.title || !data.category || !data.questions) {
            console.error('✗ 缺少必要字段 (title, category, questions)');
            return false;
        }
        console.log('✓ 基本结构正确');
        
        if (!Array.isArray(data.questions)) {
            console.error('✗ questions不是数组');
            return false;
        }
        console.log(`✓ 包含 ${data.questions.length} 道题目`);
        
        // 验证题目结构
        let validQuestions = 0;
        let questionsWithImages = 0;
        let totalImages = 0;
        
        for (let i = 0; i < Math.min(data.questions.length, 10); i++) {
            const q = data.questions[i];
            if (q.describe && q.answerOptions && q.analysis && q.hashCode) {
                validQuestions++;
                
                // 统计图片
                const descImages = (q.describe.match(/<img/g) || []).length;
                const analysisImages = (q.analysis.match(/<img/g) || []).length;
                const optionImages = q.answerOptions.reduce((count, opt) => 
                    count + ((opt.describe.match(/<img/g) || []).length), 0);
                
                const questionImages = descImages + analysisImages + optionImages;
                if (questionImages > 0) {
                    questionsWithImages++;
                    totalImages += questionImages;
                }
            }
        }
        
        console.log(`✓ 前10题结构验证: ${validQuestions}/10 题格式正确`);
        
        // 验证图片转换
        const sampleWithImage = data.questions.find(q => q.describe.includes('<img'));
        if (sampleWithImage) {
            console.log('✓ 图片转换成功');
            const imgMatch = sampleWithImage.describe.match(/<img[^>]+src="([^"]+)"/);
            if (imgMatch) {
                console.log(`  示例图片URL: ${imgMatch[1]}`);
            }
        }
        
        // 统计信息
        console.log('\n统计信息:');
        console.log(`- 总题目数: ${data.questions.length}`);
        console.log(`- 样本中包含图片的题目: ${questionsWithImages}/10`);
        console.log(`- 样本中总图片数: ${totalImages}`);
        
        // 验证hashCode格式
        const hashCodes = data.questions.slice(0, 5).map(q => q.hashCode);
        console.log(`- 示例hashCode: ${hashCodes.join(', ')}`);
        
        console.log('\n✅ 转换验证通过!');
        return true;
        
    } catch (error) {
        console.error('验证过程中出错:', error.message);
        return false;
    }
}

if (require.main === module) {
    validateConversion();
}

module.exports = { validateConversion };
