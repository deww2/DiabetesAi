# DiabetesAi
A project for predicting diabetes risk using AI/ML based on patient and lifestyle data.
## 📌 Project Overview
This repository combines a frontend (web UI) and a backend (ML model + API) to create a full-stack application that allows users to input relevant health/lifestyle data and receive predictions about diabetes risk.
- **Backend**: ML model training and serving (handled in the `backend/` folder)  
- **Frontend**: Web interface (handled in the `frontend/` folder)  
- Built using TypeScript, Python, and JavaScript.  
- Goal: Empower users and healthcare professionals with an intuitive tool for early diabetes risk estimation.
## 🛠️ Features
- Data input form for lifestyle & health metrics  
- Real-time risk prediction via API call  
- Result presentation with easy-to-interpret output  
- Modular architecture: model, API, and UI separated  
- Potential for future extensions (other chronic conditions, dataset enhancements, model improvements)
## 🚀 Getting Started
### Prerequisites
- Node.js & npm (for frontend)  
- Python (for backend model/API)  
- Git  
### Installation & Setup
1. Clone the repository:  
   ```bash
   git clone https://github.com/deww2/DiabetesAi.git
   cd DiabetesAi
   ```  
2. Setup backend:  
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```  
3. Setup frontend:  
   ```bash
   cd ../frontend
   npm install
   npm start
   ```  
### Usage
- Open the frontend in your browser (typically `http://localhost:3000`)  
- Input the health and lifestyle metrics as requested  
- Submit the form → it sends data to backend → receives a prediction  
- View result and interpret output  
## 🔍 Architecture
```
DiabetesAi/
│
├── backend/        # Python ML model and API
├── frontend/       # Web UI built with JS/TS
├── requirements.txt
├── package.json
├── .gitignore
└── README.md
```
- **frontend/** – UI code written in TypeScript/JavaScript  
- **backend/** – Python ML model and API for predictions  
- **.gitignore** – ensures sensitive data / unnecessary files aren’t tracked  
- Modular design: easy to replace model, adjust UI, or plug in new features  
## 🧠 Methodology
- Trained ML model on a dataset of patients with known diabetes outcomes  
- Preprocessing of features (normalization, missing value handling, feature selection)  
- Model evaluation using metrics such as accuracy, ROC-AUC, precision/recall  
- API wraps the trained model to expose prediction endpoint  
- Frontend communicates via HTTP request to backend  
## 📈 Example Prediction Flow
1. User enters data (e.g. glucose level, BMI, age, blood pressure)  
2. Frontend sends data → backend API  
3. Backend loads trained model → predicts diabetes risk  
4. Frontend displays probability & interpretation  
## 👥 Contributors
- **deww2** – initial architecture, model & UI integration  
- Future collaborators welcome! Please open issues or pull requests.
## 📄 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
