import axios from "axios";
import Cookies from "js-cookie";

const API_BASE = import.meta.env.VITE_SERVER_URL;

async function apiRequest(url, method = "GET", data = null) {
    const token = Cookies.get("access_token");

    try {
        const response = await axios({
            url: `${API_BASE}${url}`,
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            data,
            withCredentials: true,
        });

        return response.data;
    } catch (error) {
        console.error("API Request Error:", error.response?.data || error.message);
        throw error.response?.data || new Error("Something went wrong");
    }
}

export default apiRequest;
