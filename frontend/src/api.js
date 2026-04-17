const API_URL = "http://localhost:8000";

export const uploadDNA = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/upload-dna`, {
        method: "POST",
        body: formData,
    });
    return response.json();
};

export const submitManualData = async (assessmentData) => {
    const response = await fetch(`${API_URL}/manual-assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assessmentData),
    });
    return response.json();
};