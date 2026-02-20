import { createClient } from '@supabase/supabase-js'

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// Upload file using standard upload
export async function uploadFile(file: File) {

  const filePath = `pdfs/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage.from("pdfs").upload(filePath, file);

  if (error) throw error;

  const { data: publicUrl } = supabase.storage.from("pdfs").getPublicUrl(filePath);

  return publicUrl.publicUrl;
}


export async function POST(req: Request) {

  const formData = await req.formData();
  const file = formData.get("file") as File;

  const pdfUrl = await uploadFile(file);

  // send url to fastapi
  await fetch("http://localhost:8000/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pdf_url: pdfUrl
    })
  });

  return Response.json({ success: true });
}