### Software Requirements Specification (SRS)

**1. Introduction**
**1.1 Purpose**
The purpose of this document is to define the software requirements for a custom B2B2C e-commerce platform. The system aims to automate the retrieval of wholesale products from a specific supplier , apply dynamic category-based profit margins, and present these products to retail customers at the final calculated prices.

**1.2 Scope**
The system comprises three main functional areas:

* An automated data synchronization module to fetch products, categories, and wholesale prices from the supplier on a 24-hour cycle.


* An administrative interface for the store owner to define and manage profit margins based on product categories.


* A storefront interface where end-consumers can browse and purchase products.



**2. Overall Description**
**2.1 User Roles**

* 
**System Administrator (Store Owner):** Has authorization to configure category-based pricing rules, monitor the status of data synchronizations, and manage the storefront.


* 
**Customer:** End-user who accesses the storefront to view categorized products and final retail prices. (no authentication required, keep it simple as stupid for simple user experience). when the user ordered he will be directed to whatsApp.



* 
**Automated Sync Process:** A background routine responsible for securely authenticating with the supplier's platform and retrieving the latest product catalog.



**3. Functional Requirements**

**3.1 Data Synchronization**

* 
**REQ-3.1.1:** The system shall authenticate with the supplier's platform using predefined credentials to access the restricted wholesale pricing.


* 
**REQ-3.1.2:** The system shall execute the synchronization routine every 24 hours.


* 
**REQ-3.1.3:** The synchronization routine shall extract the following product attributes: Name, Image References, Description, Category, Available Quantity, and Wholesale Price.


* 
**REQ-3.1.4:** The system shall compare the newly fetched data against the current inventory and update pricing, availability, or insert new records accordingly.



**3.2 Pricing Logic & Configuration**

* 
**REQ-3.2.1:** The administrative interface shall provide controls to set a specific markup value (fixed or percentage) for individual product categories.


* 
**REQ-3.2.2:** The system shall compute the final retail price by adding the defined category markup to the wholesale price.


* 
**REQ-3.2.3:** Adjustments to the markup values shall apply immediately to the storefront without requiring a new data synchronization cycle.



**3.3 Storefront Operations**

* 
**REQ-3.3.1:** The storefront shall present products organized logically by their respective categories.


* 
**REQ-3.3.2:** The storefront shall strictly display only the final calculated retail prices; wholesale prices must remain completely hidden from the customer.



**4. Non-Functional Requirements**

* 
**NFR-4.1.1 (Performance):** The data extraction process must implement appropriate pacing and delays to ensure it does not overwhelm the supplier's servers.


* 
**NFR-4.1.2 (Security):** The supplier login credentials must be stored dynamically and securely within the system's configuration.


* **NFR-4.1.3 (Resource Optimization):** The system should minimize storage overhead where possible by referencing external media assets appropriately.
