"use client";
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation"; // Import useRouter for redirection

const searchSchema = z.object({
  companyName: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters long" })
    .max(50, { message: "Company name must be less than 50 characters" }),
});

type SearchFormData = z.infer<typeof searchSchema>;

const Home: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false); // Loading state for search
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
  });

  const router = useRouter();

  const onSubmit = (data: SearchFormData) => {
    setLoading(true);
    // Redirect to the new page with the search term as a query parameter
    router.push(`/Reviews?companyName=${data.companyName}`);
    reset();
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex justify-center items-center sm:py-6">
        <div className="text-center max-w-md w-full">
          <h1 className="text-primaryBlue text-3xl sm:text-5xl font-bold mb-4">
            Company Reputation Search Engine
          </h1>
          <p className="text-primaryBlue mb-6">
            Find out how people really feel about your company
          </p>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  errors.companyName ? "text-red-500" : "text-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Search your company name..."
                className={`w-full pl-10 pr-4 py-2 rounded-full focus:outline-none text-sm ${
                  errors.companyName
                    ? "border border-red-500 placeholder-red-500"
                    : "bg-[#BDDFF2]"
                }`}
                {...register("companyName")}
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs mt-1 text-center">
                  {errors.companyName.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="bg-primaryBlue text-white px-4 py-2 rounded-full shadow-[0px_4px_8px_#2D86B9,0px_2px_4px_#FFFFFF] text-sm font-bold mt-4"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
