import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Camera from "../components/Camera";
import { analyzeImage } from "../services/gemini";

const Scan: React.FC = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCapture = async (base64Image: string) => {
    setIsAnalyzing(true);
    try {
      // Analyze with Gemini
      const result = await analyzeImage(base64Image);
      
      // Navigate to result - we award points there depending on action
      navigate("/result", { state: { result, image: base64Image } });
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      alert("Something went wrong. Please try again.");
    }
  };

  if (isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-white z-50">
        <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-8"></div>
        <h2 className="text-2xl font-bold mb-2">Analyzing...</h2>
        <p className="text-gray-400 animate-pulse">Consulting the eco-database</p>
      </div>
    );
  }

  return (
    <div className="h-full relative">
       <button 
         onClick={() => navigate(-1)} 
         className="absolute top-4 left-4 z-20 w-10 h-10 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md"
       >
         <span className="material-icons-round">arrow_back</span>
       </button>
      <Camera onCapture={handleCapture} />
    </div>
  );
};

export default Scan;