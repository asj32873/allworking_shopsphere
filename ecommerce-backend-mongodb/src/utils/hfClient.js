const { HfInference } = require("@huggingface/inference");

const hf = new HfInference(process.env.HF_TOKEN);

async function generateAnswer(prompt) {
  try {
    const result = await hf.chatCompletion({
      model: process.env.HF_MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.2,
    });

    return result.choices[0].message.content;
  } catch (error) {
    console.error("===== HUGGING FACE ERROR =====");
    console.error("Status:", error.httpResponse?.status);
    console.error("Body:", JSON.stringify(error.httpResponse?.body, null, 2));
    console.error("Request:", error.httpRequest?.body);
    console.error("==============================");

    throw error;
  }
}

module.exports = { generateAnswer };
