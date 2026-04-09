"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  files?: Array<{ id: string; fileName: string; type: string }>;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          setError("Failed to load projects");
          return;
        }

        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError("An error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [router]);

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError("Failed to delete project");
        return;
      }

      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      setError("An error occurred");
      console.error(err);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <Link
            href="/projects/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create New Project
          </Link>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              You haven't created any projects yet.
            </p>
            <Link
              href="/projects/new"
              className="text-blue-600 hover:text-blue-700"
            >
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4">
                    {project.description}
                  </p>
                )}
                <p className="text-gray-500 text-xs mb-4">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </p>

                <div className="flex space-x-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
                  >
                    Open
                  </Link>
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className="flex-1 text-center bg-gray-200 text-gray-900 px-3 py-2 rounded hover:bg-gray-300 text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
