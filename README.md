# CHoDaMS Web Application

## Overview
A multi-layered PHP/MariaDB housing data system featuring a custom **Weighted Scoring Algorithm**, interactive **GeoJSON mapping**, descriptive analytics dashboards, and secure **Role-Based Access Control (RBAC)**.

## Key Technical Highlights 🚀
*   **Algorithmic Processing:** Employs a custom Weighted Scoring Algorithm to automate and compute complex eligibility points based on demographic, hazard, and economic inputs.
*   **Geo-Spatial Integration:** Real-time interactive mapping utilizing KML/GeoJSON polygons to visually track and manage project boundaries and beneficiary distribution.
*   **Advanced Data Analytics:** Transforms raw census data into dynamic, actionable visual dashboards, filtering across intricate socio-economic metrics.
*   **Multi-Layered Architecture:** Secure RESTful architecture ensuring strong separation of concerns between the frontend, PHP backend logic, and MariaDB.

## Tech Stack
*   **Frontend:** HTML, CSS, JavaScript (Bootstrap/Tailwind)
*   **Backend:** PHP (RESTful API)
*   **Database:** MariaDB (Central Database)
*   **Environment:** XAMPP (Apache, MySQL)

## User Roles & Key Features

### 1. Super Admin
*   **System Maintenance Module:** Monitors overall system performance, applies updates, and ensures smooth operation.
*   **Feature and Configuration Management:** Adjusts system settings, user permissions, project details, and database structures.

### 2. Admin
*   **Dashboard Module:** Provides descriptive data analytics, visualizing beneficiary distribution via charts and text summaries, including filtering by income, water access, and electricity. Tracks progress of surveys.
*   **Beneficiaries Module:** Manages the list of validated beneficiaries and their computed points. Allows admins to approve and transfer them to the Selected Respondents list.
*   **Project Sites Module:**
    *   **Site Management:** Organize, view, and maintain existing project sites, including interactive maps (GeoJSON/KML boundaries).
    *   **HOA Management:** Manage Homeowner's Associations, officer and member records, and related documents.
*   **Assignments Module:** Manages lot assignments for approved beneficiaries, and tracks site visits and monitoring for post-assignment compliance.
*   **Revocations Module:** Manages the revocation of awarded housing lots due to policy violations.
*   **Mapping Module:** Visualizes beneficiary locations and statuses on an interactive map using GPS coordinates.
*   **Validator Account Management:** Create, update, or deactivate validator accounts.

### 3. Validator (Web Access)
*   **Dashboard:** Office-oriented overview of validator activities, search bar, and survey counts.
*   **Survey Form Module:** Capture respondent data, household details, attach photos, and record GPS locations for mapping purposes.
*   **Profile Management:** Manage personal account details.

## System Architecture
Follows a multi-layered design. The web frontend interacts with backend PHP services that handle business logic like data validation and the Weighted Scoring Algorithm for applicant evaluation. The centralized MariaDB database stores all finalized applicant records and survey data.

## Getting Started
To run the web application locally:
1. Ensure XAMPP is installed and running (Apache & MySQL).
2. Clone/place the `Chodams` folder into your `htdocs` directory.
3. Import the required MariaDB SQL database.
4. Access the application via a web browser (e.g., `http://localhost/Chodams`).
