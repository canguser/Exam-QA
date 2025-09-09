// ==UserScript==
// @name         考试宝题库提取器
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  提取考试宝网站的题目信息并转换为JSON格式
// @author       You
// @match        https://so.kaoshibao.com/detail/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // 配置存储键名
    const CONFIG_KEY = 'kaoshibao_auto_download';
    
    // 获取自动下载配置
    function getAutoDownloadConfig() {
        return localStorage.getItem(CONFIG_KEY) === 'true';
    }
    
    // 设置自动下载配置
    function setAutoDownloadConfig(enabled) {
        localStorage.setItem(CONFIG_KEY, enabled.toString());
    }
    
    // 等待页面加载完成
    window.addEventListener('load', function() {
        setTimeout(initScript, 1000);
    });
    
    function initScript() {
        // 添加提取按钮
        addExtractButton();
        
        // 如果开启了自动下载，检查页面内容并自动处理
        if (getAutoDownloadConfig() && document.querySelector('.topic')) {
            console.log('自动下载已启用，开始自动处理...');
            setTimeout(autoDownloadAndClose, 1500); // 延迟1.5秒确保页面完全加载
        }
    }
    
    function addExtractButton() {
        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 5px;
        `;
        
        // 创建手动提取按钮
        const button = document.createElement('button');
        button.innerHTML = '📝 提取题目为JSON';
        button.style.cssText = `
            padding: 10px 15px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        button.addEventListener('click', extractQuestionData);
        
        // 创建手动自动下载按钮
        const autoButton = document.createElement('button');
        autoButton.innerHTML = '🚀 立即下载并关闭';
        autoButton.style.cssText = `
            padding: 10px 15px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        autoButton.addEventListener('click', autoDownloadAndClose);
        
        // 创建自动下载配置切换按钮
        const configButton = document.createElement('button');
        updateConfigButtonStyle(configButton);
        configButton.addEventListener('click', function() {
            toggleAutoDownload();
        });
        
        buttonContainer.appendChild(button);
        buttonContainer.appendChild(autoButton);
        buttonContainer.appendChild(configButton);
        document.body.appendChild(buttonContainer);
        
        // 创建结果显示区域
        const resultDiv = document.createElement('div');
        resultDiv.id = 'extraction-result';
        resultDiv.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            z-index: 9998;
            max-width: 400px;
            max-height: 500px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: none;
            overflow-y: auto;
            padding: 15px;
        `;
        document.body.appendChild(resultDiv);
    }
    
    function extractQuestionData() {
        try {
            const topicElement = document.querySelector('.topic');
            if (!topicElement) {
                alert('未找到题目内容！');
                return;
            }
            
            // 提取题目数据
            const questionData = parseQuestion(topicElement);
            
            // 显示结果
            displayResult(questionData);
            
            // 自动下载JSON文件
            downloadJSON(questionData);
            
        } catch (error) {
            console.error('提取数据时出错:', error);
            alert('提取数据时出错: ' + error.message);
        }
    }
    
    function parseQuestion(topicElement) {
        // 提取题目类型和描述
        const questionBox = topicElement.querySelector('.qusetion-box p');
        if (!questionBox) {
            throw new Error('未找到题目内容');
        }
        
        const questionText = questionBox.innerHTML;
        
        // 提取题目类型（单选题、多选题等）
        const typeElement = questionBox.querySelector('.theme-color');
        const questionType = typeElement ? typeElement.textContent.trim() : '未知类型';
        
        // 提取选项
        const optionElements = topicElement.querySelectorAll('.option');
        const answerOptions = [];
        
        optionElements.forEach((option, index) => {
            const optionLetter = option.querySelector('span:first-child').textContent.trim();
            const optionText = option.querySelector('span:last-child').textContent.trim();
            const isCorrect = option.classList.contains('right');
            
            answerOptions.push({
                describe: `<p>${optionText}</p>`,
                isRight: isCorrect
            });
        });
        
        // 提取正确答案
        const correctAnswerElement = topicElement.querySelector('.answer-row span[style*="color:#04C25D"]');
        const correctAnswer = correctAnswerElement ? correctAnswerElement.textContent.trim() : '';
        
        // 提取答案解析
        const analysisElement = topicElement.querySelector('.answer-analysis');
        const analysis = analysisElement ? `<p>${analysisElement.innerHTML}</p>` : '<p>暂无解析</p>';
        
        // 生成hashCode（使用当前URL或时间戳）
        const url = window.location.href;
        const hashCode = url.match(/\/detail\/(\d+)/) ? url.match(/\/detail\/(\d+)/)[1] : Date.now().toString();
        
        // 构建题目描述（移除题目类型标签）
        let describe = questionText;
        if (typeElement) {
            describe = describe.replace(typeElement.outerHTML, '').trim();
        }
        describe = `<p>${describe}</p>`;
        
        // 构建题目数据（只返回单个题目对象）
        const questionData = {
            describe: describe,
            answerOptions: answerOptions,
            analysis: analysis,
            hashCode: hashCode
        };
        
        return questionData;
    }
    
    function displayResult(data) {
        const resultDiv = document.getElementById('extraction-result');
        
        const html = `
            <div style="margin-bottom: 15px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">提取结果</h3>
                <button onclick="this.parentElement.parentElement.style.display='none'" 
                        style="float: right; background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                    ✕ 关闭
                </button>
            </div>
            <div style="clear: both;">
                <p><strong>选项数量:</strong> ${data.answerOptions.length}</p>
                <p><strong>HashCode:</strong> ${data.hashCode}</p>
                
                <div style="margin-top: 15px;">
                    <button onclick="copyToClipboard('${escapeForAttribute(JSON.stringify(data, null, 2))}')" 
                            style="background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 3px; cursor: pointer; margin-right: 10px;">
                        📋 复制JSON
                    </button>
                    <button onclick="downloadExtractedJSON()" 
                            style="background: #17a2b8; color: white; border: none; padding: 8px 12px; border-radius: 3px; cursor: pointer;">
                        💾 下载文件
                    </button>
                </div>
                
                <details style="margin-top: 15px;">
                    <summary style="cursor: pointer; font-weight: bold;">查看JSON预览</summary>
                    <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; font-size: 12px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
                </details>
            </div>
        `;
        
        resultDiv.innerHTML = html;
        resultDiv.style.display = 'block';
        
        // 存储数据供下载使用
        window.extractedData = data;
    }
    
    function escapeForAttribute(str) {
        return str.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }
    
    function downloadJSON(data) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `question_${data.hashCode}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // 自动下载并关闭页面
    function autoDownloadAndClose() {
        try {
            const topicElement = document.querySelector('.topic');
            if (!topicElement) {
                alert('未找到题目内容！');
                return;
            }
            
            // 提取题目数据
            const questionData = parseQuestion(topicElement);
            
            // 自动下载JSON文件
            downloadJSON(questionData);
            
            // 显示倒计时提示
            showCountdown();
            
            // 3秒后关闭页面
            setTimeout(() => {
                window.close();
            }, 3000);
            
        } catch (error) {
            console.error('自动处理时出错:', error);
            alert('自动处理时出错: ' + error.message);
        }
    }
    
    // 显示倒计时
    function showCountdown() {
        // 创建倒计时提示
        const countdownDiv = document.createElement('div');
        countdownDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-size: 18px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        
        document.body.appendChild(countdownDiv);
        
        let countdown = 3;
        countdownDiv.innerHTML = `✅ JSON文件已下载！<br><br>页面将在 <span style="color: #ffc107; font-weight: bold;">${countdown}</span> 秒后关闭`;
        
        const timer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownDiv.innerHTML = `✅ JSON文件已下载！<br><br>页面将在 <span style="color: #ffc107; font-weight: bold;">${countdown}</span> 秒后关闭`;
            } else {
                clearInterval(timer);
                document.body.removeChild(countdownDiv);
            }
        }, 1000);
    }
    
    // 更新配置按钮样式
    function updateConfigButtonStyle(button) {
        const isEnabled = getAutoDownloadConfig();
        button.innerHTML = isEnabled ? '🔴 关闭自动下载' : '🟢 开启自动下载';
        button.style.cssText = `
            padding: 10px 15px;
            background: ${isEnabled ? '#dc3545' : '#6c757d'};
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
    }
    
    // 切换自动下载配置
    function toggleAutoDownload() {
        const currentConfig = getAutoDownloadConfig();
        const newConfig = !currentConfig;
        setAutoDownloadConfig(newConfig);
        
        // 更新按钮样式 - 查找包含"自动下载"文字的按钮
        const configButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.includes('自动下载'));
        if (configButton) {
            updateConfigButtonStyle(configButton);
        }
        
        // 显示配置变更提示
        const message = newConfig ? 
            '✅ 自动下载已开启！\n以后打开页面将自动下载JSON并关闭' : 
            '❌ 自动下载已关闭！\n需要手动点击按钮下载';
        
        // 创建提示框
        showConfigMessage(message, newConfig);
    }
    
    // 显示配置变更消息
    function showConfigMessage(message, isEnabled) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10001;
            background: ${isEnabled ? 'rgba(40, 167, 69, 0.95)' : 'rgba(108, 117, 125, 0.95)'};
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            white-space: pre-line;
        `;
        
        messageDiv.innerHTML = message;
        document.body.appendChild(messageDiv);
        
        // 2秒后自动消失
        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
        }, 2000);
    }
    
    // 全局函数供HTML调用
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(function() {
            alert('JSON已复制到剪贴板！');
        }).catch(function(err) {
            console.error('复制失败:', err);
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('JSON已复制到剪贴板！');
        });
    };
    
    window.downloadExtractedJSON = function() {
        if (window.extractedData) {
            downloadJSON(window.extractedData);
        }
    };
    
    console.log('考试宝题库提取器已加载完成！');
})();
