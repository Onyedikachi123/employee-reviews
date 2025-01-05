"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Reviews Component
const Reviews: React.FC = () => {
  const [sentimentSummary, setSentimentSummary] = useState<{
    totalReviews: number;
    averageRating: string;
    overallSentiment: string;
    reviews: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const companyName = searchParams.get("companyName");

  useEffect(() => {
    if (companyName) {
      const fetchReviews = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/fetchReviews?companyName=${encodeURIComponent(companyName)}`);
          if (!res.ok) throw new Error("Failed to fetch reviews");
          const data = await res.json();
          setSentimentSummary(data.sentimentSummary); // Ensure sentiment summary is set here
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unknown error occurred.");
          }
        } finally {
          setLoading(false);
        }
      };

      fetchReviews();
    }
  }, [companyName]);

  if (loading) return <p className="text-center">Loading reviews...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  if (!sentimentSummary) return <p className="text-center">No reviews found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Company Reviews for {companyName}</h2>

      <div className="p-4 border rounded shadow">
        <h3 className="font-bold">Overall Sentiment: {sentimentSummary.overallSentiment}</h3>
        <p>Total Reviews: {sentimentSummary.totalReviews}</p>
        <p>Average Rating: ⭐ {sentimentSummary.averageRating}</p>
        <div className="mt-4">
          <h4 className="font-semibold">Reviews Summary:</h4>
          <p>{sentimentSummary.reviews}</p>
        </div>
      </div>
    </div>
  );
};

// Suspense Wrapper Component
const SuspenseWrapper: React.FC = () => {
  return (
    <Suspense fallback={<p className="text-center">Loading reviews...</p>}>
      <Reviews />
    </Suspense>
  );
};

export default SuspenseWrapper;
