"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          setIsAuthenticated(true);
          router.push("/dashboard");
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-20">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to StudyGood
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Upload PDFs and YouTube videos, then use AI to summarize and ask
            questions
          </p>

          <div className="space-y-4">
            <p className="text-lg text-gray-700 mb-8">
              Organize your study materials and get instant insights from your
              documents
            </p>

            <div className="flex justify-center space-x-4">
              <Link
                href="/register"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="bg-gray-200 text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📚 Upload Files
              </h3>
              <p className="text-gray-600">
                Add PDFs and YouTube videos to your projects
              </p>
            </div>
            <div className="p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🤖 AI Powered
              </h3>
              <p className="text-gray-600">
                Get instant summaries and answers about your content
              </p>
            </div>
            <div className="p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🔗 Share & Collaborate
              </h3>
              <p className="text-gray-600">
                Share projects with classmates and study buddies
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
