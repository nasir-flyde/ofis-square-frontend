import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "./components/pages/AuthPage";
import { DetailsPage } from "./components/pages/DetailsPage";
import { KYCPage } from "./components/pages/KYCPage";
import { ContractPage } from "./components/pages/ContractPage";
import { AllocationPage } from "./components/pages/AllocationPage";
import { PaymentPage } from "./components/pages/PaymentPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { UploadSignedContractPage } from "./components/pages/UploadSignedContractPage";
import { RecordPaymentPage } from "./components/pages/RecordPaymentPage";
import { CreateInvoicePage } from "./components/pages/CreateInvoicePage";
import { CompanyDetailsPage } from "./components/pages/CompanyDetailsPage";
import { ClientsPage } from "./components/pages/ClientsPage";
import { BuildingsPage } from "./components/pages/BuildingsPage";
import { CabinsPage } from "./components/pages/CabinsPage";
import { MeetingRoomsPage } from "./components/pages/MeetingRoomsPage";
import { ContractsPage } from "./components/pages/ContractsPage";
import { InvoicesPage } from "./components/pages/InvoicesPage";
import { TicketsPage } from "./components/pages/TicketsPage";
import { UsersPage } from "./components/pages/UsersPage";
import { PaymentsPage } from "./components/pages/PaymentsPage";
import { MembersPage } from "./components/pages/MembersPage";
import { CreditManagementPage } from "./components/pages/CreditManagementPage";
import { ActivityLogsPage } from "./components/pages/ActivityLogsPage";
import { EventsPage } from "./components/pages/EventsPage";
import { MainLayout } from "./components/layout/MainLayout";
import ReceptionDashboard from "./components/pages/ReceptionDashboard";
import InviteVisitor from "./components/pages/InviteVisitor";
import { OnDemandAuthPage } from "./components/pages/OnDemandAuthPage";
import { QRScannerPage } from "./components/pages/QRScannerPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/details" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        {/* Day Pass public auth */}
        <Route path="/ondemand" element={<OnDemandAuthPage />} />
        <Route path="/dashboard" element={
          <MainLayout>
            <DashboardPage />
          </MainLayout>
        } />
        <Route path="/details" element={
          <MainLayout>
            <DetailsPage />
          </MainLayout>
        } />
        <Route path="/company" element={
          <MainLayout>
            <CompanyDetailsPage />
          </MainLayout>
        } />
        <Route path="/clients" element={
          <MainLayout>
            <ClientsPage />
          </MainLayout>
        } />
        <Route path="/members" element={
          <MainLayout>
            <MembersPage />
          </MainLayout>
        } />
        <Route path="/cabins" element={
          <MainLayout>
            <CabinsPage />
          </MainLayout>
        } />
        <Route path="/meeting-rooms" element={
          <MainLayout>
            <MeetingRoomsPage />
          </MainLayout>
        } />
        <Route path="/events" element={
          <MainLayout>
            <EventsPage />
          </MainLayout>
        } />
        <Route path="/users" element={
          <MainLayout>
            <UsersPage />
          </MainLayout>
        } />
        <Route path="/buildings" element={
          <MainLayout>
            <BuildingsPage />
          </MainLayout>
        } />
        <Route path="/invoices" element={
          <MainLayout>
            <InvoicesPage />
          </MainLayout>
        } />
        <Route path="/payments" element={
          <MainLayout>
            <PaymentsPage />
          </MainLayout>
        } />
        <Route path="/credits" element={
          <MainLayout>
            <CreditManagementPage />
          </MainLayout>
        } />
        <Route path="/visitors/reception" element={
          <MainLayout>
            <ReceptionDashboard />
          </MainLayout>
        } />
        <Route path="/visitors/invite" element={
          <MainLayout>
            <InviteVisitor />
          </MainLayout>
        } />
        <Route path="/create-invoice" element={
          <MainLayout>
            <CreateInvoicePage />
          </MainLayout>
        } />
        <Route path="/tickets" element={
          <MainLayout>
            <TicketsPage />
          </MainLayout>
        } />
        <Route path="/contracts" element={
          <MainLayout>
            <ContractsPage />
          </MainLayout>
        } />
        <Route path="/scanner" element={
          <MainLayout>
            <QRScannerPage />
          </MainLayout>
        } />
        <Route path="/activity-logs" element={
          <MainLayout>
            <ActivityLogsPage />
          </MainLayout>
        } />
        <Route path="/reports" element={
          <MainLayout>
            <div className="p-6">
              <h1 className="text-2xl font-bold">Reports</h1>
              <p className="text-gray-600">View your reports here</p>
            </div>
          </MainLayout>
        } />
        <Route path="/settings" element={
          <MainLayout>
            <div className="p-6">
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-gray-600">Manage your settings here</p>
            </div>
          </MainLayout>
        } />

        {/* Onboarding flow routes with sidebar */}
        <Route path="/kyc" element={
          <MainLayout>
            <KYCPage />
          </MainLayout>
        } />
        <Route path="/contract" element={
          <MainLayout>
            <ContractPage />
          </MainLayout>
        } />
        <Route path="/allocation" element={
          <MainLayout>
            <AllocationPage />
          </MainLayout>
        } />
        <Route path="/payment" element={
          <MainLayout>
            <PaymentPage />
          </MainLayout>
        } />
        <Route path="/upload-signed-contract/:contractId" element={
          <MainLayout>
            <UploadSignedContractPage />
          </MainLayout>
        } />
        <Route path="/record-payment" element={
          <MainLayout>
            <RecordPaymentPage />
          </MainLayout>
        } />

        {/* Legacy routes without sidebar (if needed) */}
      </Routes>
    </Router>
  );
}

export default App;
