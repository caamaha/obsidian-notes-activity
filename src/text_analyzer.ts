// src/text_analyzer.ts

export class TextAnalyzer {
    // 统计文本的总字符数和总词数（不区分中英文）
    static analyzeText(text: string): { charCount: number; wordCount: number } {
        let charCount = text.length;  // 所有字符的数量，包括空格和换行
        let wordCount = 0;

        // 统计中文字符作为词
        let chineseWordCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;

        // 使用正则表达式来统计英文词数
        let englishWordCount = (text.match(/\b[\w']+\b/g) || []).length;

        // 总词数为中文字符数加英文词数
        wordCount = chineseWordCount + englishWordCount;

        return { charCount, wordCount };
    }
}
