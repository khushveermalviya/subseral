import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
    
      fetch("http://localhost:4000/auth/validate-token", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            navigate("/");
          }
        });
    }
  }, [navigate]);

  const handleLogin = () => {
    window.location.href = "http://localhost:4000/auth/github";
  };

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <button
        onClick={handleLogin}
        className="bg-blue-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
      >
        Login with GitHub
      </button>
    </div>
  );
};

export default Login;
