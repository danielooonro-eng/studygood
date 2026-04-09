"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Project {
  id: string;
  name: string;
  description?: string;
}

export default function EditProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        setName(data.name);
        setDescription(data.description || "");
      } catch (err) {
        setError("An error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update project");
        return;
      }

      router.push(`/projects/${projectId}`);
    } catch (err) {
      setError("An error occurred");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="max-w-2xl mx-auto py-12 px-4">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <Navbar />
        <div className="max-w-2xl mx-auto py-12 px-4">
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
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Link
          href={`/projects/${projectId}`}
          className="text-blue-600 hover:text-blue-700 mb-6 inline-block"
        >
          ← Back to Project
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Edit Project
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Project Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href={`/projects/${projectId}`}
              className="bg-gray-200 text-gray-900 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
