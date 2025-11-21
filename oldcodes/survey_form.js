let currentStep = 0;
showStep(currentStep);

function showStep(n) {
    const steps = document.getElementsByClassName("step");
    steps[n].style.display = "block";

    // Show or hide the Previous button
    if (n === 0) {
        document.getElementById("prevBtn").style.display = "none";
    } else {
        document.getElementById("prevBtn").style.display = "inline";
    }

    // Show Next button except on last step; show Submit button only on last step
    if (n === (steps.length - 1)) {
        document.getElementById("nextBtn").style.display = "none";
        document.getElementById("submitBtn").style.display = "inline";
    } else {
        document.getElementById("nextBtn").style.display = "inline";
        document.getElementById("submitBtn").style.display = "none";
    }
}

function nextPrev(n) {
    const steps = document.getElementsByClassName("step");
    steps[currentStep].style.display = "none"; // Hide current step
    currentStep += n; // Update current step
    showStep(currentStep); // Show the new step
}

// Form submission function
function submitForm() {
    document.querySelector("form").submit(); // Submits the form
}
