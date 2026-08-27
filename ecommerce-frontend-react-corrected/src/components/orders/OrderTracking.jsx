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
export default function OrderTracking({ item }) {
  return (
    <div className="timeline">
      {(item?.tracking || []).map((e, i) => (
        <div className="timeline-item active" key={i}>
          <div className="fw-semibold">{labels[e.status] || e.status}</div>
          <div className="small text-muted">{e.date}</div>
          <div className="small">{e.remarks}</div>
        </div>
      ))}
    </div>
  );
}
