# PDF-Web 工具集

这个目录包含了用于处理考试题库的工具脚本。

## 文件说明

### 输入文件
- `q.json` - 原始MuleSoft题库文件（235道题目）
- `images1.json` - base64编码的图片数据文件

### 输出文件
- `q1.json` - 转换后的项目格式题库文件
- `images/` - 提取的图片文件目录

### 脚本工具

#### 1. 图片提取脚本 (`extract-images.js`)
```bash
node extract-images.js
```
**功能：**
- 从 `images1.json` 提取所有base64图片
- 强制保存为PNG格式
- 无需任何外部依赖库

**输出：**
- 图片保存到 `images/` 目录
- 文件命名格式：`image_0001.png`, `image_0002.png` 等

#### 2. 题库转换脚本 (`convert-q-to-project.js`)
```bash
node convert-q-to-project.js
```
**功能：**
- 将MuleSoft格式的 `q.json` 转换为项目可识别的格式
- 处理图片引用，将 `{img0}` 等占位符转换为HTML img标签
- 生成符合项目要求的数据结构

**转换特点：**
- 题目描述转换为HTML格式
- 图片引用使用完整URL：`https://palerock.cn/file/public/qa/mulsoftdev1/image_XXXX.png`
- 选项格式包含 `describe`, `isRight`, `api` 字段
- 生成唯一的 `hashCode`：`MULESOFT_XXX`

#### 3. 验证脚本 (`validate-conversion.js`)
```bash
node validate-conversion.js
```
**功能：**
- 验证转换后的 `q1.json` 格式是否正确
- 检查数据结构完整性
- 统计图片转换情况

## 数据格式对比

### 原始格式 (q.json)
```json
{
  "title": "Salesforce MuleSoft Developer I 认证考试题库",
  "questions": [
    {
      "id": 1,
      "question": "Refer to the exhibits. {img0} What path value...",
      "question_type": "single_choice",
      "options": {
        "A": "*[order,customer]/status",
        "B": "?[order,customer]/status"
      },
      "correct_answer": "C",
      "explanation": "Correct answer is */status...",
      "images": ["{img0}"]
    }
  ]
}
```

### 项目格式 (q1.json)
```json
{
  "title": "Salesforce MuleSoft Developer I 认证考试题库",
  "category": "MULESOFT-DEV1",
  "questions": [
    {
      "describe": "<p>Refer to the exhibits. <img src=\"https://palerock.cn/file/public/qa/mulsoftdev1/image_0001.png\" alt=\"题目图片0\" style=\"max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; margin: 10px 0;\"> What path value...</p>",
      "answerOptions": [
        {
          "describe": "<p>*[order,customer]/status</p>",
          "isRight": false,
          "api": "A"
        }
      ],
      "analysis": "<p>Correct answer is */status...</p>",
      "hashCode": "MULESOFT_001"
    }
  ]
}
```

## 使用流程

1. **准备输入文件**
   - 确保 `q.json` 和 `images1.json` 在当前目录

2. **提取图片**（可选）
   ```bash
   node extract-images.js
   ```

3. **转换题库格式**
   ```bash
   node convert-q-to-project.js
   ```

4. **验证转换结果**
   ```bash
   node validate-conversion.js
   ```

5. **使用转换后的文件**
   - 将 `q1.json` 导入到考试系统中使用

## 特性

- ✅ 完全自动化转换
- ✅ 支持多图片题目
- ✅ 保持原有题目结构
- ✅ 图片样式适配移动端
- ✅ 无需外部依赖
- ✅ 错误处理和验证

## 统计信息

- **总题目数**: 235道
- **包含图片的题目**: 102道
- **成功转换率**: 100%
- **支持的图片格式**: 强制PNG输出
- **图片基础URL**: `https://palerock.cn/file/public/qa/mulsoftdev1/`

## 注意事项

1. 图片URL使用的是在线地址，确保网络连接正常
2. 转换后的文件大小约为原文件的1.5倍（因为HTML标签）
3. 所有图片引用都已转换为响应式样式，适配移动设备
4. hashCode格式为 `MULESOFT_XXX`，确保唯一性
