
import React, { useState, useRef } from 'react';
import { Upload, Book as BookIcon, Loader2, FileDown, AlertCircle, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import { Book } from '../types';
import { ocrImage } from '../services/aiService';
// @ts-ignore
import e from 'epubjs';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
} catch (err) {
  console.warn("PDF Worker 配置失败:", err);
}

interface UploaderProps {
  onUpload: (book: Book) => void;
}

const Uploader: React.FC<UploaderProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{msg: string, type: 'error' | 'warning'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractPdfText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/', 
      cMapPacked: true,
      standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/standard_fonts/',
      isEvalSupported: false
    });
    
    const pdf = await loadingTask.promise;
    let fullText = "";
    const maxPages = Math.min(pdf.numPages, 1000); 
    
    for (let i = 1; i <= maxPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await (page as any).getTextContent({
          includeMarkedContent: true,
          disableCombineTextItems: false
        });
        
        let lastY = -1;
        let pageLines: string[] = [];
        let currentLine = "";

        for (const item of textContent.items) {
          if (!("str" in item)) continue;
          const y = item.transform[5];
          if (lastY !== -1 && Math.abs(y - lastY) > 5) {
            pageLines.push(currentLine.trim());
            currentLine = "";
          }
          currentLine += item.str;
          if (item.hasEOL) currentLine += " ";
          lastY = y;
        }
        if (currentLine) pageLines.push(currentLine.trim());
        fullText += pageLines.join("\n") + "\n\n";
      } catch (e) {
        console.warn(`第 ${i} 页解析异常:`, e);
      }
    }
    
    const finalResult = fullText.trim();
    if (finalResult.length < pdf.numPages * 10) {
      throw new Error("该 PDF 可能是扫描图片或受强力加密保护。您可以尝试直接上传 PDF 的截图图片。");
    }
    return finalResult;
  };

  const extractEpubText = async (arrayBuffer: ArrayBuffer): Promise<{ text: string, title: string, author: string }> => {
    // @ts-ignore
    const book = e(arrayBuffer);
    const bookObj = book as any;
    
    try {
      await bookObj.opened;
    } catch (err) {
      throw new Error("EPUB 文件无法打开，可能已损坏或受 DRM 保护。");
    }
    
    const metadata = bookObj.package?.metadata || {};
    const bookTitle = metadata.title || "未命名书籍";
    const bookAuthor = metadata.creator || "未知作者";
    
    let fullText = "";
    const spine = bookObj.spine;
    
    if (spine && spine.items) {
      for (const section of spine.items) {
        try {
          const doc = await section.load(bookObj.load.bind(bookObj));
          const contentNode = (typeof doc === 'string') 
            ? new DOMParser().parseFromString(doc, 'text/html')
            : (doc instanceof Document ? doc : section.document);

          if (contentNode && contentNode.body) {
            const trash = contentNode.body.querySelectorAll('script, style, link, meta');
            trash.forEach((s: any) => s.remove());
            
            // To support images in EPUB eventually, we could handle <img> tags here
            const text = contentNode.body.innerText || contentNode.body.textContent || "";
            fullText += text.split('\n').map(l => l.trim()).filter(l => l).join('\n\n') + '\n\n';
          }
          section.unload();
        } catch (err) {
          console.warn("章节提取失败:", err);
        }
      }
    }
    
    return { 
      text: fullText.trim(), 
      title: bookTitle, 
      author: bookAuthor 
    };
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setErrorInfo(null);
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const base64Data = event.target?.result as string;
            // Use Gemini to OCR the image
            const transcribedText = await ocrImage(base64Data, file.type);
            
            onUpload({
              id: Math.random().toString(36).substr(2, 9),
              title: `图片: ${file.name.replace(/\.[^/.]+$/, "")}`,
              author: '视觉识别',
              content: transcribedText,
              type: 'image',
              originalImage: base64Data
            });
            setIsProcessing(false);
          } catch (err: any) {
            setErrorInfo({ msg: `AI 识别失败: ${err.message}`, type: 'error' });
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(file);
      } else if (extension === 'epub') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            const result = await extractEpubText(arrayBuffer);
            onUpload({
              id: Math.random().toString(36).substr(2, 9),
              title: result.title,
              author: result.author,
              content: result.text,
              type: 'epub'
            });
            setIsProcessing(false);
          } catch (err: any) {
            setErrorInfo({ msg: err.message, type: 'error' });
            setIsProcessing(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (extension === 'pdf') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            const content = await extractPdfText(arrayBuffer);
            onUpload({
              id: Math.random().toString(36).substr(2, 9),
              title: file.name.replace(/\.[^/.]+$/, ""),
              author: 'PDF 导入',
              content: content,
              type: 'pdf'
            });
            setIsProcessing(false);
          } catch (err: any) {
            setErrorInfo({ msg: err.message, type: 'error' });
            setIsProcessing(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (['txt', 'md', 'html', 'htm'].includes(extension || '')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          let text = event.target?.result as string;
          if (extension === 'html' || extension === 'htm') {
            const doc = new DOMParser().parseFromString(text, 'text/html');
            text = doc.body.innerText;
          }
          onUpload({
            id: Math.random().toString(36).substr(2, 9),
            title: file.name.replace(/\.[^/.]+$/, ""),
            author: '本地文档',
            content: text,
            type: extension === 'md' ? 'md' : 'txt'
          });
          setIsProcessing(false);
        };
        reader.readAsText(file);
      } else {
        setErrorInfo({ msg: "不支持的文件格式。请尝试 EPUB, PDF, 图片或 TXT。", type: 'error' });
        setIsProcessing(false);
      }
    } catch (err) {
      setErrorInfo({ msg: "处理文件时出错，请重试。", type: 'error' });
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-6">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`max-w-xl mx-auto mt-10 p-12 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center text-center group relative overflow-hidden ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:border-indigo-400'
        }`}
      >
        {isProcessing && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="font-bold text-gray-800 text-lg">正在智能解析中...</p>
            <p className="text-sm text-gray-400 mt-2 px-10">如果是图片，我们将使用 AI 识别文字内容</p>
          </div>
        )}

        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform duration-500 ${isDragging ? 'scale-110 bg-indigo-100 text-indigo-600' : 'bg-gray-50 text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50'}`}>
          <Upload className="w-10 h-10" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">添加您的电子书或照片</h2>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
          拖放文件到这里，或点击下方按钮上传。<br/>支持 EPUB, PDF, PNG/JPG, TXT。
        </p>
        
        <div className="flex flex-col gap-3">
          <label className="cursor-pointer bg-indigo-600 text-white px-10 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center gap-2">
            <BookIcon className="w-5 h-5" />
            选择文件
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".txt,.md,.html,.htm,.epub,.pdf,image/*" 
              onChange={handleFileChange} 
            />
          </label>
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">你可以直接上传书页的照片</p>
        </div>
      </div>

      {errorInfo && (
        <div className={`max-w-xl mx-auto flex items-start gap-4 p-5 rounded-2xl border ${
          errorInfo.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-amber-50 border-amber-100 text-amber-800'
        }`}>
          {errorInfo.type === 'error' ? <ShieldAlert className="w-6 h-6 flex-shrink-0" /> : <AlertCircle className="w-6 h-6 flex-shrink-0" />}
          <div>
            <p className="font-bold mb-1">{errorInfo.type === 'error' ? '解析失败' : '特别提醒'}</p>
            <p className="text-sm leading-relaxed opacity-90">{errorInfo.msg}</p>
            <button onClick={() => setErrorInfo(null)} className="mt-3 text-xs font-bold underline">关闭提示</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Uploader;
