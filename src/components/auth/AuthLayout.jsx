import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'

function AuthLayout({ path, children }) {
    const navigate = useNavigate()
    const [loader, setLoader] = useState(true)
    const token = Cookies.get("access_token")
    const role = Cookies.get("user_role")

    useEffect(() => {
        const publicPaths = ["/", "/login", "/signup"];
        const isPublic = publicPaths.includes(path);

        if (token && isPublic) {
            if (role === "Admin") {
                navigate("/admin");
            } else if (role === "Accountant") {
                navigate("/accountant");
            }
        } else if (!token && !isPublic) {
            navigate("/login");
        }
        setLoader(false);
    }, [path, navigate, token, role]);

    return loader ? (
        <div className='w-100 vh-100 flex justify-center'>
            Loading...
        </div>
    ) : (
        <>{children}</>
    );
}

export default AuthLayout;
