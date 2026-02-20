"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

export default function RagAssistantFrontendPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploaded(true);
      }
    } catch (e) {
      console.error(e);
    }

    setUploading(false);
  };

  const handleAsk = async () => {
    if (!question) return;

    const userMsg = { role: "user" as const, content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      const aiMsg = { role: "assistant" as const, content: data.answer };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
    setQuestion("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">AI Research Paper Assistant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>

            {uploaded && (
              <div className="border rounded-xl p-4 h-96 overflow-y-auto bg-white">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    <div className={`inline-block px-4 py-2 rounded-xl ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && <p className="text-sm text-gray-500">Thinking...</p>}
              </div>
            )}

            {uploaded && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask a question from the document..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <Button onClick={handleAsk} disabled={loading}>
                  Ask
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
