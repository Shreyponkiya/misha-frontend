import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { forgotPassword } from "../../../redux/Slice/loginSlice";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, isError, errorMessage } = useSelector(
    (state) => state.login
  );

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
    }),
    onSubmit: async (values) => {
      try {
        const resultAction = await dispatch(forgotPassword(values));
        if (forgotPassword.fulfilled.match(resultAction)) {
          toast.success("Password reset email sent! Please check your inbox.");
          navigate("/reset-password");
        } else {
          toast.error(
            resultAction?.payload?.message || "Failed to send reset email"
            
          );
        }
      } catch (error) {
        toast.error("An unexpected error occurred. Please try again later.");
      }
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
        <p className="text-gray-600 mb-4">
          Enter your email to reset your password
        </p>

        {isError && <p className="text-red-500 text-sm mb-3">{errorMessage}</p>}

        <form onSubmit={formik.handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block mb-1 font-medium text-gray-700"
            >
              Email
            </label>
            <div className="flex items-center border rounded-md px-3 py-2 bg-white">
              <svg
                className="w-5 h-5 text-gray-400 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M16 12l-4-4-4 4m0 0l4 4 4-4m-4 4V8" />
              </svg>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter Email"
                className="w-full outline-none"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                disabled={isLoading}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 hover:cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Forgot Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
