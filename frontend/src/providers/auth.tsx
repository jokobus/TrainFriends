import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { handleApiErr, useLocalStorage } from "../utils";
import { Api, LoginRequest } from "../api";

export interface AuthProps {
  isAuthenticated: true;
  userName: string;
}

export interface UnauthProps {
  isAuthenticated: false;
  userName: null;
}

export type AuthContextType = {
  login: (loginData: LoginRequest) => Promise<[boolean, string]>;
  logout: () => Promise<void>;
  authState: AuthProps | UnauthProps;
  refetchAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // FIXME: check if cookie is still there and fetch information
  const [authState, setAuthState] = useLocalStorage<AuthProps | UnauthProps>(
    "authState",
    { isAuthenticated: false, userName: null },
  );

  const fetchAuthState = useCallback(async () => {
    try {
      const response = await Api.authCheckGet();
      setAuthState({
        isAuthenticated: true,
        userName: response.data.username,
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        if (authState.isAuthenticated) {
          console.log("User is not authenticated anymore. Logging out.");
          setAuthState({ isAuthenticated: false, userName: null });
        }
      } else {
        throw error;
      }
    }
  }, [authState, setAuthState]);

  useEffect(() => {
    fetchAuthState();
  }, [fetchAuthState]);

  const login = useCallback(
    async ({
      username,
      password,
    }: LoginRequest): Promise<[boolean, string]> => {
      try {
        const response = await Api.loginPost({
          loginRequest: {
            username,
            password,
          },
        });
        setAuthState({
          isAuthenticated: true,
          userName: username,
        });
        return [true, ""];
      } catch (error: any) {
        if (error.response) {
          const msg = error.response.data;
          return [false, msg];
        } else {
          return [false, error.message];
        }
      }
    },
    [setAuthState],
  );

  const logout = useCallback(async () => {
    try {
      await Api.logoutPost();
      setAuthState({ isAuthenticated: false, userName: null });
    } catch (error: any) {
      // FIXME: more information
      // FIXME: inform user
      handleApiErr(error);
    }
  }, [setAuthState]);

  return (
    <AuthContext.Provider
      value={{ authState, login, logout, refetchAuth: fetchAuthState }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useAuthState = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthState must be used within an AuthProvider");
  }
  return context.authState;
};
