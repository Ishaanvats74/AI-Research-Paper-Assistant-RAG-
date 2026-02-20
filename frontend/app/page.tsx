"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function LandingPage() {

  const router = useRouter();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-center px-6">

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-bold mb-6"
      >
        📄 AI Research Paper Assistant
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-600 max-w-xl mb-8"
      >
        Upload your research papers and ask questions grounded strictly in your document using Local AI.
      </motion.p>

      <Button
        size="lg"
        onClick={() => router.push("/upload")}
      >
        Get Started
      </Button>

    </div>
  );
}