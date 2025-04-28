import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UploadCloud, FileText, FileImage, Loader2, X } from "lucide-react";

const BUCKET = "task-files"; // Make sure this bucket exists in Supabase

export default function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Upload files to Supabase Storage
  const handleUpload = async () => {
    setUploading(true);
    setError(null);
    try {
      const uploaded: any[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const filePath = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (uploadError) throw uploadError;
        uploaded.push({ name: file.name, path: filePath, type: ext });
      }
      setUploadedFiles(prev => [...prev, ...uploaded]);
      setFiles([]);
    } catch (err: any) {
      setError(err.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  // List files in the bucket
  const handleListFiles = async () => {
    setError(null);
    const { data, error: listError } = await supabase.storage.from(BUCKET).list();
    if (listError) setError(listError.message);
    else setUploadedFiles(data || []);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 bg-zinc-900 border-zinc-800 shadow-2xl rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <UploadCloud className="w-7 h-7 text-primary" />
          <h2 className="text-2xl font-bold text-white">Upload Files</h2>
        </div>
        <p className="text-zinc-300 mb-6">Upload <span className="font-semibold text-white">PDF, DOCX, JPG, or PNG</span> files to Supabase Storage.</p>
        <div className="mb-6">
          <Input
            type="file"
            multiple
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="bg-zinc-800 border-zinc-700 text-white file:bg-primary file:text-white file:rounded file:px-3 file:py-1 file:mr-4"
          />
        </div>
        {files.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 text-zinc-400 text-sm">Files to upload:</div>
            <ul className="flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <li key={file.name + idx} className="flex items-center gap-2 bg-zinc-800 text-white rounded px-3 py-1 text-sm">
                  {file.name}
                  <button
                    className="ml-1 text-zinc-400 hover:text-red-400"
                    onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-3 mb-8">
          <Button onClick={handleUpload} disabled={uploading || files.length === 0} className="bg-primary text-white hover:bg-primary/90">
            {uploading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}Upload
          </Button>
          <Button variant="outline" onClick={handleListFiles} className="border-zinc-700 text-black hover:bg-zinc-800">
            List Uploaded Files
          </Button>
        </div>
        {error && <div className="text-red-400 mb-4 font-medium">{error}</div>}
        <Separator className="my-6" />
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl shadow-inner p-6">
          <h3 className="text-lg font-bold mb-4 text-white tracking-wide">Uploaded Files</h3>
          {uploadedFiles.length === 0 ? (
            <div className="text-zinc-500 text-center py-8 italic">No files uploaded yet. Click <span className='text-primary font-semibold'>List Uploaded Files</span> to refresh.</div>
          ) : (
            <ul className="space-y-3">
              {uploadedFiles.map((file, idx) => (
                <li
                  key={file.id || file.path || idx}
                  className="flex items-center gap-4 bg-zinc-900 rounded-lg px-5 py-3 text-white hover:bg-zinc-800 transition border border-zinc-800 shadow-sm"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 mr-2">
                    {file.type === 'pdf' || file.name?.endsWith('.pdf') ? <FileText className="w-5 h-5 text-primary" /> : null}
                    {file.type === 'docx' || file.name?.endsWith('.docx') ? <FileText className="w-5 h-5 text-blue-400" /> : null}
                    {file.type === 'jpg' || file.type === 'jpeg' || file.type === 'png' || file.name?.match(/\.(jpg|jpeg|png)$/) ? <FileImage className="w-5 h-5 text-yellow-400" /> : null}
                  </span>
                  <span className="truncate max-w-xs font-medium text-white">{file.name || file.path}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
} 