import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import useAuthStore from "../store/UserSlice";

const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Upload PDF", path: "/dashboard/upload" },
    { label: "Chat",       path: "/dashboard/chat/:id" },
];

const NavBtn = ({ label, path, active }) => (
    <Link
        to={path}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left
      ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
    >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-white" : "bg-gray-600"}`} />
        {label}
    </Link>
);

export default function DashboardLayout() {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuthStore();

    // "Sarah Chen" → "SC"
    const getInitials = (name = "") =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const isActive = (path) => {
        if (path === "/dashboard") return location.pathname === "/dashboard";
        return location.pathname.startsWith(path);
    };

    return (
        <>
            <style>{`
              @keyframes fadeUp {
                from { opacity: 0; transform: translateY(16px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <div className="flex h-screen bg-gray-50 overflow-hidden">

                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-60 bg-gray-950 flex flex-col py-6 px-4 shrink-0
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-lg shrink-0">⚖️</div>
                        <span className="text-white font-bold text-lg tracking-tight">Legal AI</span>
                    </div>

                    {/* Nav items */}
                    <nav className="flex flex-col gap-1 flex-1">
                        {navItems.map((item) => (
                            <NavBtn
                                key={item.label}
                                label={item.label}
                                path={item.path}
                                active={isActive(item.path)}
                                onClick={() => setSidebarOpen(false)}
                            />
                        ))}
                    </nav>

                    {/* Logout pinned to bottom */}
                    <div className="pt-4 border-t border-gray-800">
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-600" />
                            Logout
                        </button>
                    </div>
                </aside>

                {/* Main */}
                <main className="flex-1 flex flex-col overflow-hidden min-w-0">

                    {/* Navbar */}
                    <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between gap-4 shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Hamburger (mobile) */}
                            <button
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors shrink-0"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                                    {navItems.find(i => isActive(i.path))?.label ?? "Dashboard"}
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block mt-0.5">
                                    Manage and analyze your legal documents with AI
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            {/* Upload button */}
                            <Link
                                to="/dashboard/upload"
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold px-3 sm:px-5 py-2.5 rounded-xl shadow-md shadow-blue-200 transition-all duration-200 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                                <span className="hidden sm:inline">Upload PDF</span>
                            </Link>

                            {/* User */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-semibold text-gray-900 leading-none">
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">{user?.email || ""}</p>
                                </div>
                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {getInitials(user?.name || "U")}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Dynamic Content */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
                        <Outlet />
                    </div>
                </main>

            </div>
        </>
    );
}