import { createContext, useContext, useState } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN } from "../graphql/queries";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  const [loginMutation, { loading }] = useMutation(LOGIN, {
    errorPolicy: 'all'
  });

  const login = async (email, password) => {
    try {
      const { data, errors } = await loginMutation({
        variables: { email, password }
      });
      
      if (errors) {
        throw new Error(errors[0]?.message || "Error de login");
      }
      
      // GraphQL devuelve accessToken y usuario
      localStorage.setItem("token", data.login.accessToken);
      localStorage.setItem("user", JSON.stringify(data.login.usuario));
      setUser(data.login.usuario);
    } catch (error) {
      // Re-lanzar el error para que el componente Login lo maneje
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, logout, loading }}>{children}</AuthCtx.Provider>;
}
