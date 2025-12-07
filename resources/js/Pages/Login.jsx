import React, { useState } from "react";
import { useForm } from "@inertiajs/react";

export default function Login() {
    const { data, setData, post, errors } = useForm({
        username: "",
        password: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post("/login");
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
            </form>
        </div>
    );
}
