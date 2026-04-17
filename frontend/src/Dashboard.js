import React from 'react';

const Dashboard = ({ data, onReset }) => {
    return (
        <div style={styles.dashboardContainer}>
            <div style={styles.header}>
                <h2 style={styles.title}>Analysis Results</h2>
                <button onClick={onReset} style={styles.backBtn}>Upload New File</button>
            </div>
            
            <div style={styles.grid}>
                {data.map((item, index) => (
                    <div key={index} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <strong style={styles.geneTitle}>{item.gene}</strong>
                            <span style={styles.rsidBadge}>{item.rsid}</span>
                        </div>
                        
                        <p style={styles.traitText}>
                            <span style={styles.label}>Trait:</span> {item.trait}
                        </p>
                        
                        <div style={styles.recBox}>
                            <strong style={styles.recLabel}>Recommendation:</strong>
                            <p style={styles.recText}>{item.recommendation}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    dashboardContainer: { 
        padding: '20px', 
        color: '#ffffff' // Force global text to white for your dark theme
    },
    header: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px' 
    },
    title: { color: '#ffffff', margin: 0 },
    backBtn: { 
        background: 'none', 
        border: 'none', 
        color: '#38a169', 
        cursor: 'pointer', 
        textDecoration: 'underline',
        fontSize: '1rem'
    },
    grid: { 
        display: 'grid', 
        gap: '20px', 
        marginTop: '20px' 
    },
    card: { 
        background: '#1a1a1a', // Slightly lighter than the background to create depth
        padding: '25px', 
        borderRadius: '16px', 
        border: '1px solid #333',
        borderLeft: '6px solid #38a169', // NutriGen Green accent
        textAlign: 'left'
    },
    cardHeader: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '15px' 
    },
    geneTitle: { fontSize: '1.2rem', color: '#ffffff' },
    rsidBadge: { 
        background: '#333', 
        padding: '4px 10px', 
        borderRadius: '6px', 
        fontSize: '0.8rem',
        color: '#aaa'
    },
    traitText: { color: '#cbd5e0', marginBottom: '15px' },
    label: { color: '#718096', fontWeight: 'bold' },
    recBox: { 
        background: 'rgba(56, 161, 105, 0.1)', // Subtle green tint
        padding: '15px', 
        borderRadius: '10px', 
        border: '1px solid rgba(56, 161, 105, 0.3)' 
    },
    recLabel: { color: '#48bb78', display: 'block', marginBottom: '5px' },
    recText: { margin: 0, lineHeight: '1.5', color: '#e2e8f0' }
};

export default Dashboard;