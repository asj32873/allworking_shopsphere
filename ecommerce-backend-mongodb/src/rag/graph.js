const { StateGraph, StateSchema, START, END } = require("@langchain/langgraph");

const { z } = require("zod");

const { getVectorStore } = require("./vectorStore");
const { generateAnswer } = require("../utils/hfClient");

const State = new StateSchema({
  question: z.string(),
  productId: z.string(),
  context: z.string().default(""),
  answer: z.string().default(""),
});

async function retrieve(state) {
  console.log("===== RAG RETRIEVE =====");
  console.log("Question:", state.question);
  console.log("Product ID:", state.productId);

  const vectorStore = await getVectorStore();

  const results = await vectorStore.similaritySearch(state.question, 4, {
    productId: state.productId,
  });

  console.log("Retrieved documents:", results.length);

  const context = results.map((doc) => doc.pageContent).join("\n\n---\n\n");

  console.log("Context length:", context.length);

  return {
    context,
  };
}

async function generate(state) {
  console.log("===== RAG GENERATE =====");

  const prompt = `
You are ShopSphere's Product Q&A assistant.

Answer the user's question using ONLY the product information
provided in the context.

Rules:
1. Do not invent product specifications.
2. Do not use outside knowledge.
3. If the answer is not present in the context,
   say "I don't have enough information about that."
4. Keep the answer concise and helpful.
5. Do not mention that you are an AI unless necessary.

PRODUCT CONTEXT:
${state.context}

USER QUESTION:
${state.question}

ANSWER:
`;

  const answer = await generateAnswer(prompt);

  console.log("Generated answer:", answer);

  return {
    answer: answer.trim(),
  };
}

const graph = new StateGraph(State)
  .addNode("retrieve", retrieve)
  .addNode("generate", generate)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", END)
  .compile();

module.exports = graph;
