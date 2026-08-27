const Product = require("../models/Product");
const Review = require("../models/Review");
const { generateAnswer } = require("../utils/hfClient");

async function retrieveProductContext(productId, question) {
  const product = await Product.findById(productId).lean();

  if (!product) {
    return null;
  }

  const reviews = await Review.find({
    productId,
  })
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return {
    product,
    reviews,
  };
}

function buildContext(data) {
  const { product, reviews } = data;

  const reviewText = reviews.length
    ? reviews
        .map((r) => `Rating: ${r.rating}/5\nReview: ${r.review}`)
        .join("\n\n")
    : "No customer reviews available.";

  return `
PRODUCT INFORMATION

Name: ${product.name}
Brand: ${product.brand}
Category: ${product.category}
Description: ${product.description}
Price: ₹${product.price}
Stock: ${product.stock}
Average Rating: ${product.rating}/5
Review Count: ${product.reviewCount}

CUSTOMER REVIEWS

${reviewText}
`;
}

async function answerProductQuestion(productId, question) {
  const data = await retrieveProductContext(productId, question);

  if (!data) {
    throw new Error("Product not found.");
  }

  const context = buildContext(data);

  const prompt = `
You are ShopSphere's Product Q&A assistant.

Answer the customer's question using ONLY the product information
and customer reviews provided below.

Do not invent specifications, features, prices, warranty information,
battery life, compatibility, or any other facts.

If the information needed to answer the question is not present,
say that the information is not available in the provided product data.

Keep the answer concise and useful.

PRODUCT CONTEXT:
${context}

CUSTOMER QUESTION:
${question}

ANSWER:
`;

  return await generateAnswer(prompt);
}

module.exports = {
  answerProductQuestion,
};
