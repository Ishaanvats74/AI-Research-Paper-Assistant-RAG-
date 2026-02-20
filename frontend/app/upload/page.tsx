"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud } from "lucide-react";

export default function UploadPage() {

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

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

    // After upload → Go to chat page
    router.push("/assistant");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">

      <Card className="p-10 flex flex-col gap-4 items-center shadow-xl">

        <UploadCloud size={40} />

        <p className="text-sm text-gray-500">
          Upload Research Paper to Start Chatting
        </p>

        <Input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <Button onClick={handleUpload}>
          {uploading ? "Uploading..." : "Upload Paper"}
        </Button>

      </Card>
    </div>
  );
}