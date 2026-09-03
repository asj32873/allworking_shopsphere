const graph = require("../rag/graph");
const {
  ingestProduct,
  deleteProductFromVectorStore,
} = require("../rag/ingest");

const { ok, fail } = require("../utils/apiResponse");

async function qa(req, res) {
  const { question } = req.body;

  if (!question || question.trim().length < 2) {
    return fail(res, "Question is required.");
  }

  const result = await graph.invoke({
    question: question.trim(),
    productId: req.params.id,
  });

  ok(res, {
    answer: result.answer,
  });
}

async function ingest(req, res) {
  await ingestProduct(req.params.id);
  ok(res, null, "Product indexed.");
}

async function remove(req, res) {
  await deleteProductFromVectorStore(req.params.id);
  ok(res, null, "Product removed from index.");
}

module.exports = {
  qa,
  ingest,
  remove,
};
