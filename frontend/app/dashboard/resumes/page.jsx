"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatDate, formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Star, FileText, Loader2 } from "lucide-react";

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadResumes();
  }, []);

  async function loadResumes() {
    try {
      const data = await api.getResumes();
      setResumes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      await api.uploadResume(formData);
      loadResumes();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  }

  async function handleSetDefault(id) {
    try {
      await api.setDefaultResume(id);
      loadResumes();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this resume?")) return;
    try {
      await api.deleteResume(id);
      loadResumes();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resumes</h1>
          <p className="text-muted-foreground">Upload and manage your resume files (PDF only, max 5MB)</p>
        </div>
        <Button disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload Resume
        </Button>
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
      </div>

      {resumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No resumes uploaded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <Card key={resume.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{resume.original_name}</CardTitle>
                  </div>
                  {resume.is_default ? (
                    <Badge variant="success">Default</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  {formatFileSize(resume.file_size)} · Uploaded {formatDate(resume.created_at)}
                </p>
                <div className="flex gap-2">
                  {!resume.is_default && (
                    <Button variant="outline" size="sm" onClick={() => handleSetDefault(resume.id)}>
                      <Star className="mr-1 h-3 w-3" /> Set Default
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(resume.id)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
