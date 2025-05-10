"use client";

import { useState } from "react";
import  Chatbot from "@/components/Chatbot";
import { FiMessageCircle, FiX } from "react-icons/fi"; 

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-[350px] h-[500px] bg-white shadow-lg rounded-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between bg-blue-600 text-white p-2">
            <span className="font-semibold">Budgetwize Assistant</span>
            <button onClick={() => setIsOpen(false)}>
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Chatbot />
          </div>
        </div>
      ) : (
        <button
          className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition"
          onClick={() => setIsOpen(true)}
        >
          <FiMessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default FloatingChatbot;