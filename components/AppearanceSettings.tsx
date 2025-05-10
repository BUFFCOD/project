'use client';
import React, { useEffect, useState } from "react";

export default function AppearanceSettings() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Appearance Settings</h2>
      <div className="mb-4">
        <label className="block font-medium mb-2">Theme</label>
        <select className="w-full p-2 border rounded" value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
    </div>
  );
}
