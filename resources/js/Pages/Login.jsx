import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Modal";

export default function Login() {
    const { data, setData, post, errors } = useForm({
        username: "",
        password: "",
    });
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotStatus, setForgotStatus] = useState("");
    const [forgotError, setForgotError] = useState("");
    const [forgotProcessing, setForgotProcessing] = useState(false);

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
        <div className="min-h-screen relative flex items-center justify-center">
            <img src="/pics/digos-cityhall.jpg" alt="Digos City Hall" className="absolute inset-0 w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-black/20"/>
            <form
                onSubmit={submit}
                className="relative bg-white/95 backdrop-blur p-8 rounded-xl shadow-lg w-96"
            >
                <h1 className="text-2xl font-bold mb-6 text-center">
                    Login
                </h1>

                {errors.error && (
                    <p className="text-red-500 text-sm mb-4">{errors.error}</p>
                )}

                <label className="block mb-2 text-sm font-medium">
                    Username
                </label>
                <input
                    type="text"
                    className="w-full border rounded p-2 mb-4"
                    value={data.username}
                    onChange={(e) => setData("username", e.target.value)}
                />

                <label className="block mb-2 text-sm font-medium">
                    Password
                </label>
                <input
                    type="password"
                    className="w-full border rounded p-2 mb-4"
                    value={data.password}
                    onChange={(e) => setData("password", e.target.value)}
                />

                <button
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700"
                >
                    Login
                </button>

                <div className="mt-3 text-center">
                    <button type="button" className="text-sm text-emerald-700 hover:underline" onClick={() => setShowForgot(true)}>Forgot password?</button>
                </div>
            </form>

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
                        <input type="email" className="w-full border rounded p-2" value={forgotEmail} onChange={(e)=>setForgotEmail(e.target.value)} required />
                        <div className="mt-4 flex items-center justify-end gap-2">
                            <button type="button" className="px-3 py-2 rounded border" onClick={()=>setShowForgot(false)}>Close</button>
                            <button type="submit" disabled={forgotProcessing} className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-60">Send Reset Link</button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
