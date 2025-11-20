export const handleError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    if (status === 400) {
      return data?.message || 'Bad Request';
    } else if (status === 401) {
      return 'Unauthorized access - please log in again';
    } else if (status === 403) {
      return 'Forbidden - you do not have permission to perform this action';
    } else if (status === 404) {
      return 'Resource not found';
    } else if (status === 500) {
      return 'Internal server error - please try again later';
    }
    
    // Handle other server errors
    const message = data?.message || data?.error || 'Server error occurred';
    // console.error('API Error:', status, message);
    return message;

  } else if (error.request) {
    // Request made but no response received
    // console.error('Network Error:', error.request);
    return 'Please check your connection';
  } else {
    // Something else happened
    // console.error('Error:', error.message);
    return error.message || 'An unexpected error occurred';
  }
};