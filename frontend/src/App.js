import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Dashboard from './Dashboard';
import { submitManualData } from './api';

function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('choice'); 
    const [isLoading, setIsLoading] = useState(false);
    
    // Data States
    const [analysisData, setAnalysisData] = useState(null);
    const [productName, setProductName] = useState('');
    const [dietHistory, setDietHistory] = useState([]);
    const [totals, setTotals] = useState({ sugar: 0, protein: 0 });

    // Auth & Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [barcode, setBarcode] = useState('');
    const [manualEntry, setManualEntry] = useState({ name: '', sugar: '', protein: '' });

    // Quiz States
    const [goal, setGoal] = useState('Energy');
    const [symptoms, setSymptoms] = useState([]);
    const goals = ["Energy", "Immunity", "Cognitive Focus", "Skin Health", "Muscle Recovery", "Longevity", "Gut Health"];
    const symptomList = ["Fatigue", "Stress", "Poor Sleep", "Muscle Cramps", "Brain Fog", "Joint Pain", "Brittle Nails", "Anxiety", "Dry Eyes", "Bloating"];

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) setView('choice');
        });
        return () => subscription.unsubscribe();
    }, []);

    // --- DIET PLAN LOGIC ---
    const calculateTotals = (data) => {
        let tSugar = 0;
        let tProtein = 0;
        data.forEach(item => {
            if (item.analysis_json) {
                item.analysis_json.forEach(flag => {
                    // Regex searches for any number following a label like "Sugar: "
                    const match = flag.rsid.match(/(\d+(\.\d+)?)/);
                    const val = match ? parseFloat(match[0]) : 0;
                    if (flag.rsid.toLowerCase().includes('sugar')) tSugar += val;
                    if (flag.rsid.toLowerCase().includes('protein')) tProtein += val;
                });
            }
        });
        setTotals({ sugar: tSugar.toFixed(1), protein: tProtein.toFixed(1) });
    };

    const fetchDietPlan = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('diet_logs').select('*').order('created_at', { ascending: false });
        if (!error) {
            setDietHistory(data);
            calculateTotals(data);
        }
        setView('view_plan');
        setIsLoading(false);
    };

    const deleteItem = async (id) => {
        const { error } = await supabase.from('diet_logs').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchDietPlan();
    };

    const saveToDietPlan = async (customData = null) => {
        const entry = customData || { product_name: productName, analysis_json: analysisData, user_id: user.id };
        const { error } = await supabase.from('diet_logs').insert([entry]);
        if (error) alert(error.message);
        else {
            alert("Added to plan!");
            fetchDietPlan(); // This triggers recalculation
        }
    };

    // --- SEARCH HANDLERS ---
    const goHome = () => { setAnalysisData(null); setProductName(''); setBarcode(''); setView('choice'); };

    const handleBarcodeSearch = async (val = barcode) => {
        if (!val) return; setIsLoading(true);
        try {
            const response = await fetch(`https://nutrigen-f092.onrender.com/scan-barcode/${val}`);
            const result = await response.json();
            if (result.status === "success") { setAnalysisData(result.data); setProductName(result.product_name); }
        } catch (err) { alert("Barcode failed"); } finally { setIsLoading(false); }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return; setIsLoading(true);
        const formData = new FormData(); formData.append("file", file);
        try {
            const response = await fetch("https://nutrigen-f092.onrender.com/upload-barcode-photo", { method: "POST", body: formData });
            const result = await response.json();
            if (result.status === "success") { setAnalysisData(result.data); setProductName(result.product_name); }
        } catch (err) { alert("Photo failed"); } finally { setIsLoading(false); }
    };

    const handleQuizSubmit = async () => {
        setIsLoading(true);
        try {
            const response = await submitManualData({ goal, symptoms });
            setAnalysisData(response.data); setProductName("Personal Health Profile");
        } catch (err) { alert("Quiz failed"); } finally { setIsLoading(false); }
    };

    const MenuCard = ({ icon, title, desc, onClick }) => (
        <div style={styles.optionCard} onClick={onClick}>
            <div style={styles.cardIcon}>{icon}</div>
            <h3 style={styles.cardTitle}>{title}</h3>
            <p style={styles.cardDesc}>{desc}</p>
        </div>
    );
    // ... inside your App component ...
const [authError, setAuthError] = useState(''); // New state for error messages

const handleLogin = async () => {
    setAuthError(''); // Clear previous errors
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        // Handle specific Supabase error cases
        if (error.message.includes("Invalid login credentials")) {
            // This covers both "Email not found" and "Wrong password" for security
            // But we can check for the "User not found" specific string if your project settings allow it
            setAuthError("Incorrect password or email not registered.");
        } else if (error.status === 400) {
            setAuthError("Email not found. Please sign up first.");
        } else {
            setAuthError(error.message);
        }
    }
};

const handleSignUp = async () => {
    setAuthError('');
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) setAuthError(error.message);
    else alert("Check your email for the confirmation link!");
};

    if (!user) {
    return (
        <div style={styles.container}>
            <h1 style={styles.logoText}>NutriGen<span style={{color: '#38a169'}}>.</span></h1>
            <div style={styles.card}>
                <h3 style={{marginTop: 0, marginBottom: '20px'}}>Welcome Back</h3>
                
                <input 
                    style={styles.input} 
                    placeholder="Email" 
                    type="email"
                    onChange={e => setEmail(e.target.value)} 
                />
                <input 
                    style={styles.input} 
                    type="password" 
                    placeholder="Password" 
                    onChange={e => setPassword(e.target.value)} 
                />

                {/* Display Error Message here */}
                {authError && (
                    <div style={{
                        color: '#ff4d4d', 
                        fontSize: '0.85rem', 
                        marginBottom: '15px',
                        textAlign: 'left',
                        padding: '0 5px'
                    }}>
                        {authError}
                    </div>
                )}

                <div style={{display: 'flex', gap: '10px'}}>
                    <button style={{...styles.primaryBtn, flex: 1}} onClick={handleLogin}>
                        Login
                    </button>
                    <button 
                        style={{...styles.primaryBtn, background: '#222', flex: 1}} 
                        onClick={handleSignUp}
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
}

    return (
        <div style={styles.container}>
            <header style={styles.nav}>
                <h1 style={styles.logoText} onClick={goHome}>NutriGen<span style={{color: '#38a169'}}>.</span></h1>
                <button onClick={() => supabase.auth.signOut()} style={styles.logoutBtn}>Logout</button>
            </header>

            <main>
                {analysisData ? (
                    <div style={styles.resultsHeader}>
                        <h2 style={styles.productTitle}>{productName}</h2>
                        <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                            <button style={styles.primaryBtn} onClick={() => saveToDietPlan()}>Add to Plan</button>
                            <button style={styles.secondaryBtn} onClick={() => setAnalysisData(null)}>Discard</button>
                        </div>
                        <Dashboard data={analysisData} onReset={() => setAnalysisData(null)} />
                    </div>
                ) : view === 'choice' ? (
                    <div style={styles.menuGrid}>
                        <MenuCard icon="🔍" title="Barcode Search" desc="Scan or upload product barcodes for instant nutritional analysis." onClick={() => setView('scan')} />
                        <MenuCard icon="📅" title="Diet Plan" desc="Monitor daily sugar/protein totals and manage saved meals." onClick={fetchDietPlan} />
                        <MenuCard icon="🧬" title="Health Quiz" desc="Get tailored dietary advice based on your goals and symptoms." onClick={() => setView('quiz')} />
                    </div>
                ) : view === 'view_plan' ? (
                    <div style={styles.planView}>
                        <div style={styles.summaryCard}>
                            <h3 style={{marginTop: 0}}>Daily Summary</h3>
                            <div style={{display: 'flex', gap: '40px'}}>
                                <div><small>Total Sugar</small><div style={styles.summaryVal}>{totals.sugar}g</div></div>
                                <div><small>Total Protein</small><div style={styles.summaryVal}>{totals.protein}g</div></div>
                            </div>
                        </div>
                        <div style={styles.planHeader}>
                            <h2>My Diet Plan</h2>
                            <button style={styles.primaryBtn} onClick={() => setView('manual_log')}>+ Manual Item</button>
                        </div>
                        {dietHistory.map(item => (
                            <div key={item.id} style={styles.historyItem}>
                                <div style={{flex: 1}}>
                                    <div style={{fontWeight: 'bold'}}>{item.product_name}</div>
                                    <div style={styles.miniNutrients}>
                                        {item.analysis_json?.map((n, idx) => (
                                            <span key={idx} style={styles.nutrientTag}>{n.rsid}</span>
                                        ))}
                                    </div>
                                </div>
                                <button style={styles.deleteBtn} onClick={() => {if(window.confirm("Delete?")) deleteItem(item.id)}}>Delete</button>
                            </div>
                        ))}
                        <button style={styles.backBtn} onClick={() => setView('choice')}>← Menu</button>
                    </div>
                ) : view === 'scan' ? (
                    <div style={styles.card}>
                        <h3>Product Scanner</h3>
                        <input style={styles.input} placeholder="Barcode Number" onChange={e => setBarcode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBarcodeSearch()} />
                        <button style={styles.primaryBtn} onClick={() => handleBarcodeSearch()}>Analyze</button>
                        <div style={{margin: '20px 0', textAlign: 'center', color: '#444'}}>OR</div>
                        <input type="file" id="barcode-photo" hidden accept="image/*" onChange={handlePhotoUpload} />
                        <label htmlFor="barcode-photo" style={styles.btnSecondary}>📷 Upload Photo</label>
                        <button style={styles.backBtn} onClick={() => setView('choice')}>Back</button>
                    </div>
                ) : view === 'manual_log' ? (
                    <div style={styles.card}>
                        <h3>Manual Log</h3>
                        <input style={styles.input} placeholder="Food Name" onChange={e => setManualEntry({...manualEntry, name: e.target.value})} />
                        <div style={{display: 'flex', gap: '10px'}}>
                            <input style={styles.input} type="number" placeholder="Sugar (g)" onChange={e => setManualEntry({...manualEntry, sugar: e.target.value})} />
                            <input style={styles.input} type="number" placeholder="Protein (g)" onChange={e => setManualEntry({...manualEntry, protein: e.target.value})} />
                        </div>
                        <button style={styles.primaryBtn} onClick={() => saveToDietPlan({
                            product_name: manualEntry.name, user_id: user.id,
                            analysis_json: [
                                { rsid: `Sugar: ${manualEntry.sugar}g`, trait: "Manual", genotype: "User", recommendation: "Logged manually." },
                                { rsid: `Protein: ${manualEntry.protein}g`, trait: "Manual", genotype: "User", recommendation: "Logged manually." }
                            ]
                        })}>Save to Plan</button>
                        <button style={styles.backBtn} onClick={() => setView('view_plan')}>Back</button>
                    </div>
                ) : view === 'quiz' ? (
                    <div style={styles.card}>
                        <h3>Health Assessment</h3>
                        <select value={goal} onChange={(e) => setGoal(e.target.value)} style={styles.input}>
                            {goals.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px'}}>
                            {symptomList.map(s => (
                                <button key={s} onClick={() => setSymptoms(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s])} 
                                    style={symptoms.includes(s) ? styles.tagActive : styles.tag}>{s}</button>
                            ))}
                        </div>
                        <button onClick={handleQuizSubmit} style={{...styles.primaryBtn, marginTop: '30px'}}>Analyze</button>
                        <button style={styles.backBtn} onClick={() => setView('choice')}>Cancel</button>
                    </div>
                ) : null}
            </main>
        </div>
    );
}

const styles = {
    container: { 
        maxWidth: '100%', // Changed from 900px to 100% for the background
        minHeight: '100vh', // Forces it to fill the whole screen height
        margin: '0', 
        padding: '40px 20px', 
        color: '#fff', 
        fontFamily: "system-ui, sans-serif",
        backgroundColor: '#000', // Matches the dark theme
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    nav: { 
        width: '100%',
        maxWidth: '900px', // Keeps your content centered and readable
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '40px' 
    },
    logoText: { fontSize: '2rem', fontWeight: '900', cursor: 'pointer', margin: 0 },
    summaryCard: { background: '#38a169', padding: '25px', borderRadius: '24px', marginBottom: '30px' },
    summaryVal: { fontSize: '2rem', fontWeight: 'bold' },
    menuGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
    optionCard: { background: '#111', padding: '30px', borderRadius: '24px', border: '1px solid #222', cursor: 'pointer' },
    cardTitle: { margin: '10px 0 5px 0' },
    cardDesc: { color: '#666', fontSize: '0.85rem' },
    card: { 
        background: '#111', 
        padding: '40px', 
        borderRadius: '24px', 
        border: '1px solid #222',
        width: '100%',
        maxWidth: '450px' // Keeps the login box from getting too wide
    },
    input: { width: '100%', padding: '14px', margin: '10px 0', borderRadius: '12px', background: '#000', border: '1px solid #333', color: '#fff', boxSizing: 'border-box' },
    primaryBtn: { background: '#38a169', color: '#fff', padding: '14px 24px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
    btnSecondary: { background: '#222', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box' },
    historyItem: { background: '#111', padding: '20px', borderRadius: '16px', border: '1px solid #222', marginBottom: '15px', display: 'flex', alignItems: 'center' },
    nutrientTag: { background: '#222', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', marginRight: '8px', color: '#aaa' },
    deleteBtn: { background: 'none', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' },
    tagActive: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #38a169', background: 'rgba(56, 161, 105, 0.1)', color: '#38a169' },
    tag: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #333', background: '#000', color: '#666', cursor: 'pointer' },
    backBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', marginTop: '20px', textDecoration: 'underline' },
    logoutBtn: { border: '1px solid #222', background: 'none', color: '#444', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer' },
    planHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }
};

export default App;