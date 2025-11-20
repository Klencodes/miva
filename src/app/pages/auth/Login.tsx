import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "../../../ui";
import {
  ENTITY_KEY,
  setStoredItem,
  USER_KEY,
  useStore,
} from "../../../core/hooks/useStore";
import { useToast } from "../../../core/hooks/useToast";
import { authService } from "../../../core/services/auth";
import { appService } from "../../../core/services/app";
import { IUser } from "../../../core/interfaces/IUser";
import { IEntity, IEntityItem } from "../../../core/interfaces/IEntity";
import { Roles, SUPER_ADMIN_ENTITY_ID } from "../../../core/enums/roles";

export interface LoginFormState {
  email: string;
  password: string;
}

const initialFormState: LoginFormState = {
  email: "shine@goddidmart.com",
  password: "pass123",
};

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { show } = useToast();
  const { setStoreEntities, isAuthenticatedRef } = useStore();

  const [form, setForm] = useState<LoginFormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<LoginFormState>>({});
  const [loading, setLoading] = useState(false);

  const validate = useCallback(
    (data: LoginFormState): Partial<LoginFormState> => {
      const newErrors: Partial<LoginFormState> = {};

      if (!data.email) {
        newErrors.email = "Email is required.";
      } else if (!EMAIL_REGEX.test(data.email)) {
        newErrors.email = "Invalid email format.";
      }

      if (!data.password) {
        newErrors.password = "Password is required.";
      } else if (data.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters.";
      }

      return newErrors;
    },
    []
  );

  const isFormValid = useMemo(() => {
    const currentErrors = validate(form);
    return Object.keys(currentErrors).length === 0;
  }, [form, validate]);

  const handleInputChange = useCallback(
    (field: keyof LoginFormState) => (value: string) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleEntitiesAfterLogin = async (userData: IUser) => {
      try {
        const entitiesRes = await appService.getEntities();
        console.log(entitiesRes.results)
        let entitiesToSet: IEntityItem[] = [];
          entitiesToSet = entitiesRes.results;
          const hasEntities = entitiesRes?.results?.length > 0;

          if (hasEntities) {
            if (userData.role === Roles.SUPER_ADMIN) {
              entitiesToSet = entitiesRes.results.map((ent: IEntityItem) => ({
                ...ent,
                id: ent.name === "All Entities"
                    ? SUPER_ADMIN_ENTITY_ID
                    : ent.id,
              }));
            
            }

          // FIXED: Ensure setStoreEntities is available and call it
          setStoredItem(ENTITY_KEY, entitiesToSet[0]);
          setStoreEntities(entitiesToSet);
          window.location.replace("/dashboard");
        } else {
          navigate("/account/create-business");
        }
        return;
      } catch (error) {
        console.error("Error fetching entities:", error);
        return false;
      }
    }

  const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      const newErrors = validate(form);
      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        show(
          "Validation Error",
          "Please check your email and password",
          "info"
        );
        return;
      }

      setLoading(true);

      try {
        const res = await authService.login(form);
        if (!res.success) {
          throw new Error(res.message || "Invalid email or password");
        }
        const userData = res?.results;
        setStoredItem(USER_KEY, userData);
        if (!userData.verified) {
          navigate("/account/verify", { state: { email: form.email } });
          show("Info", "Please verify your account to proceed.", "info", 5000);
          return;
        }

        show("Success", "Welcome back!", "success");
        await handleEntitiesAfterLogin(userData);
      } catch (err: any) {
        const errorMessage = err.message || "Invalid email or password";
        show("Error", errorMessage, "error");
      } finally {
        setLoading(false);
      }
    },

  register =  () => {
      navigate("/account/register");
    }

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 card">
        <h2 className="text-3xl font-bold text-center text-text mb-8">
          Login to your account
        </h2>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Email"
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleInputChange("email")}
            placeholder="Enter your email"
            required={true}
            error={errors.email}
          >
            <i
              slot="prefix"
              className="ri-mail-line text-base text-text-light"
            ></i>
          </Input>

          <Input
            label="Password"
            type="password"
            id="pass"
            name="pass"
            value={form.password}
            onChange={handleInputChange("password")}
            placeholder="Enter your password"
            required={true}
            error={errors.password}
          >
            <i
              slot="prefix"
              className="ri-lock-line text-base text-text-light"
            ></i>
          </Input>

          <Button

            type="submit"
            fullWidth={true}
            disabled={!isFormValid || loading}
            loading={loading}
          >
            {!loading && <i className="ri-login-box-line mr-2"></i>}
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="text-center text-text-light text-sm">
          Don't have a merchant account yet?
          <Button variant="link" onClick={register} className="-ml-2">
            Register
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
