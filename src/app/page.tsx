'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadAndAnalyze } from '@/actions/upload';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [groupName, setGroupName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && /\.(xlsx?|csv)$/i.test(dropped.name)) {
      setFile(dropped);
      if (!groupName) {
        setGroupName(dropped.name.replace(/\.(xlsx?|csv)$/i, ''));
      }
    } else {
      setError('Excel (.xlsx) または CSV ファイルを選択してください');
    }
  }, [groupName]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!groupName) {
        setGroupName(selected.name.replace(/\.(xlsx?|csv)$/i, ''));
      }
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setError('');
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('groupName', groupName || 'default');

      setProgress(30);
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 5, 85));
      }, 500);

      const result = await uploadAndAnalyze(formData);

      clearInterval(interval);
      setProgress(100);
      setStatus('success');

      setTimeout(() => {
        router.push(`/batches/${result.batchId}`);
      }, 800);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : '解析中にエラーが発生しました');
      setProgress(0);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="animate-in">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          面談ログをアップロード
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 40, fontSize: 15 }}>
          Excel (.xlsx) または CSV ファイルをアップロードすると、自動で解析が実行されます。
        </p>
      </div>

      {/* Upload zone */}
      <div
        className={`upload-zone animate-in ${isDragging ? 'active' : ''}`}
        style={{ animationDelay: '0.1s' }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        {file ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <FileSpreadsheet size={48} style={{ color: 'var(--accent-green)' }} />
            <span style={{ fontWeight: 600, fontSize: 16 }}>{file.name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {(file.size / 1024).toFixed(1)} KB
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Upload size={48} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontWeight: 600, fontSize: 16 }}>
              ドラッグ＆ドロップ、またはクリックして選択
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              .xlsx / .csv 対応
            </span>
          </div>
        )}
      </div>

      {/* Group name input */}
      <div className="animate-in" style={{ marginTop: 24, animationDelay: '0.2s' }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
          団体名 / グループ名
        </label>
        <input
          className="input-field"
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="例: 〇〇協同組合"
        />
      </div>

      {/* Progress bar */}
      {status === 'uploading' && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Loader2 size={18} className="spin" style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>解析中...</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Success message */}
      {status === 'success' && (
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--accent-green)' }}>
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: 600 }}>解析完了！レポートに遷移します...</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--accent-red)' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Upload button */}
      <div className="animate-in" style={{ marginTop: 32, animationDelay: '0.3s' }}>
        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={!file || status === 'uploading'}
          style={{ width: '100%', padding: '16px', fontSize: 16 }}
        >
          {status === 'uploading' ? '解析中...' : '解析を開始'}
        </button>
      </div>
    </div>
  );
}
