import React, { useEffect, useState, useCallback, useRef } from "react";
import { Upload, X, Plus } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { GET, PUT } from "../../config/api_helper";
import {
  UPDATE_PRODUCT_URL,
  GET_BRANDS_URL,
  GET_COLORS_URL,
} from "../../config/url_helper";

const UpdateProduct = ({
  product,
  categories,
  onClose,
  onSuccess,
  updating,
  setUpdating,
}) => {
  const [editData, setEditData] = useState({
    category: product?.category?._id || product?.category || "",
    name: product?.name || "",
    description: product?.description || "",
    base_price: product?.base_price || "",
    isFeatured: product?.isFeatured || false,
    isSoldOut: product?.isSoldOut || false,
    isVisible: product?.isActive !== false,
    isActive: product?.isActive !== false,
    specifications: {
      material: product?.specifications?.material || "",
      fit: product?.specifications?.fit || "",
    },
    brand: product?.brand?._id || product?.brand || "",
    collections: Array.isArray(product?.collections)
      ? product.collections.map((c) => (typeof c === "string" ? c : c.name))
      : [],
    discount: product?.discount || "",
    tags: Array.isArray(product?.tags)
      ? product.tags.map((t) => (typeof t === "string" ? t : t.name))
      : [],
    variants: product?.variants?.length
      ? product.variants.map((v) => ({
          price: v.price || "",
          sizes: Array.isArray(v.sizes)
            ? v.sizes.map((s) => ({
                size: s.size || "",
                stock: s.stock || "",
              }))
            : [],
          color: v.color?._id || v.color || "",
          images: Array.isArray(v.images)
            ? v.images.map((img) => ({
                url: img.url || "",
              }))
            : [],
        }))
      : [
          {
            price: "",
            sizes: [],
            color: "",
            images: [],
          },
        ],
  });
  const [newTag, setNewTag] = useState("");
  const [newCollection, setNewCollection] = useState("");
  const [imagePreviews, setImagePreviews] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [brands, setBrands] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const tagInputRef = useRef(null);

  const tagSuggestions = [
    "man's fashion",
    "woman's fashion",
    "woman Accessories",
    "mens-accessories",
    "discount-deal",
  ];

  const predefinedSizes = [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "2XL",
    "3XL",
    "4XL",
    "5XL",
  ];

  // Validation function
  const validateField = (name, value, variantIndex = null) => {
    let error = "";
    if (name === "category" && !value) {
      error = "Category is required";
    } else if (name === "name") {
      if (!value.trim()) error = "Product name is required";
      else if (value.length < 3) error = "Name must be at least 3 characters";
      else if (value.length > 100)
        error = "Name must be 100 characters or less";
    } else if (name === "description") {
      if (!value.trim()) error = "Description is required";
      else if (value.length > 500)
        error = "Description must be 500 characters or less";
    } else if (name === "base_price") {
      if (!value || isNaN(value) || value <= 0)
        error = "Base price must be a positive number";
      else if (value > 999999.99)
        error = "Base price must be less than 999999.99";
    } else if (name === "brand" && !value) {
      error = "Brand is required";
    } else if (name === "discount" && value) {
      if (isNaN(value) || value < 0 || value > 100)
        error = "Discount must be between 0 and 100";
    } else if (name === "material" && value) {
      if (value.length > 100) error = "Material must be 100 characters or less";
    } else if (name === "fit" && value) {
      if (value.length > 100) error = "Fit must be 100 characters or less";
    } else if (name === "newCollection" && value) {
      if (value.length > 50) error = "Collection must be 50 characters or less";
    } else if (name === "newTag" && value) {
      if (value.length > 50) error = "Tag must be 50 characters or less";
    } else if (name === "variant_price" && variantIndex !== null) {
      if (!value || isNaN(value) || value <= 0)
        error = "Price must be a positive number";
      else if (value > 999999.99) error = "Price must be less than 999999.99";
    } else if (name === "variant_color" && variantIndex !== null && !value) {
      error = "Color is required";
    } else if (name === "variant_sizes" && variantIndex !== null) {
      if (!value || value.length === 0) error = "At least one size is required";
    } else if (name === "variant_images" && variantIndex !== null) {
      if (!value || value.length === 0)
        error = "At least one image is required";
    } else if (name === "variant_stock" && variantIndex !== null) {
      if (!value.some((size) => size.stock && parseInt(size.stock) >= 0))
        error = "At least one size must have valid stock";
    }
    return error;
  };

  // Validate entire form
  const validateForm = useCallback(() => {
    const errors = {};

    errors.category = validateField("category", editData.category);
    errors.name = validateField("name", editData.name);
    errors.description = validateField("description", editData.description);
    errors.base_price = validateField("base_price", editData.base_price);
    errors.brand = validateField("brand", editData.brand);
    errors.discount = validateField("discount", editData.discount);
    errors.material = validateField(
      "material",
      editData.specifications.material
    );
    errors.fit = validateField("fit", editData.specifications.fit);

    editData.collections.forEach((collection, index) => {
      if (collection.length > 50) {
        errors[`collection_${index}`] =
          "Collection must be 50 characters or less";
      }
    });

    editData.tags.forEach((tag, index) => {
      if (tag.length > 50) {
        errors[`tag_${index}`] = "Tag must be 50 characters or less";
      }
    });

    editData.variants.forEach((variant, index) => {
      errors[`variant_${index}_price`] = validateField(
        "variant_price",
        variant.price,
        index
      );
      errors[`variant_${index}_color`] = validateField(
        "variant_color",
        variant.color,
        index
      );
      errors[`variant_${index}_sizes`] = validateField(
        "variant_sizes",
        variant.sizes,
        index
      );
      errors[`variant_${index}_images`] = validateField(
        "variant_images",
        variant.images,
        index
      );
      errors[`variant_${index}_stock`] = validateField(
        "variant_stock",
        variant.sizes,
        index
      );
    });

    setFormErrors(errors);
    return Object.keys(errors).every((key) => !errors[key]);
  }, [editData]);

  // Handle input blur for validation
  const handleInputBlur = useCallback((e) => {
    const { name, value } = e.target;
    setFormErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  }, []);

  // Fetch brands and colors
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const response = await GET(GET_BRANDS_URL);
        setBrands(response.data.brands || []);
      } catch (error) {
        console.error("Error fetching brands:", error);
        toast.error("Failed to fetch brands");
      } finally {
        setLoading(false);
      }
    };
    const fetchColors = async () => {
      try {
        const response = await GET(GET_COLORS_URL);
        setAvailableColors(response.data.colors || []);
      } catch (error) {
        console.error("Error fetching colors:", error);
        toast.error("Failed to fetch colors");
      }
    };
    fetchBrands();
    fetchColors();
  }, []);

  // Update image previews
  useEffect(() => {
    const previews = {};
    editData.variants.forEach((variant, variantIndex) => {
      previews[variantIndex] = variant.images.map((image, imgIndex) => ({
        preview: image.url
          ? `${image.url}`
          : image.file
          ? URL.createObjectURL(image.file)
          : "",
        name: image.url
          ? `Existing Image ${imgIndex + 1}`
          : image.file?.name || `Image ${imgIndex + 1}`,
        size: image.url ? 0 : image.file?.size || 0,
        existing: !!image.url,
      }));
    });
    setImagePreviews((prev) => {
      // Clean up old previews to prevent memory leaks
      Object.values(prev).forEach((variantPreviews) => {
        variantPreviews.forEach((preview) => {
          if (preview.preview && !preview.existing) {
            URL.revokeObjectURL(preview.preview);
          }
        });
      });
      return previews;
    });
  }, [editData.variants]);

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setNewTag(value);
    setFormErrors((prev) => ({
      ...prev,
      newTag: validateField("newTag", value),
    }));
    if (value.trim()) {
      const filtered = tagSuggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions(tagSuggestions);
      setShowSuggestions(true);
    }
  };

  const handleTagInputFocus = () => {
    setFilteredSuggestions(tagSuggestions);
    setShowSuggestions(true);
  };

  const handleTagInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100);
    setFormErrors((prev) => ({
      ...prev,
      newTag: validateField("newTag", newTag),
    }));
  };

  const handleSuggestionClick = (suggestion) => {
    if (!editData.tags.includes(suggestion)) {
      setEditData((prev) => ({
        ...prev,
        tags: [...prev.tags, suggestion],
      }));
      setNewTag("");
      setShowSuggestions(false);
      setFilteredSuggestions([]);
      setFormErrors((prev) => ({ ...prev, newTag: "" }));
      if (tagInputRef.current) {
        tagInputRef.current.focus();
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSpecificationChange = (key, value) => {
    setEditData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value,
      },
    }));
    setFormErrors((prev) => ({ ...prev, [key]: validateField(key, value) }));
  };

  const handleVariantChange = (variantIndex, field, value) => {
    setEditData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[variantIndex] = {
        ...newVariants[variantIndex],
        [field]: value,
      };
      return {
        ...prev,
        variants: newVariants,
      };
    });
    setFormErrors((prev) => ({
      ...prev,
      [`variant_${variantIndex}_${field}`]: validateField(
        `variant_${field}`,
        value,
        variantIndex
      ),
    }));
  };

  const handleSizeStockChange = (variantIndex, sizeIndex, stock) => {
    setEditData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[variantIndex].sizes = newVariants[variantIndex].sizes.map(
        (size, j) => (j === sizeIndex ? { ...size, stock } : size)
      );
      return {
        ...prev,
        variants: newVariants,
      };
    });
    setFormErrors((prev) => ({
      ...prev,
      [`variant_${variantIndex}_stock`]: validateField(
        "variant_stock",
        editData.variants[variantIndex].sizes,
        variantIndex
      ),
    }));
  };

  const addSizeToVariant = (variantIndex, selectedSize) => {
    if (!selectedSize) return;

    setEditData((prev) => {
      const newVariants = [...prev.variants];
      const variant = newVariants[variantIndex];

      const sizeExists = variant.sizes.some(
        (s) => s.size.toLowerCase() === selectedSize.toLowerCase()
      );
      if (sizeExists) {
        toast.warn(`Size "${selectedSize}" is already added to this variant.`);
        return prev;
      }

      newVariants[variantIndex].sizes = [
        ...variant.sizes,
        { size: selectedSize, stock: "" },
      ];
      setFormErrors((prev) => ({
        ...prev,
        [`variant_${variantIndex}_sizes`]: validateField(
          "variant_sizes",
          newVariants[variantIndex].sizes,
          variantIndex
        ),
        [`variant_${variantIndex}_stock`]: validateField(
          "variant_stock",
          newVariants[variantIndex].sizes,
          variantIndex
        ),
      }));
      return {
        ...prev,
        variants: newVariants,
      };
    });
  };

  const removeSizeFromVariant = (variantIndex, sizeIndex) => {
    setEditData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[variantIndex].sizes = newVariants[variantIndex].sizes.filter(
        (_, i) => i !== sizeIndex
      );
      return {
        ...prev,
        variants: newVariants,
      };
    });
    setFormErrors((prev) => ({
      ...prev,
      [`variant_${variantIndex}_sizes`]: validateField(
        "variant_sizes",
        editData.variants[variantIndex].sizes.filter((_, i) => i !== sizeIndex),
        variantIndex
      ),
      [`variant_${variantIndex}_stock`]: validateField(
        "variant_stock",
        editData.variants[variantIndex].sizes.filter((_, i) => i !== sizeIndex),
        variantIndex
      ),
    }));
  };

  const addVariant = () => {
    const newVariantIndex = editData.variants.length;
    const lastVariant = editData.variants[newVariantIndex - 1];
    const newSizes = lastVariant
      ? lastVariant.sizes.map((sizeData) => ({
          size: sizeData.size,
          stock: "",
        }))
      : [];

    setEditData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          price: "",
          sizes: newSizes,
          color: "",
          images: [],
        },
      ],
    }));

    setFormErrors((prev) => ({
      ...prev,
      [`variant_${newVariantIndex}_price`]: validateField(
        "variant_price",
        "",
        newVariantIndex
      ),
      [`variant_${newVariantIndex}_color`]: validateField(
        "variant_color",
        "",
        newVariantIndex
      ),
      [`variant_${newVariantIndex}_sizes`]: validateField(
        "variant_sizes",
        newSizes,
        newVariantIndex
      ),
      [`variant_${newVariantIndex}_images`]: validateField(
        "variant_images",
        [],
        newVariantIndex
      ),
      [`variant_${newVariantIndex}_stock`]: validateField(
        "variant_stock",
        newSizes,
        newVariantIndex
      ),
    }));
  };

  const removeVariant = (index) => {
    if (editData.variants.length > 1) {
      setEditData((prev) => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index),
      }));
      setImagePreviews((prev) => {
        const newPreviews = { ...prev };
        if (newPreviews[index]) {
          newPreviews[index].forEach((preview) => {
            if (preview.preview && !preview.existing) {
              URL.revokeObjectURL(preview.preview);
            }
          });
          delete newPreviews[index];
        }
        return newPreviews;
      });
      setUploadErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach((key) => {
          if (key.startsWith(`image_variant_${index}_`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach((key) => {
          if (key.startsWith(`variant_${index}_`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    } else {
      toast.warn("At least one variant is required.");
    }
  };

  const addTag = () => {
    if (newTag.trim() && !editData.tags.includes(newTag.trim())) {
      const error = validateField("newTag", newTag);
      if (error) {
        setFormErrors((prev) => ({ ...prev, newTag: error }));
        return;
      }
      setEditData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
      setShowSuggestions(false);
      setFormErrors((prev) => ({ ...prev, newTag: "" }));
      if (tagInputRef.current) {
        tagInputRef.current.focus();
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setEditData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      editData.tags.forEach((tag, index) => {
        if (tag === tagToRemove) {
          delete newErrors[`tag_${index}`];
        }
      });
      return newErrors;
    });
  };

  const addCollection = () => {
    if (
      newCollection.trim() &&
      !editData.collections.includes(newCollection.trim())
    ) {
      const error = validateField("newCollection", newCollection);
      if (error) {
        setFormErrors((prev) => ({ ...prev, newCollection: error }));
        return;
      }
      setEditData((prev) => ({
        ...prev,
        collections: [...prev.collections, newCollection.trim()],
      }));
      setNewCollection("");
      setFormErrors((prev) => ({ ...prev, newCollection: "" }));
    }
  };

  const removeCollection = (collectionToRemove) => {
    setEditData((prev) => ({
      ...prev,
      collections: prev.collections.filter(
        (collection) => collection !== collectionToRemove
      ),
    }));
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      editData.collections.forEach((collection, index) => {
        if (collection === collectionToRemove) {
          delete newErrors[`collection_${index}`];
        }
      });
      return newErrors;
    });
  };

  const handleImageUpload = useCallback(
    (variantIndex, event) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      const errors = {};
      const validFiles = [];
      const newPreviews = [];

      const existingImages = editData.variants[variantIndex].images.map(
        (img) => ({
          name: img.file?.name || img.url?.split("/").pop(),
          size: img.file?.size || 0,
        })
      );

      files.forEach((file, index) => {
        if (!file.type.startsWith("image/")) {
          errors[`image_variant_${variantIndex}_${index}`] =
            "Please select image files only";
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          errors[`image_variant_${variantIndex}_${index}`] =
            "File size must be less than 5MB";
          return;
        }
        if (
          existingImages.some(
            (existing) =>
              existing.name === file.name && existing.size === file.size
          ) ||
          validFiles.some(
            (vf) => vf.name === file.name && vf.size === file.size
          )
        ) {
          errors[
            `image_variant_${variantIndex}_${index}`
          ] = `Duplicate file: ${file.name}`;
          return;
        }
        validFiles.push(file);

        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push({
            preview: e.target.result,
            name: file.name,
            size: file.size,
            existing: false,
          });
          if (newPreviews.length === validFiles.length) {
            const currentImages = editData.variants[variantIndex].images || [];
            const updatedImages = [
              ...currentImages,
              ...validFiles.map((f) => ({
                file: f,
              })),
            ];

            setEditData((prev) => {
              const newVariants = [...prev.variants];
              newVariants[variantIndex].images = updatedImages;
              return { ...prev, variants: newVariants };
            });
            setImagePreviews((prev) => {
              const currentPreviews = prev[variantIndex] || [];
              const updatedPreviews = [
                ...currentPreviews.filter((p) => p.existing),
                ...newPreviews,
              ];
              return {
                ...prev,
                [variantIndex]: updatedPreviews,
              };
            });
            setFormErrors((prev) => ({
              ...prev,
              [`variant_${variantIndex}_images`]: validateField(
                "variant_images",
                updatedImages,
                variantIndex
              ),
            }));
          }
        };
        reader.onerror = () => {
          errors[`image_variant_${variantIndex}_${index}`] =
            "Error reading file";
          setUploadErrors((prev) => ({ ...prev, ...errors }));
        };
        reader.readAsDataURL(file);
      });

      if (Object.keys(errors).length > 0) {
        setUploadErrors((prev) => ({ ...prev, ...errors }));
      }
      event.target.value = "";
    },
    [editData.variants]
  );

  const removeImage = (variantIndex, imageIndex) => {
    setEditData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[variantIndex].images = newVariants[
        variantIndex
      ].images.filter((_, i) => i !== imageIndex);
      return { ...prev, variants: newVariants };
    });
    setImagePreviews((prev) => {
      const newPreviews = { ...prev };
      if (newPreviews[variantIndex]) {
        const preview = newPreviews[variantIndex][imageIndex];
        if (preview.preview && !preview.existing) {
          URL.revokeObjectURL(preview.preview);
        }
        newPreviews[variantIndex] = newPreviews[variantIndex].filter(
          (_, i) => i !== imageIndex
        );
      }
      return newPreviews;
    });
    setUploadErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`image_variant_${variantIndex}_${imageIndex}`];
      return newErrors;
    });
    setFormErrors((prev) => ({
      ...prev,
      [`variant_${variantIndex}_images`]: validateField(
        "variant_images",
        editData.variants[variantIndex].images.filter(
          (_, i) => i !== imageIndex
        ),
        variantIndex
      ),
    }));
  };

  const handleProductUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    setLoading(true);
    setUpdating(true);
    try {
      const submitData = new FormData();
      submitData.append("category", editData.category);
      submitData.append("name", editData.name);
      submitData.append("description", editData.description);
      submitData.append("base_price", editData.base_price);
      submitData.append("isFeatured", editData.isFeatured.toString());
      submitData.append("isSoldOut", editData.isSoldOut.toString());
      submitData.append("isVisible", editData.isVisible.toString());
      submitData.append("isActive", editData.isActive.toString());
      submitData.append("brand", editData.brand);
      submitData.append("discount", editData.discount || "");
      submitData.append(
        "specifications",
        JSON.stringify(editData.specifications)
      );
      submitData.append("collections", JSON.stringify(editData.collections));
      submitData.append("tags", JSON.stringify(editData.tags));

      editData.variants.forEach((variant, index) => {
        submitData.append(`variants[${index}][price]`, variant.price);
        submitData.append(`variants[${index}][color]`, variant.color);

        variant.sizes.forEach((sizeData, sizeIndex) => {
          submitData.append(
            `variants[${index}][sizes][${sizeIndex}][size]`,
            sizeData.size
          );
          submitData.append(
            `variants[${index}][sizes][${sizeIndex}][stock]`,
            sizeData.stock || ""
          );
        });

        const newImages = variant.images.filter((image) => image.file);
        newImages.forEach((image, imgIndex) => {
          submitData.append(
            `variants[${index}][image]`,
            image.file
          );
        });

        const existingImages = variant.images.filter(
          (image) => image.url && !image.file
        );
        if (existingImages.length > 0) {
          submitData.append(
            `variants[${index}][existingImages]`,
            JSON.stringify(existingImages.map((img) => ({ url: img.url })))
          );
        }
      });

      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}${UPDATE_PRODUCT_URL}/${product._id}`,
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (response.data.statusCode === 200) {
        toast.success("Product updated successfully!");
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating product:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update product";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 top-15 xl:left-38">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-6xl max-h-[70vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Edit Product
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 hover:cursor-pointer"
            aria-label="Close modal"
            disabled={updating || loading}
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* {Object.keys(formErrors).length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium">
              Please correct the following errors:
            </p>
            <ul className="list-disc list-inside text-red-600 text-sm mt-2">
              {Object.entries(formErrors)
                .filter(([_, err]) => err)
                .map(([key, err], idx) => (
                  <li key={idx}>{err}</li>
                ))}
            </ul>
          </div>
        )} */}

        <form onSubmit={handleProductUpdate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category *
              </label>
              <select
                name="category"
                value={editData.category}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className={`w-full px-3 py-2 border text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  formErrors.category ? "border-red-500" : "border-gray-300"
                }`}
                disabled={updating || loading}
                required
                aria-required="true"
              >
                <option value="">Select a Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} {!cat.isActive && "(Inactive)"}
                  </option>
                ))}
              </select>
              {formErrors.category && (
                <p className="text-red-600 text-xs mt-1">
                  {formErrors.category}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className={`w-full px-3 py-2 border text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  formErrors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Oversized T-Shirt"
                disabled={updating || loading}
                required
                aria-required="true"
              />
              {formErrors.name && (
                <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={editData.description}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              rows={4}
              className={`w-full px-3 py-2 border text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                formErrors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Comfortable cotton t-shirt"
              disabled={updating || loading}
              required
              aria-required="true"
            />
            {formErrors.description && (
              <p className="text-red-600 text-xs mt-1">
                {formErrors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Price *
              </label>
              <input
                type="number"
                name="base_price"
                value={editData.base_price}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                step="0.01"
                min="0.01"
                className={`w-full px-3 py-2 border text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  formErrors.base_price ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="999"
                disabled={updating || loading}
                required
                aria-required="true"
              />
              {formErrors.base_price && (
                <p className="text-red-600 text-xs mt-1">
                  {formErrors.base_price}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand *
              </label>
              <select
                name="brand"
                value={editData.brand}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className={`w-full px-3 py-2 border text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  formErrors.brand ? "border-red-500" : "border-gray-300"
                }`}
                disabled={updating || loading}
                required
                aria-required="true"
              >
                <option value="">Select a Brand</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {formErrors.brand && (
                <p className="text-red-600 text-xs mt-1">{formErrors.brand}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount (%)
              </label>
              <input
                type="number"
                name="discount"
                value={editData.discount}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                min="0"
                max="100"
                step="0.1"
                className={`w-full px-3 py-2 border text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  formErrors.discount ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="10"
                disabled={updating || loading}
              />
              {formErrors.discount && (
                <p className="text-red-600 text-xs mt-1">
                  {formErrors.discount}
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Product Status
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={editData.isFeatured}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={updating || loading}
                />
                <span className="ml-2 text-sm text-gray-700">Featured</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isSoldOut"
                  checked={editData.isSoldOut}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={updating || loading}
                />
                <span className="ml-2 text-sm text-gray-700">Sold Out</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isVisible"
                  checked={editData.isVisible}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={updating || loading}
                />
                <span className="ml-2 text-sm text-gray-700">Visible</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={editData.isActive}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={updating || loading}
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material
                </label>
                <input
                  type="text"
                  value={editData.specifications.material}
                  onChange={(e) =>
                    handleSpecificationChange("material", e.target.value)
                  }
                  onBlur={() =>
                    setFormErrors((prev) => ({
                      ...prev,
                      material: validateField(
                        "material",
                        editData.specifications.material
                      ),
                    }))
                  }
                  className={`w-full px-3 py-2 border text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                    formErrors.material ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., Cotton"
                  disabled={updating || loading}
                />
                {formErrors.material && (
                  <p className="text-red-600 text-xs mt-1">
                    {formErrors.material}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fit
                </label>
                <input
                  type="text"
                  value={editData.specifications.fit}
                  onChange={(e) =>
                    handleSpecificationChange("fit", e.target.value)
                  }
                  onBlur={() =>
                    setFormErrors((prev) => ({
                      ...prev,
                      fit: validateField("fit", editData.specifications.fit),
                    }))
                  }
                  className={`w-full px-3 py-2 border text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                    formErrors.fit ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., Regular"
                  disabled={updating || loading}
                />
                {formErrors.fit && (
                  <p className="text-red-600 text-xs mt-1">{formErrors.fit}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collections
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCollection}
                onChange={(e) => {
                  setNewCollection(e.target.value);
                  setFormErrors((prev) => ({
                    ...prev,
                    newCollection: validateField(
                      "newCollection",
                      e.target.value
                    ),
                  }));
                }}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addCollection())
                }
                onBlur={() =>
                  setFormErrors((prev) => ({
                    ...prev,
                    newCollection: validateField(
                      "newCollection",
                      newCollection
                    ),
                  }))
                }
                className={`flex-1 px-3 py-2 border text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  formErrors.newCollection
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Add a collection"
                disabled={updating || loading}
              />
              <button
                type="button"
                onClick={addCollection}
                className={`px-4 py-2 rounded-md transition-colors duration-200 hover:cursor-pointer${
                  updating || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                }`}
                disabled={updating || loading}
                aria-label="Add collection"
              >
                <Plus size={16} />
              </button>
            </div>
            {formErrors.newCollection && (
              <p className="text-red-600 text-xs mt-1 ">
                {formErrors.newCollection}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {editData.collections.map((collection, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                >
                  {collection}
                  <button
                    type="button"
                    onClick={() => removeCollection(collection)}
                    className="ml-2 hover:text-green-600 transition-colors duration-200 hover:cursor-pointer"
                    disabled={updating || loading}
                    aria-label={`Remove ${collection} collection`}
                  >
                    <X size={14} />
                  </button>
                  {formErrors[`collection_${index}`] && (
                    <p className="text-red-600 text-xs mt-1">
                      {formErrors[`collection_${index}`]}
                    </p>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                ref={tagInputRef}
                type="text"
                value={newTag}
                onChange={handleTagInputChange}
                onFocus={handleTagInputFocus}
                onBlur={handleTagInputBlur}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                className={`flex-1 px-3 py-2 border text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  formErrors.newTag ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Add a tag"
                disabled={updating || loading}
              />
              <button
                type="button"
                onClick={addTag}
                className={`px-4 py-2 rounded-md transition-colors duration-200 hover:cursor-pointer${
                  updating || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                }`}
                disabled={updating || loading}
                aria-label="Add tag"
              >
                <Plus size={16} />
              </button>
            </div>
            {formErrors.newTag && (
              <p className="text-red-600 text-xs mt-1">{formErrors.newTag}</p>
            )}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <ul className="absolute z-20 w-full max-w-[calc(100%-4rem)] bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                {filteredSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onMouseDown={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-100 cursor-pointer"
                    role="option"
                    aria-selected={editData.tags.includes(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              {editData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-blue-600 transition-colors duration-200 hover:cursor-pointer"
                    disabled={updating || loading}
                    aria-label={`Remove ${tag} tag`}
                  >
                    <X size={14} />
                  </button>
                  {formErrors[`tag_${index}`] && (
                    <p className="text-red-600 text-xs mt-1">
                      {formErrors[`tag_${index}`]}
                    </p>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Product Variants
              </h3>
              <button
                type="button"
                onClick={addVariant}
                className={`px-4 py-2 rounded-md transition-colors duration-200 hover:cursor-pointer ${
                  updating || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                }`}
                disabled={updating || loading}
                aria-label="Add variant"
              >
                <Plus size={16} className="inline mr-1" />
                Add Variant
              </button>
            </div>

            {editData.variants.map((variant, variantIndex) => (
              <div
                key={variantIndex}
                className="mb-6 p-4 bg-white rounded-md border border-gray-200"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-700">
                    Variant {variantIndex + 1}
                  </h4>
                  {editData.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(variantIndex)}
                      className="text-red-600 hover:text-red-800 transition-colors duration-200 hover:cursor-pointer"
                      disabled={updating || loading}
                      aria-label={`Remove Variant ${variantIndex + 1}`}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variant Price *
                    </label>
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) =>
                        handleVariantChange(
                          variantIndex,
                          "price",
                          e.target.value
                        )
                      }
                      onBlur={() =>
                        setFormErrors((prev) => ({
                          ...prev,
                          [`variant_${variantIndex}_price`]: validateField(
                            "variant_price",
                            variant.price,
                            variantIndex
                          ),
                        }))
                      }
                      step="0.01"
                      min="0.01"
                      className={`w-full px-3 py-2 border text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                        formErrors[`variant_${variantIndex}_price`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="29"
                      disabled={updating || loading}
                      required
                      aria-required="true"
                    />
                    {formErrors[`variant_${variantIndex}_price`] && (
                      <p className="text-red-600 text-xs mt-1">
                        {formErrors[`variant_${variantIndex}_price`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color *
                    </label>
                    <select
                      value={variant.color}
                      onChange={(e) =>
                        handleVariantChange(
                          variantIndex,
                          "color",
                          e.target.value
                        )
                      }
                      onBlur={() =>
                        setFormErrors((prev) => ({
                          ...prev,
                          [`variant_${variantIndex}_color`]: validateField(
                            "variant_color",
                            variant.color,
                            variantIndex
                          ),
                        }))
                      }
                      className={`w-full px-3 py-2 border text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                        formErrors[`variant_${variantIndex}_color`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      disabled={updating || loading}
                      required
                      aria-required="true"
                    >
                      <option value="">Select Color</option>
                      {availableColors.map((color) => (
                        <option key={color._id} value={color._id}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                    {formErrors[`variant_${variantIndex}_color`] && (
                      <p className="text-red-600 text-xs mt-1">
                        {formErrors[`variant_${variantIndex}_color`]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variant Images *
                  </label>
                  <div className="flex items-center mb-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(variantIndex, e)}
                      className="hidden"
                      id={`image-upload-variant-${variantIndex}`}
                      disabled={updating || loading}
                    />
                    <label
                      htmlFor={`image-upload-variant-${variantIndex}`}
                      className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                        updating || loading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                      }`}
                    >
                      <Upload size={16} className="mr-2" />
                      Upload Images
                    </label>
                  </div>
                  {Object.keys(uploadErrors).some((key) =>
                    key.startsWith(`image_variant_${variantIndex}_`)
                  ) && (
                    <div className="text-red-600 text-xs mb-4">
                      {Object.entries(uploadErrors)
                        .filter(([key]) =>
                          key.startsWith(`image_variant_${variantIndex}_`)
                        )
                        .map(([key, error]) => (
                          <p key={key}>{error}</p>
                        ))}
                    </div>
                  )}
                  {formErrors[`variant_${variantIndex}_images`] && (
                    <p className="text-red-600 text-xs mt-2">
                      {formErrors[`variant_${variantIndex}_images`]}
                    </p>
                  )}
                  {imagePreviews[variantIndex]?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {imagePreviews[variantIndex].map((image, imgIndex) => (
                        <div
                          key={`${variantIndex}-${imgIndex}`}
                          className="relative group"
                        >
                          <img
                            src={image.preview}
                            alt={image.name}
                            className="w-full h-32 object-cover rounded-md border border-gray-200"
                            onError={(e) => {
                              e.target.src = "/placeholder-image.png";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(variantIndex, imgIndex)}
                            className="absolute top-2 right-2 bg-white rounded-full hover:cursor-pointer p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            disabled={updating || loading}
                            aria-label={`Remove image ${image.name}`}
                          >
                            <X size={16} className="text-red-600" />
                          </button>
                          <div className="mt-1 text-xs text-gray-500 truncate max-w-[150px]">
                            {image.name} (
                            {image.existing
                              ? "Existing"
                              : `${(image.size / 1024).toFixed(2)} KB`}
                            )
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Size & Stock *
                    </label>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) =>
                          addSizeToVariant(variantIndex, e.target.value)
                        }
                        className={`px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                          updating || loading
                            ? "border-gray-300 bg-gray-100"
                            : "border-gray-300 text-gray-700"
                        }`}
                        disabled={updating || loading}
                      >
                        <option value="">Add Size</option>
                        {predefinedSizes
                          .filter(
                            (size) =>
                              !variant.sizes.some(
                                (s) =>
                                  s.size.toLowerCase() === size.toLowerCase()
                              )
                          )
                          .map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  {variant.sizes.length === 0 && (
                    <p className="text-red-600 text-xs mb-2">
                      At least one size is required for this variant.
                    </p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {variant.sizes.map((sizeData, sizeIndex) => (
                      <div
                        key={`${variantIndex}-${sizeIndex}`}
                        className="border border-gray-200 rounded-md p-2 relative group"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-sm font-medium text-gray-700">
                            {sizeData.size}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              removeSizeFromVariant(variantIndex, sizeIndex)
                            }
                            className="text-red-500 hover:text-red-700 hover:cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            disabled={updating || loading}
                            aria-label={`Remove size ${sizeData.size}`}
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <input
                          type="number"
                          value={sizeData.stock}
                          onChange={(e) =>
                            handleSizeStockChange(
                              variantIndex,
                              sizeIndex,
                              e.target.value
                            )
                          }
                          onBlur={() =>
                            setFormErrors((prev) => ({
                              ...prev,
                              [`variant_${variantIndex}_stock`]: validateField(
                                "variant_stock",
                                variant.sizes,
                                variantIndex
                              ),
                            }))
                          }
                          min="0"
                          className={`w-full px-3 py-2 border text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                            formErrors[`variant_${variantIndex}_stock`]
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="10"
                          disabled={updating || loading}
                        />
                        {formErrors[`variant_${variantIndex}_stock`] && (
                          <p className="text-red-600 text-xs mt-1">
                            {formErrors[`variant_${variantIndex}_stock`]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {formErrors[`variant_${variantIndex}_sizes`] && (
                    <p className="text-red-600 text-xs mt-2">
                      {formErrors[`variant_${variantIndex}_sizes`]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="submit"
              disabled={updating || loading}
              className={`px-6 py-2 rounded-md transition-colors duration-200 hover:cursor-pointer ${
                updating || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              }`}
              aria-label="Save changes"
            >
              {updating || loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                "Save Changes"
              )}
            </button>
            <button
              onClick={onClose}
              disabled={updating || loading}
              className={`px-6 py-2 rounded-md transition-colors duration-200 hover:cursor-pointer ${
                updating || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-500 text-white hover:bg-gray-600 focus:ring-2 focus:ring-gray-500"
              }`}
              aria-label="Cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProduct;
