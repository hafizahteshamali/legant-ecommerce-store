import axios from "axios";
import { toast } from "react-toastify";

const apiClient = axios.create({
  baseURL: "https://legant-ecommerce-store.vercel.app/api",
  timeout: 30000,
});

// 🔹 Request Interceptor: token automatically attach
apiClient.interceptors.request.use((config)=>{
  const token = sessionStorage.getItem("token");
  if(token){
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error)=>{
  Promise.reject(error)
})

// 🔹 Response Interceptor: success + 401 handling
apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.success && response.data.message) {
      toast.success(response.data.message); // success toast
    }
    return response.data;
  },
  (error) => {
    const status = error.response?.status; // 🔹 ye missing tha
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";

    toast.error(message);
    if (status === 401) {
      sessionStorage.removeItem("token"); // token remove
      window.location.href = "/login"; // redirect
    }
    return Promise.reject(error);
  }
);

export default apiClient;
