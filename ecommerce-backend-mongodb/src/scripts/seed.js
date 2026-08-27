require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");

const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Product = require("../models/Product");

const VENDOR_PASSWORD = "vendor123";

const vendors = [
  {
    name: "Tech World",
    email: "techworld@example.com",
    phone: "9876500001",
    storeName: "Tech World Electronics",
    storeAddress: "MG Road, Bengaluru, Karnataka",
  },
  {
    name: "Gadget Hub",
    email: "gadgethub@example.com",
    phone: "9876500002",
    storeName: "Gadget Hub Store",
    storeAddress: "Indiranagar, Bengaluru, Karnataka",
  },
  {
    name: "Digital Store",
    email: "digitalstore@example.com",
    phone: "9876500003",
    storeName: "Digital Store India",
    storeAddress: "Whitefield, Bengaluru, Karnataka",
  },
];

const productsByVendor = {
  "techworld@example.com": [
    {
      name: "Apple AirPods Pro 2",
      brand: "Apple",
      category: "AUDIO",
      price: 24999,
      stock: 30,
      rating: 4.7,
      reviewCount: 0,
      description:
        "Premium wireless earbuds with active noise cancellation, transparency mode, and high quality sound.",
      imageUrl:
        "https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=800",
    },
    {
      name: "Sony WH-1000XM5",
      brand: "Sony",
      category: "AUDIO",
      price: 29999,
      stock: 20,
      rating: 4.8,
      reviewCount: 0,
      description:
        "Premium wireless noise cancelling headphones with immersive sound and comfortable over-ear design.",
      imageUrl:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    },
    {
      name: "Samsung 55 Inch 4K Smart TV",
      brand: "Samsung",
      category: "TV",
      price: 54999,
      stock: 12,
      rating: 4.6,
      reviewCount: 0,
      description:
        "55 inch 4K smart television with vibrant picture quality and built-in streaming applications.",
      imageUrl:
        "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800",
    },
  ],

  "gadgethub@example.com": [
    {
      name: "Mechanical Gaming Keyboard",
      brand: "Logitech",
      category: "ACCESSORIES",
      price: 5999,
      stock: 35,
      rating: 4.5,
      reviewCount: 0,
      description:
        "Mechanical gaming keyboard with responsive switches and a durable design for gaming and work.",
      imageUrl:
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
    },
    {
      name: "iPhone 16",
      brand: "Apple",
      category: "MOBILE",
      price: 69999,
      stock: 15,
      rating: 4.7,
      reviewCount: 0,
      description:
        "Modern Apple smartphone with powerful performance, advanced cameras, and a high quality display.",
      imageUrl:
        "https://images.unsplash.com/photo-1592286927505-2fd6c4f0c3a4?w=800",
    },
    {
      name: "Samsung Galaxy S25",
      brand: "Samsung",
      category: "MOBILE",
      price: 74999,
      stock: 18,
      rating: 4.6,
      reviewCount: 0,
      description:
        "Premium Android smartphone with powerful performance, advanced camera features, and modern design.",
      imageUrl:
        "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800",
    },
  ],

  "digitalstore@example.com": [
    {
      name: "Dell Inspiron 15",
      brand: "Dell",
      category: "LAPTOP",
      price: 62999,
      stock: 10,
      rating: 4.4,
      reviewCount: 0,
      description:
        "Everyday laptop designed for productivity, browsing, office work, and entertainment.",
      imageUrl:
        "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800",
    },
    {
      name: "MacBook Air M3",
      brand: "Apple",
      category: "LAPTOP",
      price: 99999,
      stock: 8,
      rating: 4.9,
      reviewCount: 0,
      description:
        "Lightweight premium laptop with Apple silicon performance, long battery life, and a sharp display.",
      imageUrl:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    },
    {
      name: "JBL Bluetooth Speaker",
      brand: "JBL",
      category: "AUDIO",
      price: 7999,
      stock: 25,
      rating: 4.5,
      reviewCount: 0,
      description:
        "Portable Bluetooth speaker delivering powerful wireless audio for home and outdoor listening.",
      imageUrl:
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800",
    },
  ],
};

async function findOrCreateVendor(vendorData, passwordHash) {
  let user = await User.findOne({
    email: vendorData.email.toLowerCase(),
  });

  if (!user) {
    user = await User.create({
      name: vendorData.name,
      email: vendorData.email,
      phone: vendorData.phone,
      passwordHash,
      role: "VENDOR",
      status: "ACTIVE",
    });

    console.log(`Created vendor user: ${user.email}`);
  } else {
    // Make sure existing account is a vendor
    user.role = "VENDOR";
    user.status = "ACTIVE";

    // Reset password to vendor123
    user.passwordHash = passwordHash;

    await user.save();

    console.log(`Updated existing vendor user: ${user.email}`);
  }

  let vendor = await Vendor.findOne({
    userId: user._id,
  });

  if (!vendor) {
    vendor = await Vendor.create({
      userId: user._id,
      storeName: vendorData.storeName,
      email: user.email,
      phone: user.phone,
      storeAddress: vendorData.storeAddress,
      status: "VERIFIED",
      verifiedAt: new Date(),
    });

    console.log(`Created vendor profile: ${vendor.storeName}`);
  } else {
    vendor.storeName = vendorData.storeName;
    vendor.email = user.email;
    vendor.phone = user.phone;
    vendor.storeAddress = vendorData.storeAddress;
    vendor.status = "VERIFIED";
    vendor.verifiedAt = vendor.verifiedAt || new Date();

    await vendor.save();

    console.log(`Updated vendor profile: ${vendor.storeName}`);
  }

  return user;
}

async function insertProducts(vendorUser, products) {
  for (const productData of products) {
    const existing = await Product.findOne({
      vendorId: vendorUser._id,
      name: productData.name,
    });

    if (existing) {
      console.log(`Product already exists: ${productData.name}`);
      continue;
    }

    const product = await Product.create({
      ...productData,
      vendorId: vendorUser._id,
    });

    console.log(
      `Created product: ${product.name} | ₹${product.price} | Stock: ${product.stock}`,
    );
  }
}

async function run() {
  try {
    console.log("\n========================================");
    console.log(" ShopSphere Vendor + Product Seeder");
    console.log("========================================\n");

    await connectDB();

    const passwordHash = await bcrypt.hash(
      VENDOR_PASSWORD,
      Number(process.env.BCRYPT_SALT_ROUNDS || 12),
    );

    for (const vendorData of vendors) {
      console.log(`\n--- Processing ${vendorData.storeName} ---`);

      const vendorUser = await findOrCreateVendor(vendorData, passwordHash);

      const products = productsByVendor[vendorData.email];

      await insertProducts(vendorUser, products);
    }

    console.log("\n========================================");
    console.log(" SEED COMPLETED");
    console.log("========================================\n");

    console.log("Vendor login credentials:\n");

    for (const vendor of vendors) {
      console.log(`Store   : ${vendor.storeName}`);
      console.log(`Email   : ${vendor.email}`);
      console.log(`Password: ${VENDOR_PASSWORD}`);
      console.log("----------------------------------------");
    }

    console.log("\nAll vendor accounts use password: vendor123\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("\nSEED FAILED:");
    console.error(error);

    await mongoose.disconnect();

    process.exit(1);
  }
}

run();
