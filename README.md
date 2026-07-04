# AgroSense AI 🌱

An intelligent, Gemini-powered crop advisory and pest risk assistant designed specifically for Indian smallholder farmers. 

AgroSense AI leverages Google's Gemini 1.5 Flash API to deliver expert agricultural guidance through an intuitive web interface. Operating through specialized agentic modules, it simulates a RAG (Retrieval-Augmented Generation) system to provide farmers with actionable advice based on soil health, local weather patterns, and pest resistance data.

## Features ✨

- **🌾 Crop Advisor:** Get tailored advice on crop health, growth stages, soil nutrients, and fertilizer recommendations.
- **🐛 Pest Diagnostician:** Describe symptoms and get real-time identification of pests/diseases along with practical remedies.
- **🌦 Seasonal Risk Alert:** Receive early warnings about seasonal risks, weather-related threats, and preventive measures.
- **🧠 Powered by Gemini:** Utilizes Google's Gemini 1.5 Flash for fast, intelligent, and context-aware responses.

## Tech Stack 🛠️

- **Frontend:** React, Vite
- **Styling:** CSS (Clean, Modern, Responsive UI)
- **AI Integration:** `@google/generative-ai` SDK (Gemini 1.5 Flash)

## Getting Started 🚀

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dhanasinghbtech2024-dev/AgroSense-AI.git
   cd AgroSense-AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Create a `.env` file in the root directory.
   - Add your Gemini API key to the `.env` file:
     ```env
     VITE_GEMINI_API_KEY=your_gemini_api_key_here
     ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173/` (or the port specified by Vite) to use the application.

## SDG Alignment 🌍

AgroSense AI aligns with the United Nations Sustainable Development Goals:
- **🎯 SDG 2:** Zero Hunger
- **☀️ SDG 13:** Climate Action
- **🌿 SDG 15:** Life on Land

## Disclaimer ⚠️

*Advice provided by AgroSense AI is AI-generated. While it aims to be as accurate as possible, please consult a local Krishi Sevak or agricultural expert for critical decisions.*
