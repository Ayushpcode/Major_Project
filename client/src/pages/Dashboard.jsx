import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useChatStore from "../store/ChatStore";

const FileIcon = () => (
  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-slate-100">
    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  </div>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const DocCard = ({ doc, index }) => {
  const navigate = useNavigate();
  const { deleteDocument } = useChatStore();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    await deleteDocument(doc._id);
    setDeleting(false);
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:border-blue-300"
      style={{ animation: `fadeUp 0.4s ease both`, animationDelay: `${index * 70}ms` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <FileIcon />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap bg-blue-100 text-blue-600">
            PDF
          </span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title={confirmDelete ? "Click again to confirm" : "Delete document"}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-40
              ${confirmDelete
                ? "bg-red-100 text-red-600 hover:bg-red-200"
                : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500"
              }`}
          >
            {deleting
              ? <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              : <DeleteIcon />
            }
          </button>
        </div>
      </div>

      {/* Confirm hint — reserved height so card doesn't shift */}
      <p className={`text-xs text-red-500 -mt-2 transition-opacity duration-200 ${confirmDelete ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        Click delete again to confirm
      </p>

      {/* Doc info */}
      <div className="flex-1">
        <p className="font-semibold text-sm leading-snug text-gray-900">{doc.fileName}</p>
        <p className="text-xs text-gray-400 mt-1">Uploaded {formatDate(doc.createdAt)}</p>
        <p className="text-xs text-gray-400">{doc.totalChunks} chunks</p>
      </div>

      {/* Ask AI */}
      <button
        onClick={() => navigate(`/dashboard/chat/${doc._id}`)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 bg-gray-100 text-gray-700 hover:bg-gray-200"
      >
        ✦ Ask AI
      </button>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="w-11 h-11 rounded-xl bg-gray-200" />
      <div className="w-16 h-6 rounded-full bg-gray-200" />
    </div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
    <div className="h-10 bg-gray-100 rounded-xl" />
  </div>
);

export default function LegalAIDashboard() {
  const { documents, documentsLoading, fetchDocuments } = useChatStore();

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
      {documentsLoading ? (
        <>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
          <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m.75-3h4.5M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="font-medium">No documents yet</p>
          <p className="text-sm mt-1">Upload a PDF to get started</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 font-medium mb-5">{documents.length} documents available</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {documents.map((doc, i) => (
              <DocCard key={doc._id} doc={doc} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}