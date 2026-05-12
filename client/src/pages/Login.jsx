import { useState } from "react";
import useAuthStore from "../store/UserSlice";
import { useNavigate } from "react-router-dom";

export default function AuthForm() {
  const [mode, setMode] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const register = useAuthStore((state) => state.register);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const switchTab = (next) => {
    if (next === mode || loading) return;
    setMode(next);
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (mode === "signup" && !name.trim()) e.name = "Name is required";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = "Valid email required";
    if (password.length < 6) e.password = "Min. 6 characters";
    return e;
  };

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 450);
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      triggerShake();
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      let success = false;

      if (mode === "signin") {
        success = await login(email, password);
      } else {
        success = await register(name, email, password);
      }

      if (success) {
        setSuccess(true);
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setErrors({ general: mode === "signin" ? "Invalid email or password." : "Registration failed. Try again." });
        triggerShake();
      }

    } catch (error) {
      console.error(error);
      setErrors({ general: "Something went wrong. Please try again." });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className={`bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-sm transition-all ${shaking ? "animate-shake" : ""}`}>

        {success ? (
          <div className="text-center py-4 animate-fade-up">
            <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {mode === "signin" ? "Signed in!" : "Account created!"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {mode === "signin" ? "Welcome back." : "Welcome aboard!"}
            </p>
          </div>
        ) : (
          <>
            {/* Tab Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6 relative">
              <div className={`absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-white rounded-lg border border-gray-200 shadow-sm transition-transform duration-300 ${mode === "signup" ? "translate-x-full" : ""}`} />
              {["signin", "signup"].map((m) => (
                <button
                  key={m}
                  onClick={() => switchTab(m)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg relative z-10 transition-colors duration-200 ${mode === m ? "text-gray-900" : "text-gray-400"}`}
                >
                  {m === "signin" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            {/* Heading */}
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm text-gray-500 mb-5">
              {mode === "signin" ? "Sign in to your account to continue" : "Sign up and get started today"}
            </p>

            {/* General error banner */}
            {errors.general && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4 animate-fade-up">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-red-600 font-medium">{errors.general}</p>
              </div>
            )}

            {/* Name field (signup only) */}
            <div className={`overflow-hidden transition-all duration-300 ${mode === "signup" ? "max-h-24 opacity-100 mb-4" : "max-h-0 opacity-0"}`}>
              <Field label="Full name" error={errors.name}>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass(errors.name)}
                />
              </Field>
            </div>

            {/* Email */}
            <div className="mb-4">
              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass(errors.email)}
                />
              </Field>
            </div>

            {/* Password */}
            <div className="mb-5">
              <Field label="Password" error={errors.password}>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className={inputClass(errors.password)}
                />
              </Field>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
              )}
              {loading
                ? mode === "signin" ? "Signing in…" : "Creating account…"
                : mode === "signin" ? "Sign in" : "Sign up"}
            </button>

            {/* Footer */}
            <p className="text-center text-sm text-gray-500 mt-4">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => switchTab(mode === "signin" ? "signup" : "signin")}
                className="text-gray-900 font-semibold underline underline-offset-2"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
        @keyframes fade-up {
          from{opacity:0;transform:translateY(10px)}
          to{opacity:1;transform:translateY(0)}
        }
        .animate-shake { animation: shake 0.4s ease; }
        .animate-fade-up { animation: fade-up 0.4s ease; }
      `}</style>
    </div>
  );
}

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
    {children}
    {error && (
      <div className="flex items-center gap-1.5 mt-1 animate-fade-up">
        <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-xs text-red-500">{error}</p>
      </div>
    )}
  </div>
);

const inputClass = (error) =>
  `w-full px-3 py-2.5 text-sm rounded-xl border bg-gray-50 text-gray-900 outline-none
   focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all
   ${error ? "border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100" : "border-gray-200"}`;