<!DOCTYPE html>
<html lang="en">
<head>
    
    <!-- Metadata and links for external stylesheets and icons -->
    <meta charset="UTF-8" />
    <title>Survey Form</title>
    <link rel="stylesheet" href="survey_form.css" />
  
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/exif-js/2.3.0/exif.min.js"></script>
    <style>
        .step {
            display: none;
        }
        .step.active {
            display: block;
        }
        .button-container {
            margin-top: 20px;
        }
    </style>
</head>
<body>

    <!-- Sidebar container -->
    <div class="sidebar">
        <br>
        <!-- Sidebar menu list -->
        <ul class="menu">
            <li>
                <a href="vdashboard.php">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </a>
            </li> 
            <li>
                <a href="#">
                    <i class="fas fa-file-alt"></i>
                    <span>Survey Form</span>
                </a>
            </li> 
            <li>
                <a href="valiprofile.php">
                    <i class="fas fa-user"></i>
                    <span>Profile</span>
                </a>
            </li>    
            <li class="logout">
                <a href="logout.php">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Log Out</span>
                </a>
            </li>                       
        </ul>
        

    </div>

    <!-- Main content container -->
    <div class="main--content">
        <!-- Header section -->
        <div class="header--wrapper">
            <div class="header--title">
                <h2>Survey Form</h2>
            </div>
            <!-- Logo section -->
            <div class="user--info">   
                <img src="image/greenlogo1.jpg" alt=""/>
            </div>
        </div>

        <!-- Survey Form -->
        <div class = "container"> 

            <form id="surveyForm" action="submit_survey.php" method="POST" enctype="multipart/form-data">

                    
                <!-- Step 1: Classification -->
                <div class="first form"> 

                    <div class="step active">

                        <span class="title">I. Classification</span>
                        <br><br>
                        <div class ="fields">        
                                                            
                            <div class ="input-fields">
                                <label>Is this a Previous Client?</label>
                                <select name="previous_client">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>          
        
                            <div class ="input-fields">
                                <label>Year Inhabited the Place:</label>
                                <input type="text" name="year_inhabited" required>
                            </div>          
        
                            <div class ="input-fields">
                                <label>Classification of Displaced Household:</label>
                                <select name="classification" id="classification" onchange="handleClassificationChange()">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Displaced">Displaced</option>
                                    <option value="Double-up">Double-up</option>
                                    <option value="Homeless">Homeless</option>
                                    <option value="Upgrading_of_Land_Tenure">Upgrading of Land Tenure</option>
                                </select>
                            </div>

                        </div> 
                        <br><br>        
        
                        <div class ="secfields">

                            <div class ="firstinput-fields" id="sub_class_displaced_container" style="display: none;">        
                                <label>Sub-class of Displaced:</label>
                                <select name="sub_class_displaced">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Coastal Areas">Coastal Areas</option>
                                    <option value="Drought">Drought</option>
                                    <option value="Earthquake Affected">Earthquake Affected</option>
                                    <option value="Flood Affected">Flood Affected</option>
                                    <option value="Sea Level Rise">Sea Level Rise</option>
                                    <option value="Threat of Eviction">Threat of Eviction</option>
                                    <option value="Eviction/Demolition Order">Eviction/Demolition Order</option>
                                    <option value="Human Induced Disaster">Human Induced Disaster</option>
                                    <option value="Infra Projects">Infra Projects</option>
                                    <option value="Landslide Affected">Landslide Affected</option>
                                    <option value="Near Waterways">Near Waterways</option>
                                </select>
                            </div>            
                                    
                            <div class ="firstinput-fields" id="sub_class_double_up_container" style="display: none;">
                                <label>Sub-class of Double-up:</label>
                                <select name="sub_class_double_up">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Renter/Tenant">Renter/Tenant</option>
                                    <option value="Rent-free/Sharer">Rent-free/Sharer</option>
                                    <option value="Caretaker">Caretaker</option>
                                </select>
                            </div>
                            
                            <div class ="firstinput-fields" id="sub_class_homeless_container" style="display: none;">
                                <label>Sub-class of Homeless:</label>
                                <select name="sub_class_homeless">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Public - living in tent">Public - living in tent</option>
                                    <option value="Private - living in tent">Private - living in tent</option>
                                </select>
                            </div>
                        </div>        
                        <script>
    function handleClassificationChange() {
    // Get the classification dropdown value
    const classification = document.getElementById('classification').value;

    // Get the containers for the sub-class dropdowns
    const subClassDisplacedContainer = document.getElementById('sub_class_displaced_container');
    const subClassDoubleUpContainer = document.getElementById('sub_class_double_up_container');
    const subClassHomelessContainer = document.getElementById('sub_class_homeless_container');

    // Get the subclass dropdowns
    const subClassDisplaced = document.querySelector('select[name="sub_class_displaced"]');
    const subClassDoubleUp = document.querySelector('select[name="sub_class_double_up"]');
    const subClassHomeless = document.querySelector('select[name="sub_class_homeless"]');

    // Reset visibility
    subClassDisplacedContainer.style.display = 'none';
    subClassDoubleUpContainer.style.display = 'none';
    subClassHomelessContainer.style.display = 'none';

    // Reset values of hidden subclass dropdowns
    subClassDisplaced.value = '';
    subClassDoubleUp.value = '';
    subClassHomeless.value = '';

    // Show the relevant sub-class dropdown based on classification
    if (classification === 'Displaced') {
        subClassDisplacedContainer.style.display = 'block';
    } else if (classification === 'Double-up') {
        subClassDoubleUpContainer.style.display = 'block';
    } else if (classification === 'Homeless') {
        subClassHomelessContainer.style.display = 'block';
    }
}

</script>     
                    </div>
                </div>
                
                <!-- Step 2: Personal Data -->
                <div class="second form">
                    <div class="step">

                        <span class ="title">II. Demographic Information</span>
                        <br><br> 

                        <div class ="input-fields">
                            <label>Person Being Interview:</label>
                            <select name="interview_person">
                                <option value="" disabled selected>- select here -</option>
                                <option value="Household_Head">Household Head</option>
                                <option value="Spouse_Head">Spouse Head</option>
                                <option value="Never-Married">Never-Married, children of Head/Spouse, from oldest to youngest</option>
                            </select>
                        </div>
                        <br>
                        
                        <div class ="secfields"> 

                            <div class ="firstinput-fields">
                                <label>Last Name:</label>
                                <input type="text" name="last_name" required>
                            </div> 
                            <div class ="firstinput-fields">
                                <label>First Name:</label>
                                    <input type="text" name="first_name" required>
                            </div>
                            <div class ="firstinput-fields">
                                <label>Middle Name:</label>
                                <input type="text" name="middle_name">                                
                            </div>
                            
                            <div class ="firstinput-fields">
                                <label>Suffix:</label>
                                <input type="text" name="suffix" required>
                            </div>   
                        </div>
                        <br>

                        <div class ="secfields">
                            <div class ="firstinput-fields">
                                <label>Gender:</label>
                                <select name="gender">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        
                            <div class ="firstinput-fields">
                                <label>Barangay:</label>
                                <select id="barangay" name="barangay" onchange="updatePurokOptions()">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Aplaya">Aplaya</option>
                                    <option value="Balabag">Balabag</option>    
                                    <option value="Binaton">Binaton</option>
                                    <option value="Cogon">Cogon</option>
                                    <option value="Colorado">Colorado</option>
                                    <option value="Dawis">Dawis</option>
                                    <option value="Dulangan">Dulangan</option>
                                    <option value="Goma">Goma</option>
                                    <option value="Igpit">Igpit</option>
                                    <option value="Kapatagan">Kapatagan</option>
                                    <option value="Kiagot">Kiagot</option>
                                    <option value="Lungag">Lungag</option>
                                    <option value="Mahayahay">Mahayahay</option>
                                    <option value="Matti">Matti</option>
                                    <option value="Ruparan">Ruparan</option>
                                    <option value="San_Agustin">San Agustin</option>
                                    <option value="San_Jose">San Jose</option>
                                    <option value="San_Miguel">San Miguel</option>
                                    <option value="San_Roque">San Roque</option>
                                    <option value="Sinawilan">Sinawilan</option>
                                    <option value="Soong">Soong</option>
                                    <option value="Tiguman">Tiguman</option>
                                    <option value="Tres_De_Mayo">Tres de Mayo</option>
                                    <option value="Zone_1">Zone 1</option>
                                    <option value="Zone_2">Zone 2</option>
                                    <option value="Zone_3">Zone 3</option>
                                </select>
                            </div>

                            <div class ="firstinput-fields">
                                <label>Purok:</label>
                                <select id="purok" name="purok">
                                    <option value="" disabled selected>- select barangay first -</option>
                                </select>

                                <script>
                                    // Define Purok options for each Barangay
                                    const purokOptions = {
                                        Aplaya: [
                                            { value: "Purok_1", text: "Purok 1" },
                                            { value: "Purok_2", text: "Purok 2" },
                                        ],
                                        Balabag: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Binaton: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Cogon: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Colorado: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Dawis: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Dulangan: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Goma: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Igpit: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Kapatagan: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Kiagot: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Lungag: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Mahayahay: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Matti: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Ruparan: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        San_Agustin: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        San_Jose: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        San_Miguel: [
                                            { value: "Purok Gemelina", text: "Purok Gemelina" },
                                        ],
                                        San_Roque: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Sinawilan: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Soong: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Tiguman: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Tres_De_Mayo: [
                                            {value:"Purok 1", text: "Purok 1"},
                                        ],
                                        Zone_1: [
                                            { value: "Purok Silangan", text: "Purok Silangan" },
                                        ],
                                        Zone_2: [
                                            { value: "Purok Silangan", text: "Purok Silangan" },
                                        ],
                                        Zone_3: [
                                            { value: "Purok Silangan", text: "Purok Silangan" },
                                        ],
                                        // Add more barangay-purok mappings as needed
                                    };

                                    function updatePurokOptions() {
                                        // Get selected Barangay
                                        const barangaySelect = document.getElementById("barangay");
                                        const purokSelect = document.getElementById("purok");
                                        const selectedBarangay = barangaySelect.value;

                                        // Clear previous Purok options
                                        purokSelect.innerHTML = '<option value="" disabled selected>- select purok -</option>';

                                        // Get the corresponding Purok options for the selected Barangay
                                        if (purokOptions[selectedBarangay]) {
                                            purokOptions[selectedBarangay].forEach(purok => {
                                                const option = document.createElement("option");
                                                option.value = purok.value;
                                                option.textContent = purok.text;
                                                purokSelect.appendChild(option);
                                            });
                                        }
                                    }
                                </script>
                            </div>  
                            
                            <div class ="firstinput-fields">
                                <label>Street:</label>
                                <input type="text" name="street" required>
                            </div> 
                          
                            <div class ="firstinput-fields">
                                <label>Religion:</label>
                                <select name="religion">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Roman_Catholic">Roman Catholic</option>
                                    <option value="Islam">Islam</option>
                                    <option value="Iglesia_ni_Cristo">Iglesia ni Cristo</option>
                                    <option value="Seventh-day_Adventist">Seventh-day Adventist</option>
                                    <option value="Bible_Baptist_Church">Bible Baptist Church</option>
                                    <option value="United_Church_of_Christ_in_the_Philippines">United Church of Christ in the Philippines</option>
                                    <option value="Jehovah's_Witnesses">Jehovah's Witnesses</option>
                                    <option value="Church_of_Christ">Church of Christ</option>
                                </select>
                            </div>
                        </div>
                        <br><br>

                        <div class ="secfields">

                            <div class ="firstinput-fields">
                                <label>Place of Birth:</label>
                                <input type="text" name="birth_place" required>
                            </div>
                            <div class ="firstinput-fields"> 
                                <label>Date of Birth:</label>
                                <input type="date" name="birth_date" require>
                            </div>
                            <div class ="firstinput-fields"> 
                            <label>Age:</label>
                            <input type="number" name="person_age" required>
                            </div>
                        </div>
                        <br>

                        <div class ="secfields">

                            <div class ="firstinput-fields"> 
                                <label>Marital Status:</label>
                                <select name="marital_status">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Live-in">Live-in</option>
                                    <option value="Widow/Widower">Widow/Widower</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Annulled">Annulled</option>
                                    <option value="Separated">Separated</option>
                                    <option value="Unknown">Unknown</option>
                                </select>
                            </div>

                            <div class ="firstinput-fields"> 
                                <label>Contact Number:</label>
                                <input type="text" name="contact_number">
                            </div>
                            <div class ="firstinput-fields"> 
                                <label>Language Spoken:</label>
                                <select name="language_spoken">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Cebuano">Cebuano</option>
                                    <option value="Tagalog">Tagalog</option>
                                    <option value="English">English</option>
                                </select>
                            </div>   
                        </div>    
                        <br>

                        <div class ="secfields">

                            <div class ="firstinput-fields"> 
                                <label>Tribe:</label>
                                <select name="tribe">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Manobo">Manobo</option>
                                    <option value="Bagobo">Bagobo</option>
                                    <option value="B'laan">B'laan</option>
                                    <option value="Kaolo">Kaolo</option>
                                    <option value="Bisaya">Bisaya</option>
                                    <option value="Muslim">Muslim</option>
                                </select>       
                            </div>

                            <div class ="firstinput-fields">
                                <label>Highest Educational Attainment:</label>
                                <select name="highest_education">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="none">No Formal Education</option>
                                    <option value="Elementary_Level_(Incomplete)">Elementary Level (Incomplete)</option>
                                    <option value="Elementary_Graduate">Elementary Graduate</option>
                                    <option value="High_School_Level (Incomplete)">High School Level (Incomplete)</option>
                                    <option value="High_School_Graduate">High School Graduate</option>
                                    <option value="Vocational/Technical_Education">Vocational/Technical Education</option>
                                    <option value="College_Level_(Incomplete)">College Level (Incomplete)</option>
                                    <option value="College_Graduate">College Graduate</option>
                                    <option value="Postgraduate_Level">Postgraduate Level (Master's, Doctorate, etc.)</option>
                                    <option value="ALS">Alternative Learning System (ALS) Graduate</option>
                                </select>
                            </div>
                            
                            <div class ="firstinput-fields">
                                <label>Name of the school last attended:</label>
                                <input type="text" name="last_school_attended">                  
                            </div>        
                            <div class ="firstinput-fields">
                                <label>Year graduated:</label>
                                <input type="text" name="year_graduated">
                            </div> 
                        </div>
                        <br><br>

                        <span class="spouse">Spouse Information</span>
                        <br><br>
                        <div class ="secfields">

                            <div class ="firstinput-fields">
                                <label>Spouse Name:</label>
                                <input type="text" name="spouse_name">
                            </div>  

                            <div class ="firstinput-fields">
                                <label>Spouse Religion:</label>
                                <select name="spouse_religion">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Roman_Catholic">Roman Catholic</option>
                                    <option value="Islam">Islam</option>
                                    <option value="Iglesia_ni_Cristo">Iglesia ni Cristo</option>
                                    <option value="Seventh-day_Adventist">Seventh-day Adventist</option>
                                    <option value="Bible_Baptist_Church">Bible Baptist Church</option>
                                    <option value="United_Church_of_Christ_in_the_Philippines">United Church of Christ in the Philippines</option>
                                    <option value="Jehovah's_Witnesses">Jehovah's Witnesses</option>
                                    <option value="Church_of_Christ">Church of Christ</option>
                                </select>
                            </div> 
                            
                            <div class ="firstinput-fields">
                                <label>Spouse Tribe:</label>
                                <select name="spouse_tribe">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Manobo">Manobo</option>
                                    <option value="Bagobo">Bagobo</option>
                                    <option value="B'laan">B'laan</option>
                                    <option value="Kaolo">Kaolo</option>
                                    <option value="Bisaya">Bisaya</option>
                                    <option value="Muslim">Muslim</option>
                                </select>
                            </div> 

                            <div class ="firstinput-fields">
                                <label>Age:</label>
                                <input type="number" name="spouse_age" required>
                            </div>
                            <div class ="firstinput-fields">
                                <label>Gender:</label>
                                <select name="spouse_gender">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div> 
                        </div>
                        <br>

                        <span class="affil">Affiliation</span>
                        <br><br>
                        <div class ="secfields">

                            <div class ="firstinput-fields">
                                <select name="affiliation">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="SSS">Social Security System (SSS)</option>
                                    <option value="GSIS">Government Service Insurance System (GSIS)</option>
                                    <option value="PhilHealth">Philippine Health Insurance Corp. (PhilHealth)</option>
                                    <option value="PagIbig">Home Development Mutual Fund (PagIbig)</option>
                                    <option value="PWD">Person With Disability (PWD)</option>
                                    <option value="Senior_Citizen">Senior Citizen</option>
                                    <option value="Solo_Parent">Solo Parent</option>
                                    <option value="4Ps">4Ps</option>
                                </select>
                            </div>    
                        </div>
                       
                        <br>
                        <span class="household">Member of the Household</span>
                        <br>
                        
                            <div class ="table-fields">
                                <table id="familyMembersTable" class="styled-table">
                                    <thead class="table-header">
                                        <tr>
                                            <th>Name (First, Middle Initial, Last)</th>
                                            <th>Age</th>
                                            <th>Relationship</th>
                                            <th>Civil Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><input type="text" name="name[]" placeholder="Full Name"></td>
                                            <td><input type="number" name="age[]" placeholder="Age"></td>
                                            <td><input type="text" name="relationship[]" placeholder="Relationship"></td>
                                            <td>
                                                <select name="civil_status[]">
                                                    <option value="" disabled selected>- select here -</option>
                                                    <option value="Single">Single</option>
                                                    <option value="Married">Married</option>
                                                    <option value="Live-in">Live-in</option>
                                                </select>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table id="familyMembersTable" class="styled-table">
                                    <thead class="table-header">
                                        <tr>
                                            <th>Educational Attainment</th>
                                            <th>Occupation</th>
                                            <th>Monthly Income</th>
                                            <th>Code</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><input type="text" name="educational_attainment[]" placeholder="Education"></td>
                                            <td><input type="text" name="occupation[]" placeholder="Occupation"></td>
                                            <td><input type="number" name="monthly_income[]" placeholder="Monthly Income"></td>
                                            <td><input type="text" name="code[]" placeholder="Code"></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                         
                        <button type="button" id="addRowButton">Add</button>
                        <script>
                            // Add event listener to the button
                            document.getElementById('addRowButton').addEventListener('click', function () {
                                // Get both tables
                                const familyTable = document.querySelector('#familyMembersTable:nth-of-type(1) tbody');
                                const secondTable = document.querySelector('#familyMembersTable:nth-of-type(2) tbody');
                        
                                // Add a new row to each table
                                const newFamilyRow = document.createElement('tr');
                                newFamilyRow.innerHTML = `
                                    <td><input type="text" name="name[]" placeholder="Full Name"></td>
                                    <td><input type="number" name="age[]" placeholder="Age"></td>
                                    <td><input type="text" name="relationship[]" placeholder="Relationship"></td>
                                    <td>
                                        <select name="civil_status[]">
                                            <option value="" disabled selected>- select here -</option>
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                            <option value="Live-in">Live-in</option>
                                        </select>
                                    </td>
                                `;
                                familyTable.appendChild(newFamilyRow);
                        
                                const newSecondRow = document.createElement('tr');
                                newSecondRow.innerHTML = `
                                    <td><input type="text" name="educational_attainment[]" placeholder="Education"></td>
                                    <td><input type="text" name="occupation[]" placeholder="Occupation"></td>
                                    <td><input type="number" name="monthly_income[]" placeholder="Monthly Income"></td>
                                    <td><input type="text" name="code[]" placeholder="Code"></td>
                                `;
                                secondTable.appendChild(newSecondRow);
                            });
                        </script>
                        
                       
                    </div>     
                </div>

                <!-- Step 3: Household Information -->
                <div class="third form">
                    <div class="step">
                        <span class="title">III. Household Information</span>
                        <br><br>
                        <div class ="fields">

                            <div class ="input-fields">
                                <label>Do you own the lot where your house is situated?</label>
                                <select name="lot_ownership">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>    

                            <div class ="input-fields">
                                <label>Do you own the house that you are living in at this time?</label>
                                <select name="house_ownership">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>    
                       
                            <div class ="input-fields">
                                <label>Do you previously avail of socialized housing?</label>
                                <select name="avail_socialized_housing">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>    

                            <div class ="input-fields">
                                <label>Do you live in a temporary dwelling, e.g.,a tent, cart?</label>
                                <select name="temporary_living_area">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>    
                        </div>
                        <br><br>

                        <span class="line"> </span>
                        <div class ="secfields">

                            <div class ="firstinput-fields">
                                <label >Housing Structure:</label>
                                <select id="housingStructureDropdown" name="housing_structure">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Full_Concrete">Full Concrete</option>
                                    <option value="Made_of_wood_and_metal_roof">Made of wood and metal roof</option>
                                    <option value="Made_of_Amakan_and_Nipa">Made of Amakan and Nipa</option>
                                    <option value="Combination_of_concrete_and_wood">Combination of concrete and wood</option>
                                    <option value="Made_of_Amakan_and_metal_roof">Made of Amakan and metal roof</option>
                                    <option value="Others">Others (please specify)</option>
                                </select>
                                <input type="text" id="otherInput" name="other_housing_structure" placeholder="Please specify" style="display: none;">
                                      
                            </div>
                          
                        <script>
                            // Get dropdown and input elements
                            const dropdown = document.getElementById('housingStructureDropdown');
                            const otherInput = document.getElementById('otherInput');
                            
                            // Add event listener to dropdown
                            dropdown.addEventListener('change', function () {
                            // Show the input field if "Others" is selected
                            if (dropdown.value === 'Others') {
                                otherInput.style.display = 'inline'; // Show input
                                } else {
                                    otherInput.style.display = 'none'; // Hide input
                                    otherInput.value = ''; // Clear input
                                }
                            });
                        </script>

                        <div class ="firstinput-fields">
                            <label>Type of Toilet:</label>
                            <select id="typeoftoilet" name="type_of_toilet">
                                <option value="" disabled selected>- select here -</option>
                                <option value="Water_Sealed">Water Sealed</option>
                                <option value="Open_Pit/Antipolo">Open Pit/Antipolo</option>
                                <option value="No_Toilet">No Toilet</option>
                                <option value="Others">Others (please specify)</option>
                            </select>
                            <input type="text" id="otherInput1" name="other_type_of_toilet" placeholder="Please specify" style="display: none;">
                        </div> 
                        
                        <script>
                            // Script for "Type of Toilet"
                            const dropdown1 = document.getElementById('typeoftoilet');
                            const otherInput1 = document.getElementById('otherInput1');
                    
                            dropdown1.addEventListener('change', function () {
                                if (dropdown1.value === 'Others') {
                                    otherInput1.style.display = 'inline'; // Show input
                                } else {
                                    otherInput1.style.display = 'none'; // Hide input
                                    otherInput1.value = ''; // Clear input
                                }
                            });
                        </script>
                        <div class ="firstinput-fields">
                        <label >Source of Water:</label>
                        <select id="sourceofwater" name="source_of_water">
                            <option value="" disabled selected>- select here -</option>
                            <option value="NAWASA">Community Water System (NAWASA)</option>
                            <option value="Deep_Well">Deep Well</option>
                            <option value="Spring">Spring</option>
                            <option value="Rainwater">Rainwater</option>
                            <option value="Surface_Water">Surface Water (river, lake, dam)</option>
                            <option value="Others">Others (please specify)</option>
                        </select>
                        <input type="text" id="otherInput2" name="other_source_of_water" placeholder="Please specify" style="display: none;">
                        </div>

                       <script>
                            // Script for "Type of Toilet"
                            const dropdown2 = document.getElementById('sourceofwater');
                            const otherInput2 = document.getElementById('otherInput2');
                    
                            dropdown2.addEventListener('change', function () {
                                if (dropdown2.value === 'Others') {
                                    otherInput2.style.display = 'inline'; // Show input
                                } else {
                                    otherInput2.style.display = 'none'; // Hide input
                                    otherInput2.value = ''; // Clear input
                                }
                            });
                        </script>
                        
                        <div class ="firstinput-fields">
                        <label >Source of Electricity:</label>
                        <select id="sourceofelectricity" name="source_of_electricity">
                            <option value="" disabled selected>- select here -</option>
                            <option value="With_own_meter">With own meter</option>
                            <option value="Solar_Panel">Solar Panel</option>
                            <option value="Candle/Lamp">Candle/Lamp</option>
                            <option value="Tapping_to_the_neighbor">Tapping to the neighbor</option>
                            <option value="Others">Others (please specify)</option>
                        </select>
                        <input type="text" id="otherInput3" name="other_source_of_electricity" placeholder="Please specify" style="display: none;">
                        </div>

                        <script>
                            // Script for "Type of Toilet"
                            const dropdown3 = document.getElementById('sourceofelectricity');
                            const otherInput3 = document.getElementById('otherInput3');
                    
                            dropdown3.addEventListener('change', function () {
                                if (dropdown3.value === 'Others') {
                                    otherInput3.style.display = 'inline'; // Show input
                                } else {
                                    otherInput3.style.display = 'none'; // Hide input
                                    otherInput3.value = ''; // Clear input
                                }
                            });
                        </script>
                        
                        </div> 
                    </div>
                </div>

                <!-- Step 4: Economic Aspect -->
                <div class="fourth form">
                    <div class="step">

                        <span class ="title">IV. Economic Aspect</span>      
                        <br><br>
                        <div class ="fields">
                                                          
                            <div class ="input-fields">
                        
                                <label>Household Head Main Source of Income:</label>
                                <select id="mainincomesource" name="main_income_source">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Public_Employee">Employee (Public Office/Company)</option>
                                    <option value="Private_Employee">Employee (Private Office/Company)</option>
                                    <option value="Self_Employed">Self-Employed/with owned business</option>
                                    <option value="Casual">Casual (On-call for work)</option>
                                    <option value="others">Others (please specify)</option>
                                </select>
                                <input type="text" id="otherInput4" name="other_main_income_source" placeholder="Please specify" style="display: none;">
                            </div>
    
                            <script>
                            // Script
                                const dropdown4 = document.getElementById('mainincomesource');
                                const otherInput4 = document.getElementById('otherInput4');
                            
                                dropdown4.addEventListener('change', function () {
                                    // Ensure the value matches the option "others"
                                    if (dropdown4.value === 'others') {
                                        otherInput4.style.display = 'inline'; // Show input
                                    } else {
                                        otherInput4.style.display = 'none'; // Hide input
                                        otherInput4.value = ''; // Clear input
                                    }
                                });
                            </script>
                          
                            <div class ="input-fields">
                                <label>Work Status:</label>
                                <select id="workstatus" name="work_status">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Regular">Regular</option>
                                    <option value="Contractual">Contractual</option>
                                    <option value="others">Others (please specify)</option>
                                </select>
                            
                            <input type="text" id="otherInput5" name="other_work_status" placeholder="Please specify" style="display: none;">
                            </div>
                            <script>
                                // Script
                                const dropdown5 = document.getElementById('workstatus');
                                const otherInput5 = document.getElementById('otherInput5');
                            
                                dropdown5.addEventListener('change', function () {
                                    // Ensure the value matches the option "others"
                                    if (dropdown5.value === 'others') {
                                        otherInput5.style.display = 'inline'; // Show input
                                    } else {
                                        otherInput5.style.display = 'none'; // Hide input
                                        otherInput5.value = ''; // Clear input
                                    }
                                    });
                                </script>
                           

                            <div class ="input-fields">
                                <label>Work Location (Household Head):</label>
                                <select name="work_location_head">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Within the Barangay<">Within the Barangay</option>
                                    <option value="Within the City/Municipality">Within the City/Municipality</option>
                                    <option value="Within the Province">Within the Province</option>
                                    <option value="Within the Country">Within the Country</option>
                                </select>
                            </div>     
                        </div>
                        <br><br>

                        <div class ="secfields">

                            <!-- <div class ="firstinput-fields">
                                <label>Household Head Monthly Salary/Income:</label>
                                <select name="monthly_salary">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Less_than_500_PHP">Less than 500 PHP</option>
                                    <option value="500_-_999_PHP">500 - 999 PHP</option>
                                    <option value="1,000_-_2,999_PHP">1,000 - 2,999 PHP</option>
                                    <option value="3,000_-_4,999_PHP">3,000 - 4,999 PHP</option>
                                    <option value="5,000_-_9,999_PHP">5,000 - 9,999 PHP</option>
                                    <option value="10,000_-_19,999_PHP">10,000 - 19,999 PHP</option>
                                    <option value="20,000_PHP_and_above">20,000 PHP and above</option>
                                </select>
                            </div>  -->

                            <div class ="firstinput-fields">
                                <label>Combine Household Income:</label>
                                <select name="combine_monthly_income">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="0 - 2,999 PHP">0 - 2,999 PHP</option>
                                    <option value="3,000 - 5,999 PHP">3,000 - 5,999 PHP</option>
                                    <option value="6,000 - 8,999 PHP">6,000 - 8,999 PHP</option>
                                    <option value="9,000 - 12,999_PHP">9,000 - 12,999_PHP</option>
                                    <option value="13,000 and above">13,000 and above</option>
                                </select>
                            </div>
                        </div>       
                    </div>
                </div>
                
                <!-- Step 5: Training needs -->
                <div class="fifth form">

                    <div class="step">
                        <span class="title">V. Training Needs Assessment and Organization Membership</span>
                        <br><br>

                        <div class ="fields">
                                                      
                            <div class ="input-fields">                     
                                <label>Is there any skill that can be used for a living?:</label>
                                <select id="skillsForLivingDropdown" name="skills_for_living">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>

                            <div class ="input-fields">
                                <!-- Follow-up question -->
                               
                                <div id="skillDetails" style="display: none; margin-top: 10px;">      
                                        <label>If there is any, what is it?</label>
                                        <select id="specificSkillDropdown" name="specific_skill">
                                            <option value="" disabled selected>- select skill -</option>
                                            <option value="Handicrafts">Handicrafts</option>
                                            <option value="Wood_Works_and_Furnitures">Wood Works & Furnitures</option>
                                            <option value="Food_Processing">Food Processing</option>
                                            <option value="others">Others (please specify)</option>
                                        </select> 
                                        <div class ="input-fields">
                                            <input type="text" id="otherSkillInput" name="other_skill" placeholder="Please specify" style="display: none; margin-top: 5px;">
                                        </div>
                                </div>
                            </div>
                            <script>
                                // lements
                                const skillsForLivingDropdown = document.getElementById('skillsForLivingDropdown');
                                const skillDetails = document.getElementById('skillDetails');
                                const specificSkillDropdown = document.getElementById('specificSkillDropdown');
                                const otherSkillInput = document.getElementById('otherSkillInput');
                            
                                // Show or hide follow-up question based on "Yes/No"
                                skillsForLivingDropdown.addEventListener('change', function () {
                                if (skillsForLivingDropdown.value === 'Yes') {
                                    skillDetails.style.display = 'block'; // Show follow-up question
                                    
                                    } else {
                                        skillDetails.style.display = 'none'; // Hide follow-up question
                                        specificSkillDropdown.value = ''; // Reset dropdown
                                        otherSkillInput.style.display = 'none'; // Hide "Others" input
                                        otherSkillInput.value = ''; // Clear input value
                                    }
                                });
                            
                                // Show or hide input field for "Others"
                                specificSkillDropdown.addEventListener('change', function () {
                                if (specificSkillDropdown.value === 'others') {
                                    otherSkillInput.style.display = 'block'; // Show input
                                    } else {
                                        otherSkillInput.style.display = 'none'; // Hide input
                                        otherSkillInput.value = ''; // Clear input value
                                    }
                                });
                            </script>                           
                            

                            <div class ="input-fields">
                                <label>Are you a member of any organization/association in your community?:</label>
                                <select id="organizationmember" name="organization_member">
                                    <option value="" disabled selected>- select here -</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>

                            <div class ="input-fields">    
                                <!-- Follow-up question -->
                                 
                                <div id="organizationdetails" style="display: none; margin-top: 10px;">                                  
                                    <label>If member, what organization/association is it?</label>
                                        <select id="specificOrganization" name="specific_organization">
                                            <option value="" disabled selected>- select skill -</option>
                                            <option value="HOA">HOA</option>
                                            <option value="Youth_Organization">Youth Organization</option>
                                            <option value="Dayong">Dayong</option>
                                            <option value="Womens_Organization">Women's Organization</option>
                                            <option value="others">Others (please specify)</option>
                                        </select>
                                    <div class ="input-fields">   
                                        <input type="text" id="otherOrganizationInput" name="other_organization" placeholder="Please specify" style="display: none; margin-top: 5px;">
                                    </div>
                                </div>
                            </div>
                               
                            <script>
                                    // Elements
                                    const organizationmember = document.getElementById('organizationmember');
                                    const organizationdetails = document.getElementById('organizationdetails');
                                    const specificOrganization = document.getElementById('specificOrganization');
                                    const otherOrganizationInput = document.getElementById('otherOrganizationInput');
                            
                                    // Show or hide follow-up question based on "Yes/No"
                                    organizationmember.addEventListener('change', function () {
                                        if (organizationmember.value === 'Yes') {
                                            organizationdetails.style.display = 'block'; // Show follow-up question
                                        } else {
                                            organizationdetails.style.display = 'none'; // Hide follow-up question
                                            specificOrganization.value = ''; // Reset dropdown
                                            otherOrganizationInput.style.display = 'none'; // Hide "Others" input
                                            otherOrganizationInput.value = ''; // Clear input value
                                        }
                                    });
                            
                                    // Show or hide input field for "Others"
                                    specificOrganization.addEventListener('change', function () {
                                        if (specificOrganization.value === 'others') {
                                            otherOrganizationInput.style.display = 'block'; // Show input
                                        } else {
                                            otherOrganizationInput.style.display = 'none'; // Hide input
                                            otherOrganizationInput.value = ''; // Clear input value
                                        }
                                    });
                                </script>
                        </div>  
                        <br>
                        <div class ="secfields">
                            <div class ="firstinput-fields">
                                <label>What are the skills you want to learn?</label>
                                <input type="text" name="wanttolearn" required>
                            </div>  
                        </div>
                    </div>
                </div>

                <!-- Step 6: Final Section -->
                <div class="sixth form">
                    <div class="step">
                        <span class="title">VI. Final Remarks</span>
                        <br><br>
                        
                        <div class="secfields">
                            <div class="firstinput-fields">
                                <label for="house_photo">Add Photo of Respondent's House:</label>
                                <input type="file" id="house_photo" name="house_photo" accept="image/*" capture="environment" style="width: 100%;">
                                <small>You can take a photo or upload one from your device.</small>
                            </div>
                        </div>
                        <br><br>
                        
                        <!-- GPS Location Section -->
                        <div class="secfields">
                            <div class="firstinput-fields">
                                <label>Location Capture:</label>
                                <button type="button" id="getLocationBtn" onclick="getCurrentLocation()" style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                                    <i class="fas fa-map-marker-alt"></i> Get Current Location
                                </button>
                                <div id="locationStatus" style="margin-top: 10px; font-size: 14px;"></div>
                            </div>
                        </div>
                        <br><br>
                        
                        <input type="hidden" name="latitude" id="lat">
                        <input type="hidden" name="longitude" id="lon">

<script>
// GPS Location Function
function getCurrentLocation() {
    const statusDiv = document.getElementById('locationStatus');
    const latInput = document.getElementById('lat');
    const lonInput = document.getElementById('lon');
    
    statusDiv.innerHTML = '<span style="color: orange;">Requesting location...</span>';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                latInput.value = latitude;
                lonInput.value = longitude;
                
                statusDiv.innerHTML = '<span style="color: green;">✓ Location captured successfully! (Lat: ' + latitude.toFixed(6) + ', Lon: ' + longitude.toFixed(6) + ')</span>';
            },
            function(error) {
                let errorMessage = 'Error getting location: ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Location permission denied. Please allow location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Location request timed out.';
                        break;
                    default:
                        errorMessage += 'Unknown error occurred.';
                        break;
                }
                statusDiv.innerHTML = '<span style="color: red;">✗ ' + errorMessage + '</span>';
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    } else {
        statusDiv.innerHTML = '<span style="color: red;">✗ Geolocation is not supported by this browser.</span>';
    }
}

// Image upload with GPS extraction (fallback)
document.getElementById("house_photo").addEventListener("change", function(event) {
    const file = event.target.files[0];
    const statusDiv = document.getElementById('locationStatus');

    if (file) {
        // Check if EXIF.js is available
        if (typeof EXIF !== 'undefined') {
            EXIF.getData(file, function() {
                const lat = EXIF.getTag(this, "GPSLatitude");
                const lon = EXIF.getTag(this, "GPSLongitude");
                const latRef = EXIF.getTag(this, "GPSLatitudeRef");
                const lonRef = EXIF.getTag(this, "GPSLongitudeRef");

                if (lat && lon) {
                    const latitude = convertToDecimal(lat, latRef);
                    const longitude = convertToDecimal(lon, lonRef);
                    
                    document.getElementById("lat").value = latitude;
                    document.getElementById("lon").value = longitude;
                    
                    statusDiv.innerHTML = '<span style="color: green;">✓ GPS data extracted from image! (Lat: ' + latitude.toFixed(6) + ', Lon: ' + longitude.toFixed(6) + ')</span>';
                }
            });
        }
    }

    function convertToDecimal(coord, ref) {
        const decimal = coord[0] + coord[1]/60 + coord[2]/3600;
        return (ref === "S" || ref === "W") ? decimal * -1 : decimal;
    }
});
</script>
<br><br>

                        <!-- Remarks Section -->
                        <div class ="secfields">
                            <div class ="firstinput-fields">
                                <label for="remarks">Remarks:</label>
                                <textarea id="remarks" name="remarks" placeholder="Enter remarks here..." rows="4" style="width: 100%;"></textarea>
                            </div>
                        </div>
                        <br><br>

                        <!-- Interviewer Name -->
                        <div class ="secfields">
                            <div class="firstinput-fields">
                                <label for="interviewedBy">Interviewed by:</label>
                                <input type="text" id="interviewedBy" name="interviewed_by" value="<?php echo isset($_SESSION['name']) ? htmlspecialchars($_SESSION['name']) : ''; ?>" readonly style="width: 100%;">
                            </div>
                            
                        </div>        
                        <br><br>

                        <!-- Date Interviewed -->
                        <div class ="secfields">
                            <div class ="firstinput-fields">
                                <label for="dateInterviewed">Date Interviewed:</label>
                                <input type="date" id="dateInterviewed" name="date_interviewed" style="width: 100%;">
                            </div>
                        </div> 
                        
                    <!-- Validator Signature -->
                    <br><br>
<label for="validator_signature">Validator Signature:</label>
<canvas id="validator-signature-pad" width="300" height="100" style="border:1px solid #000;"></canvas>
<button type="button" onclick="clearSignature('validator')">Clear</button>
<input type="hidden" name="validator_signature" id="validator_signature">

<br><br>

<!-- Respondent Signature -->
<label for="respondent_signature">Respondent Signature:</label>
<canvas id="respondent-signature-pad" width="300" height="100" style="border:1px solid #000;"></canvas>
<button type="button" onclick="clearSignature('respondent')">Clear</button>
<input type="hidden" name="respondent_signature" id="respondent_signature">

<br><br>
                    </div>
                </div>   
                <!-- Final Step: Buttons -->
                <div class="button-container">
                    <button type="button" id="prevBtn" onclick="nextPrev(-1)">Previous</button>
                    <button type="button" id="nextBtn" onclick="nextPrev(1)">Next</button>
                    <button type="button" id="submitBtn" onclick="submitForm()">Submit</button>
                </div>
            </form>

        </div> 


    </div>  
    <script src="survey_form.js"></script> 
    <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.6/dist/signature_pad.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.6/dist/signature_pad.umd.min.js"></script>
<script>
let validatorPad = new SignaturePad(document.getElementById('validator-signature-pad'));
let respondentPad = new SignaturePad(document.getElementById('respondent-signature-pad'));

function clearSignature(type) {
    if (type === 'validator') {
        validatorPad.clear();
    } else if (type === 'respondent') {
        respondentPad.clear();
    }
}

document.getElementById('surveyForm').addEventListener('submit', function(e) {
    document.getElementById('validator_signature').value = validatorPad.isEmpty() ? '' : validatorPad.toDataURL();
    document.getElementById('respondent_signature').value = respondentPad.isEmpty() ? '' : respondentPad.toDataURL();
});
</script>
</body>
</html>