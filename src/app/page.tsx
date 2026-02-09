'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Redirect to report page
      router.push(`/report/${data.batchId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong during upload.');
      setUploading(false);
    }
  }, [router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Upload Interview Log</h1>
        <p className="text-slate-500">
          Upload your monthly interview Excel/CSV file to generate an instant analysis report.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={clsx(
          "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors cursor-pointer bg-white",
          isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="font-medium text-slate-900">Analyzing...</p>
              <p className="text-sm text-slate-500">This might take a moment.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="font-medium text-lg text-slate-900">
                {isDragActive ? "Drop the file here" : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Supports .xlsx and .csv
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Upload Failed</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          Expected Format
        </h2>
        <div className="text-sm text-slate-600 space-y-2">
          <p>The file should contain columns for:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><strong>Date</strong> (e.g., 2023/01/01)</li>
            <li><strong>Name</strong> (Employee Name)</li>
            <li><strong>Content</strong> (Consultation/Problem details)</li>
            <li><strong>Action</strong> (Response/Action taken)</li>
          </ul>
          <p className="text-xs text-slate-400 mt-2">
            * Merged cells and newlines within cells are supported.
          </p>
        </div>
      </div>
    </div>
  );
}
