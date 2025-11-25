import React, { useState, useEffect } from "react";
import { useModal } from "../../../core/hooks/useModal";
import { appService } from "../../../core/services/app";
import { Button, Input } from "../../../ui";
import { IEntityItem } from "../../../core/interfaces/IEntity";

interface AssignUserEntityFormData {
  user_id: string;
  entity_id: string;
  role: string;
}

const AssignUserEntity: React.FC = () => {
  const { modalRef, modalData } = useModal();
  const [formData, setFormData] = useState<AssignUserEntityFormData>({
    user_id: modalData.id,
    entity_id: "",
    role: "staff",
  });
  const [entities, setEntities] = useState<IEntityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [entitiesLoading, setEntitiesLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Fetch available entities
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        setEntitiesLoading(true);
        const response = await appService.getEntities();
        if (response && response.results) {
          setEntities(response.results);
        }
      } catch (err) {
        console.error("Error fetching entities:", err);
        setError("Failed to load entities");
      } finally {
        setEntitiesLoading(false);
      }
    };

    fetchEntities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.entity_id) {
      setError("Please select an entity");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // NOTE: Assuming appService.assignUserToEntity exists and handles the POST request
      const response = await appService.assignUserToEntity(formData);

      if (response.success) {
        modalRef?.close({ success: true, user: response.results });
      } else {
        setError(response?.message || "Failed to assign user to entity");
      }
    } catch (err: any) {
      // Check if error is an API response with a message or a generic error
      const errorMessage = err.response?.data?.message || err.message || "An unexpected error occurred during assignment.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof AssignUserEntityFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user makes a selection
    if (error) setError("");
  };

  return (
    // Main container uses flex-col to stack header, body (flex-1), and footer
    <div className="flex flex-col h-full w-full mx-auto px-2">
      
      {/* Header Section (Non-scrolling) */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4">
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">
            Assign User to Entity
          </h2>
          <h4 className="text-md text-text-light mt-1">
            Assign{" "}
            <span className="font-medium">
              {modalData.first_name} {modalData.last_name}
            </span>{" "}
            to an entity
          </h4>
        </div>
        <button
          onClick={() => modalRef!.dismiss()}
          className="w-8 h-8 rounded-full text-text-light hover:bg-background-50 transition-colors flex items-center justify-center"
          aria-label="Close modal"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Scrollable Body Content (Form) */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-4">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          
          {/* User Info Display with Icon */}
          <div className="p-3 bg-background rounded border border-border flex items-center gap-4">
            {/* Rounded Photo/Icon */}
            <div className="w-12 h-12 rounded-full bg-primary-10 flex items-center justify-center text-primary text-xl">
              {modalData?.image_url ? <img src={modalData.image_url} alt={modalData.first_name} />: <i className="ri-user-fill"></i>}
            </div>
            {/* User Details */}
            <div>
              <div className="text-sm text-text-light">User</div>
              <div className="font-medium text-text">
                {modalData.first_name} {modalData.last_name}
              </div>
              <div className="text-xs text-text-light mt-1">
                {modalData.email}
              </div>
            </div>
          </div>

          {/* Entity Selection */}
          <div>
            <Input
              label="Select Entity *"
              type="select"
              id="entity"
              value={formData.entity_id}
              onChange={(value) => handleChange("entity_id", value)}
              disabled={entitiesLoading}
              required
              selectOptions={[
                { value: "", label: entitiesLoading ? "Loading entities..." : "Choose an entity..." } as any,
                ...entities.map((entity: IEntityItem) => ({
                  value: entity.id,
                  label: entity.name,
                })),
              ]}
            />
          </div>

          {/* Role Selection */}
          <div>
            <Input
              label="Select Role"
              type="select"
              id="role"
              value={formData.role}
              onChange={(value) => handleChange("role", value)}
              disabled={entitiesLoading}
              selectOptions={[
                { value: "staff", label: "Staff" },
                { value: "manager", label: "Manager" },
                { value: "admin", label: "Admin" },
              ]}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-danger-5 border border-danger rounded-sm text-danger text-sm">
              <i className="ri-error-warning-line mr-2"></i>
              {error}
            </div>
          )}
        </form>
      </div>
      
      {/* Sticky Action Buttons (Footer) */}
      <div className="flex justify-end items-center py-4 border-t border-border mt-auto bg-card">
          <Button
            type="button"
            variant="outline"
            onClick={() => modalRef?.dismiss()}
            disabled={loading}
            className="flex-1 mr-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            loading={loading}
            disabled={!formData.entity_id || entitiesLoading}
            className="flex-1 ml-2"
          >
            Assign User
          </Button>
        </div>
    </div>
  );
};

export default AssignUserEntity;