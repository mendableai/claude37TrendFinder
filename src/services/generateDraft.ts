import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

/**
 * Generate a post draft with trending ideas based on raw tweets.
 */
export async function generateDraft(rawStories: string) {
  console.log(
    `Generating a post draft with raw stories (${rawStories.length} characters)...`,
  );

  try {
    // Get current date for header
    const currentDate = new Date().toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      month: "numeric",
      day: "numeric",
    });

    // Define prompt
    const prompt = `
      You are given a list of raw AI and LLM-related tweets sourced from X/Twitter.
      Your task is to find interesting trends, launches, or unique insights from the tweets.
      For each tweet, provide a 'story_or_tweet_link' and a one-sentence 'description'.
      Return at least 10 tweets unless fewer are available.
      
      Format the output strictly as JSON:
      {
        "interestingTweetsOrStories": [
          {
            "story_or_tweet_link": "https://x.com/...",
            "description": "..."
          }
        ]
      }

      Here are the raw tweets:
      ${rawStories}
    `;

    // Initialize Claude client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Call Claude API
    const result = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract response
    const firstBlock = result.content[0];
    if (!firstBlock || firstBlock.type !== "text") {
      throw new Error("Invalid response format from Claude");
    }

    const rawJSON = firstBlock.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    if (!rawJSON) {
      console.log("No JSON output returned.");
      return "No output.";
    }

    console.log(rawJSON);
    const parsedResponse = JSON.parse(rawJSON);

    // Construct the final post
    const header = `🚀 AI and LLM Trends on X for ${currentDate}\n\n`;
    const draft_post =
      header +
      parsedResponse.interestingTweetsOrStories
        .map(
          (tweetOrStory: any) =>
            `• ${tweetOrStory.description}\n  ${tweetOrStory.story_or_tweet_link}`,
        )
        .join("\n\n");

    return draft_post;
  } catch (error) {
    console.error("Error generating draft post", error);
    return "Error generating draft post.";
  }
}
