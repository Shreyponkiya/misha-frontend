import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { MoveLeft } from "lucide-react";

const ProductDetail = () => {
  const location = useLocation();
  const { product } = location.state || {};

  // Fallback product data if none is passed via state
  const displayProduct = product || {
    name: "Sample Product",
    base_price: 0,
    discount: 0,
    quantity: 0,
    variants: [],
  };

  // State for selected image, variant, and size
  const [selectedImage, setSelectedImage] = useState(
    displayProduct.variants?.[0]?.images?.find((img) => img.isPrimary)?.url ||
      ""
  );
  const [selectedVariant, setSelectedVariant] = useState(
    displayProduct.variants?.[0] || null
  );
  const [selectedSize, setSelectedSize] = useState(
    displayProduct.variants?.[0]?.sizes?.[0]?.size || ""
  );

  // Calculate discounted price
  const discountedPrice = (
    displayProduct.base_price -
    displayProduct.base_price * (displayProduct.discount / 100)
  ).toFixed(2);

  // Handle variant (color) selection
  const handleVariantSelect = (variant) => {
    const primaryImage = variant.images?.find((img) => img.isPrimary);
    setSelectedVariant(variant);
    setSelectedImage(primaryImage?.url || "");
    setSelectedSize(variant.sizes?.[0]?.size || ""); // Reset size to first available
  };

  // Handle size selection
  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  return (
    <div className="bg-gray-50 font-sans p-6 mt-20 m-6 rounded-lg shadow-md">
      {/* Back button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => window.history.back()}
          className="text-black px-4 py-2 rounded-lg transition-colors border border-gray-300 hover:bg-gray-100 hover:border-black hover:cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <MoveLeft /> Back
          </span>
        </button>
      </div>
      {/* Main Content */}
      <main className="container mx-auto p-6 flex flex-col md:flex-row gap-6">
        {/* Product Images */}
        <div className="flex flex-row gap-4 w-full md:w-1/2">
          {/* Thumbnails */}
          <div className="flex flex-col gap-2 w-20 h-80 overflow-y-auto">
            {displayProduct.variants?.map((variant, idx) => {
              const primaryImage = variant.images?.find((img) => img.isPrimary);
              return primaryImage ? (
                <div
                  key={variant.color?._id || idx}
                  className={`h-20 w-20 flex items-center justify-center rounded-lg overflow-hidden border ${
                    selectedImage === primaryImage.url
                      ? "border-black border-2"
                      : "border-gray-300"
                  } cursor-pointer`}
                  onClick={() => handleVariantSelect(variant)}
                >
                  <img
                    src={`${primaryImage.url}`}
                    alt={
                      primaryImage.alt ||
                      `${variant.color?.name || "Variant"} Image`
                    }
                    className="max-h-full object-contain"
                  />
                </div>
              ) : null;
            })}
          </div>
          {/* Large Image */}
          <div className="bg-gray-200 h-96 flex items-center justify-center rounded-lg overflow-hidden flex-1">
            {selectedImage ? (
              <img
                src={`${selectedImage}`}
                alt={displayProduct.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500">No image available</span>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="w-full md:w-1/2">
          <h1 className="text-2xl font-semibold text-gray-800">
            {displayProduct.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-600">(9)</span>
          </div>
          <div className="mt-2 text-xl font-bold text-gray-800">
            ₹{discountedPrice}{" "}
            {displayProduct.discount > 0 && (
              <span className="text-gray-500 line-through text-base">
                ₹{displayProduct.base_price.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-2">
            {displayProduct.quantity} people are viewing this right now
          </p>

          {/* Stock and Timer */}
          {displayProduct.quantity > 0 && (
            <div className="mt-4 text-red-500">
              <p>
                Hurry up! Sale ends in: <span className="font-bold">TBD</span>
              </p>
              <p>Only {displayProduct.quantity} item(s) left in stock!</p>
            </div>
          )}

          {/* Size Selection */}
          {selectedVariant?.sizes?.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-600">Size:</p>
              <div className="flex gap-2 mt-2">
                {selectedVariant.sizes.map((sizeObj, index) => (
                  <button
                    key={sizeObj.size || index}
                    className={`border px-4 py-2 rounded-lg text-sm hover:cursor-pointer${
                      selectedSize === sizeObj.size
                        ? "border-black bg-gray-100"
                        : "border-gray-300 hover:border-black"
                    }`}
                    onClick={() => handleSizeSelect(sizeObj.size)}
                  >
                    {sizeObj.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          <div className="mt-4">
            <p className="text-gray-600">Color:</p>
            <div className="flex gap-2 mt-2">
              {displayProduct.variants?.map((variant) => (
                <button
                  key={variant.color?._id || variant.color?.name}
                  className={`w-8 h-8 rounded-full border-2 hover:cursor-pointer ${
                    selectedVariant?.color?._id === variant.color?._id
                      ? "border-black"
                      : "border-gray-300 hover:border-gray-600"
                  }`}
                  style={{
                    backgroundColor: variant.color?.hex || variant.color?.name,
                  }}
                  onClick={() => handleVariantSelect(variant)}
                  title={variant.color?.name}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
