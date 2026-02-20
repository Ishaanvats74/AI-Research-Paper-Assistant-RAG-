"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { UploadCloud, Send } from "lucide-react";

export default function RagAssistantFrontendPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    setUploaded(true);
  };

  const handleAsk = async () => {
    if (!question) return;

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

    const aiMsg = { role: "assistant" as const, content: data.answer };
    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-100 to-slate-200">

      {/* Header */}
      <div className="p-4 border-b bg-white shadow-sm text-xl font-semibold text-center">
        📄 AI Research Paper Assistant
      </div>

      {/* Upload Section */}
      {!uploaded && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <Card className="p-10 flex flex-col gap-4 items-center">
            <UploadCloud size={40} />
            <p className="text-sm text-gray-500">
              Upload a Research Paper to Start Chatting
            </p>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button onClick={handleUpload}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </Card>
        </div>
      )}

      {/* Chat Section */}
      {uploaded && (
        <>
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
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {loading && (
              <p className="text-sm text-gray-400">Thinking...</p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white flex gap-2">
            <Input
              placeholder="Ask a question from your paper..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <Button onClick={handleAsk} disabled={loading}>
              <Send size={16} />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}