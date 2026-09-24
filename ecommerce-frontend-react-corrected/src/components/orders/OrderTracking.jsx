const labels = {
  PLACED: "Order Placed",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  DISPATCHED: "Dispatched",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export default function OrderTracking({ order }) {
  const events = (order?.items || [])
    .flatMap((item) => item.tracking || [])
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="order-timeline">
      {events.map((e, i) => {
        const isLast = i === events.length - 1;

        return (
          <div
            className={`order-timeline-item ${
              isLast ? "order-timeline-item-current" : ""
            }`}
            key={i}
          >
            {!isLast && <div className="order-timeline-line" />}

            <div className="order-timeline-marker">
              <i
                className={
                  e.status === "DELIVERED"
                    ? "bi bi-check-lg"
                    : e.status === "CANCELLED"
                      ? "bi bi-x-lg"
                      : "bi bi-check2"
                }
              />
            </div>

            <div className="order-timeline-content">
              <div className="order-timeline-top">
                <div className="order-timeline-status">
                  {labels[e.status] || e.status}
                </div>

                {isLast && (
                  <span className="order-timeline-current">Current</span>
                )}
              </div>

              {e.date && (
                <div className="order-timeline-date">
                  <i className="bi bi-clock" />

                  {new Date(e.date).toLocaleString("en-IN")}
                </div>
              )}

              {e.remarks && (
                <div className="order-timeline-remarks">{e.remarks}</div>
              )}
            </div>
          </div>
        );
      })}

      {!events.length && (
        <div className="order-timeline-empty">
          <div className="order-timeline-empty-icon">
            <i className="bi bi-truck" />
          </div>

          <div>
            <strong>No tracking updates yet</strong>

            <p>
              Tracking information will appear here once your order has been
              updated.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
