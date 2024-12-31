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

interface Analysis {
  positivePercentage: string;
  negativePercentage: string;
  mixedPercentage: string;
}

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selectedTab, setSelectedTab] = useState<"positive" | "negative" | "mixed">("positive");
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
          setReviews(data.reviews);
          setAnalysis(data.analysis);
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

  const filteredReviews = reviews.filter((review) => review.sentiment.toLowerCase() === selectedTab);

  if (loading) return <p className="text-center">Loading reviews...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Company Reviews for {companyName}</h2>

      {analysis && (
        <div className="mb-6">
          <p>👍 Positive: {analysis.positivePercentage}%</p>
          <p>👎 Negative: {analysis.negativePercentage}%</p>
          <p>🤝 Mixed: {analysis.mixedPercentage}%</p>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setSelectedTab("positive")}
          className={selectedTab === "positive" ? "text-blue-500" : ""}
        >
          Positive
        </button>
        <button
          onClick={() => setSelectedTab("negative")}
          className={selectedTab === "negative" ? "text-red-500" : ""}
        >
          Negative
        </button>
        <button
          onClick={() => setSelectedTab("mixed")}
          className={selectedTab === "mixed" ? "text-yellow-500" : ""}
        >
          Mixed
        </button>
      </div>

      <div className="grid gap-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <div key={review.id} className="p-4 border rounded shadow">
              <h3 className="font-bold">{review.title}</h3>
              <p>{review.text}</p>
              <p>⭐ Rating: {review.rating}</p>
              <p
                className={`font-semibold ${
                  review.sentiment === "Positive"
                    ? "text-green-500"
                    : review.sentiment === "Negative"
                    ? "text-red-500"
                    : "text-yellow-500"
                }`}
              >
                Sentiment: {review.sentiment}
              </p>
            </div>
          ))
        ) : (
          <p>No reviews in this category.</p>
        )}
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
