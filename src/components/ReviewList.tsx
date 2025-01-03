"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Review {
  id: string;
  title: string;
  text: string;
  rating: number;
  sentiment: "Positive" | "Negative" | "Mixed";
}

interface SentimentSummary {
  count: number;
  averageRating: string;
  percentage: string;
  reviews: string[];
}

const Reviews: React.FC = () => {
  const [sentimentSummary, setSentimentSummary] = useState<{
    Positive: SentimentSummary;
    Negative: SentimentSummary;
    Mixed: SentimentSummary;
  } | null>(null);
  const [selectedTab, setSelectedTab] = useState<"Positive" | "Negative" | "Mixed">("Positive");
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
          setSentimentSummary(data.sentimentSummary);
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

  const summary = sentimentSummary[selectedTab];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Company Reviews for {companyName}</h2>

      <div className="flex gap-4 mb-4">
        {["Positive", "Negative", "Mixed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab as "Positive" | "Negative" | "Mixed")}
            className={selectedTab === tab ? "text-blue-500" : ""}
          >
            {tab} ({sentimentSummary[tab as "Positive" | "Negative" | "Mixed"].count})
          </button>
        ))}
      </div>

      <div className="p-4 border rounded shadow">
        <h3 className="font-bold">{selectedTab} Reviews</h3>
        <p>Total Count: {summary.count}</p>
        <p>Average Rating: ⭐ {summary.averageRating}</p>
        <p>Percentage: {summary.percentage}%</p>
        <div className="mt-4">
          <h4 className="font-semibold">Review Texts:</h4>
          <ul className="list-disc pl-5">
            {summary.reviews.map((text, index) => (
              <li key={index}>{text}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Suspense Wrapper Component
const SuspenseWrapper: React.FC = () => {
  return (
    <Suspense fallback={<p className="text-center">Loading...</p>}>
      <Reviews />
    </Suspense>
  );
};

export default SuspenseWrapper;
