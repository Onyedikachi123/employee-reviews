import { NextResponse } from "next/server";
import reviewsData from "../../../../public/reviews.json";
import axios from "axios";

type Review = {
    id: string;
    title: string;
    text: string;
    rating: number;
    sentiment: "Positive" | "Negative" | "Mixed";
    companyName: string;
};

type SentimentResponse = Array<{ label: string; score: number }>;

// Hugging Face API setup
const SENTIMENT_API_URL = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english";
const HF_API_KEY = process.env.HF_API_KEY; // API key from environment variables

// Cache for storing sentiment results
const sentimentCache = new Map<string, "Positive" | "Negative" | "Mixed">();

// Delay function for handling retries
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Sentiment analysis function with retry for "model loading" error
const sentimentAnalyzer = async (text: string): Promise<"Positive" | "Negative" | "Mixed"> => {
    // Check cache first
    if (sentimentCache.has(text)) {
        return sentimentCache.get(text)!;
    }

    try {
        const response = await axios.post<SentimentResponse>(
            SENTIMENT_API_URL,
            { inputs: text },
            { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
        );

        // Validate response structure
        if (response.data && Array.isArray(response.data) && response.data[0]?.label) {
            const sentiment = response.data[0].label.toLowerCase();

            const mappedSentiment =
                sentiment === "positive"
                    ? "Positive"
                    : sentiment === "negative"
                    ? "Negative"
                    : "Mixed";

            // Cache result
            sentimentCache.set(text, mappedSentiment);

            return mappedSentiment;
        } else {
            console.warn("Unexpected response format:", response.data);
            return "Mixed"; // Default for unexpected responses
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const errorData = error.response?.data;

            // Check if the model is loading (custom handling added here)
            if (errorData?.error === "Model distilbert/distilbert-base-uncased-finetuned-sst-2-english is currently loading") {
                console.warn("Model is loading. Retrying...");
                const estimatedTime = errorData.estimated_time || 10; // Default to 10 seconds if not provided
                await delay(estimatedTime * 1000); // Wait for the estimated time
                return sentimentAnalyzer(text); // Retry
            }

            if (error.response?.status === 429) {
                console.warn("Rate limit exceeded. Retrying...");
                await delay(2000); // Retry after 2 seconds
                return sentimentAnalyzer(text); // Retry
            }

            console.error("Axios error in sentiment analysis:", errorData || error.message);
        } else {
            console.error("Unexpected error in sentiment analysis:", error);
        }

        return "Mixed"; // Default fallback
    }
};

// Sentiment percentages calculation
const calculateSentimentPercentages = (reviews: Review[]) => {
    const total = reviews.length;
    const counts = reviews.reduce(
        (acc, review) => {
            acc[review.sentiment]++;
            return acc;
        },
        { Positive: 0, Negative: 0, Mixed: 0 }
    );

    return {
        positivePercentage: ((counts.Positive / total) * 100).toFixed(2),
        negativePercentage: ((counts.Negative / total) * 100).toFixed(2),
        mixedPercentage: ((counts.Mixed / total) * 100).toFixed(2),
    };
};

// API route handler
export async function GET(req: Request) {
    const url = new URL(req.url);
    const companyName = url.searchParams.get("companyName");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const reviews = reviewsData.reviews as Review[];
    let filteredReviews = reviews;

    if (companyName) {
        filteredReviews = filteredReviews.filter((review) =>
            review.companyName.toLowerCase().includes(companyName.toLowerCase())
        );
    }

    if (filteredReviews.length === 0) {
        return NextResponse.json({ error: "No reviews found for the specified company." }, { status: 404 });
    }

    // Analyze sentiment for each review
    const updatedReviews = await Promise.all(
        filteredReviews.map(async (review) => ({
            ...review,
            sentiment: review.sentiment === "Mixed" ? await sentimentAnalyzer(review.text) : review.sentiment,
        }))
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReviews = updatedReviews.slice(startIndex, endIndex);

    const analysis = calculateSentimentPercentages(updatedReviews);

    return NextResponse.json({
        reviews: paginatedReviews,
        analysis,
        pagination: { page, limit, total: updatedReviews.length },
    });
}