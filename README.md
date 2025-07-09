# 🚀 GenAI Privacy and Compliance Assessor

A proof-of-concept web application designed to help organisations assess their maturity and readiness for regulations like the EU AI Act. This tool was developed as a proactive initiative to demonstrate a potential product offering, guiding users through a comprehensive questionnaire to generate a real-time compliance score and actionable recommendations.

## ✨ Key Features

This application provides a seamless user experience to simplify a complex compliance assessment:

- **Region-Specific Assessments**: Users can select their primary region of operation (EU, UK, US) to receive a relevant set of questions.
- **Guided Questionnaire**: A multi-step form with a progress bar guides users through 8 key domains of AI compliance, from Discovery & Inventory to Ethics and Security.
- **Dynamic Maturity Scoring**: As the user answers questions, the application calculates a real-time maturity score, providing instant feedback on their compliance posture.
- **Actionable Recommendations**: Based on the assessment results, the app provides prioritised, high-level recommendations to help organisations improve their security and governance frameworks.
- **Lead Generation & Reporting**: Includes functionality for users to provide their details to download a more comprehensive PDF report of their results.

## 📸 Screenshots

Here is a look at the application's user interface:

*Welcome Screen:*
![Welcome Screen](./screenshots/welcome-screen.jpg)

*Assessment Questions:*
![Assessment Questions](./screenshots/questions-with-progression.jpg)

*Maturity Score Results:*
![Maturity Score Results](./screenshots/maturity-score-results.jpg)

*Priority Recommendations:*
![Priority Recommendations](./screenshots/recommended-actions.jpg)

*Report Download Prompt:*
![Report Download Prompt](./screenshots/report-download.jpg)


## 🛡️ DevSecOps Implementation

This project serves as a case study in applying DevSecOps principles. A key goal was to establish a secure software development lifecycle from the outset.

A GitHub Actions CI/CD workflow has been implemented to automate security scanning on every code push. This ensures that security is not an afterthought but an integral, automated part of the development process.

The pipeline includes the following security gates:

### Secret Scanning

Utilises **TruffleHog** to scan the repository's full commit history for any accidentally leaked secrets, such as API keys or private credentials. This is a critical first line of defence to prevent credential compromise.

### Static Application Security Testing (SAST)

Utilises **GitHub's native CodeQL engine** to perform a deep scan of the source code. This process identifies potential security vulnerabilities such as injection flaws, cross-site scripting (XSS), and insecure coding patterns before they ever reach a production environment.

### Software Composition Analysis (SCA)

Integrates **Trivy** to scan all open-source dependencies and libraries used in the project. It checks against a database of known vulnerabilities (CVEs) and provides alerts if an insecure or outdated library is being used, preventing supply chain attacks.

## 🔮 Future Security Enhancements

To advance this proof-of-concept to a production-ready state, the following security measures would be prioritised in the development roadmap:

- **Robust Input Validation**: Implement comprehensive server-side validation on all user inputs to protect against injection attacks and ensure data integrity.
- **API Rate Limiting**: Introduce rate limiting on API endpoints to protect the application from denial-of-service (DoS) attacks and abusive behaviour.
- **Comprehensive Error Handling & Logging**: Enhance the error handling mechanism to prevent sensitive information leakage and implement structured logging for security monitoring and incident response.
- **Content Security Policy (CSP)**: Implement a strict CSP to mitigate the risk of XSS and other code injection attacks.

## ⚙️ Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend/Database**: Google Firebase (Firestore)
- **Deployment**: Vercel
- **CI/CD & Security**: GitHub Actions, CodeQL, Trivy, TruffleHog

## 📝 Project Status

This project is currently archived and serves as a portfolio piece demonstrating skills in full-stack development, application security, and DevSecOps practices. The live deployment has been taken down.
