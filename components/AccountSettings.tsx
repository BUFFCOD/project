'use client';
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function AccountSettings() {
  const { user } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setEmail(user.primaryEmailAddress?.emailAddress || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
  
    if (!user) {
      setMessage("User not found.");
      return;
    }
  
    try {
      await user.updatePassword({ newPassword: password });
      setMessage("Password updated successfully!");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password update error:", error);
      setMessage("Failed to update password. Make sure your account uses a password login.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Account Settings</h2>
      <div className="mb-4">
        <label className="block font-medium">Email</label>
        <input
          type="email"
          className="w-full p-2 border rounded bg-gray-100"
          value={email}
          readOnly // Remove this if you want users to edit their email
        />
      </div>
      <div className="mb-4">
        <label className="block font-medium">New Password</label>
        <input
          type="password"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block font-medium">Confirm Password</label>
        <input
          type="password"
          className="w-full p-2 border rounded"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save Changes
      </button>
      {message && <p className="mt-2 text-green-600">{message}</p>}
    </div>
  );
}
