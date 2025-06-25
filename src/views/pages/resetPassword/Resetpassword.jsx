import React, { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { resetPassword } from "../../../redux/Slice/loginSlice";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, isError, errorMessage, isSuccess } = useSelector(
    (state) => state.login
  );

  useEffect(() => {
    if (!token) {
      toast.error(
        "Invalid or missing reset token. Please request a new password reset."
      );
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Password reset successful! Redirecting to login...");
    }
  }, [isSuccess]);

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      )
      .required("Password is required"),
    confirmpassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm Password is required"),
  });

  const formik = useFormik({
    initialValues: {
      password: "",
      confirmpassword: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const requestData = {
          token,
          password: values.password,
          confirmPassword: values.confirmpassword,
        };

        const resultAction = await dispatch(resetPassword(requestData));

        if (resetPassword.fulfilled.match(resultAction)) {
          toast.success("Password has been reset successfully!");
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else {
          toast.error(
            resultAction.payload ||
              "Failed to reset password. Please try again."
          );
        }
      } catch (error) {
        toast.error("An unexpected error occurred. Please try again.");
        console.error(error);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Reset Password
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Enter your new password below
          </p>

          {isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              {errorMessage ||
                "An error occurred while resetting your password."}
            </div>
          )}

          {isSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
              Password has been reset successfully! Redirecting to login...
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter New Password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  formik.touched.password && formik.errors.password
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmpassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmpassword"
                name="confirmpassword"
                placeholder="Confirm New Password"
                value={formik.values.confirmpassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  formik.touched.confirmpassword &&
                  formik.errors.confirmpassword
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
              />
              {formik.touched.confirmpassword &&
                formik.errors.confirmpassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {formik.errors.confirmpassword}
                  </p>
                )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formik.isValid}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed hover:cursor-pointer text-white font-medium py-2 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button>

            <div className="flex justify-center space-x-4 text-sm">
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 hover:underline transition duration-200"
              >
                Back to Login
              </Link>
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:text-blue-800 hover:underline transition duration-200"
              >
                Request New Reset Link
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
