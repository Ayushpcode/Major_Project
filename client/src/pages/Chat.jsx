import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import useChatStore from "../store/ChatStore";

// ─── Icons ────────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FileIcon({ ext = "pdf" }) {
  const colors = { pdf: "#e24b4a", docx: "#378add", xlsx: "#639922" };
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3 2h7l3 3v9H3V2z" stroke={colors[ext] || "#888"} strokeWidth="1.2" />
      <path d="M10 2v3h3" stroke={colors[ext] || "#888"} strokeWidth="1.2" />
      <text x="4.5" y="12" fontSize="4" fontWeight="700" fill={colors[ext] || "#888"} fontFamily="sans-serif">
        {ext.toUpperCase()}
      </text>
    </svg>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHIPS = [
  "Summarize this document",
  "Extract key points",
  "Find any risks mentioned",
  "What are the main conclusions?",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-bl-sm">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-2 h-2 rounded-full bg-gray-400 inline-block"
            style={{ animation: "bounce 0.9s infinite", animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400 px-1">AI is typing…</span>
    </div>
  );
}

function SkeletonBubble() {
  return (
    <div className="flex flex-col gap-2 max-w-xs">
      <div className="h-3 w-48 rounded-full bg-gray-200 animate-pulse" />
      <div className="h-3 w-36 rounded-full bg-gray-200 animate-pulse" />
    </div>
  );
}

function EmptyState({ onChipClick }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
      <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="#9ca3af" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">Ask questions about your uploaded document</p>
        <p className="text-xs text-gray-400 mt-1">Get instant answers powered by AI</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => onChipClick(chip)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-full bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex flex-col gap-1 max-w-[70%] animate-fadeUp ${isUser ? "self-end items-end" : "self-start items-start"}`}>
      <div className={`px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${
        isUser
          ? "bg-gray-900 text-white rounded-br-sm"
          : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
      }`}>
        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
      </div>
      <span className="text-xs text-gray-400 px-1">{msg.time}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatInterface() {
  const { id } = useParams();

  const {
    messages,
    isTyping,
    isLoading,
    docName,
    fetchDocument,
    sendMessage,
    clearChat,
  } = useChatStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);

  // On mount: load document. On unmount: clear chat state.
  useEffect(() => {
    if (id) fetchDocument(id);
    return () => clearChat();
  }, [id]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(
    async (text = input.trim()) => {
      if (!text || isTyping || !id) return;
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      await sendMessage(id, text);
    },
    [input, isTyping, id, sendMessage]
  );

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const ext = docName?.split(".").pop()?.toLowerCase() || "pdf";
  const badgeColor = {
    pdf:  { bg: "bg-red-50",   border: "border-red-200",   text: "text-red-800"   },
    docx: { bg: "bg-blue-50",  border: "border-blue-200",  text: "text-blue-800"  },
    xlsx: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800" },
  }[ext] || { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800" };

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeUp { animation: fadeUp 0.2s ease-out; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>

      <div className="flex h-[81.5vh] bg-white font-sans">

        {/* ── Main ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">

          {/* Header */}
          <header className="px-5 py-3.5 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="h-7 w-44 rounded-md bg-gray-200 animate-pulse" />
              ) : (
                <div className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 border ${badgeColor.bg} ${badgeColor.border}`}>
                  <FileIcon ext={ext} />
                  <span className={`text-xs font-medium ${badgeColor.text}`}>
                    {docName || "Document"}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Ask questions about this document</p>
          </header>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 scroll-smooth scrollbar-thin"
          >
            {isLoading ? (
              <div className="flex flex-col gap-5 pt-2">
                <SkeletonBubble />
                <SkeletonBubble />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState onChipClick={(chip) => handleSend(chip)} />
            ) : (
              <>
                {messages.map((msg) => (
                  <Message key={msg.id} msg={msg} />
                ))}
                {isTyping && <TypingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKey}
                disabled={isLoading}
                placeholder="Ask about this document..."
                rows={1}
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl resize-none outline-none focus:border-gray-400 transition-colors bg-[#F8FAFC] text-gray-900 placeholder-gray-400 disabled:opacity-50"
                style={{ minHeight: "42px", maxHeight: "120px" }}
              />
              <button
                onClick={() => handleSend()}
                disabled={isTyping || !input.trim() || isLoading}
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-gray-900 rounded-lg hover:opacity-80 disabled:opacity-40 transition-all active:scale-95"
              >
                <SendIcon />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-1.5">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>

        </main>
      </div>
    </>
  );
}
