const {
  HuggingFaceInferenceEmbeddings,
} = require("@langchain/community/embeddings/hf");

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY,
  model: "BAAI/bge-base-en-v1.5",
  provider: "hf-inference",
});

module.exports = embeddings;
