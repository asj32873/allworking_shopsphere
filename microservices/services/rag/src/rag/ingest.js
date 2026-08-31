const {Document}=require('@langchain/core/documents');const {getVectorStore}=require('./vectorStore');const {getJson}=require('../utils/serviceClient');const PRODUCT=()=>process.env.PRODUCT_SERVICE_URL||'http://localhost:5003';const REVIEWS=()=>process.env.REVIEW_SERVICE_URL||'http://localhost:5009';function id(p){return `product-${p._id||p.id}`;}async function buildProductDocument(productId){const p=await getJson(PRODUCT(),`/internal/products/${productId}`);if(!p.ok)throw new Error('Product not found');const product=p.data.data;const r=await getJson(REVIEWS(),`/api/reviews/product/${productId}`);const reviews=r.data?.data||[];const text=`Product Name: ${product.name}
Brand: ${product.brand}
Category: ${product.category}
Price: ₹${product.price}
Stock: ${product.stock}
Rating: ${product.rating||0}/5
Review Count: ${product.reviewCount||0}

Description:
${product.description}

Customer Reviews:
${reviews.length?reviews.map(x=>`Rating: ${x.rating}/5\nReview: ${x.review}`).join('\n\n'):'No reviews available.'}`;return new Document({pageContent:text,metadata:{productId:String(product._id),type:'product',name:product.name,brand:product.brand,category:product.category}});}async function ingestProduct(productId){const v=await getVectorStore();const d=await buildProductDocument(productId);const docId=id(d.metadata);try{await v.delete({ids:[docId]});}catch{}await v.addDocuments([d],{ids:[docId]});return d;}module.exports={buildProductDocument,ingestProduct};