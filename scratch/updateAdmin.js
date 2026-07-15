const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Admin.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state for settings
const stateCode = `  const [settingsForm, setSettingsForm] = useState({
    baseCity: '',
    baseState: '',
    cityCharge: 0,
    stateCharge: 40,
    otherCharge: 60
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
`;
content = content.replace(/(const \[actionLoading, setActionLoading\] = useState\(false\);)/, `$1\n${stateCode}`);

// 2. Add fetch logic for settings
const fetchLogic = `
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettingsForm({
          baseCity: data.baseCity || '',
          baseState: data.baseState || '',
          cityCharge: data.cityCharge || 0,
          stateCharge: data.stateCharge || 0,
          otherCharge: data.otherCharge || 0
        });
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify(settingsForm)
      });
      if (!res.ok) throw new Error('Failed to save settings');
      showToast('Settings saved successfully!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);
`;

content = content.replace(/(const fetchOrders = async \(\) => \{)/, `${fetchLogic}\n  $1`);

// 3. Add Settings Tab Button
const settingsTabBtn = `          <button 
            onClick={() => setActiveTab('settings')} 
            className={\`admin-tab-btn \${activeTab === 'settings' ? 'active' : ''}\`}
          >
            <Edit size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Settings
          </button>`;

content = content.replace(/(<button \s*onClick=\{\(\) => setActiveTab\('orders'\)\}[^>]*>[\s\S]*?<\/button>)/, `$1\n${settingsTabBtn}`);

// 4. Add Settings Tab Content
const settingsTabContent = `
        {/* TAB 3: SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Store Delivery Settings</h2>
            {loadingSettings ? (
              <Loader2 size={32} className="spinner" style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
            ) : (
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Base City</label>
                    <input 
                      type="text" 
                      value={settingsForm.baseCity} 
                      onChange={(e) => setSettingsForm({...settingsForm, baseCity: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Base State</label>
                    <input 
                      type="text" 
                      value={settingsForm.baseState} 
                      onChange={(e) => setSettingsForm({...settingsForm, baseState: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>City Charge (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={settingsForm.cityCharge} 
                      onChange={(e) => setSettingsForm({...settingsForm, cityCharge: Number(e.target.value)})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>State Charge (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={settingsForm.stateCharge} 
                      onChange={(e) => setSettingsForm({...settingsForm, stateCharge: Number(e.target.value)})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Other State Charge (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={settingsForm.otherCharge} 
                      onChange={(e) => setSettingsForm({...settingsForm, otherCharge: Number(e.target.value)})} 
                      required 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={actionLoading}
                  style={{ alignSelf: 'flex-start', padding: '0.8rem 2rem' }}
                >
                  {actionLoading ? <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : 'Save Settings'}
                </button>
              </form>
            )}
          </div>
        )}
`;

content = content.replace(/(<\/div>\s*\{\/\* --- ADD\/EDIT MODAL OVERLAY --- \*\/})/, `  ${settingsTabContent}\n      $1`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Admin.jsx updated successfully.');
