'use client';

import React, { useState } from "react";
import { User, Brush, Bell } from "lucide-react";
import AccountSettings from "@/components/AccountSettings";

import AppearanceSettings from "@/components/AppearanceSettings";
import NotificationsSettings from "@/components/NotificationSettings";
import DeleteAccountModal from "@/components/DeleteAccountModal";

export default function SettingsPage() {
  const [section, setSection] = useState("account");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">User Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <ul className="space-y-4">
            <li>
              <button onClick={() => setSection("account")} className="flex items-center gap-2 hover:text-blue-600">
                <User className="w-4 h-4" /> Account
              </button>
            </li>
            <li>
              <button onClick={() => setSection("appearance")} className="flex items-center gap-2 hover:text-blue-600">
                <Brush className="w-4 h-4" /> Appearance
              </button>
            </li>
            <li>
              <button onClick={() => setSection("notifications")} className="flex items-center gap-2 hover:text-blue-600">
                <Bell className="w-4 h-4" /> Notifications
              </button>
            </li>
            <li>
              <button onClick={() => setShowDeleteModal(true)} className="text-red-500 hover:underline">
                Delete Account
              </button>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3 bg-white p-6 rounded shadow">
          {section === "account" && <AccountSettings />}
          {section === "appearance" && <AppearanceSettings />}
          {section === "notifications" && <NotificationsSettings />}
        </div>
      </div>

      {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />}
    </div>
  );
}