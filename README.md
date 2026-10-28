# WalletWise 🚂💸

An Offline-First Progressive Web App (PWA) engineered for seamless financial tracking in low-network environments. 

Originally architected to manage budget and itineraries for a 120-day solo rail journey across all 28 states of India, WalletWise ensures zero data loss when cellular networks drop. It utilizes a local-storage-first approach, instantly capturing data on the device and performing a bulk background sync to MongoDB the moment internet connectivity is restored.

## ✨ Core Features

*   **Offline-First Architecture:** Complete offline functionality. UI indicators (Spinning, Green Cloud, Red Offline) visually track the live sync status with the backend.
*   **Trip & Itinerary Isolation:** Group expenses by specific trips. Features visual budget consumption bars and a dedicated toggle for professional field/audit trips.
*   **OCR Receipt Scanning:** Integrated `tesseract.js` automatically extracts the highest monetary value from photos of physical bills.
*   **GPS Location Tagging:** Fetches exact geographic coordinates and reverse-geocodes them to append `[City, State]` tags to transaction notes.
*   **Advanced Analytics:** Interactive Recharts pie charts for category breakdowns and month-over-month bar chart comparisons.
*   **PWA Ready:** Fully installable on Android and iOS home screens for a native, full-screen mobile experience.
*   **Instant Export:** Generate complete `.xlsx` spreadsheet reports or share formatted text summaries instantly via WhatsApp and Email.

## 🛠️ Tech Stack

**Frontend:**
*   React.js (Vite)
*   Tailwind CSS & Lucide Icons (UI/UX)
*   Recharts (Data Visualization)
*   Tesseract.js (Optical Character Recognition)
*   SheetJS / XLSX (Data Export)
*   Vite PWA Plugin

**Backend:**
*   Node.js & Express.js
*   MongoDB Atlas (Mongoose)
*   CORS & dotenv

## 🚀 Local Installation & Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/AshishKumarManik/walletwise-app.git](https://github.com/AshishKumarManik/walletwise-app.git)
