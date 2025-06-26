import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { login } from "../../../redux/Slice/loginSlice";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string().required("Password is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setSubmitting(true);
        const resultAction = await dispatch(login(values));
        console.log("Login result:", resultAction);
        if (login.fulfilled.match(resultAction)) {
          const { token, user } = resultAction.payload || {};

          toast.success("Login successful!");
          navigate("/dashboard");
        } else {
          toast.error("Invalid credentials or account is deactivated.");
        }
      } catch (error) {
        console.error("Login failed:", error);
        toast.error("Invalid credentials or account is deactivated.");
        // toast.error("An unexpected error occurred");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleForgotPassword = () => {
    navigate("/forgot-password"); // Update with your actual route
  };

  const handleSignUp = () => {
    navigate("/signup"); // Update with your actual route
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 flex items-center justify-center px-4 py-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.15)_1px,_transparent_0)] bg-[length:20px_20px] opacity-20"></div>

      <div className="relative w-full max-w-md">
        {/* Main Card */}
        <div className="bg-gray-800/70 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl"></div>

          {/* Header */}
          <div className="relative z-10 text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-gray-300" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          <form
            className="relative z-10 space-y-6"
            onSubmit={formik.handleSubmit}
          >
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-gray-700/70 transition-all duration-200 ${
                    formik.errors.email && formik.touched.email
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>
              {formik.errors.email && formik.touched.email && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <span className="w-4 h-4 mr-1">⚠</span>
                  {formik.errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3 bg-gray-700/50 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-gray-700/70 transition-all duration-200 ${
                    formik.errors.password && formik.touched.password
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors hover:cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formik.errors.password && formik.touched.password && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <span className="w-4 h-4 mr-1">⚠</span>
                  {formik.errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formik.isSubmitting}
              className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800  hover:cursor-pointer text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl focus:ring-4 focus:ring-blue-500/30 focus:outline-none ${
                formik.isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {formik.isSubmitting ? "Signing In..." : "Sign In"}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors hover:underline hover:cursor-pointer"
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
