const logout = () => {
    // Clear cookies and perform logout actions
    localStorage.clear()
    window.location.href = '/login'; 
};

export default logout;