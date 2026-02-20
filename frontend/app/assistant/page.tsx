"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Send, Upload } from "lucide-react";

export default function AssistantPage() {
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAsk = async () => {
    if (!question.trim()) return;

    const userMsg = { role: "user" as const, content: question };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();

    const aiMsg = {
      role: "assistant" as const,
      content: data.answer,
    };

    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  // 🔥 ENTER KEY SUPPORT
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <div className="p-4 border-b bg-white shadow-sm flex justify-between items-center">
        <h1 className="text-lg font-semibold">📄 AI Research Assistant</h1>

        {/* Upload New Document */}
        <Button variant="outline" onClick={() => router.push("/")}>
          <Upload size={16} className="mr-2" />
          New Document
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-400">
            Ask anything about your document...
          </p>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-lg px-4 py-2 rounded-2xl shadow ${
                msg.role === "user" ? "bg-blue-500 text-white" : "bg-white"
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}

        {loading && <p className="text-sm text-gray-400">Thinking...</p>}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white flex gap-2">
        <Input
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown} // 🔥 ENTER
        />

        <Button onClick={handleAsk} disabled={loading}>
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
