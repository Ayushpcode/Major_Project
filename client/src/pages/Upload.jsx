import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUploadStore from "../store/uploadStore";

export default function UploadPDF() {
  const { file, uploading, progress, done, error, documentId, setFile, setError, reset, uploadFile } = useUploadStore();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Reset store every time this page mounts so second upload works
  useEffect(() => {
    reset();
  }, []);

  // Redirect after success
  useEffect(() => {
    if (done && documentId) {
      const timer = setTimeout(() => {
        navigate(`/dashboard/chat/${documentId}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [done, documentId]);

  const validateFile = (f) => {
    if (!f) return "No file selected.";
    if (f.type !== "application/pdf") return "Only PDF files are allowed.";
    if (f.size > 50 * 1024 * 1024) return "File exceeds 50 MB limit.";
    return "";
  };

  const handleFile = (f) => {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const formatSize = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + " MB";

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: #3b82f6; }
          50%       { border-color: #93c5fd; }
        }
        @keyframes bounceIcon {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes checkPop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes progressShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-fade-up     { animation: fadeUp 0.5s ease both; }
        .animate-bounce-icon { animation: bounceIcon 1.2s ease-in-out infinite; }
        .animate-check-pop   { animation: checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        .drag-active         { animation: pulse-border 1s ease-in-out infinite; }
        .progress-bar {
          background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 40%, #93c5fd 60%, #3b82f6 100%);
          background-size: 200% 100%;
          animation: progressShimmer 1.5s linear infinite;
        }
      `}</style>

      <div className="fixed inset-0 bg-gray-100 flex flex-col items-center justify-center px-4 overflow-hidden">

        {/* Heading */}
        <div className="text-center mb-8 animate-fade-up">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Upload PDF</h1>
          <p className="text-gray-500 mt-2 text-base">Drag and drop or click to select a file</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 w-full max-w-lg animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          {done ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-check-pop">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900">Upload complete!</p>
              <p className="text-sm text-gray-400">{file?.name}</p>
              <p className="text-xs text-gray-400">Redirecting to chat...</p>
            </div>
          ) : (
            <>
              {/* ── Drop zone ── */}
              <div
                onClick={() => !uploading && inputRef.current.click()}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-12 px-6 cursor-pointer transition-all duration-300 select-none
                  ${dragging
                    ? "border-blue-400 bg-blue-50 scale-[1.02] drag-active"
                    : file
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
                  }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />

                {/* Icon */}
                {dragging ? (
                  <div className="animate-bounce-icon mb-4">
                    <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.043 11.095" />
                    </svg>
                  </div>
                ) : file ? (
                  <div className="mb-4 w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                ) : (
                  <div className="mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.043 11.095" />
                    </svg>
                  </div>
                )}

                {/* Text */}
                {file ? (
                  <div className="text-center">
                    <p className="font-semibold text-gray-800 text-sm truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatSize(file.size)}</p>
                    {!uploading && (
                      <p className="text-xs text-blue-500 mt-2 underline underline-offset-2">Click to change file</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-semibold text-gray-700">{dragging ? "Drop it here!" : "Drag your PDF here"}</p>
                    <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                  </div>
                )}

                {dragging && (
                  <div className="absolute inset-0 rounded-2xl bg-blue-50/60 flex items-center justify-center">
                    <p className="text-blue-500 font-bold text-lg">Release to drop</p>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mt-3 animate-fade-up">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Progress bar */}
              {uploading && (
                <div className="mt-5 animate-fade-up">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Uploading…</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full progress-bar transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex gap-1.5 mt-3 justify-center">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-blue-400"
                        style={{ animation: `bounceIcon 1s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upload button */}
              {!uploading && (
                <button
                  onClick={uploadFile}
                  disabled={!file}
                  className={`mt-5 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98]
                    ${file
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200"
                      : "bg-gray-100 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  Upload PDF
                </button>
              )}
            </>
          )}
        </div>

        {!done && (
          <p className="text-sm text-gray-400 mt-5 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Maximum file size: 50 MB
          </p>
        )}
      </div>
    </>
  );
}