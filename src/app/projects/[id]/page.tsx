"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface ProjectFile {
  id: string;
  fileName: string;
  type: string;
  uploadedAt: string;
  fileSize: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  files?: ProjectFile[];
}

export default function ProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [activeTab, setActiveTab] = useState<"files" | "pdf" | "video">("files");
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          setError("Project not found");
          return;
        }

        const data = await response.json();
        setProject(data);
      } catch (err) {
        setError("An error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to upload file");
        return;
      }

      const uploadedFile = await response.json();
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          files: [...(prev.files || []), uploadedFile],
        };
      });
    } catch (err) {
      setError("An error occurred");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError("Failed to delete file");
        return;
      }

      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          files: prev.files?.filter((f) => f.id !== fileId),
        };
      });
    } catch (err) {
      setError("An error occurred");
      console.error(err);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setAskingQuestion(true);
    setError("");
    setAnswer("");

    try {
      const response = await fetch(`/api/projects/${projectId}/ask-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to get answer");
        return;
      }

      const data = await response.json();
      setAnswer(data.answer);
    } catch (err) {
      setError("An error occurred");
      console.error(err);
    } finally {
      setAskingQuestion(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4">
          <p className="text-red-600">{error || "Project not found"}</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {project.name}
              </h1>
              {project.description && (
                <p className="mt-2 text-gray-600">{project.description}</p>
              )}
            </div>
            <Link
              href={`/projects/${projectId}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Edit Project
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Files Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Project Files</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload PDF or Video
                </label>
                <input
                  type="file"
                  accept=".pdf,video/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                {uploading && <p className="mt-2 text-sm text-gray-500">Uploading...</p>}
              </div>

              {project.files && project.files.length > 0 ? (
                <div className="space-y-3">
                  {project.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-md"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {file.fileName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {file.type.toUpperCase()} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No files uploaded yet
                </p>
              )}
            </div>
          </div>

          {/* AI Tools Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">AI Tools</h2>

            <div className="space-y-4">
              <button
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled
              >
                Summarize PDF
              </button>

              <button
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled
              >
                Summarize Video
              </button>

              <button
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled
              >
                Share Project
              </button>
            </div>

            {/* Q&A Section */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-bold text-lg mb-4">Ask Questions</h3>
              <form onSubmit={handleAskQuestion} className="space-y-4">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about your PDFs..."
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  disabled={askingQuestion || !project.files?.length}
                />
                <button
                  type="submit"
                  disabled={askingQuestion || !project.files?.length || !question.trim()}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {askingQuestion ? "Thinking..." : "Ask"}
                </button>
              </form>

              {answer && (
                <div className="mt-4 p-4 bg-purple-50 rounded-md">
                  <p className="text-sm text-gray-900">{answer}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
