/**
 * API Utility Functions
 * Handles API calls with automatic fallback from localhost to ngrok
 */

const API_ENDPOINTS = {
    primary: 'http://127.0.0.1:5000',
    fallback: 'https://delila-wakeless-maranda.ngrok-free.dev'
};

let currentEndpoint = API_ENDPOINTS.primary;

/**
 * Fetch with automatic fallback
 * @param {string} path - API path (e.g., '/api/pokemon')
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function apiFetch(path, options = {}) {
    // Add ngrok headers by default
    const headers = {
        ...options.headers,
        "ngrok-skip-browser-warning": "true"
    };
    
    try {
        // Try primary endpoint first
        const response = await fetch(`${currentEndpoint}${path}`, {
            ...options,
            headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        // If primary fails, try fallback
        if (currentEndpoint === API_ENDPOINTS.primary) {
            console.warn(`Primary API failed, switching to fallback: ${error.message}`);
            currentEndpoint = API_ENDPOINTS.fallback;
            
            try {
                const response = await fetch(`${currentEndpoint}${path}`, {
                    ...options,
                    headers
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return response;
            } catch (fallbackError) {
                console.error('Fallback API also failed:', fallbackError);
                throw fallbackError;
            }
        }
        
        throw error;
    }
}

/**
 * Get current API endpoint being used
 * @returns {string}
 */
function getCurrentEndpoint() {
    return currentEndpoint;
}

/**
 * Reset to primary endpoint
 */
function resetEndpoint() {
    currentEndpoint = API_ENDPOINTS.primary;
}
