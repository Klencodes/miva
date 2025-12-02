import React, { useState, useCallback, useEffect } from "react";
import { Button, Input } from "../../../ui";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../../core/services/auth";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import {
  ENTITY_KEY,
  setStoredItem,
  USER_KEY,
  useStore,
} from "../../../core/hooks/useStore";
import { appService } from "../../../core/services/app";
import { Roles, SUPER_ADMIN_ENTITY_ID } from "../../../core/enums/roles";
import { IUser } from "../../../core/interfaces/IUser";
import { IEntityItem, IEntity } from "../../../core/interfaces/IEntity";
import { toast } from "sonner";

const CODE_LENGTH = 4;

const Verify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setStoreEntities } = useStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  usePageTitle("Verify Account");

  useEffect(() => {
    const state = location.state as { email: string } | undefined;

    if (state?.email) {
      setCurrentEmail(state.email);
    } else {
      toast.error("Session Expired", {
        description: "Please register or log in again.",
      });
      navigate("/account/register", { replace: true });
    }
  }, [location.state, navigate]);

  const validateCode = useCallback((value: string) => {
    if (!value) return "Verification Code is required.";
    if (value.length !== CODE_LENGTH)
      return `Code must be ${CODE_LENGTH} digits.`;
    if (/\D/.test(value)) return "Code must contain only digits.";
    return "";
  }, []);

  const handleChange = (value: string) => {
    const sanitizedValue = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(sanitizedValue);

    if (sanitizedValue) {
      setError(validateCode(sanitizedValue));
    } else {
      setError("");
    }
  };

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateCode(code);
    if (validationError) {
      setError(validationError);
      toast.error("Validation Error", {
        description: "Please enter a valid verification code.",
      });
      return;
    }

    if (!currentEmail) {
      toast.error("Error", {
        description: "Email not found. Please try again.",
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: currentEmail,
        otp: code,
      };
      const response = await authService.verifyOTP(payload);

      if (!response.success) {
        throw new Error(response.message || "Verification failed.");
      }

      toast.success("Success", {
        description: response.message || "Email verified successfully!",
      });

      if (response.results?.user) {
        setStoredItem(USER_KEY, response.results.user);
      }

      await handleEntitiesAfterVerification(response.results?.user);
    } catch (err: any) {
      const errorMessage =
        err.message ||
        "Verification failed. The code might be incorrect or expired.";
      toast.error("Error", { description: errorMessage });
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendLoading || !currentEmail) return;

    setResendLoading(true);
    try {
      const response = await authService.resendOTP({ email: currentEmail });

      if (response.success) {
        toast.success("Success", {
          description:
            response.message || "Verification code resent to your email.",
        });
      } else {
        throw new Error(response.message || "Failed to resend code.");
      }
    } catch (err: any) {
      const errorMessage =
        err.message || "Failed to resend code. Please try again later.";
      toast.error("Error", { description: errorMessage });
    } finally {
      setResendLoading(false);
    }
  };

  const goToRegister = () => {
    navigate("/account/register");
  };

  const isFormValid = code.length === CODE_LENGTH && !error && !!currentEmail;

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 card">
        <div className="text-center">
          <i className="ri-mail-check-line text-4xl text-primary-60 mb-6"></i>
          <h2 className="text-3xl font-bold text-text mb-2">
            Verify Your Email
          </h2>
          <div className="text-text-light">
            We sent a verification code to
            <span className="font-semibold text-text">
              {`${" "}${currentEmail || "..."}`}
            </span>
          </div>
        </div>

        <form className="space-y-6 justify-center" onSubmit={onSubmit}>
          <Input
            label="Verification Code"
            type="text"
            value={code}
            onChange={handleChange}
            placeholder={`Enter ${CODE_LENGTH}-digit code`}
            required={true}
            error={error}
          />

          <Button
            type="submit"
            disabled={!isFormValid || loading}
            loading={loading}
            fullWidth
          >
            {loading ? "Verifying..." : "Verify Email"}
          </Button>
        </form>

        <div className="text-center space-y-4">
          <div className="text-text-light text-sm">
            Didn't receive the code?
            <Button
              variant="link"
              onClick={resendCode}
              disabled={resendLoading || !currentEmail}
              className="-ml-2"
            >
              {resendLoading ? "Sending..." : "Resend Code"}
            </Button>
          </div>

          <div className="text-center text-text-light text-sm">
            Wrong email?
            <Button variant="link" onClick={goToRegister} className="-ml-2">
              Go back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
