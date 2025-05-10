'use client';
import React, { useState } from "react";

export default function NotificationsSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Notification Settings</h2>
      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
          Email Notifications
        </label>
      </div>
      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={smsNotifications} onChange={() => setSmsNotifications(!smsNotifications)} />
          SMS Notifications
        </label>
      </div>
    </div>
  );
}
