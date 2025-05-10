"use client";

import React, {
  useState,
  useRef,
  useEffect,
  FormEvent,
  useCallback,
} from "react";
import { useAuth } from "@clerk/nextjs";

interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

interface AccountSummary {
  name: string;
  balances: {
    current: number;
    available?: number;
    iso_currency_code?: string;
  };
}

interface TransactionSummary {
  name: string;
  amount: number;
  date: string;
  category: string | string[];
  merchant_name?: string;
}

interface ChatbotProps {
  accounts?: AccountSummary[];
  transactions?: TransactionSummary[];
}

export default function Chatbot({
  accounts = [],
  transactions = [],
}: ChatbotProps) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPlaidConnection, setNeedsPlaidConnection] = useState(false);
  const { getToken } = useAuth();

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, needsPlaidConnection]);

  const handleSubmit = useCallback(
    async (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      const trimmedMessage = message.trim();
      if (!trimmedMessage || isLoading) return;

      const userMessage: ChatMessage = {
        role: "user",
        parts: [{ text: trimmedMessage }],
      };
      const historyToSend = [...chatHistory];

      setChatHistory((prev) => [...prev, userMessage]);
      setMessage("");
      setIsLoading(true);
      setError(null);
      setNeedsPlaidConnection(false);

      try {
        const token = await getToken();
        if (!token) {
          setError("You must be logged in to ask a question.");
          setIsLoading(false);
          return;
        }

        const payload = {
          message: trimmedMessage,
          history: historyToSend,
          context: {
            accounts,
            transactions,
          },
        };

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `API Error: ${response.status} ${response.statusText}`
          );
        }

        if (data.needsPlaidConnection) {
          setNeedsPlaidConnection(true);
          if (data.text) {
            setChatHistory((prev) => [
              ...prev,
              { role: "model", parts: [{ text: data.text }] },
            ]);
          }
        } else if (data.text) {
          setChatHistory((prev) => [
            ...prev,
            { role: "model", parts: [{ text: data.text }] },
          ]);
        } else {
          setError("Received an empty response from the assistant.");
        }
      } catch (err: any) {
        console.error("Chatbot Error:", err);
        setError(err.message || "Failed to communicate with the chatbot.");
      } finally {
        setIsLoading(false);
      }
    },
    [message, isLoading, chatHistory, getToken, accounts, transactions]
  );

  const styles = {
    container: {
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "15px",
      maxWidth: "600px",
      margin: "20px auto",
      display: "flex",
      flexDirection: "column",
      height: "600px",
      backgroundColor: "#f9f9f9",
    },
    chatArea: {
      flexGrow: 1,
      overflowY: "auto",
      marginBottom: "15px",
      paddingRight: "10px",
    },
    messageBubble: (role: "user" | "model") => ({
      marginBottom: "10px",
      textAlign: role === "user" ? "right" : "left",
    }),
    
    messageContent: (role: "user" | "model") => ({
      display: "inline-block",
      padding: "8px 12px",
      borderRadius: "15px",
      backgroundColor: role === "user" ? "#007bff" : "#e9ecef",
      color: role === "user" ? "white" : "black",
      maxWidth: "80%",
      textAlign: "left",
      wordWrap: "break-word",
    }),
    form: { display: "flex", marginTop: "auto" },
    input: {
      flexGrow: 1,
      padding: "10px",
      marginRight: "10px",
      border: "1px solid #ccc",
      borderRadius: "5px",
    },
    button: {
      padding: "10px 15px",
      border: "none",
      borderRadius: "5px",
      backgroundColor: "#007bff",
      color: "white",
      cursor: "pointer",
      opacity: isLoading ? 0.7 : 1,
    },
    loadingText: {
      textAlign: "left",
      fontStyle: "italic",
      color: "#666",
      padding: "5px 0",
    },
    errorText: { color: "red", marginTop: "10px", padding: "5px 0" },
    plaidPrompt: {
      textAlign: "center",
      margin: "10px 0",
      padding: "10px",
      backgroundColor: "#fff3cd",
      border: "1px solid #ffeeba",
      borderRadius: "5px",
      color: "#856404",
    },
  };

  return (
    <div style={styles.container}>
      <div ref={chatContainerRef} style={styles.chatArea}>
        {chatHistory.map((chatItem, index) => (
          <div key={index} style={styles.messageBubble(chatItem.role)}>
            <div style={styles.messageContent(chatItem.role)}>
              {chatItem.parts[0].text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={styles.loadingText}>Assistant is thinking...</div>
        )}
      </div>

      {error && <div style={styles.errorText}>Error: {error}</div>}

      {needsPlaidConnection && (
        <div style={styles.plaidPrompt}>
          Please connect your bank account to proceed with financial actions.
          <p style={{ fontSize: "0.8em", marginTop: "5px" }}>
            (You can then ask your question again)
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          ref={inputRef}
          style={styles.input}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isLoading ? "Waiting for response..." : "Ask the assistant..."
          }
          disabled={isLoading || needsPlaidConnection}
        />
        <button
          style={styles.button}
          type="submit"
          disabled={isLoading || !message.trim() || needsPlaidConnection}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
