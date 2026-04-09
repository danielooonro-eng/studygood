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
  const [pdfQuestion, setPdfQuestion] = useState("");
  const [pdfAnswer, setPdfAnswer] = useState("");
  const [askingPdfQuestion, setAskingPdfQuestion] = useState(false);
  const [videoQuestion, setVideoQuestion] = useState("");
  const [videoAnswer, setVideoAnswer] = useState("");
  const [askingVideoQuestion, setAskingVideoQuestion] = useState(false);
  const [pdfSummary, setPdfSummary] = useState("");
  const [summarizingPdf, setSummarizingPdf] = useState(false);
  const [videoSummary, setVideoSummary] = useState("");
  const [summarizingVideo, setSummarizingVideo] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<any[]>([]);
  const [loadingShared, setLoadingShared] = useState(false);
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
    fetchSharedUsers();
  }, [projectId, router]);

  const fetchSharedUsers = async () => {
    try {
      setLoadingShared(true);
      const response = await fetch(`/api/projects/${projectId}/share`);
      if (response.ok) {
        const data = await response.json();
        setSharedUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch shared users:", err);
    } finally {
      setLoadingShared(false);
    }
  };

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

  const handleAskPdfQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfQuestion.trim()) return;

    setAskingPdfQuestion(true);
    setError("");
    setPdfAnswer("");

    try {
      const response = await fetch(`/api/projects/${projectId}/ask-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: pdfQuestion }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to get answer");
        return;
      }

      const data = await response.json();
      setPdfAnswer(data.answer);
    } catch (err) {
      setError("An error occurred");
      console.error(err);
    } finally {
      setAskingPdfQuestion(false);
    }
  };

  const handleSummarizePdf = async () => {
    setSummarizingPdf(true);
    setError("");
    setPdfSummary("");

    try {
      const response = await fetch(`/api/projects/${projectId}/summarize-pdf`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to summarize");
        return;
      }

      const data = await response.json();
      setPdfSummary(data.summary);
    } catch (err) {
      setError("An error occurred");
      console.error(err);
    } finally {
      setSummarizingPdf(false);
    }
  };

  const handleAskVideoQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoQuestion.trim()) return;

    setAskingVideoQuestion(true);
    setError("");
    setVideoAnswer("");

    try {
      const response = await fetch(`/api/projects/${projectId}/ask-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: videoQuestion }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to get answer");
        return;
      }

      const data = await response.json();
      setVideoAnswer(data.answer);
    } catch (err) {
      setError("An error occurred");
      console.error(err);
    } finally {
      setAskingVideoQuestion(false);
    }
  };

  const handleSummarizeVideo = async () => {
    setSummarizingVideo(true);
    setError("");
    setVideoSummary("");

    try {
      const response = await fetch(`/api/projects/${projectId}/summarize-video`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to summarize");
        return;
      }

      const data = await response.json();
      setVideoSummary(data.summary);
    } catch (err) {
      setError("An error occurred");
      console.error(err);
    } finally {
      setSummarizingVideo(false);
    }
  };

  const handleShareProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    setSharing(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: shareEmail }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to share project");
        return;
      }

      setShareEmail("");
      await fetchSharedUsers();
    } catch (err) {
      setError("An error occurred");
      console.error(err);
    } finally {
      setSharing(false);
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
          <div className="space-y-6">
            {/* PDF Tools */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">📄 PDF Tools</h2>

              <div className="space-y-4">
                <button
                  onClick={handleSummarizePdf}
                  disabled={summarizingPdf || !project.files?.some((f) => f.type === "pdf")}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {summarizingPdf ? "Summarizing..." : "📝 Summarize PDFs"}
                </button>

                {pdfSummary && (
                  <div className="p-4 bg-blue-50 rounded-md">
                    <h4 className="font-bold mb-2">Summary:</h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{pdfSummary}</p>
                  </div>
                )}
              </div>

              {/* PDF Q&A */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-bold text-lg mb-4">❓ Ask Questions About PDFs</h3>
                <form onSubmit={handleAskPdfQuestion} className="space-y-4">
                  <textarea
                    value={pdfQuestion}
                    onChange={(e) => setPdfQuestion(e.target.value)}
                    placeholder="Ask a question about your PDFs..."
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    disabled={askingPdfQuestion || !project.files?.some((f) => f.type === "pdf")}
                  />
                  <button
                    type="submit"
                    disabled={
                      askingPdfQuestion ||
                      !project.files?.some((f) => f.type === "pdf") ||
                      !pdfQuestion.trim()
                    }
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {askingPdfQuestion ? "Thinking..." : "Ask"}
                  </button>
                </form>

                {pdfAnswer && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-md">
                    <p className="text-sm text-gray-900">{pdfAnswer}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Video Tools */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">🎥 Video Tools</h2>

              <div className="space-y-4">
                <button
                  onClick={handleSummarizeVideo}
                  disabled={summarizingVideo || !project.files?.some((f) => f.type === "video")}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {summarizingVideo ? "Summarizing..." : "📝 Summarize Videos"}
                </button>

                {videoSummary && (
                  <div className="p-4 bg-green-50 rounded-md">
                    <h4 className="font-bold mb-2">Summary:</h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{videoSummary}</p>
                  </div>
                )}
              </div>

              {/* Video Q&A */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-bold text-lg mb-4">❓ Ask Questions About Videos</h3>
                <form onSubmit={handleAskVideoQuestion} className="space-y-4">
                  <textarea
                    value={videoQuestion}
                    onChange={(e) => setVideoQuestion(e.target.value)}
                    placeholder="Ask a question about your videos..."
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    disabled={
                      askingVideoQuestion || !project.files?.some((f) => f.type === "video")
                    }
                  />
                  <button
                    type="submit"
                    disabled={
                      askingVideoQuestion ||
                      !project.files?.some((f) => f.type === "video") ||
                      !videoQuestion.trim()
                    }
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {askingVideoQuestion ? "Thinking..." : "Ask"}
                  </button>
                </form>

                {videoAnswer && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-md">
                    <p className="text-sm text-gray-900">{videoAnswer}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Share Project */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">🔗 Share Project</h2>

              <form onSubmit={handleShareProject} className="space-y-4 mb-6">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="Enter email to share with..."
                    className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={sharing}
                  />
                  <button
                    type="submit"
                    disabled={sharing || !shareEmail.trim()}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
                  >
                    {sharing ? "Sharing..." : "Share"}
                  </button>
                </div>
              </form>

              {sharedUsers && sharedUsers.length > 0 && (
                <div>
                  <h4 className="font-bold mb-3">Shared with:</h4>
                  <div className="space-y-2">
                    {sharedUsers.map((share: any) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {share.sharedWithUser.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {share.sharedWithUser.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
