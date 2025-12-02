import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button } from "../../../ui";
import { countries } from "./countries";
import { authService } from "../../../core/services/auth";
import {
  ENTITY_KEY,
  setStoredItem,
  USER_KEY,
  useStore,
} from "../../../core/hooks/useStore";
import { toast } from "sonner";
import { Roles, SUPER_ADMIN_ENTITY_ID } from "../../../core/enums/roles";
import { IUser } from "../../../core/interfaces/IUser";
import { appService } from "../../../core/services/app";
import { IEntity, IEntityItem } from "../../../core/interfaces/IEntity";

interface RegisterForm {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  phone_code: string;
}

const Register: React.FC = () => {
  const { setUser, setStoreEntities } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const phoneCodes = useMemo(
    () =>
      countries.map((country: { flag: any; code: any; phone_code: any }) => ({
        label: `${country.flag} ${country.code} | ${country.phone_code}`,
        value: country.phone_code,
      })),
    []
  );

  const initialFormData: RegisterForm = {
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    phone_code: phoneCodes[0].value || "",
  };

  const [formData, setFormData] = useState<RegisterForm>(initialFormData);

  const handleInputChange = useCallback(
    (field: keyof RegisterForm) => (value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const isFormValid = useMemo(() => {
    const { email, password, first_name, last_name, phone_number, phone_code } =
      formData;
    return (
      !!email &&
      !!password &&
      !!first_name &&
      !!last_name &&
      !!phone_number &&
      !!phone_code &&
      password.length >= 6 &&
      /\S+@\S+\.\S+/.test(email)
    );
  }, [formData]);

  const onSubmit = useCallback(async () => {
    if (formData?.password.length < 6) {
      toast.error("Error", {
        description: "Password must be at least 6 characters",
      });
      return;
    }
    if (!isFormValid) {
      toast.error("Validation Error", {
        description: "Please fill all required fields correctly",
      });
      return;
    }

    setLoading(true);

    try {
      const response: any = await authService.register(formData);
      if (response.success) {
        setStoredItem(USER_KEY, response.results);
        setLoading(false);
        if (response.results && response.results?.role === Roles.SUPER_ADMIN) {
          await handleEntitiesAfterVerification(response.results)
        } else {
          navigate("/account/verify", {
            state: { email: formData.email },
          });
        }

        toast.success(response.response || "Success", {
          description: response.message || "Registration successful",
        });
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.error?.message || err.message || "Registration failed";
      toast.error("Error", { description: errorMessage });
    }
    // eslint-disable-next-line
  }, [formData, isFormValid, setUser]); // Add setUser to dependencies

  const handleEntitiesAfterVerification = useCallback(
    async (userData: IUser) => {
      try {
        const entitiesRes = await appService.getEntities();
        const rawResults = entitiesRes.results;

        let entitiesToSet: IEntityItem[] = [];
        let entityToSet: IEntityItem | null = null;

        let entityArray: any[] = [];

        if (
          !rawResults ||
          (Array.isArray(rawResults) && rawResults.length === 0)
        ) {
          entityArray = [];
        } else if (Array.isArray(rawResults)) {
          entityArray = rawResults;
        } else if (typeof rawResults === "object" && rawResults !== null) {
          entityArray = [rawResults];
        } else {
          console.warn("Unexpected entity response structure:", rawResults);
          navigate("/account/create-business", { replace: true });
          return;
        }

        const hasEntities = entityArray.length > 0;

        if (hasEntities) {
          const isPending = entityArray.some((ent) => ent.approved === false);

          if (isPending) {
            navigate("/account/pending-entity-approval", {
              replace: true,
              state: entityArray[0],
            });
            return;
          }

          entitiesToSet = entityArray.map((ent) =>
            ent.entity ? ent.entity : ent
          );

          if (userData.role === Roles.SUPER_ADMIN) {
            entitiesToSet = entitiesRes.results.map((ent: IEntity) => ({
              ...ent.entity,
              id:
                ent.entity.name === "All Entities"
                  ? SUPER_ADMIN_ENTITY_ID
                  : ent.entity.id,
            }));
            entityToSet = entitiesToSet[0];
          } else {
            entityToSet = entitiesToSet[0];
          }

          setStoredItem(ENTITY_KEY, entityToSet);
          setStoreEntities(entitiesToSet);
          window.location.replace("/dashboard");
        } else {
          setStoreEntities([]);
          setStoredItem(ENTITY_KEY, null);
          navigate("/account/create-business", { replace: true });
        }
      } catch (error) {
        console.error("Error fetching entities:", error);
        navigate("/account/create-business", { replace: true });
      }
    },
    // eslint-disable-next-line
    [setStoreEntities]
  );

  const handleLogin = useCallback(() => {
    navigate("/account/login");
  }, [navigate]);

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 card">
        <h2 className="text-3xl font-bold text-center text-text mb-8">
          Create your account
        </h2>

        <div className="">
          <div className="grid grid-cols-2 gap-x-4">
            <Input
              id="firstname"
              label="First Name"
              type="text"
              name="firstname"
              value={formData.first_name}
              onChange={handleInputChange("first_name")}
              placeholder="John"
              required={true}
            />

            <Input
              id="last_name"
              label="Last Name"
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange("last_name")}
              placeholder="Doe"
              required={true}
            />
          </div>

          <Input
            id="emailF"
            label="Email"
            type="email"
            name="emailF"
            value={formData.email}
            onChange={handleInputChange("email")}
            placeholder="Enter your email"
            required={true}
          />

          <div className="flex gap-2">
            <div className="w-32">
              <Input
                id="code"
                label="Code"
                type="select"
                name="code"
                value={formData.phone_code}
                onChange={handleInputChange("phone_code")}
                selectOptions={phoneCodes}
                required={true}
              />
            </div>

            <div className="flex-1">
              <Input
                id="phonenumber"
                label="Phone Number"
                type="tel"
                name="phonenumber"
                value={formData.phone_number}
                onChange={handleInputChange("phone_number")}
                placeholder="987 654 321"
                required={true}
              />
            </div>
          </div>

          <Input
            id="password"
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange("password")}
            placeholder="Enter your password"
            required={true}
          />

          <Button
            onClick={onSubmit}
            fullWidth={true}
            disabled={loading}
            loading={loading}
          >
            {!loading && <i className="ri-user-add-line mr-2"></i>}
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </div>

        <div className="text-center text-text-light text-sm">
          Already have an account?
          <Button className="-ml-2" variant="link" onClick={handleLogin}>
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Register;
