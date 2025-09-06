import React from "react";
import { Badge } from "../ui/Badge";

const stages = [
  { id: "company", name: "Company Details", key: "companyDetailsComplete" },
  { id: "kyc", name: "KYC Verification", key: "kycStatus" },
  { id: "contract", name: "Contract Signing", key: "contractStage" },
  { id: "allocation", name: "Cabin Allocation", key: "cabinAllocated" },
  { id: "payment", name: "Payment", key: "paymentStatus" },
  { id: "dashboard", name: "Dashboard", key: "complete" },
];

export function StageProgress({ clientData }) {
  const getCurrentStage = () => {
    if (!clientData) return 0;
    
    const { companyDetailsComplete, kycStatus, contractStage, cabinAllocated, paymentStatus } = clientData;
    
    if (!companyDetailsComplete) return 0;
    if ((kycStatus || "").toLowerCase() !== "verified") return 1;
    if ((contractStage || "draft") !== "active") return 2;
    if (!cabinAllocated) return 3;
    if (paymentStatus !== "paid") return 4;
    return 5;
  };

  const currentStage = getCurrentStage();

  const getStageStatus = (index) => {
    if (index < currentStage) return "completed";
    if (index === currentStage) return "current";
    return "pending";
  };

  const getStageValue = (stage, index) => {
    if (!clientData) return null;
    
    switch (stage.key) {
      case "companyDetailsComplete":
        return clientData.companyDetailsComplete ? "Complete" : "Pending";
      case "kycStatus":
        return clientData.kycStatus || "Not Started";
      case "contractStage":
        return clientData.contractStage || "Draft";
      case "cabinAllocated":
        return clientData.cabinAllocated ? "Allocated" : "Pending";
      case "paymentStatus":
        return clientData.paymentStatus || "Pending";
      case "complete":
        return currentStage === 5 ? "Complete" : "Pending";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Onboarding Progress</h3>
      
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const status = getStageStatus(index);
          const value = getStageValue(stage, index);
          
          return (
            <div key={stage.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`stage-step-icon ${status}`}>
                  {status === "completed" ? "✓" : index + 1}
                </div>
                <span className={`stage-step-text ${status}`}>
                  {stage.name}
                </span>
              </div>
              <Badge 
                variant={
                  status === "completed" ? "success" : 
                  status === "current" ? "info" : 
                  "gray"
                }
              >
                {value}
              </Badge>
            </div>
          );
        })}
      </div>
      
      {clientData && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Client ID:</strong> {clientData.id || clientData._id}
          </p>
        </div>
      )}
    </div>
  );
}
