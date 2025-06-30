import { useNavigate } from "react-router-dom";
const Navigate=useNavigate
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem("access_token");
    return token ? children : <Navigate to="/login" />;
  };
  export default PrivateRoute