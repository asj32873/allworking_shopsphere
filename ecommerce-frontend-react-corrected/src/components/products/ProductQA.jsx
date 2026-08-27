import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export default function ProductQA({ productId }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Please enter a question.");
      return;
    }

    if (trimmedQuestion.length < 2) {
      setError("Question must contain at least 2 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const response = await fetch(`${API_URL}/products/${productId}/qa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmedQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get an answer.");
      }

      setAnswer(data.data.answer);
    } catch (err) {
      console.error("Product Q&A error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <div className="card bg-light border-0 mt-3">
      <div className="card-body">
        <h5>
          <i className="bi bi-stars me-2" />
          Product Q&A
        </h5>

        <textarea
          className="form-control mb-2"
          rows="2"
          placeholder="Ask something about this product..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <button
          className="btn btn-primary"
          onClick={askQuestion}
          disabled={loading || !question.trim()}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
              />
              Thinking...
            </>
          ) : (
            <>
              <i className="bi bi-stars me-2" />
              Ask AI
            </>
          )}
        </button>

        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

        {answer && (
          <div className="mt-3">
            <div className="fw-semibold mb-1">AI Answer</div>

            <div className="card">
              <div className="card-body">{answer}</div>
            </div>
          </div>
        )}

        {!answer && !error && !loading && (
          <div className="small text-muted mt-2">
            Ask about the product's features, specifications, reviews, price, or
            other information available in the product data.
          </div>
        )}
      </div>
    </div>
  );
}
