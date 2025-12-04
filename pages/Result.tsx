import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnalysisResult } from "../types";
import { addPoints, auth } from "../services/firebase";

const Result: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { result: AnalysisResult; image: string };
  const [disposed, setDisposed] = useState(false);

  if (!state) {
    navigate("/home");
    return null;
  }

  const { result, image } = state;
  const isRecyclable = result.isRecyclable;

  const handleDispose = async () => {
    // Always update the UI so the user sees feedback, even in offline/demo mode
    setDisposed(true);

    try {
      if (auth.currentUser) {
        await addPoints(auth.currentUser.uid, 1);
      } else {
        console.warn("No Firebase user found, recording disposal locally only (no cloud points update).");
      }
    } catch (error) {
      console.error("Failed to record disposal points", error);
    }

    // Keep the user on this screen briefly so they can read the disposal instructions,
    // then return them to Home.
    setTimeout(() => navigate('/home'), 2000);
  };

  return (
    <div className="min-h-full pb-8 bg-gray-50">
      {/* Image Header */}
      <div className="relative h-64 w-full">
        <img src={image} alt="Captured" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-6">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-2 ${
            isRecyclable ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
          }`}>
            <span className="material-icons-round text-sm mr-1">
              {isRecyclable ? "recycling" : "delete_outline"}
            </span>
            {isRecyclable ? "Recyclable" : "Not Recyclable"}
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">{result.itemName}</h1>
        </div>
        
        <button 
          onClick={() => navigate('/scan')} 
          className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition"
        >
          <span className="material-icons-round">arrow_back</span>
        </button>
      </div>

      <div className="px-6 -mt-6 relative z-10">
        {/* Disposal Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-l-4 border-emerald-500">
          <h3 className="text-gray-900 font-bold mb-2 flex items-center">
            <span className="material-icons-round text-gray-400 mr-2">info</span>
            How to Dispose
          </h3>
          <p className="text-gray-600 leading-relaxed text-sm mb-4">
            {result.disposalInstruction}
          </p>

          {!isRecyclable && (
            <button
              onClick={handleDispose}
              disabled={disposed}
              className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center transition-all ${
                 disposed ? "bg-gray-400" : "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200"
              }`}
            >
              {disposed ? (
                 <>
                   <span className="material-icons-round mr-2">check</span> Disposed (+1 pt)
                 </>
              ) : (
                 <>
                   <span className="material-icons-round mr-2">delete</span> Dispose & Earn 1 Pt
                 </>
              )}
            </button>
          )}
        </div>

        {/* DIY Options */}
        {isRecyclable && result.diyOptions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Upcycle This Item</h2>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Recommended</span>
            </div>

            <div className="grid gap-4">
              {result.diyOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    navigate("/workshop", {
                      state: {
                        item: result.itemName,
                        project: option.title,
                        originalImage: image, // ensure `image` is the original scan base64 in this component's scope
                      },
                    })
                  }
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-left hover:shadow-md transition-all active:scale-[0.99] flex flex-col"
                >
                  <div className="flex justify-between w-full mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      option.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : 
                      option.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {option.difficulty}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg mb-1">{option.title}</h4>
                  <p className="text-gray-500 text-xs line-clamp-2">{option.description}</p>
                  
                  <div className="mt-3 flex items-center text-emerald-600 text-sm font-medium">
                    Start Project <span className="material-icons-round text-sm ml-1">arrow_forward</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="h-8"></div>
      </div>
    </div>
  );
};

export default Result;