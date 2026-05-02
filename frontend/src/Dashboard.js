import React from 'react';

const Dashboard = ({ data, onReset }) => {
    // Separate data into alerts/wins and standard nutrients
    const alerts = data.filter(item => item.gene !== "Standard");
    const standards = data.filter(item => item.gene === "Standard");

    return (
        <div style={styles.dashboardContainer}>
            <div style={styles.header}>
                <h2 style={styles.title}>Analysis Results</h2>
                <button onClick={onReset} style={styles.backBtn}>Upload New File</button>
            </div>
            
            {alerts.length > 0 && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>⚠️ Alerts & Insights</h3>
                    <div style={styles.grid}>
                        {alerts.map((item, index) => {
                            const isAlert = item.gene.toLowerCase().includes('alert');
                            return (
                                <div key={index} style={{
                                    ...styles.card,
                                    borderLeftColor: isAlert ? '#e53e3e' : '#38a169',
                                }}>
                                    <div style={styles.cardHeader}>
                                        <strong style={{
                                            ...styles.geneTitle,
                                            color: isAlert ? '#fc8181' : '#48bb78'
                                        }}>{item.gene}</strong>
                                        <span style={styles.rsidBadge}>{item.rsid}</span>
                                    </div>
                                    
                                    <p style={styles.traitText}>
                                        <span style={styles.label}>Trait:</span> {item.trait}
                                    </p>
                                    
                                    <div style={{
                                        ...styles.recBox,
                                        background: isAlert ? 'rgba(229, 62, 62, 0.1)' : 'rgba(56, 161, 105, 0.1)',
                                        borderColor: isAlert ? 'rgba(229, 62, 62, 0.3)' : 'rgba(56, 161, 105, 0.3)'
                                    }}>
                                        <strong style={{
                                            ...styles.recLabel,
                                            color: isAlert ? '#fc8181' : '#48bb78'
                                        }}>Recommendation:</strong>
                                        <p style={styles.recText}>{item.recommendation}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {standards.length > 0 && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>📋 Standard Nutrients</h3>
                    <div style={styles.standardGrid}>
                        {standards.map((item, index) => (
                            <div key={index} style={styles.standardCard}>
                                <div style={styles.standardHeader}>
                                    <strong style={styles.standardTitle}>{item.rsid}</strong>
                                    <span style={styles.standardBadge}>{item.genotype}</span>
                                </div>
                                <p style={styles.standardRec}>{item.recommendation}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    dashboardContainer: { 
        padding: '10px 0', 
        color: '#ffffff',
        width: '100%',
        boxSizing: 'border-box'
    },
    header: { 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: '10px',
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '25px' 
    },
    title: { color: '#ffffff', margin: 0, fontSize: '1.5rem' },
    backBtn: { 
        background: 'none', 
        border: 'none', 
        color: '#38a169', 
        cursor: 'pointer', 
        textDecoration: 'underline',
        fontSize: '1rem',
        padding: 0
    },
    section: {
        marginBottom: '35px',
    },
    sectionTitle: {
        fontSize: '1.25rem',
        color: '#e2e8f0',
        marginBottom: '15px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
    },
    grid: { 
        display: 'grid', 
        gridTemplateColumns: '1fr',
        gap: '20px', 
    },
    standardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '15px',
    },
    card: { 
        background: '#1a1a1a',
        padding: '20px', 
        borderRadius: '16px', 
        border: '1px solid #333',
        borderLeftWidth: '6px',
        borderLeftStyle: 'solid',
        textAlign: 'left',
        wordBreak: 'break-word',
        boxSizing: 'border-box'
    },
    standardCard: {
        background: '#111',
        padding: '15px',
        borderRadius: '12px',
        border: '1px solid #222',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
    },
    cardHeader: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '15px',
        flexWrap: 'wrap'
    },
    standardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px',
        gap: '10px',
        flexWrap: 'wrap'
    },
    geneTitle: { fontSize: '1.15rem', fontWeight: 'bold' },
    standardTitle: { fontSize: '1rem', color: '#fff', fontWeight: 'bold' },
    rsidBadge: { 
        background: '#333', 
        padding: '4px 10px', 
        borderRadius: '6px', 
        fontSize: '0.8rem',
        color: '#aaa',
        whiteSpace: 'nowrap'
    },
    standardBadge: {
        background: '#222',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        color: '#888',
        whiteSpace: 'nowrap'
    },
    traitText: { color: '#cbd5e0', marginBottom: '15px', fontSize: '0.9rem' },
    label: { color: '#718096', fontWeight: 'bold' },
    recBox: { 
        padding: '15px', 
        borderRadius: '10px', 
        borderWidth: '1px',
        borderStyle: 'solid'
    },
    recLabel: { display: 'block', marginBottom: '5px', fontSize: '0.9rem' },
    recText: { margin: 0, lineHeight: '1.5', color: '#e2e8f0', fontSize: '0.95rem' },
    standardRec: { margin: 0, fontSize: '0.85rem', color: '#aaa', lineHeight: '1.4' }
};

export default Dashboard;