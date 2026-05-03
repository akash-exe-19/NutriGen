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
    const [totals, setTotals] = useState({ sugar: 0, protein: 0, calories: 0 });
    const [profileData, setProfileData] = useState({ username: '', age: '', gender: 'male', height: '', weight: '' });

    // Auth & Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [barcode, setBarcode] = useState('');
    const [manualEntry, setManualEntry] = useState({ name: '', sugar: '', protein: '', calories: '' });

    // Quiz States
    const [goal, setGoal] = useState('Energy');
    const [symptoms, setSymptoms] = useState([]);
    const goals = ["Energy", "Immunity", "Cognitive Focus", "Skin Health", "Muscle Recovery", "Longevity", "Gut Health"];
    const symptomList = ["Fatigue", "Stress", "Poor Sleep", "Muscle Cramps", "Brain Fog", "Joint Pain", "Brittle Nails", "Anxiety", "Dry Eyes", "Bloating"];

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser && (!currentUser.user_metadata?.age || !currentUser.user_metadata?.height)) {
                setView('profile_setup');
            } else if (currentUser) {
                setView('choice');
            }
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser && (!currentUser.user_metadata?.age || !currentUser.user_metadata?.height)) {
                setView('profile_setup');
            } else if (currentUser) {
                setView('choice');
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    // --- DIET PLAN LOGIC ---
    const calculateTotals = (data) => {
        let tSugar = 0;
        let tProtein = 0;
        let tCalories = 0;
        data.forEach(item => {
            if (item.analysis_json) {
                item.analysis_json.forEach(flag => {
                    const match = flag.rsid.match(/(\d+(\.\d+)?)/);
                    const val = match ? parseFloat(match[0]) : 0;
                    if (flag.rsid.toLowerCase().includes('sugar')) tSugar += val;
                    if (flag.rsid.toLowerCase().includes('protein')) tProtein += val;
                    if (flag.rsid.toLowerCase().includes('energy-kcal') || flag.rsid.toLowerCase().includes('calories')) tCalories += val;
                });
            }
        });
        setTotals({ sugar: tSugar.toFixed(1), protein: tProtein.toFixed(1), calories: tCalories.toFixed(0) });
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

    const handleProfileSubmit = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.auth.updateUser({
            data: { 
                username: profileData.username,
                age: parseInt(profileData.age), 
                gender: profileData.gender, 
                height: parseFloat(profileData.height), 
                weight: parseFloat(profileData.weight) 
            }
        });
        if (error) alert(error.message);
        else {
            setUser(data.user);
            setView('choice');
        }
        setIsLoading(false);
    };

    const getBMR = () => {
        if (!user || !user.user_metadata?.age || !user.user_metadata?.height || !user.user_metadata?.weight) return 2000;
        const { age, gender, height, weight } = user.user_metadata;
        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        bmr += (gender.toLowerCase() === 'male') ? 5 : -161;
        return Math.round(bmr * 1.2);
    };

    const getBMI = () => {
        if (!user || !user.user_metadata?.height || !user.user_metadata?.weight) return null;
        const h = user.user_metadata.height / 100;
        const bmi = user.user_metadata.weight / (h * h);
        return bmi.toFixed(1);
    };

    const handleBarcodeSearch = async (val = barcode) => {
        if (!val) return; setIsLoading(true);
        try {
            const age = user?.user_metadata?.age || '';
            const gender = user?.user_metadata?.gender || '';
            const queryParams = (age && gender) ? `?age=${age}&gender=${gender}` : '';
            const response = await fetch(`https://nutrigen-f092.onrender.com/scan-barcode/${val}${queryParams}`);
            const result = await response.json();
            if (result.status === "success") { setAnalysisData(result.data); setProductName(result.product_name); }
        } catch (err) { alert("Barcode failed"); } finally { setIsLoading(false); }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return; setIsLoading(true);
        const formData = new FormData(); formData.append("file", file);
        if (user?.user_metadata?.age) formData.append("age", user.user_metadata.age);
        if (user?.user_metadata?.gender) formData.append("gender", user.user_metadata.gender);
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
const [authError, setAuthError] = useState(''); 

// --- AUTH HANDLERS ---
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
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <button onClick={() => {
                        setProfileData({
                            username: user?.user_metadata?.username || '',
                            age: user?.user_metadata?.age || '',
                            gender: user?.user_metadata?.gender || 'male',
                            height: user?.user_metadata?.height || '',
                            weight: user?.user_metadata?.weight || ''
                        });
                        setView('profile_setup');
                    }} style={styles.logoutBtn}>👤 Profile</button>
                    <button onClick={() => supabase.auth.signOut()} style={styles.logoutBtn}>Logout</button>
                </div>
            </header>

            <main>
                {analysisData ? (
                    <div style={styles.resultsHeader}>
                        <h2 style={styles.productTitle}>
                            {productName}
                            <span style={{fontSize: '1rem', color: '#888', marginLeft: '10px'}}>
                                ({analysisData.find(i => i.rsid.toLowerCase().includes('energy-kcal'))?.rsid.match(/(\d+(\.\d+)?)/)?.[0] || 'Unknown'} kcal)
                            </span>
                        </h2>
                        <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                            <button style={styles.primaryBtn} onClick={() => saveToDietPlan()}>Add to Plan</button>
                            <button style={styles.secondaryBtn} onClick={() => setAnalysisData(null)}>Discard</button>
                        </div>
                        <Dashboard data={analysisData} onReset={() => setAnalysisData(null)} />
                    </div>
                ) : view === 'profile_setup' ? (
                    <div style={styles.card}>
                        <h3>{user?.user_metadata?.age ? 'Edit Profile' : 'Complete Your Profile'}</h3>
                        <p style={{color: '#aaa', fontSize: '0.9rem'}}>This helps us calculate personalized nutrient limits and BMR.</p>
                        <input style={styles.input} type="text" placeholder="Username (Optional)" value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} />
                        <select style={styles.input} value={profileData.gender} onChange={e => setProfileData({...profileData, gender: e.target.value})}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                        <input style={styles.input} type="number" placeholder="Age (years)" value={profileData.age} onChange={e => setProfileData({...profileData, age: e.target.value})} />
                        <input style={styles.input} type="number" placeholder="Height (cm)" value={profileData.height} onChange={e => setProfileData({...profileData, height: e.target.value})} />
                        <input style={styles.input} type="number" placeholder="Weight (kg)" value={profileData.weight} onChange={e => setProfileData({...profileData, weight: e.target.value})} />
                        <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                            <button style={{...styles.primaryBtn, flex: 1}} onClick={handleProfileSubmit}>Save</button>
                            {user?.user_metadata?.age && (
                                <button style={{...styles.secondaryBtn, flex: 1}} onClick={() => setView('choice')}>Cancel</button>
                            )}
                        </div>
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
                            <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
                                <div><small>Calories Logged</small><div style={styles.summaryVal}>{totals.calories}</div></div>
                                <div><small>Daily Target</small><div style={styles.summaryVal}>{getBMR()}</div></div>
                                <div><small>Your BMI</small><div style={styles.summaryVal}>{getBMI() || '--'}</div></div>
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
                        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                            <input style={{...styles.input, flex: 1, minWidth: '80px'}} type="number" placeholder="Calories" onChange={e => setManualEntry({...manualEntry, calories: e.target.value})} />
                            <input style={{...styles.input, flex: 1, minWidth: '80px'}} type="number" placeholder="Sugar (g)" onChange={e => setManualEntry({...manualEntry, sugar: e.target.value})} />
                            <input style={{...styles.input, flex: 1, minWidth: '80px'}} type="number" placeholder="Protein (g)" onChange={e => setManualEntry({...manualEntry, protein: e.target.value})} />
                        </div>
                        <button style={styles.primaryBtn} onClick={() => saveToDietPlan({
                            product_name: manualEntry.name, user_id: user.id,
                            analysis_json: [
                                { rsid: `Energy-kcal: ${manualEntry.calories}kcal`, trait: "Manual", genotype: "User", recommendation: "Logged manually." },
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
        maxWidth: '100vw', 
        minHeight: '100vh', 
        margin: '0', 
        padding: '20px 15px', 
        color: '#fff', 
        fontFamily: "system-ui, sans-serif",
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
        overflowX: 'hidden'
    },
    nav: { 
        width: '100%',
        maxWidth: '900px', 
        display: 'flex', 
        flexWrap: 'wrap',
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        gap: '15px'
    },
    logoText: { fontSize: '1.8rem', fontWeight: '900', cursor: 'pointer', margin: 0 },
    summaryCard: { background: '#38a169', padding: '20px', borderRadius: '20px', marginBottom: '30px', width: '100%', boxSizing: 'border-box' },
    summaryVal: { fontSize: '1.8rem', fontWeight: 'bold' },
    menuGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', width: '100%', boxSizing: 'border-box' },
    optionCard: { background: '#111', padding: '25px', borderRadius: '20px', border: '1px solid #222', cursor: 'pointer', boxSizing: 'border-box' },
    cardTitle: { margin: '10px 0 5px 0', fontSize: '1.1rem' },
    cardDesc: { color: '#aaacae', fontSize: '0.85rem', lineHeight: '1.4' },
    card: { 
        background: '#111', 
        padding: '30px 20px', 
        borderRadius: '24px', 
        border: '1px solid #222',
        width: '100%',
        maxWidth: '450px',
        boxSizing: 'border-box'
    },
    input: { width: '100%', padding: '14px', margin: '10px 0', borderRadius: '12px', background: '#000', border: '1px solid #333', color: '#fff', boxSizing: 'border-box', fontSize: '1rem' },
    primaryBtn: { background: '#38a169', color: '#fff', padding: '14px 24px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' },
    btnSecondary: { background: '#222', color: '#fff', padding: '14px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box', fontSize: '1rem' },
    historyItem: { background: '#111', padding: '15px', borderRadius: '16px', border: '1px solid #222', marginBottom: '15px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', boxSizing: 'border-box' },
    nutrientTag: { background: '#222', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', marginRight: '6px', marginBottom: '6px', color: '#aaa', display: 'inline-block', wordBreak: 'break-word' },
    deleteBtn: { background: 'none', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', alignSelf: 'flex-start' },
    tagActive: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #38a169', background: 'rgba(56, 161, 105, 0.1)', color: '#38a169', margin: '5px' },
    tag: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #333', background: '#000', color: '#666', cursor: 'pointer', margin: '5px' },
    backBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginTop: '20px', textDecoration: 'underline', padding: 0, fontSize: '1rem' },
    logoutBtn: { border: '1px solid #222', background: 'none', color: '#efefef', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer' },
    planHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
    planView: { width: '100%', maxWidth: '900px', boxSizing: 'border-box' },
    resultsHeader: { width: '100%', maxWidth: '900px', boxSizing: 'border-box' },
    productTitle: { fontSize: '1.5rem', wordBreak: 'break-word', marginTop: 0 }
};

export default App;