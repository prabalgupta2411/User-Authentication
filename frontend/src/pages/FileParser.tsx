import React, { useState } from 'react';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';

// Set the workerSrc for pdfjs to the local file in public
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

const FileParser = () => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setText('');
    setFileUrl(null);
    setFileType(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setFileUrl(URL.createObjectURL(file));
    setFileType(file.type);
    try {
      if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }
          if (!fullText.trim()) {
            setError('No text found in PDF. The PDF may be scanned or image-based.');
          }
          setText(fullText);
        } catch (err: any) {
          setError('Failed to parse PDF: ' + (err.message || err.toString()));
        }
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx')
      ) {
        // DOCX parsing
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setText(result.value);
      } else {
        setError('Unsupported file type. Please upload a PDF or DOCX file.');
      }
    } catch (err: any) {
      setError('Failed to parse file: ' + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#18181b', color: 'white', display: 'flex' }}>
      {/* Left column: Upload and Preview */}
      <div style={{ width: '35%', minWidth: 320, maxWidth: 480, background: '#23232a', padding: 32, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', borderRight: '1px solid #27272a' }}>
        <h2 style={{ fontSize: 24, marginBottom: 24 }}>File Parser</h2>
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          style={{ marginBottom: 16 }}
        />
        {loading && <div style={{ margin: '16px 0', color: '#aaa' }}>Parsing file...</div>}
        {error && <div style={{ color: 'red', margin: '16px 0' }}>{error}</div>}
        {/* File preview */}
        {fileUrl && (
          <div style={{ marginTop: 24, background: '#18181b', borderRadius: 8, padding: 12, minHeight: 200, maxHeight: 400, overflow: 'auto', boxShadow: '0 2px 8px #0002' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#e0e0e0' }}>Preview:</div>
            {fileType === 'application/pdf' ? (
              <iframe
                src={fileUrl}
                title="PDF Preview"
                style={{ width: '100%', height: 320, border: 'none', background: '#222' }}
              />
            ) : fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || (fileUrl && fileUrl.endsWith('.docx')) ? (
              <div style={{ color: '#aaa', fontStyle: 'italic' }}>DOCX preview not supported. Please see extracted text on the right.</div>
            ) : null}
          </div>
        )}
      </div>
      {/* Right column: Text output */}
      <div style={{ flex: 1, padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch' }}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#e0e0e0' }}>Extracted Text</div>
        <div style={{ flex: 1, background: '#23232a', borderRadius: 8, padding: 24, overflowY: 'auto', minHeight: 400, maxHeight: '80vh', color: '#fff', fontFamily: 'monospace', fontSize: 15 }}>
          {text ? text : <span style={{ color: '#888' }}>No text extracted yet.</span>}
        </div>
      </div>
    </div>
  );
};

export default FileParser;