#!/usr/bin/env node

/**
 * Q.json转换脚本 - 将MuleSoft题库格式转换为项目可识别的格式
 * 
 * 功能：
 * 1. 转换题目格式从MuleSoft格式到项目格式
 * 2. 处理图片引用，将{imgN}替换为HTML img标签
 * 3. 生成正确的数据结构
 * 
 * 使用方法:
 * node convert-q-to-project.js
 */

const fs = require('fs');
const path = require('path');

// 脚本所在目录
const scriptDir = __dirname;
const inputFile = path.join(scriptDir, 'q.json');
const outputFile = path.join(scriptDir, 'q1.json');
const baseImageUrl = 'https://palerock.cn/file/public/qa/mulsoftdev1/';

/**
 * 将选项字母转换为对应的API值
 */
function getOptionApi(letter) {
    const mapping = {
        'A': 'A',
        'B': 'B', 
        'C': 'C',
        'D': 'D',
        'E': 'E',
        'F': 'F'
    };
    return mapping[letter] || letter;
}

/**
 * 处理图片引用，将{imgN}替换为HTML img标签
 */
function processImageReferences(text, imageCounter) {
    if (!text) return text;
    
    // 匹配所有的{imgN}格式
    return text.replace(/\{img(\d+)\}/g, (match, imgNumber) => {
        const paddedNumber = String(parseInt(imgNumber) + 1).padStart(4, '0');
        const imageUrl = `${baseImageUrl}image_${paddedNumber}.png`;
        return `<img src="${imageUrl}" alt="题目图片${imgNumber}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; margin: 10px 0;">`;
    });
}

/**
 * 处理题目描述，包含图片处理
 */
function processQuestionText(questionText, images) {
    let result = questionText;
    
    // 处理图片引用
    result = processImageReferences(result, 0);
    
    // 如果有额外的图片数组，也处理它们
    if (images && images.length > 0) {
        images.forEach((imgRef, index) => {
            const imgPlaceholder = `{${imgRef}}`;
            if (result.includes(imgPlaceholder)) {
                result = result.replace(imgPlaceholder, 
                    processImageReferences(imgPlaceholder, index)
                );
            }
        });
    }
    
    // 包装为HTML段落
    return `<p>${result}</p>`;
}

/**
 * 处理解析文本
 */
function processAnalysis(analysisText) {
    if (!analysisText) return '<p>暂无解析</p>';
    
    let result = processImageReferences(analysisText, 0);
    
    // 如果不是以HTML标签开始，包装为段落
    if (!result.trim().startsWith('<')) {
        result = `<p>${result}</p>`;
    }
    
    return result;
}

/**
 * 转换单个题目
 */
function convertQuestion(originalQuestion, questionIndex) {
    const question = {
        describe: processQuestionText(originalQuestion.question, originalQuestion.images),
        answerOptions: [],
        analysis: processAnalysis(originalQuestion.explanation),
        hashCode: `MULESOFT_${String(originalQuestion.id).padStart(3, '0')}`
    };
    
    // 处理选项
    if (originalQuestion.options) {
        Object.entries(originalQuestion.options).forEach(([key, value]) => {
            const option = {
                describe: `<p>${processImageReferences(value, 0)}</p>`,
                isRight: originalQuestion.correct_answer === key,
                api: getOptionApi(key)
            };
            question.answerOptions.push(option);
        });
    }
    
    return question;
}

/**
 * 主转换函数
 */
function convertQJsonToProjectFormat(inputData) {
    const result = {
        title: inputData.title || "MuleSoft Developer I 认证考试题库",
        category: "MULESOFT-DEV1",
        questions: []
    };
    
    if (inputData.questions && Array.isArray(inputData.questions)) {
        result.questions = inputData.questions.map((q, index) => {
            try {
                return convertQuestion(q, index);
            } catch (error) {
                console.error(`处理第 ${index + 1} 题时出错:`, error.message);
                return null;
            }
        }).filter(q => q !== null);
    }
    
    return result;
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log('开始转换Q.json文件...');
        console.log(`输入文件: ${inputFile}`);
        console.log(`输出文件: ${outputFile}`);
        
        // 检查输入文件是否存在
        if (!fs.existsSync(inputFile)) {
            console.error('错误: q.json 文件不存在!');
            process.exit(1);
        }
        
        // 读取输入文件
        console.log('正在读取输入文件...');
        const inputData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        
        console.log(`找到 ${inputData.questions ? inputData.questions.length : 0} 道题目`);
        
        // 转换数据
        console.log('正在转换数据格式...');
        const convertedData = convertQJsonToProjectFormat(inputData);
        
        // 写入输出文件
        console.log('正在保存转换结果...');
        fs.writeFileSync(outputFile, JSON.stringify(convertedData, null, 2), 'utf8');
        
        console.log('\n转换完成!');
        console.log(`成功转换 ${convertedData.questions.length} 道题目`);
        console.log(`输出文件: ${outputFile}`);
        console.log('\n格式特点:');
        console.log('- 题目描述支持HTML格式');
        console.log('- 图片引用已转换为HTML img标签');
        console.log('- 选项格式符合项目要求');
        console.log('- 包含题目解析');
        console.log(`- 使用图片基础URL: ${baseImageUrl}`);
        
        // 显示一些统计信息
        const questionsWithImages = convertedData.questions.filter(q => 
            q.describe.includes('<img') || 
            q.analysis.includes('<img') || 
            q.answerOptions.some(opt => opt.describe.includes('<img'))
        ).length;
        
        console.log(`\n统计信息:`);
        console.log(`- 总题目数: ${convertedData.questions.length}`);
        console.log(`- 包含图片的题目: ${questionsWithImages}`);
        
    } catch (error) {
        console.error('转换过程中出错:', error.message);
        if (error.stack) {
            console.error('错误堆栈:', error.stack);
        }
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = { 
    convertQJsonToProjectFormat, 
    processImageReferences, 
    processQuestionText,
    processAnalysis
};
