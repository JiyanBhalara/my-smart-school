// app/(root)/onboarding/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Role = "STUDENT" | "TEACHER";

export default function Onboarding() {
  const router = useRouter();
  const { update } = useSession();

  const [form, setForm] = useState<{
    birthdate: string;
    school: string;
    role: Role;
  }>({
    birthdate: "",
    school: "",
    role: "STUDENT",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to save onboarding data");
      setLoading(false);
      return;
    }

    // mark onboarding complete in the session so middleware stops redirecting
    await update({ profileComplete: true });

    router.push("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8" 
          style={{ backgroundColor: '#8ECAE6' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full opacity-10 animate-pulse"
             style={{ backgroundColor: '#023047' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full opacity-10 animate-pulse delay-1000"
             style={{ backgroundColor: '#FFB703' }}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header section */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200"
               style={{ backgroundColor: '#023047' }}>
            <svg className="w-8 h-8" style={{ color: '#8ECAE6' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#023047' }}>
            Welcome aboard!
          </h1>
          <p className="text-lg opacity-80" style={{ color: '#023047' }}>
            Tell us a bit about yourself to get started
          </p>
        </div>

        {/* Form container */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 transform hover:shadow-3xl transition-shadow duration-300 animate-slideUp"
        >
          {error && (
            <div className="p-4 rounded-xl text-sm text-center animate-shake"
                 style={{ backgroundColor: '#FB8500', color: 'white' }}>
              {error}
            </div>
          )}

          {/* Birth-date field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold" style={{ color: '#023047' }}>
              Birth Date
            </label>
            <input
              type="date"
              required
              className="w-full rounded-xl border-2 p-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 hover:border-opacity-70"
              style={{ 
                borderColor: '#219EBC'
              }}
              value={form.birthdate}
              onChange={(e) =>
                setForm((f) => ({ ...f, birthdate: e.target.value }))
              }
            />
          </div>

          {/* School field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold" style={{ color: '#023047' }}>
              School / Institution
            </label>
            <input
              type="text"
              required
              placeholder="Enter your school name"
              className="w-full rounded-xl border-2 p-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 hover:border-opacity-70 placeholder-gray-400"
              style={{ 
                borderColor: '#219EBC',
              }}
              value={form.school}
              onChange={(e) =>
                setForm((f) => ({ ...f, school: e.target.value }))
              }
            />
          </div>

          {/* Role selection */}
          <div className="space-y-3">
            <legend className="block text-sm font-semibold" style={{ color: '#023047' }}>
              I am a
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Student", value: "STUDENT", icon: "📚" },
                { label: "Teacher", value: "TEACHER", icon: "👨‍🏫" },
              ].map(({ label, value, icon }) => (
                <label key={value} className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={form.role === value}
                    onChange={() =>
                      setForm((f) => ({ ...f, role: value as Role }))
                    }
                    className="sr-only"
                  />
                  <div className={`
                    p-4 rounded-xl border-2 text-center transition-all duration-200 
                    group-hover:scale-105 group-hover:shadow-md
                    ${form.role === value 
                      ? 'border-[#023047] shadow-lg' 
                      : 'border-gray-200 hover:border-[#219EBC]'
                    }
                  `}
                  style={{
                    backgroundColor: form.role === value ? '#8ECAE6' : 'white',
                    color: form.role === value ? '#023047' : '#666'
                  }}>
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="font-medium text-sm">{label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl font-semibold text-white text-sm transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-4 focus:ring-opacity-50"
            style={{ 
              backgroundColor: loading ? '#219EBC' : '#023047',
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Setting up your profile...</span>
              </div>
            ) : (
              "Continue to Dashboard"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 animate-fadeIn delay-300">
          <p className="text-sm opacity-70" style={{ color: '#023047' }}>
            Your information is secure and will not be shared
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.8s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.3);
        }
        
        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </main>
  );
}