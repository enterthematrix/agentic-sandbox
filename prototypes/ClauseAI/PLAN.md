# Jira Tickets: ClauseAI Project

This document outlines the initial product backlog and task descriptions for the Prelegal Project, tracking the progression from data curation to a full-featured AI legal assistant.

---

### CL-1: A company offering full-featured AI legal assistant
**Description:** Create a starter README file. This will be updated as the project will move through implementation. 

### CL-2: Create a dataset of legal document templates
**Description:** This task is a one-time data curation task to prepare data for the Prelegal project.

For context, the CommonPaper GitHub account ([Common Paper](https://github.com/CommonPaper)) contains a number of repositories with legal agreement templates that can be copied and modified under a CC license. We will use this as our source of data.

**Requirements:**
1.  Browse CommonPaper’s repositories online and retrieve all available markdown template legal agreements.
2.  Store all markdown files in a directory called `/templates` within the Prelegal project.
3.  Create a `catalog.json` file in the project root containing the `name`, `description`, and `filename` of each downloaded markdown document.
4.  Add a text file in the `/templates` directory indicating that all contents are licensed under the **CC BY 4.0** license.

---

### CL-3: Prototype of Mutual NDA creator
**Description:** Build a basic web application to create a Mutual NDA document for a user.

**Requirements:**
1.  Implement a web form where users enter key information (e.g., entity names, effective date, state of jurisdiction).
2.  The website should dynamically display the Mutual NDA with the user's information populated into the template.
3.  Allow the user to download the completed document locally.

---

### CL-4: Build foundation of V1 product
**Description:** Upgrade the prototype to establish the technical foundation for the full V1 project. This focuses on architecture rather than new user-facing features.

**Requirements:**
1.  Establish a formal Frontend and Backend separation.
2.  Implement a temporary database (e.g., SQLite or a lightweight NoSQL instance) to manage session data.
3.  Provide automation scripts to start and stop the development environment.
4.  Ensure the code is structured for scalability but keep the product features identical to the PL-3 prototype.

---

### CL-5: Add AI Chat (Mutual NDA Only)
**Description:** Change the interaction model from static forms to a conversational AI interface while still focusing exclusively on the Mutual NDA.

**Requirements:**
1.  Implement a freeform chat interface powered by an LLM.
2.  The AI should guide the user, asking questions related to necessary fields for the NDA.
3.  The AI should populate the document in real-time based on the chat responses.

---

### CL-6: Expand to all supported legal document types
**Description:** Expand the AI's functionality to support all document types found in the template library curated in PL-2.

**Requirements:**
1.  Integrate the `catalog.json` data so the AI knows which documents are available.
2.  If a user requests an unsupported document, the AI must explain the limitation and offer the closest relevant alternative from our library.
3.  Maintain the guided conversational process for all supported document types.

---

### CL-7: Support multiple users & final polish
**Description:** Transition the application from a local/single-user utility to a production-ready multi-user platform.

**Requirements:**
1.  **User Authentication:** Implement sign-up/login functionality to allow users to save and revisit their documents.
2.  **Document Dashboard:** Create a user dashboard to view, edit, and delete previously generated agreements.
3.  **PDF Export:** Add the ability to export the final documents as polished, formatted PDFs in addition to Markdown.
4.  **UI/UX Refinement:** Conduct a final styling pass to ensure a professional, "legal-tech" aesthetic across the chat and document preview.