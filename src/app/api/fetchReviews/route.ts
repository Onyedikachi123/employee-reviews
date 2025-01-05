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
    if (sentimentCache.has(text)) {
        return sentimentCache.get(text)!;
    }

    try {
        const response = await axios.post<SentimentResponse>(
            SENTIMENT_API_URL,
            { inputs: text },
            { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
        );

        if (response.data && Array.isArray(response.data) && response.data[0]?.label) {
            const sentiment = response.data[0].label.toLowerCase();
            const mappedSentiment =
                sentiment === "positive"
                    ? "Positive"
                    : sentiment === "negative"
                    ? "Negative"
                    : "Mixed";

            sentimentCache.set(text, mappedSentiment);
            return mappedSentiment;
        } else {
            console.warn("Unexpected response format:", response.data);
            return "Mixed";
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const errorData = error.response?.data;

            if (errorData?.error === "Model distilbert/distilbert-base-uncased-finetuned-sst-2-english is currently loading") {
                console.warn("Model is loading. Retrying...");
                const estimatedTime = errorData.estimated_time || 10;
                await delay(estimatedTime * 1000);
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

// Summarize reviews by sentiment with percentages and review texts
const summarizeReviewsBySentiment = (reviews: Review[]) => {
    const totalReviews = reviews.length;
    
    const sentimentGroups = reviews.reduce(
        (acc, review) => {
            acc[review.sentiment].count += 1;
            acc[review.sentiment].totalRating += review.rating;
            acc[review.sentiment].reviews.push(review.text);
            return acc;
        },
        {
            Positive: { count: 0, totalRating: 0, reviews: [] as string[] },
            Negative: { count: 0, totalRating: 0, reviews: [] as string[] },
            Mixed: { count: 0, totalRating: 0, reviews: [] as string[] },
        } as Record<"Positive" | "Negative" | "Mixed", { count: number; totalRating: number; reviews: string[] }>
    );

    const getOverallSentiment = () => {
        const totalSentiments = sentimentGroups.Positive.count + sentimentGroups.Negative.count + sentimentGroups.Mixed.count;
        const positivePercentage = (sentimentGroups.Positive.count / totalSentiments) * 100;

        return positivePercentage > 50 ? "Positive" : "Mixed"; // Simplified sentiment logic
    };

    return {
        totalReviews,
        averageRating: (
            (sentimentGroups.Positive.totalRating + sentimentGroups.Negative.totalRating + sentimentGroups.Mixed.totalRating) /
            totalReviews
        ).toFixed(2),
        overallSentiment: getOverallSentiment(),
        reviews: sentimentGroups.Positive.reviews.concat(sentimentGroups.Negative.reviews, sentimentGroups.Mixed.reviews),
    };
};

// API route handler (Modified)
export async function GET(req: Request) {
    const url = new URL(req.url);
    const companyName = url.searchParams.get("companyName");

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

    // Use summarizeReviewsBySentiment to get sentiment summary
    const sentimentSummary = summarizeReviewsBySentiment(updatedReviews);

    return NextResponse.json({
        sentimentSummary,
    });
}
