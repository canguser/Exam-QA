// ==UserScript==
// @name         考试宝练题页面批量题库下载器
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动遍历考试宝练题页面，批量提取所有题目信息并下载题库
// @author       You
// @match        https://www.kaoshibao.com/online/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // 全局变量
    let questionsData = [];
    let isCollecting = false;
    let currentQuestionIndex = 0;
    let totalQuestions = 0;
    let collectionStarted = false;
    
    // 等待页面加载完成
    window.addEventListener('load', function() {
        setTimeout(initScript, 2000);
    });
    
    function initScript() {
        console.log('考试宝练题页面题库下载器已加载');
        
        // 添加控制面板
        addControlPanel();
        
        // 检查页面是否有题目内容
        if (document.querySelector('.topic')) {
            console.log('检测到练题页面，准备添加批量下载功能...');
            extractTotalQuestions();
        }
    }
    
    function addControlPanel() {
        // 创建控制面板
        const panel = document.createElement('div');
        panel.id = 'scraper-control-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: white;
            border: 2px solid #007bff;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            min-width: 250px;
            font-family: Arial, sans-serif;
        `;
        
        panel.innerHTML = `
            <div style="margin-bottom: 15px;">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">🎯 题库下载器</h3>
                <div id="status-info" style="font-size: 14px; color: #666;">
                    状态：等待开始
                </div>
                <div id="progress-info" style="font-size: 14px; color: #666; margin-top: 5px;">
                    进度：0/0
                </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button id="start-collection" style="
                    padding: 10px 15px;
                    background: #28a745;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                ">🚀 开始批量收集</button>
                
                <button id="stop-collection" style="
                    padding: 10px 15px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    display: none;
                ">⏹️ 停止收集</button>
                
                <button id="download-questions" style="
                    padding: 10px 15px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    display: none;
                ">💾 下载题库 (0)</button>
                
                <button id="clear-data" style="
                    padding: 8px 15px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 12px;
                ">🗑️ 清空数据</button>
            </div>
            
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">
                <details>
                    <summary style="cursor: pointer; font-size: 12px; color: #666;">收集设置</summary>
                    <div style="margin-top: 10px;">
                        <label style="font-size: 12px; color: #666;">
                            <input type="checkbox" id="auto-download" checked> 收集完成后自动下载
                        </label>
                        <br>
                        <label style="font-size: 12px; color: #666; margin-top: 5px; display: block;">
                            间隔时间: <input type="number" id="interval-time" value="800" min="0" max="3000" style="width: 60px; margin: 0 5px;"> 毫秒
                        </label>
                    </div>
                </details>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // 绑定事件
        bindControlEvents();
    }
    
    function bindControlEvents() {
        document.getElementById('start-collection').addEventListener('click', startCollection);
        document.getElementById('stop-collection').addEventListener('click', stopCollection);
        document.getElementById('download-questions').addEventListener('click', downloadQuestions);
        document.getElementById('clear-data').addEventListener('click', clearData);
    }
    
    function extractTotalQuestions() {
        // 尝试从页面中提取总题数
        const topicNumElement = document.querySelector('.topic-num');
        if (topicNumElement) {
            const text = topicNumElement.textContent;
            const match = text.match(/(\d+)\/(\d+)/);
            if (match) {
                currentQuestionIndex = parseInt(match[1]);
                totalQuestions = parseInt(match[2]);
                updateProgress();
                console.log(`检测到总题数: ${totalQuestions}, 当前题目: ${currentQuestionIndex}`);
            }
        }
    }
    
    function startCollection() {
        if (isCollecting) return;
        
        isCollecting = true;
        collectionStarted = true;
        
        // 更新UI
        document.getElementById('start-collection').style.display = 'none';
        document.getElementById('stop-collection').style.display = 'block';
        updateStatus('正在准备收集...');
        
        // 先检查当前是否在第1题，如果不是则导航到第1题
        extractTotalQuestions();
        if (currentQuestionIndex > 1) {
            updateStatus(`当前在第${currentQuestionIndex}题，正在导航到第1题...`);
            navigateToFirstQuestion();
        } else {
            updateStatus('正在收集题目...');
            // 开始收集流程
            collectCurrentQuestion();
        }
    }
    
    function stopCollection() {
        isCollecting = false;
        
        // 更新UI
        document.getElementById('start-collection').style.display = 'block';
        document.getElementById('stop-collection').style.display = 'none';
        updateStatus('收集已停止');
        
        // 显示下载按钮
        if (questionsData.length > 0) {
            showDownloadButton();
        }
    }
    
    function collectCurrentQuestion() {
        if (!isCollecting) return;
        
        try {
            // 首先点击任意选项以显示答案
            clickRandomOption(() => {
                // 等待答案和解析加载，然后提取题目信息
                waitForAnalysisAndExtract(() => {
                    // 检查是否需要继续 - 如果当前不是最后一题就继续
                    if (isCollecting && questionsData.length < totalQuestions) {
                        // 点击下一题
                        clickNextQuestion();
                    } else {
                        // 收集完成
                        completeCollection();
                    }
                });
            });
            
        } catch (error) {
            console.error('收集题目时出错:', error);
            updateStatus('收集出错: ' + error.message);
            stopCollection();
        }
    }
    
    function clickRandomOption(callback) {
        const options = document.querySelectorAll('.option');
        if (options.length === 0) {
            throw new Error('未找到选项');
        }
        
        // 找到一个未被选中的选项
        let targetOption = null;
        for (let option of options) {
            if (!option.classList.contains('right') && !option.classList.contains('err') && !option.classList.contains('selected')) {
                targetOption = option;
                break;
            }
        }
        
        // 如果没找到未选中的，就选第一个
        if (!targetOption) {
            targetOption = options[0];
        }
        
        console.log('点击选项:', targetOption.textContent.trim());
        targetOption.click();
        
        // 稍等一下确保点击生效
        setTimeout(callback, 200);
    }
    
    function waitForAnalysisAndExtract(callback) {
        let attempts = 0;
        const maxAttempts = 10; // 最多尝试10次
        
        function checkForAnalysis() {
            attempts++;
            
            // 检查是否有解析元素出现
            const analysisElement = document.querySelector('.answer-analysis');
            const hasCorrectAnswer = document.querySelector('.option.right');
            
            if (analysisElement || hasCorrectAnswer || attempts >= maxAttempts) {
                console.log(`第${attempts}次检查 - 解析元素:`, !!analysisElement, '正确答案:', !!hasCorrectAnswer);
                // 提取题目信息
                extractQuestionData();
                callback();
            } else {
                // 继续等待，每200ms检查一次
                setTimeout(checkForAnalysis, 200);
            }
        }
        
        // 开始检查
        checkForAnalysis();
    }
    
    function navigateToFirstQuestion() {
        // 连续点击上一题直到到达第1题
        function clickPrevious() {
            extractTotalQuestions();
            
            if (currentQuestionIndex <= 1) {
                // 已经到达第1题，开始收集
                updateStatus('已到达第1题，开始收集...');
                setTimeout(() => {
                    collectCurrentQuestion();
                }, 500);
                return;
            }
            
            // 查找上一题按钮
            const prevButtons = document.querySelectorAll('button');
            let prevButton = null;
            
            for (let button of prevButtons) {
                const buttonText = button.textContent || button.innerText;
                if (buttonText.includes('上一题')) {
                    prevButton = button;
                    break;
                }
            }
            
            if (prevButton) {
                console.log(`从第${currentQuestionIndex}题点击上一题`);
                prevButton.click();
                
                // 等待页面更新后继续点击上一题
                setTimeout(clickPrevious, 600);
            } else {
                console.log('未找到上一题按钮，从当前题开始收集');
                updateStatus('未找到上一题按钮，从当前题开始收集...');
                collectCurrentQuestion();
            }
        }
        
        clickPrevious();
    }
    
    function extractQuestionData() {
        try {
            // 更新题目索引
            extractTotalQuestions();
            
            // 提取题目类型
            const typeElement = document.querySelector('.topic-type');
            const questionType = typeElement ? typeElement.textContent.trim() : '未知类型';
            
            // 提取题目内容（保留完整HTML包括图片）
            const titleElement = document.querySelector('.qusetion-title');
            if (!titleElement) {
                throw new Error('未找到题目内容');
            }
            
            // 完整保留HTML内容，包括图片标签
            let questionContent = titleElement.innerHTML;
            
            // 检测题目中是否有图片
            const hasQuestionImage = questionContent.includes('<img');
            if (hasQuestionImage) {
                console.log('📷 题目中检测到图片');
            }
            
            // 提取选项
            const optionElements = document.querySelectorAll('.option');
            const answerOptions = [];
            const seenOptions = new Set(); // 用于检测重复选项
            
            optionElements.forEach((option, index) => {
                const optionLetter = option.querySelector('.before-icon').textContent.trim();
                const optionContentElement = option.querySelector('span:last-child');
                const isCorrect = option.classList.contains('right');
                
                // 保留完整HTML内容，包括可能的图片
                let optionContent = '';
                if (optionContentElement) {
                    // 检查是否包含HTML标签（特别是img标签）
                    const innerHTML = optionContentElement.innerHTML;
                    if (innerHTML.includes('<img') || innerHTML.includes('<') || innerHTML !== optionContentElement.textContent) {
                        // 包含HTML内容，直接使用innerHTML
                        optionContent = innerHTML.trim();
                    } else {
                        // 纯文字内容
                        optionContent = optionContentElement.textContent.trim();
                    }
                }
                
                // 如果内容已经包含HTML标签，直接包装；否则包装在p标签中
                const finalContent = optionContent.includes('<') ? 
                    `<p>${optionContent}</p>` : 
                    `<p>${optionContent}</p>`;
                
                // 创建唯一标识符：内容 + 正确性
                const optionKey = `${finalContent}|${isCorrect}`;
                
                // 检查是否重复
                if (seenOptions.has(optionKey)) {
                    console.log(`⚠️ 发现重复选项 ${optionLetter}：${optionContent.substring(0, 50)}...，已跳过`);
                    return; // 跳过重复选项
                }
                
                seenOptions.add(optionKey);
                
                // 检测选项中是否有图片
                if (optionContent.includes('<img')) {
                    console.log(`📷 选项 ${optionLetter} 中检测到图片`);
                }
                
                answerOptions.push({
                    describe: finalContent,
                    isRight: isCorrect
                });
            });
            
            // 提取答案解析
            let analysis = '<p>暂无解析</p>';
            let analysisFound = false;
            
            const analysisElement = document.querySelector('.answer-analysis');
            if (analysisElement && analysisElement.textContent.trim()) {
                // 完整保留解析HTML内容，包括图片
                const analysisHTML = analysisElement.innerHTML;
                analysis = `<p>${analysisHTML}</p>`;
                analysisFound = true;
                
                // 检测解析中是否有图片
                if (analysisHTML.includes('<img')) {
                    console.log('✅ 通过 .answer-analysis 找到解析内容 📷 包含图片');
                } else {
                    console.log('✅ 通过 .answer-analysis 找到解析内容');
                }
            } else {
                console.log('❌ 未在 .answer-analysis 中找到解析，尝试其他选择器...');
                
                // 尝试其他可能的解析选择器
                const altAnalysisSelectors = [
                    '.analysis',
                    '.answer-detail', 
                    '.explanation',
                    '.topic-analysis',
                    '.answer-explain',
                    '.question-analysis',
                    '[class*="analysis"]',
                    '[class*="explain"]',
                    '[class*="answer"]'
                ];
                
                for (let selector of altAnalysisSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        // 完整保留解析HTML内容，包括可能的图片
                        const elementHTML = element.innerHTML;
                        analysis = `<p>${elementHTML}</p>`;
                        analysisFound = true;
                        
                        // 检测解析中是否有图片
                        if (elementHTML.includes('<img')) {
                            console.log(`✅ 通过选择器 ${selector} 找到解析内容 📷 包含图片`);
                        } else {
                            console.log(`✅ 通过选择器 ${selector} 找到解析内容`);
                        }
                        break;
                    }
                }
                
                if (!analysisFound) {
                    console.log('⚠️ 所有选择器都未找到解析内容');
                    // 输出当前页面的HTML结构用于调试
                    console.log('当前页面结构:', document.querySelector('.topic')?.outerHTML.substring(0, 1000));
                }
            }
            
            // 更新状态显示解析提取情况
            updateStatus(`正在收集题目... ${analysisFound ? '✅有解析' : '❌无解析'}`);
            
            
            // 生成hashCode
            const hashCode = `Q${currentQuestionIndex}_${Date.now()}`;
            
            // 构建题目数据
            const questionData = {
                describe: `<p>${questionContent}</p>`,
                answerOptions: answerOptions,
                analysis: analysis,
                hashCode: hashCode,
                questionType: questionType,
                questionIndex: currentQuestionIndex
            };
            
            // 添加到数据集合
            questionsData.push(questionData);
            
            // 显示选项统计信息
            const originalOptionCount = optionElements.length;
            const finalOptionCount = answerOptions.length;
            const removedCount = originalOptionCount - finalOptionCount;
            
            if (removedCount > 0) {
                console.log(`题目 ${currentQuestionIndex} 收集完成 - 原始选项:${originalOptionCount}, 去重后:${finalOptionCount}, 移除重复:${removedCount}`);
            } else {
                console.log(`题目 ${currentQuestionIndex} 收集完成 - 选项数:${finalOptionCount}`);
            }
            
            updateProgress();
            
        } catch (error) {
            console.error('提取题目数据时出错:', error);
            throw error;
        }
    }
    
    function clickNextQuestion() {
        // 查找下一题按钮
        const nextButtons = document.querySelectorAll('button');
        let nextButton = null;
        
        for (let button of nextButtons) {
            const buttonText = button.textContent || button.innerText;
            if (buttonText.includes('下一题')) {
                nextButton = button;
                break;
            }
        }
        
        if (nextButton) {
            console.log('点击下一题');
            nextButton.click();
            
            // 等待页面更新后继续收集
            const interval = parseInt(document.getElementById('interval-time').value) || 800;
            setTimeout(() => {
                if (isCollecting) {
                    collectCurrentQuestion();
                }
            }, interval);
        } else {
            throw new Error('未找到下一题按钮');
        }
    }
    
    function completeCollection() {
        isCollecting = false;
        
        // 计算总的选项统计
        let totalOriginalOptions = 0;
        let totalFinalOptions = 0;
        questionsData.forEach(q => {
            totalFinalOptions += q.answerOptions.length;
        });
        
        const statusMessage = `收集完成！共收集 ${questionsData.length} 道题目，${totalFinalOptions} 个选项`;
        updateStatus(statusMessage);
        console.log(statusMessage);
        
        // 更新UI
        document.getElementById('start-collection').style.display = 'block';
        document.getElementById('stop-collection').style.display = 'none';
        
        showDownloadButton();
        
        // 如果开启了自动下载
        if (document.getElementById('auto-download').checked) {
            setTimeout(downloadQuestions, 1000);
        }
    }
    
    function showDownloadButton() {
        const downloadBtn = document.getElementById('download-questions');
        downloadBtn.style.display = 'block';
        downloadBtn.textContent = `💾 下载题库 (${questionsData.length})`;
    }
    
    function updateStatus(status) {
        document.getElementById('status-info').textContent = `状态：${status}`;
    }
    
    function updateProgress() {
        document.getElementById('progress-info').textContent = `进度：${questionsData.length}/${totalQuestions}`;
    }
    
    function downloadQuestions() {
        if (questionsData.length === 0) {
            alert('没有收集到题目数据！');
            return;
        }
        
        // 构建完整的题库数据
        const questionBank = {
            title: `题库_${new Date().toISOString().split('T')[0]}`,
            category: "PRACTICE",
            questions: questionsData
        };
        
        // 下载JSON文件
        const jsonStr = JSON.stringify(questionBank, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `practice_questions_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        updateStatus(`题库已下载！共 ${questionsData.length} 道题目`);
    }
    
    function clearData() {
        if (confirm('确定要清空已收集的题目数据吗？')) {
            questionsData = [];
            currentQuestionIndex = 0;
            updateProgress();
            updateStatus('数据已清空');
            document.getElementById('download-questions').style.display = 'none';
        }
    }
    
    console.log('考试宝练题页面题库下载器已初始化');
})();
