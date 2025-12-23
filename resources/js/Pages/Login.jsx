import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Modal";

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        username: "",
        password: "",
    });
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotStatus, setForgotStatus] = useState("");
    const [forgotError, setForgotError] = useState("");
    const [forgotProcessing, setForgotProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post("/login");
    };

    const submitForgot = async (e) => {
        e.preventDefault();
        setForgotProcessing(true);
        setForgotStatus("");
        setForgotError("");
        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || "";
        try {
            const res = await fetch("/validator/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf },
                body: JSON.stringify({ email: forgotEmail })
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                setForgotStatus(json.message || "Reset link sent");
                setForgotEmail("");
            } else {
                setForgotError(json.message || "Request failed");
            }
        } catch (err) {
            setForgotError("Network error");
        }
        setForgotProcessing(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-5xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="relative h-80 md:h-[520px] bg-gray-100">
                        <img src="/pics/digos-cityhall.jpg" alt="Digos City Hall" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 via-emerald-500/20 to-emerald-400/10"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-white text-xl font-semibold">Welcome to CHoDaMS</h3>
                            <p className="text-emerald-50 text-xs mt-1">City Housing Data Management System</p>
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-500">User Login</span>
                        </div>
                        {errors.error && (
                            <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                                {errors.error}
                            </div>
                        )}
                        <form onSubmit={submit} className="mt-4 space-y-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData("username", e.target.value)}
                                    className="w-full border border-gray-300 rounded-full p-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                    placeholder="Enter username"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={data.password}
                                        onChange={(e) => setData("password", e.target.value)}
                                        className="w-full border border-gray-300 rounded-full p-2.5 pr-20 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                        placeholder="Enter password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute inset-y-0 right-4 flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full mt-2 px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70"
                            >
                                Log in
                            </button>
                            <div className="mt-2 text-center">
                                <button
                                    type="button"
                                    className="text-xs text-emerald-700 hover:underline"
                                    onClick={() => setShowForgot(true)}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="mt-2 text-xs text-gray-500 text-center">
                                Use Admin or Validator credentials
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <Modal show={showForgot} onClose={() => setShowForgot(false)} maxWidth="sm">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Forgot Password</h2>
                    <p className="mt-1 text-sm text-gray-600">Enter the email used for your validator account.</p>
                    {forgotStatus !== "" && (
                        <div className="mt-3 text-sm font-medium text-emerald-700">{forgotStatus}</div>
                    )}
                    {forgotError !== "" && (
                        <div className="mt-3 text-sm font-medium text-red-600">{forgotError}</div>
                    )}
                    <form onSubmit={submitForgot} className="mt-4">
                        <input
                            type="email"
                            className="w-full border rounded p-2"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            required
                        />
                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                className="px-3 py-2 rounded border"
                                onClick={() => setShowForgot(false)}
                            >
                                Close
                            </button>
                            <button
                                type="submit"
                                disabled={forgotProcessing}
                                className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-60"
                            >
                                Send Reset Link
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
