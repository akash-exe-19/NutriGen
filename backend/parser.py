import pandas as pd

# This represents a small subset of the SNPedia database
SNP_DATABASE = {
    "rs1544410": {
        "gene": "VDR",
        "trait": "Vitamin D Receptor Sensitivity",
        "variants": {
            "AA": "High sensitivity. Standard dosage is fine.",
            "AG": "Moderate sensitivity. Increase sun exposure.",
            "GG": "Lower sensitivity. Consider Vitamin D3 + K2 supplements."
        }
    }
}

def parse_dna_file(file_content):
    # DNA files are usually tab-separated with comments starting with #
    # We skip the comments and look for the rsid column
    try:
        # Simulating reading a 23andMe style .txt file
        lines = [line.decode('utf-8') for line in file_content.splitlines() if not line.startswith(b'#')]
        results = []

        for line in lines:
            parts = line.split()
            if len(parts) < 4: continue
            
            rsid, _, _, genotype = parts[0], parts[1], parts[2], parts[3]
            
            if rsid in SNP_DATABASE:
                data = SNP_DATABASE[rsid]
                results.append({
                    "rsid": rsid,
                    "gene": data["gene"],
                    "trait": data["trait"],
                    "genotype": genotype,
                    "recommendation": data["variants"].get(genotype, "No specific data for this variant.")
                })
        return results
    except Exception as e:
        return {"error": str(e)}