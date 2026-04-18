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
    grid: { 
        display: 'grid', 
        gridTemplateColumns: '1fr', // Stacks nicely on mobile
        gap: '20px', 
        marginTop: '20px' 
    },
    card: { 
        background: '#1a1a1a',
        padding: '20px', 
        borderRadius: '16px', 
        border: '1px solid #333',
        borderLeft: '6px solid #38a169',
        textAlign: 'left',
        wordBreak: 'break-word',
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
    geneTitle: { fontSize: '1.15rem', color: '#ffffff', fontWeight: 'bold' },
    rsidBadge: { 
        background: '#333', 
        padding: '4px 10px', 
        borderRadius: '6px', 
        fontSize: '0.8rem',
        color: '#aaa',
        whiteSpace: 'nowrap'
    },
    traitText: { color: '#cbd5e0', marginBottom: '15px', fontSize: '0.9rem' },
    label: { color: '#718096', fontWeight: 'bold' },
    recBox: { 
        background: 'rgba(56, 161, 105, 0.1)', 
        padding: '15px', 
        borderRadius: '10px', 
        border: '1px solid rgba(56, 161, 105, 0.3)' 
    },
    recLabel: { color: '#48bb78', display: 'block', marginBottom: '5px', fontSize: '0.9rem' },
    recText: { margin: 0, lineHeight: '1.5', color: '#e2e8f0', fontSize: '0.95rem' }
};

export default Dashboard;