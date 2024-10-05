document.addEventListener("DOMContentLoaded", function () {
    const alertDiv = document.querySelector('.alert'); // Look for the .alert div in the DOM

    if (alertDiv) {  // Check if the .alert div exists (i.e., if a message was passed and displayed)
        // Styling the alert box dynamically
        alertDiv.style.background = '#d4edda'; // Light green background indicating success
        alertDiv.style.color = '#155724'; // Dark green text color
        alertDiv.style.padding = '10px'; // Add padding to make the alert look better

        // Hide the alert message after 3 seconds
        setTimeout(() => {
            alertDiv.style.display = 'none'; // After 3000ms (3 seconds), hide the alert div
        }, 3000);
    }
});
