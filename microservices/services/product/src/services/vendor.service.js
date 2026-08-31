const { getJson } = require('../utils/serviceClient');

const VENDOR_SERVICE =
  process.env.VENDOR_SERVICE_URL || 'http://localhost:5012';

/**
 * Product.vendorId stores the authenticated user's ID.
 * Vendor.userId stores the same ID.
 *
 * Therefore Product Service resolves a vendor through:
 *
 * GET /internal/vendors/by-user/:userId
 */
async function getVendorByUserId(userId) {
  if (!userId) {
    return null;
  }

  try {
    const result = await getJson(
      VENDOR_SERVICE,
      `/internal/vendors/by-user/${encodeURIComponent(String(userId))}`,
    );

    if (!result.ok) {
      console.error(
        `Vendor lookup failed for user ${userId}: HTTP ${result.status}`,
      );

      return null;
    }

    return result.data?.data || null;
  } catch (error) {
    console.error(
      `Vendor service request failed for user ${userId}:`,
      error.message,
    );

    return null;
  }
}

/**
 * Gets all vendors through the internal Vendor Service endpoint.
 *
 * This is used for product LIST responses so we do not make
 * one HTTP request per product.
 */
async function getAllVendors() {
  try {
    const result = await getJson(
      VENDOR_SERVICE,
      '/internal/vendors',
    );

    if (!result.ok) {
      console.error(
        `Vendor list lookup failed: HTTP ${result.status}`,
      );

      return [];
    }

    return Array.isArray(result.data?.data)
      ? result.data.data
      : [];
  } catch (error) {
    console.error(
      'Vendor service list request failed:',
      error.message,
    );

    return [];
  }
}

module.exports = {
  getVendorByUserId,
  getAllVendors,
};