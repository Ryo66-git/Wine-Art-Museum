import { NextResponse } from "next/server";
import OpenAI from "openai";
import { generateArtPrompt } from "@/lib/prompt-generator";

export async function GET() {
  try {

    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Generate the art prompt
    const prompt = generateArtPrompt();

    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image: No URL returned" },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Return the image URL and the prompt used
    return NextResponse.json(
      {
        imageUrl,
        prompt,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error("Error generating image:", error);
    
    // Ensure we always return JSON, even if there's an unexpected error
    const errorMessage = error?.message || String(error) || "Unknown error occurred";
    const errorStatus = error?.status || error?.statusCode || 500;
    
    return NextResponse.json(
      { 
        error: "Failed to generate image",
        details: errorMessage,
      },
      { 
        status: typeof errorStatus === 'number' ? errorStatus : 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

