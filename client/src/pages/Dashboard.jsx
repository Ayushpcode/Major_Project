import { useState } from "react";
import { Link } from "react-router-dom";

const docs = [
  { id: 1, name: "Service Agreement.pdf", date: "Apr 5, 2024", tag: "Service", tagColor: "bg-blue-100 text-blue-600" },
  { id: 2, name: "Employment Contract.pdf", date: "Apr 3, 2024", tag: "Employment", tagColor: "bg-purple-100 text-purple-600" },
  { id: 3, name: "NDA Template.pdf", date: "Apr 1, 2024", tag: "NDA", tagColor: "bg-gray-100 text-gray-600" },
  { id: 4, name: "Privacy Policy.pdf", date: "Mar 28, 2024", tag: "Policy", tagColor: "bg-green-100 text-green-600" },
  { id: 5, name: "Terms of Service.pdf", date: "Mar 25, 2024", tag: "Terms", tagColor: "bg-orange-100 text-orange-600" },
  { id: 6, name: "Partnership Agreement.pdf", date: "Mar 20, 2024", tag: "Partnership", tagColor: "bg-blue-100 text-blue-600", active: true },
];

const FileIcon = ({ active }) => (
  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-blue-100" : "bg-slate-100"}`}>
    <svg className={`w-5 h-5 ${active ? "text-blue-500" : "text-slate-400"}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  </div>
);

const DocCard = ({ doc, index }) => (
  <div
    className={`bg-white rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-md
      ${doc.active ? "border-blue-400 shadow-lg shadow-blue-100 scale-[1.01]" : "border-gray-200 hover:border-blue-300"}`}
    style={{ animation: `fadeUp 0.4s ease both`, animationDelay: `${index * 70}ms` }}
  >
    <div className="flex items-start justify-between gap-2">
      <FileIcon active={doc.active} />
      <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${doc.tagColor}`}>
        {doc.tag}
      </span>
    </div>

    <div className="flex-1">
      <p className={`font-semibold text-sm leading-snug ${doc.active ? "text-blue-600" : "text-gray-900"}`}>
        {doc.name}
      </p>
      <p className="text-xs text-gray-400 mt-1">Uploaded {doc.date}</p>
    </div>

    <button
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95
        ${doc.active
          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
    >
      ✦ Ask AI
    </button>
  </div>
);

export default function LegalAIDashboard() {

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <p className="text-sm text-gray-500 font-medium mb-5">{docs.length} documents available</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {docs.map((doc, i) => (
            <DocCard key={doc.id} doc={doc} index={i} />
          ))}
        </div>
      </div>
    </>
  );
}