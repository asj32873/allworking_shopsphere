const graph = require("../rag/graph");

async function askProductQuestion(req, res, next) {
  try {
    console.log("===== PRODUCT QA HIT =====");
    console.log("Method:", req.method);
    console.log("URL:", req.originalUrl);
    console.log("Body:", req.body);
    console.log("Params:", req.params);

    const { question } = req.body;
    const { id: productId } = req.params;

    if (!question || question.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Question must contain at least 2 characters.",
      });
    }

    const result = await graph.invoke({
      question: question.trim(),
      productId,
    });

    res.json({
      success: true,
      data: {
        question: question.trim(),
        answer: result.answer,
      },
    });
  } catch (error) {
    console.error("===== QA ERROR =====");
    console.error(error);
    next(error);
  }
}

module.exports = {
  askProductQuestion,
};
