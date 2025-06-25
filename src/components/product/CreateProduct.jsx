import React, { useEffect, useState } from "react";
import { Upload, X, Plus } from "lucide-react";
import axios from "axios";
import { GET, POST } from "../../config/api_helper";
import { useNavigate } from "react-router-dom";
import {
  GET_CATEGORIES_URL,
  CREATE_PRODUCT_URL,
  GET_BRANDS_URL,
  GET_COLORS_URL,
} from "../../config/url_helper";
import { toast } from "react-toastify";

const CreateProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    description: "",
    base_price: "",
    isFeatured: false,
    isSoldOut: false,
    isVisible: true,
    specifications: {
      material: "",
      fit: "",
    },
    brand: "",
    collections: [],
    discount: "",
    tags: [],
    isActive: true,
    variants: [
      {
        price: "",
        sizes: [],
        color: "",
        images: [],
      },
    ],
  });

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [newCollection, setNewCollection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState({
    categories: false,
    brands: false,
    colors: false,
  });
  const [uploadErrors, setUploadErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState({}); // New state for validation errors

  const tagSuggestions = [
    "mans-fashion",
    "womans-fashion",
    "woman-Accessories",
    "mens-accessories",
    "discount-deal",
  ];

  // Validation function
  const validateField = (
    name,
    value,
    variantIndex = null,
    sizeIndex = null
  ) => {
    let error = "";
    if (name === "category" && !value) {
      error = "Category is required";
    } else if (name === "name") {
      if (!value.trim()) error = "Product name is required";
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
      if (value.length === 0) error = "At least one size is required";
    } else if (name === "variant_images" && variantIndex !== null) {
      if (value.length === 0) error = "At least one image is required";
    } else if (
      name === "size_stock" &&
      variantIndex !== null &&
      sizeIndex !== null &&
      value
    ) {
      if (isNaN(value) || value < 0)
        error = "Stock must be a non-negative number";
    }
    return error;
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};

    // Validate top-level fields
    newErrors.category = validateField("category", formData.category);
    newErrors.name = validateField("name", formData.name);
    newErrors.description = validateField("description", formData.description);
    newErrors.base_price = validateField("base_price", formData.base_price);
    newErrors.brand = validateField("brand", formData.brand);
    newErrors.discount = validateField("discount", formData.discount);
    newErrors.material = validateField(
      "material",
      formData.specifications.material
    );
    newErrors.fit = validateField("fit", formData.specifications.fit);

    // Validate collections
    formData.collections.forEach((collection, index) => {
      if (collection.length > 50) {
        newErrors[`collection_${index}`] =
          "Collection must be 50 characters or less";
      }
    });

    // Validate tags
    formData.tags.forEach((tag, index) => {
      if (tag.length > 50) {
        newErrors[`tag_${index}`] = "Tag must be 50 characters or less";
      }
    });

    // Validate variants
    formData.variants.forEach((variant, variantIndex) => {
      newErrors[`variant_${variantIndex}_price`] = validateField(
        "variant_price",
        variant.price,
        variantIndex
      );
      newErrors[`variant_${variantIndex}_color`] = validateField(
        "variant_color",
        variant.color,
        variantIndex
      );
      newErrors[`variant_${variantIndex}_sizes`] = validateField(
        "variant_sizes",
        variant.sizes,
        variantIndex
      );
      newErrors[`variant_${variantIndex}_images`] = validateField(
        "variant_images",
        variant.images,
        variantIndex
      );
      variant.sizes.forEach((sizeData, sizeIndex) => {
        newErrors[`variant_${variantIndex}_size_${sizeIndex}_stock`] =
          validateField("size_stock", sizeData.stock, variantIndex, sizeIndex);
      });
    });

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  // Handle input blur for validation
  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading((prev) => ({ ...prev, categories: true }));
        const response = await GET(GET_CATEGORIES_URL);
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories.");
      } finally {
        setLoading((prev) => ({ ...prev, categories: false }));
      }
    };
    fetchCategories();
  }, []);

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading((prev) => ({ ...prev, brands: true }));
        const response = await GET(GET_BRANDS_URL);
        setBrands(response.data.brands || []);
      } catch (error) {
        console.error("Error fetching brands:", error);
        toast.error("Failed to load brands.");
      } finally {
        setLoading((prev) => ({ ...prev, brands: false }));
      }
    };
    fetchBrands();
  }, []);

  // Fetch colors
  useEffect(() => {
    const fetchColors = async () => {
      try {
        setLoading((prev) => ({ ...prev, colors: true }));
        const response = await GET(GET_COLORS_URL);
        setAvailableColors(response.data.colors || []);
      } catch (error) {
        console.error("Error fetching colors:", error);
        toast.error("Failed to load colors.");
      } finally {
        setLoading((prev) => ({ ...prev, colors: false }));
      }
    };
    fetchColors();
  }, []);

  // Update available sizes when category changes
  useEffect(() => {
    if (formData.category) {
      const selectedCategory = categories.find(
        (cat) => cat._id === formData.category
      );
      const sizes = selectedCategory?.sizes || [];
      setAvailableSizes(sizes.map((size) => size.label));

      // Update existing variants to use category sizes
      setFormData((prev) => {
        const newVariants = prev.variants.map((variant) => {
          const newSizes = sizes.map((size) => ({
            size: size.label,
            stock:
              variant.sizes.find((s) => s.size === size.label)?.stock || "",
          }));
          return { ...variant, sizes: newSizes };
        });
        return { ...prev, variants: newVariants };
      });
    } else {
      setAvailableSizes([]);
      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.map((variant) => ({
          ...variant,
          sizes: [],
        })),
      }));
    }
    // Validate category on change
    setErrors((prev) => ({
      ...prev,
      category: validateField("category", formData.category),
    }));
  }, [formData.category, categories]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSpecificationChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value,
      },
    }));
    setErrors((prev) => ({ ...prev, [key]: validateField(key, value) }));
  };

  const handleVariantChange = (variantIndex, field, value) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[variantIndex] = {
        ...newVariants[variantIndex],
        [field]: value,
      };
      return { ...prev, variants: newVariants };
    });
    setErrors((prev) => ({
      ...prev,
      [`variant_${variantIndex}_${field}`]: validateField(
        `variant_${field}`,
        value,
        variantIndex
      ),
    }));
  };

  const handleSizeStockChange = (variantIndex, sizeIndex, stock) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[variantIndex].sizes[sizeIndex].stock = stock;
      return { ...prev, variants: newVariants };
    });
    setErrors((prev) => ({
      ...prev,
      [`variant_${variantIndex}_size_${sizeIndex}_stock`]: validateField(
        "size_stock",
        stock,
        variantIndex,
        sizeIndex
      ),
    }));
  };

  const addSizeToVariant = (variantIndex, selectedSize) => {
    if (!selectedSize) return;

    setFormData((prev) => {
      const newVariants = [...prev.variants];
      const variant = newVariants[variantIndex];

      const sizeExists = variant.sizes.some(
        (s) => s.size.toLowerCase() === selectedSize.toLowerCase()
      );
      if (sizeExists) {
        toast.error(`Size ${selectedSize} already exists in this variant`);
        return prev;
      }

      variant.sizes.push({ size: selectedSize, stock: "" });
      return { ...prev, variants: newVariants };
    });
    // Validate sizes after adding
    setErrors((prev) => ({
      ...prev,
      [`variant_${variantIndex}_sizes`]: validateField(
        "variant_sizes",
        formData.variants[variantIndex].sizes.concat({
          size: selectedSize,
          stock: "",
        }),
        variantIndex
      ),
    }));
  };

  const removeSizeFromVariant = (variantIndex, sizeIndex) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[variantIndex].sizes = newVariants[variantIndex].sizes.filter(
        (_, i) => i !== sizeIndex
      );
      return { ...prev, variants: newVariants };
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`variant_${variantIndex}_size_${sizeIndex}_stock`];
      newErrors[`variant_${variantIndex}_sizes`] = validateField(
        "variant_sizes",
        formData.variants[variantIndex].sizes.filter((_, i) => i !== sizeIndex),
        variantIndex
      );
      return newErrors;
    });
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          price: "",
          sizes: availableSizes.map((size) => ({ size, stock: "" })),
          color: "",
          images: [],
        },
      ],
    }));
    // Validate new variant
    const newVariantIndex = formData.variants.length;
    setErrors((prev) => ({
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
        availableSizes.map((size) => ({ size, stock: "" })),
        newVariantIndex
      ),
      [`variant_${newVariantIndex}_images`]: validateField(
        "variant_images",
        [],
        newVariantIndex
      ),
    }));
  };

  const removeVariant = (index) => {
    if (formData.variants.length > 1) {
      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index),
      }));
      setImagePreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[index];
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
      setErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach((key) => {
          if (key.startsWith(`variant_${index}_`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const error = validateField("newTag", newTag);
      if (error) {
        setErrors((prev) => ({ ...prev, newTag: error }));
        return;
      }
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
      setShowSuggestions(false);
      setErrors((prev) => ({ ...prev, newTag: "" }));
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      formData.tags.forEach((tag, index) => {
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
      !formData.collections.includes(newCollection.trim())
    ) {
      const error = validateField("newCollection", newCollection);
      if (error) {
        setErrors((prev) => ({ ...prev, newCollection: error }));
        return;
      }
      setFormData((prev) => ({
        ...prev,
        collections: [...prev.collections, newCollection.trim()],
      }));
      setNewCollection("");
      setErrors((prev) => ({ ...prev, newCollection: "" }));
    }
  };

  const removeCollection = (collectionToRemove) => {
    setFormData((prev) => ({
      ...prev,
      collections: prev.collections.filter(
        (collection) => collection !== collectionToRemove
      ),
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      formData.collections.forEach((collection, index) => {
        if (collection === collectionToRemove) {
          delete newErrors[`collection_${index}`];
        }
      });
      return newErrors;
    });
  };

  const handleImageUpload = (variantIndex, event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const errors = {};
    const validFiles = [];
    const newPreviews = [];

    const existingFiles = formData.variants[variantIndex].images.map((img) => ({
      name: img.file.name,
      size: img.file.size,
    }));

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
        existingFiles.some(
          (existing) =>
            existing.name === file.name && existing.size === file.size
        ) ||
        validFiles.some((vf) => vf.name === file.name && vf.size === file.size)
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
          isPrimary:
            newPreviews.length === 0 && validFiles.length === index + 1,
        });
        if (newPreviews.length === validFiles.length) {
          setFormData((prev) => {
            const newVariants = [...prev.variants];
            newVariants[variantIndex].images = [
              ...newVariants[variantIndex].images,
              ...validFiles.map((f, idx) => ({
                file: f,
                isPrimary:
                  idx === 0 && newVariants[variantIndex].images.length === 0,
                alt: f.name,
              })),
            ];
            return { ...prev, variants: newVariants };
          });
          setImagePreviews((prev) => ({
            ...prev,
            [variantIndex]: [...(prev[variantIndex] || []), ...newPreviews],
          }));
          setErrors((prev) => ({
            ...prev,
            [`variant_${variantIndex}_images`]: validateField(
              "variant_images",
              [
                ...formData.variants[variantIndex].images,
                ...validFiles.map((f) => ({
                  file: f,
                  isPrimary: false,
                  alt: f.name,
                })),
              ],
              variantIndex
            ),
          }));
        }
      };
      reader.onerror = () => {
        errors[`image_variant_${variantIndex}_${index}`] = "Error reading file";
        setUploadErrors((prev) => ({ ...prev, ...errors }));
      };
      reader.readAsDataURL(file);
    });

    if (Object.keys(errors).length > 0) {
      setUploadErrors((prev) => ({ ...prev, ...errors }));
    }
    event.target.value = "";
  };

  const removeImage = (variantIndex, imageIndex) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      const wasPrimary = newVariants[variantIndex].images[imageIndex].isPrimary;
      newVariants[variantIndex].images = newVariants[
        variantIndex
      ].images.filter((_, i) => i !== imageIndex);
      if (wasPrimary && newVariants[variantIndex].images.length > 0) {
        newVariants[variantIndex].images[0].isPrimary = true;
      }
      return { ...prev, variants: newVariants };
    });
    setImagePreviews((prev) => {
      const newPreviews = { ...prev };
      newPreviews[variantIndex] = prev[variantIndex].filter(
        (_, i) => i !== imageIndex
      );
      if (
        newPreviews[variantIndex]?.length > 0 &&
        !newPreviews[variantIndex].some((img) => img.isPrimary)
      ) {
        newPreviews[variantIndex][0].isPrimary = true;
      }
      return newPreviews;
    });
    setUploadErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`image_variant_${variantIndex}_${imageIndex}`];
      return newErrors;
    });
    setErrors((prev) => ({
      ...prev,
      [`variant_${variantIndex}_images`]: validateField(
        "variant_images",
        formData.variants[variantIndex].images.filter(
          (_, i) => i !== imageIndex
        ),
        variantIndex
      ),
    }));
  };

  const togglePrimaryImage = (variantIndex, imageIndex) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[variantIndex].images = newVariants[variantIndex].images.map(
        (image, i) => ({
          ...image,
          isPrimary: i === imageIndex,
        })
      );
      return { ...prev, variants: newVariants };
    });
    setImagePreviews((prev) => {
      const variantPreviews = [...(prev[variantIndex] || [])];
      variantPreviews.forEach((preview, i) => {
        preview.isPrimary = i === imageIndex;
      });
      return { ...prev, [variantIndex]: variantPreviews };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix all validation errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();

      submitData.append("category", formData.category);
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("base_price", formData.base_price);
      submitData.append("isFeatured", formData.isFeatured.toString());
      submitData.append("isSoldOut", formData.isSoldOut.toString());
      submitData.append("isVisible", formData.isVisible.toString());
      submitData.append("isActive", formData.isActive.toString());
      submitData.append("brand", formData.brand);
      submitData.append("discount", formData.discount || "");
      submitData.append(
        "specifications",
        JSON.stringify(formData.specifications)
      );
      submitData.append("collections", JSON.stringify(formData.collections));
      submitData.append("tags", JSON.stringify(formData.tags));

      formData.variants.forEach((variant, index) => {
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
        const seenFiles = new Set();
        variant.images.forEach((image, imgIndex) => {
          const fileKey = `${image.file.name}:${image.file.size}`;
          if (!seenFiles.has(fileKey)) {
            submitData.append(`variants[${index}][image]`, image.file);
            seenFiles.add(fileKey);
          } else {
            console.warn(`Duplicate image skipped: ${image.file.name}`);
          }
        });
      });

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}${CREATE_PRODUCT_URL}`,
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      toast.success("Product created successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Error creating product:", error);
      const message =
        error.response?.data?.message ||
        "Failed to create product. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setNewTag(value);

    if (value.trim()) {
      const filtered = tagSuggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
    setErrors((prev) => ({ ...prev, newTag: validateField("newTag", value) }));
  };

  const handleTagInputFocus = () => {
    setFilteredSuggestions(tagSuggestions);
    setShowSuggestions(true);
  };

  const handleTagInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100);
    setErrors((prev) => ({ ...prev, newTag: validateField("newTag", newTag) }));
  };

  const handleSuggestionClick = (suggestion) => {
    if (!formData.tags.includes(suggestion)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, suggestion],
      }));
      setNewTag("");
      setShowSuggestions(false);
      setFilteredSuggestions([]);
      setErrors((prev) => ({ ...prev, newTag: "" }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Create New Product</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:cursor-pointer"
        >
          Back to Products
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Category *
            </label>
            {loading.categories ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-500">
                  Loading categories...
                </span>
              </div>
            ) : (
              <>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={`w-full px-3 py-2 border ${
                    errors.category ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  required
                >
                  <option value="">Select a Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name} {!cat.isActive && "(Disabled)"}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                )}
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className={`w-full px-3 py-2 border ${
                errors.name ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter product name"
              required
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            rows={4}
            className={`w-full px-3 py-2 border ${
              errors.description ? "border-red-500" : "border-gray-300"
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Product description"
            required
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Price *
            </label>
            <input
              type="number"
              name="base_price"
              value={formData.base_price}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              step="0.01"
              min="0.01"
              className={`w-full px-3 py-2 border ${
                errors.base_price ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Base price"
              required
            />
            {errors.base_price && (
              <p className="text-red-500 text-xs mt-1">{errors.base_price}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand *
            </label>
            {loading.brands ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-500">Loading brands...</span>
              </div>
            ) : (
              <>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  className={`w-full px-3 py-2 border ${
                    errors.brand ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  required
                >
                  <option value="">Select a Brand</option>
                  {brands.map((brand) => (
                    <option key={brand._id} value={brand._id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                {errors.brand && (
                  <p className="text-red-500 text-xs mt-1">{errors.brand}</p>
                )}
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount (%)
            </label>
            <input
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              min="0"
              max="100"
              step="0.1"
              className={`w-full px-3 py-2 border ${
                errors.discount ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Discount percentage"
            />
            {errors.discount && (
              <p className="text-red-500 text-xs mt-1">{errors.discount}</p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Product Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Featured</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isSoldOut"
                checked={formData.isSoldOut}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Sold Out</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isVisible"
                checked={formData.isVisible}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Visible</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Specifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material
              </label>
              <input
                type="text"
                value={formData.specifications.material}
                onChange={(e) =>
                  handleSpecificationChange("material", e.target.value)
                }
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    material: validateField(
                      "material",
                      formData.specifications.material
                    ),
                  }))
                }
                className={`w-full px-3 py-2 border ${
                  errors.material ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Material (e.g., Cotton)"
              />
              {errors.material && (
                <p className="text-red-500 text-xs mt-1">{errors.material}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fit
              </label>
              <input
                type="text"
                value={formData.specifications.fit}
                onChange={(e) =>
                  handleSpecificationChange("fit", e.target.value)
                }
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    fit: validateField("fit", formData.specifications.fit),
                  }))
                }
                className={`w-full px-3 py-2 border ${
                  errors.fit ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Fit type (e.g., Regular)"
              />
              {errors.fit && (
                <p className="text-red-500 text-xs mt-1">{errors.fit}</p>
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
                setErrors((prev) => ({
                  ...prev,
                  newCollection: validateField("newCollection", e.target.value),
                }));
              }}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addCollection())
              }
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  newCollection: validateField("newCollection", newCollection),
                }))
              }
              className={`flex-1 px-3 py-2 border ${
                errors.newCollection ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Add collection"
            />
            <button
              type="button"
              onClick={addCollection}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:cursor-pointer"
            >
              <Plus size={16} />
            </button>
          </div>
          {errors.newCollection && (
            <p className="text-red-500 text-xs mt-1">{errors.newCollection}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {formData.collections.map((collection, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
              >
                {collection}
                <button
                  type="button"
                  onClick={() => removeCollection(collection)}
                  className="ml-2 hover:text-green-600 hover:cursor-pointer"
                >
                  <X size={14} />
                </button>
                {errors[`collection_${index}`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`collection_${index}`]}
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
              type="text"
              value={newTag}
              onChange={handleTagInputChange}
              onFocus={handleTagInputFocus}
              onBlur={handleTagInputBlur}
              className={`flex-1 px-3 py-2 border ${
                errors.newTag ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Add tag"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:cursor-pointer"
            >
              <Plus size={16} />
            </button>
          </div>
          {errors.newTag && (
            <p className="text-red-500 text-xs mt-1">{errors.newTag}</p>
          )}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full max-w-[calc(100%-4rem)] bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onMouseDown={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-100 cursor-pointer"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 hover:text-blue-600 hover:cursor-pointer"
                >
                  <X size={14} />
                </button>
                {errors[`tag_${index}`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`tag_${index}`]}
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700b hover:cursor-pointer"
            >
              <Plus size={16} className="inline mr-1" /> Add Variant
            </button>
          </div>
          {formData.variants.map((variant, variantIndex) => (
            <div
              key={variantIndex}
              className="mb-6 p-4 bg-white border border-gray-200 rounded-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-700">
                  Variant #{variantIndex + 1}
                </h4>
                {formData.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(variantIndex)}
                    className="text-red-600 hover:text-red-800 hover:cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variant Price *
                  </label>
                  <input
                    type="number"
                    value={variant.price}
                    onChange={(e) =>
                      handleVariantChange(variantIndex, "price", e.target.value)
                    }
                    onBlur={() =>
                      setErrors((prev) => ({
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
                    className={`w-full px-3 py-2 border ${
                      errors[`variant_${variantIndex}_price`]
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Variant price"
                    required
                  />
                  {errors[`variant_${variantIndex}_price`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`variant_${variantIndex}_price`]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color *
                  </label>
                  {loading.colors ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-500">
                        Loading colors...
                      </span>
                    </div>
                  ) : (
                    <>
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
                          setErrors((prev) => ({
                            ...prev,
                            [`variant_${variantIndex}_color`]: validateField(
                              "variant_color",
                              variant.color,
                              variantIndex
                            ),
                          }))
                        }
                        className={`w-full px-3 py-2 border ${
                          errors[`variant_${variantIndex}_color`]
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        required
                      >
                        <option value="">Select Color</option>
                        {availableColors.map((color) => (
                          <option key={color._id} value={color._id}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                      {errors[`variant_${variantIndex}_color`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`variant_${variantIndex}_color`]}
                        </p>
                      )}
                    </>
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
                  />
                  <label
                    htmlFor={`image-upload-variant-${variantIndex}`}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700"
                  >
                    <Upload size={16} className="mr-2" />
                    Upload Images
                  </label>
                </div>
                {Object.keys(uploadErrors)
                  .filter((key) =>
                    key.startsWith(`image_variant_${variantIndex}_`)
                  )
                  .map((key) => (
                    <p key={key} className="text-red-600 text-sm">
                      {uploadErrors[key]}
                    </p>
                  ))}
                {errors[`variant_${variantIndex}_images`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`variant_${variantIndex}_images`]}
                  </p>
                )}
                {imagePreviews[variantIndex]?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                    {imagePreviews[variantIndex].map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.preview}
                          alt={`Preview ${image.name}`}
                          className="w-full h-auto rounded-md object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(variantIndex, index)}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer"
                        >
                          <X size={16} className="text-red-600" />
                        </button>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500 truncate max-w-[80%]">
                            {image.name} ({(image.size / 1024).toFixed(2)} KB)
                          </span>
                          <label className="flex items-center text-xs">
                            <input
                              type="checkbox"
                              checked={image.isPrimary}
                              onChange={() =>
                                togglePrimaryImage(variantIndex, index)
                              }
                              className="mr-1"
                            />
                            Primary
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                {/* <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Size & Stock *
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addSizeToVariant(variantIndex, e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.category || availableSizes.length === 0}
                  >
                    <option value="">
                      {formData.category
                        ? availableSizes.length > 0
                          ? "Add Size"
                          : "No sizes available"
                        : "Select a category first"}
                    </option>
                    {availableSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div> */}
                {errors[`variant_${variantIndex}_sizes`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`variant_${variantIndex}_sizes`]}
                  </p>
                )}
                {variant.sizes.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {formData.category
                      ? availableSizes.length > 0
                        ? "Select a size to add."
                        : "No sizes available for this category."
                      : "Please select a category to view available sizes."}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {variant.sizes.map((sizeData, sizeIndex) => (
                      <div
                        key={sizeIndex}
                        className="border border-gray-200 rounded-md p-2 relative group"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {sizeData.size}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              removeSizeFromVariant(variantIndex, sizeIndex)
                            }
                            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer"
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
                            setErrors((prev) => ({
                              ...prev,
                              [`variant_${variantIndex}_size_${sizeIndex}_stock`]:
                                validateField(
                                  "size_stock",
                                  sizeData.stock,
                                  variantIndex,
                                  sizeIndex
                                ),
                            }))
                          }
                          min="0"
                          className={`w-full px-3 py-2 border ${
                            errors[
                              `variant_${variantIndex}_size_${sizeIndex}_stock`
                            ]
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Stock count"
                        />
                        {errors[
                          `variant_${variantIndex}_size_${sizeIndex}_stock`
                        ] && (
                          <p className="text-red-500 text-xs mt-1">
                            {
                              errors[
                                `variant_${variantIndex}_size_${sizeIndex}_stock`
                              ]
                            }
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:cursor-pointer ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
