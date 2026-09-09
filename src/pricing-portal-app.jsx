import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// ============================================================================
// PRICING PORTAL APP - Zero-Cost Cloud-Based Supplier Pricing System
// ============================================================================

// Initialize Supabase (you'll fill in your keys during setup)
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Main App Component
export default function PricingPortalApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [suppliers, setSuppliers] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  // Check auth on load
  useEffect(() => {
    checkUser();
  }, []);

  // Fetch suppliers and submissions when user logs in
  useEffect(() => {
    if (user) {
      fetchSuppliers();
      fetchSubmissions();
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontSize: '18px' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <LoginView
        onLoginSuccess={() => checkUser()}
        supabase={supabase}
      />
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>📊 Pricing Portal</h1>
          <div style={styles.headerRight}>
            <span style={styles.userEmail}>{user.email}</span>
            <button
              onClick={handleLogout}
              style={styles.logoutBtn}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={styles.nav}>
        <button
          onClick={() => setCurrentView('dashboard')}
          style={{
            ...styles.navBtn,
            ...(currentView === 'dashboard' ? styles.navBtnActive : {})
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setCurrentView('suppliers')}
          style={{
            ...styles.navBtn,
            ...(currentView === 'suppliers' ? styles.navBtnActive : {})
          }}
        >
          Suppliers
        </button>
        <button
          onClick={() => setCurrentView('submissions')}
          style={{
            ...styles.navBtn,
            ...(currentView === 'submissions' ? styles.navBtnActive : {})
          }}
        >
          Submissions
        </button>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        {currentView === 'dashboard' && (
          <DashboardView
            suppliers={suppliers}
            submissions={submissions}
            onRefresh={() => {
              fetchSuppliers();
              fetchSubmissions();
            }}
          />
        )}
        {currentView === 'suppliers' && (
          <SupplierManagementView
            suppliers={suppliers}
            onSuppliersUpdate={fetchSuppliers}
            supabase={supabase}
          />
        )}
        {currentView === 'submissions' && (
          <SubmissionsView
            suppliers={suppliers}
            submissions={submissions}
            onSubmissionsUpdate={fetchSubmissions}
            supabase={supabase}
          />
        )}
      </main>
    </div>
  );
}

// ============================================================================
// LOGIN VIEW
// ============================================================================

function LoginView({ onLoginSuccess, supabase }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: 'admin' }
          }
        });
        if (error) throw error;
        setEmail('');
        setPassword('');
        alert('Sign up successful! Check your email for confirmation.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginBox}>
        <h1 style={styles.loginTitle}>📊 Pricing Portal</h1>
        <p style={styles.loginSubtitle}>Admin Access</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleAuth} style={styles.loginForm}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <button
            type="submit"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
          </button>
        </form>

        <p style={styles.toggleText}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={styles.toggleBtn}
            disabled={loading}
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD VIEW
// ============================================================================

function DashboardView({ suppliers, submissions, onRefresh }) {
  const getExpiringSuppliers = () => {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    return suppliers.filter(s => {
      if (!s.pricing_expiry) return false;
      const expiryDate = new Date(s.pricing_expiry);
      return expiryDate <= twoWeeksFromNow && expiryDate > now;
    }).sort((a, b) => new Date(a.pricing_expiry) - new Date(b.pricing_expiry));
  };

  const getOverdueSuppliers = () => {
    const now = new Date();
    return suppliers.filter(s => {
      if (!s.pricing_expiry) return false;
      const expiryDate = new Date(s.pricing_expiry);
      return expiryDate <= now;
    });
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending_validation');
  const approvedSubmissions = submissions.filter(s => s.status === 'approved');
  const expiringSuppliers = getExpiringSuppliers();
  const overdueSuppliers = getOverdueSuppliers();

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>Dashboard</h2>

      <div style={styles.statsGrid}>
        <StatCard
          title="Total Suppliers"
          value={suppliers.length}
          color="#3498db"
        />
        <StatCard
          title="Pending Validation"
          value={pendingSubmissions.length}
          color="#e74c3c"
        />
        <StatCard
          title="Approved Submissions"
          value={approvedSubmissions.length}
          color="#27ae60"
        />
        <StatCard
          title="Expiring Soon"
          value={expiringSuppliers.length}
          color="#f39c12"
        />
      </div>

      {overdueSuppliers.length > 0 && (
        <AlertBox type="error" title={`⚠️ ${overdueSuppliers.length} Overdue Suppliers`}>
          <ul style={styles.alertList}>
            {overdueSuppliers.map(s => (
              <li key={s.id}><strong>{s.name}</strong> - Expired {formatDate(s.pricing_expiry)}</li>
            ))}
          </ul>
        </AlertBox>
      )}

      {expiringSuppliers.length > 0 && (
        <AlertBox type="warning" title={`⏰ ${expiringSuppliers.length} Expiring in Next 2 Weeks`}>
          <ul style={styles.alertList}>
            {expiringSuppliers.map(s => (
              <li key={s.id}><strong>{s.name}</strong> - Expires {formatDate(s.pricing_expiry)}</li>
            ))}
          </ul>
        </AlertBox>
      )}

      {pendingSubmissions.length > 0 && (
        <AlertBox type="info" title={`📋 ${pendingSubmissions.length} Submissions Pending Review`}>
          <ul style={styles.alertList}>
            {pendingSubmissions.map(s => (
              <li key={s.id}><strong>{s.supplier_name}</strong> - Submitted {formatDate(s.created_at)}</li>
            ))}
          </ul>
        </AlertBox>
      )}

      <button
        onClick={onRefresh}
        style={styles.refreshBtn}
      >
        🔄 Refresh
      </button>
    </div>
  );
}

// ============================================================================
// SUPPLIER MANAGEMENT VIEW
// ============================================================================

function SupplierManagementView({ suppliers, onSuppliersUpdate, supabase }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    cycle_type: 'standard',
    pricing_expiry: '',
    ghbs_served: '',
    notes: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingId) {
        const { error } = await supabase
          .from('suppliers')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([formData]);
        if (error) throw error;
      }

      resetForm();
      onSuppliersUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier) => {
    setFormData(supplier);
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      onSuppliersUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      cycle_type: 'standard',
      pricing_expiry: '',
      ghbs_served: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Supplier Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.addBtn}
        >
          + Add Supplier
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          
          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Supplier Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={styles.input}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label style={styles.label}>Supplier Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                style={styles.input}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label style={styles.label}>Cycle Type</label>
              <select
                name="cycle_type"
                value={formData.cycle_type}
                onChange={handleInputChange}
                style={styles.input}
                disabled={loading}
              >
                <option value="standard">Standard (Jan-Dec)</option>
                <option value="6_month">6-Month</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Pricing Expiry Date</label>
              <input
                type="date"
                name="pricing_expiry"
                value={formData.pricing_expiry}
                onChange={handleInputChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={styles.label}>GHBs Served (comma-separated)</label>
              <input
                type="text"
                name="ghbs_served"
                value={formData.ghbs_served}
                onChange={handleInputChange}
                placeholder="e.g., GHB001, GHB002"
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={styles.label}>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                style={{ ...styles.input, minHeight: '80px', fontFamily: 'monospace' }}
                disabled={loading}
              />
            </div>
          </div>

          <div style={styles.formButtons}>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Saving...' : (editingId ? 'Update Supplier' : 'Add Supplier')}
            </button>
            <button type="button" onClick={resetForm} style={styles.cancelBtn} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th>Name</th>
              <th>Code</th>
              <th>Cycle Type</th>
              <th>Expiry Date</th>
              <th>GHBs Served</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.emptyState}>
                  No suppliers yet. Add one to get started!
                </td>
              </tr>
            ) : (
              suppliers.map(supplier => (
                <tr key={supplier.id} style={styles.tableRow}>
                  <td>{supplier.name}</td>
                  <td><code style={styles.code}>{supplier.code}</code></td>
                  <td>{supplier.cycle_type}</td>
                  <td>{supplier.pricing_expiry ? formatDate(supplier.pricing_expiry) : '-'}</td>
                  <td>{supplier.ghbs_served || '-'}</td>
                  <td style={styles.actionCell}>
                    <button
                      onClick={() => handleEdit(supplier)}
                      style={styles.editBtn}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      style={styles.deleteBtn}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// SUBMISSIONS VIEW
// ============================================================================

function SubmissionsView({ suppliers, submissions, onSubmissionsUpdate, supabase }) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [uploadType, setUploadType] = useState('submission');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  const REQUIRED_COLUMNS = ['supplier code', 'quote reference', 'price', 'expiry'];

  const validateExcelFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { header: 1 });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(firstSheet);

          if (data.length === 0) {
            resolve({
              valid: false,
              errors: ['File is empty']
            });
            return;
          }

          const headers = Object.keys(data[0]).map(h => h.toLowerCase());
          const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));

          if (missingColumns.length > 0) {
            resolve({
              valid: false,
              errors: [`Missing required columns: ${missingColumns.join(', ')}`]
            });
            return;
          }

          const errors = [];
          data.forEach((row, idx) => {
            if (!row['supplier code']) errors.push(`Row ${idx + 2}: Missing supplier code`);
            if (!row['quote reference']) errors.push(`Row ${idx + 2}: Missing quote reference`);
            if (!row['price'] || isNaN(row['price'])) errors.push(`Row ${idx + 2}: Invalid price`);
            if (!row['expiry'] || isNaN(Date.parse(row['expiry']))) errors.push(`Row ${idx + 2}: Invalid expiry date`);
          });

          resolve({
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : [],
            rowCount: data.length
          });
        } catch (err) {
          resolve({
            valid: false,
            errors: ['Invalid Excel file format']
          });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setSelectedFile(file);
    setError('');
    setValidationErrors([]);

    const validation = await validateExcelFile(file);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
    } else {
      setValidationErrors([`✅ File validated successfully! (${validation.rowCount} rows)`]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedSupplierId) {
      setError('Please select a file and supplier');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      const timestamp = new Date().toISOString();
      const fileName = `${uploadType}/${supplier.code}/${timestamp}_${selectedFile.name}`;

      // Upload file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('pricing-files')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Create submission record
      const validation = await validateExcelFile(selectedFile);
      const { error: dbError } = await supabase
        .from('submissions')
        .insert([{
          supplier_id: selectedSupplierId,
          supplier_name: supplier.name,
          file_name: selectedFile.name,
          file_path: data.path,
          upload_type: uploadType,
          status: validation.valid ? 'approved' : 'needs_review',
          validation_errors: validation.valid ? [] : validation.errors,
          created_at: timestamp
        }]);

      if (dbError) throw dbError;

      // Reset form
      setSelectedFile(null);
      setSelectedSupplierId('');
      setUploadType('submission');
      setShowUpload(false);
      setValidationErrors([]);
      onSubmissionsUpdate();
      alert('File uploaded successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('pricing-files')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop();
      a.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const deleteSubmission = async (id, filePath) => {
    if (!window.confirm('Delete this submission?')) return;

    setLoading(true);
    try {
      await supabase.storage.from('pricing-files').remove([filePath]);
      await supabase.from('submissions').delete().eq('id', id);
      onSubmissionsUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>File Submissions</h2>
        <button
          onClick={() => setShowUpload(!showUpload)}
          style={styles.addBtn}
        >
          + Upload File
        </button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          
          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Supplier *</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                style={styles.input}
                disabled={loading}
                required
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>File Type *</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                style={styles.input}
                disabled={loading}
              >
                <option value="submission">New Submission</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={styles.label}>Excel File (.xlsx) *</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                style={styles.input}
                disabled={loading}
                required
              />
              {validationErrors.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  {validationErrors.map((error, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px',
                        marginTop: '4px',
                        backgroundColor: error.includes('✅') ? '#d4edda' : '#f8d7da',
                        color: error.includes('✅') ? '#155724' : '#721c24',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    >
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={styles.formButtons}>
            <button
              type="submit"
              style={styles.submitBtn}
              disabled={loading || !selectedFile || !selectedSupplierId}
            >
              {loading ? 'Uploading...' : 'Upload File'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUpload(false);
                setSelectedFile(null);
                setError('');
                setValidationErrors([]);
              }}
              style={styles.cancelBtn}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th>Supplier</th>
              <th>File Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.emptyState}>
                  No submissions yet.
                </td>
              </tr>
            ) : (
              submissions.map(submission => (
                <tr key={submission.id} style={styles.tableRow}>
                  <td>{submission.supplier_name}</td>
                  <td style={{ fontSize: '13px' }}>{submission.file_name}</td>
                  <td>{submission.upload_type}</td>
                  <td>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: submission.status === 'approved' ? '#27ae60' : '#e74c3c'
                      }}
                    >
                      {submission.status}
                    </span>
                  </td>
                  <td>{formatDate(submission.created_at)}</td>
                  <td style={styles.actionCell}>
                    <button
                      onClick={() => downloadFile(submission.file_path)}
                      style={styles.downloadBtn}
                      disabled={loading}
                    >
                      Download
                    </button>
                    <button
                      onClick={() => deleteSubmission(submission.id, submission.file_path)}
                      style={styles.deleteBtn}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatCard({ title, value, color }) {
  return (
    <div style={{
      ...styles.statCard,
      borderLeftColor: color
    }}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{title}</div>
    </div>
  );
}

function AlertBox({ type, title, children }) {
  const colors = {
    error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
    warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
    info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
  };
  const color = colors[type] || colors.info;

  return (
    <div style={{
      ...styles.alert,
      backgroundColor: color.bg,
      borderLeft: `4px solid ${color.border}`
    }}>
      <h3 style={{ ...styles.alertTitle, color: color.text }}>{title}</h3>
      <div style={{ color: color.text }}>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f5f6fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  userEmail: {
    fontSize: '13px',
    opacity: 0.9
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  nav: {
    display: 'flex',
    gap: 0,
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    paddingLeft: '20px'
  },
  navBtn: {
    padding: '12px 20px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
    transition: 'all 0.2s'
  },
  navBtnActive: {
    borderBottomColor: '#3498db',
    color: '#3498db'
  },
  main: {
    flex: 1,
    padding: '30px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#2c3e50'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  statCard: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #3498db'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2c3e50'
  },
  statLabel: {
    fontSize: '13px',
    color: '#7f8c8d',
    marginTop: '4px'
  },
  alert: {
    padding: '16px',
    borderRadius: '6px',
    marginBottom: '16px'
  },
  alertTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: '600'
  },
  alertList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px'
  },
  form: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '6px',
    color: '#2c3e50'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  formButtons: {
    display: 'flex',
    gap: '10px'
  },
  submitBtn: {
    padding: '10px 24px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s'
  },
  cancelBtn: {
    padding: '10px 24px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  addBtn: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600'
  },
  refreshBtn: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    marginTop: '16px'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #e0e0e0'
  },
  tableRow: {
    borderBottom: '1px solid #e0e0e0',
    transition: 'background-color 0.2s'
  },
  actionCell: {
    display: 'flex',
    gap: '8px'
  },
  editBtn: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  downloadBtn: {
    padding: '6px 12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '13px'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#95a5a6'
  },
  error: {
    padding: '12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '16px',
    fontSize: '14px',
    border: '1px solid #f5c6cb'
  },
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f6fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loginBox: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  loginTitle: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: '700',
    color: '#2c3e50'
  },
  loginSubtitle: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#7f8c8d'
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px'
  },
  toggleText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#7f8c8d',
    margin: 0
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#3498db',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'underline'
  }
};
