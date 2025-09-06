/* global React, ReactDOM, axios */

const { useState, useEffect, useMemo } = React;

function useApi(baseUrl) {
  const [token, setToken] = useState(localStorage.getItem("ofis_admin_token") || "");

  const client = useMemo(() => {
    const inst = axios.create({ baseURL: baseUrl });
    inst.interceptors.request.use((config) => {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return inst;
  }, [baseUrl, token]);

  const saveToken = (t) => {
    setToken(t || "");
    if (t) localStorage.setItem("ofis_admin_token", t);
    else localStorage.removeItem("ofis_admin_token");
  };

  return { client, token, saveToken };
}

function NavigationStatus({ api }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flags, setFlags] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/api/me");
        if (!mounted) return;
        setFlags(data?.client || null);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [api]);

  const decision = useMemo(() => {
    if (!flags) return { stage: "unknown", page: "-" };
    const { companyDetailsComplete, kycStatus, contractStage, cabinAllocated, paymentStatus } = flags;
    if (!companyDetailsComplete) return { stage: "Company Details", page: "CompanyDetailsForm" };
    if ((kycStatus || "").toLowerCase() !== "verified") return { stage: "KYC", page: "KYCVerificationPage" };
    if ((contractStage || "draft") !== "active") return { stage: "Contract", page: "ContractSignature" };
    if (!cabinAllocated) return { stage: "Allocation", page: "AllocateCabin" };
    if (paymentStatus !== "paid") return { stage: "Payment", page: "Payments" };
    return { stage: "Dashboard", page: "ClientDashboard" };
  }, [flags]);

  return (
    <Section title="Navigation (via /api/me)">
      {loading && <div>Loading navigation...</div>}
      {error && <div className="error">{error}</div>}
      {!loading && flags && (
        <div>
          <div style={{marginBottom: 10}}>
            <strong>Client ID:</strong> {flags.id}
          </div>
          <ul>
            <li><strong>companyDetailsComplete</strong>: {String(flags.companyDetailsComplete)}</li>
            <li><strong>kycStatus</strong>: {flags.kycStatus || "none"}</li>
            <li><strong>contractStage</strong>: {flags.contractStage || "-"}</li>
            <li><strong>cabinAllocated</strong>: {String(flags.cabinAllocated)}</li>
            <li><strong>paymentStatus</strong>: {flags.paymentStatus || "-"}</li>
          </ul>
          <div style={{marginTop: 10}}>
            <strong>Decision</strong>: Go to <span className="badge badge-pending">{decision.page}</span> (Stage: {decision.stage})
          </div>
        </div>
      )}
      {!loading && !flags && (
        <div>No client found for this token. Use a client token to see navigation flags.</div>
      )}
    </Section>
  );
}

function Section({ title, children, right }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{title}</h2>
        <div>{right}</div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function AdminLogin({ api, onLogin }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/api/auth/admin/login", { email, phone, password });
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Admin Login">
      <form onSubmit={handleLogin} className="form-grid">
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
        </div>
        <div className="field">
          <label>Phone (optional)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9999999999" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="actions">
          <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>
    </Section>
  );
}

function CreateClient({ api, onCreated }) {
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = { companyName, contactPerson, email, phone, companyAddress };
      const { data } = await api.post("/api/clients", payload);
      onCreated(data.client);
      setCompanyName("");
      setContactPerson("");
      setEmail("");
      setPhone("");
      setCompanyAddress("");
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Create Client (Admin)" right={<small>Defaults: companyDetailsComplete=true, kycStatus=pending</small>}>
      <form onSubmit={handleCreate} className="form-grid">
        <div className="field">
          <label>Company Name</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Corp" />
        </div>
        <div className="field">
          <label>Contact Person</label>
          <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="John Doe" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@acme.com" />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
        </div>
        <div className="field full">
          <label>Address</label>
          <input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Street, City" />
        </div>
        <div className="actions">
          <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Client"}</button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>
    </Section>
  );
}

function ClientsList({ api, refreshSignal }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(null); // clientId currently uploading

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/clients");
      setClients(data || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshSignal]);

  const handleVerify = async (clientId) => {
    try {
      await api.post(`/api/clients/${clientId}/kyc/verify`);
      await load();
      alert("KYC verified. A draft contract is created automatically.");
    } catch (err) {
      alert(err?.response?.data?.error || err.message);
    }
  };

  const handleUploadKyc = async (clientId, files) => {
    if (!files || !files.length) return;
    const form = new FormData();
    // append all files under field name 'kycFiles'
    Array.from(files).forEach((f) => form.append("kycFiles", f));
    setUploading(clientId);
    try {
      await api.post(`/api/clients/${clientId}/kyc`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
      alert("KYC submitted and set to verified");
    } catch (err) {
      alert(err?.response?.data?.error || err.message);
    } finally {
      setUploading(null);
    }
  };

  return (
    <Section title="Clients">
      {loading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      {!loading && (
        <table className="table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Phone</th>
              <th>KYC</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c._id}>
                <td>{c.companyName || "-"}</td>
                <td>{c.contactPerson || "-"}</td>
                <td>{c.email || "-"}</td>
                <td>{c.phone || "-"}</td>
                <td>
                  <span className={`badge badge-${(c.kycStatus || "none").toLowerCase()}`}>{c.kycStatus || "none"}</span>
                </td>
                <td className="row-actions">
                  <label className="upload-btn">
                    Upload KYC
                    <input type="file" multiple onChange={(e) => handleUploadKyc(c._id, e.target.files)} disabled={uploading===c._id} />
                  </label>
                  {String(c.kycStatus).toLowerCase() !== "verified" && (
                    <button onClick={() => handleVerify(c._id)}>Verify KYC</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

function App() {
  const [baseUrl, setBaseUrl] = useState(localStorage.getItem("ofis_api_base") || "http://localhost:5001");
  const { client: api, token, saveToken } = useApi(baseUrl);
  const [user, setUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { localStorage.setItem("ofis_api_base", baseUrl); }, [baseUrl]);

  const handleLoggedIn = (t, u) => {
    saveToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    saveToken("");
    setUser(null);
  };

  return (
    <div className="container">
      <header className="topbar">
        <div className="brand">Ofis Square • Admin Flow</div>
        <div className="top-actions">
          <input className="baseurl" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          {user ? (
            <>
              <span className="user">{user?.name} ({user?.roleName || "admin"})</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : null}
        </div>
      </header>

      {!token ? (
        <AdminLogin api={api} onLogin={handleLoggedIn} />
      ) : (
        <>
          <NavigationStatus api={api} />
          <CreateClient api={api} onCreated={() => setRefreshKey((k) => k+1)} />
          <ClientsList api={api} refreshSignal={refreshKey} />
          <Section title="Next Stage: Contract Signing">
            <p>
              After KYC is verified, a draft contract is created automatically for the client
              (see <code>controllers/clientController.js</code> → <code>verifyKyc()</code>). You can then manage
              contract sending and signature using the Zoho Sign integration.
            </p>
          </Section>
        </>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
