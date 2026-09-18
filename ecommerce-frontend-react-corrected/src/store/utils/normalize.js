export const normalizeProduct = (p) => ({
  ...p,
  id: p._id || p.id,
  image: p.imageUrl || p.image || "",
  vendor: p.vendor
    ? {
        ...p.vendor,
        id: p.vendor._id || p.vendor.id,
        userId: p.vendor.userId?._id || p.vendor.userId,
      }
    : null,
});

export const normalizeUser = (u) => ({
  ...u,
  id: u._id || u.id,
});

export const normalizeVendor = (v) => ({
  ...v,
  id: v._id || v.id,
  userId: v.userId?._id || v.userId,
});

export const normalizeAddress = (a) => ({
  ...a,
  id: a._id || a.id,
});

export const normalizeReview = (r) => ({
  ...r,
  id: r._id || r.id,
  productId: r.productId?._id || r.productId,
  userId: r.userId?._id || r.userId,
  user: r.userId?.name
    ? {
        id: r.userId._id,
        name: r.userId.name,
      }
    : null,
});

export const normalizeOrder = (o) => ({
  ...o,
  id: o._id || o.id,
  userId: o.userId?._id || o.userId,
  addressId: o.addressId?._id || o.addressId,

  items: (o.items || []).map((i) => ({
    ...i,
    id: i._id || i.id,
    orderId: i.orderId?._id || i.orderId,
    productId: i.productId?._id || i.productId,
    vendorId: i.vendorId?._id || i.vendorId,
    tracking: i.tracking || [],
  })),
});

export const normalizeIssue = (i) => ({
  ...i,
  id: i._id || i.id,
  userId: i.userId?._id || i.userId,
  assignedTo: i.assignedTo?._id || i.assignedTo || null,
  orderId: i.orderId?._id || i.orderId || null,
  productId: i.productId?._id || i.productId || null,
});
