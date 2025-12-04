import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchSharedProject, SharedProject } from "../services/firebase";

const ProjectDetail: React.FC = () => {
  const { id } = useParams(); // ← This MUST be "id" to match the route param /:id
  const navigate = useNavigate();
  const [project, setProject] = useState<SharedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      console.log("[ProjectDetail] useParams id:", id);

      if (!id) {
        console.error("[ProjectDetail] No project ID in URL params");
        setError("No project ID provided");
        setLoading(false);
        return;
      }

      try {
        console.log("[ProjectDetail] Fetching project with ID:", id);
        const proj = await fetchSharedProject(id);
        
        console.log("[ProjectDetail] fetchSharedProject result:", proj);

        if (!proj) {
          console.error("[ProjectDetail] Project not found in Firestore");
          setError("Project not found");
        } else {
          console.log("[ProjectDetail] Project loaded successfully:", proj);
          setProject(proj);
          setError(null);
        }
      } catch (err) {
        console.error("[ProjectDetail] Error fetching project:", err);
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-emerald-50">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <span className="material-icons-round text-4xl text-emerald-600">
              image
            </span>
          </div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-emerald-50 px-6 pb-8">
        <span className="text-6xl mb-4">😞</span>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
        <p className="text-gray-600 text-center mb-6">{error}</p>
        
        {/* Promo section for anonymous visitors */}
        <div className="bg-white rounded-2xl p-6 mb-6 w-full max-w-sm border-2 border-emerald-200">
          <h2 className="text-xl font-bold text-emerald-600 mb-3 text-center">
            🌍 Join the EcoWarrior Movement
          </h2>
          <p className="text-gray-700 text-center text-sm mb-4">
            Turn your trash into treasure! Create amazing DIY projects from waste materials and earn points while saving the planet.
          </p>
          <button
            onClick={() => navigate("/#/home")}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
          >
            Create Your Account & Start Upcycling
          </button>
        </div>

        <button
          onClick={() => navigate("/#/home")}
          className="text-emerald-600 hover:text-emerald-700 font-semibold"
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  // Successfully loaded project
  return (
    <div className="min-h-full pb-8 bg-gray-50">
      {/* Proof Image */}
      <div className="w-full h-80">
        <img
          src={project.proofImage}
          alt="Finished project"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Project Info Card */}
      <div className="px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          {/* Creator Info */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold">
              {project.createdBy.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900">{project.createdBy}</p>
              <p className="text-xs text-gray-500">
                {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Project Title & Description */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {project.projectName}
          </h2>
          <p className="text-gray-600 mb-4">{project.title}</p>
          {project.description && (
            <p className="text-sm text-gray-700 mb-4 italic">"{project.description}"</p>
          )}

          {/* Meta Info */}
          <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <p className={`text-xs font-bold px-2 py-1 rounded uppercase inline-block ${
                project.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                project.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {project.difficulty}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-emerald-600">
                +{project.points}
                <span className="text-xs text-gray-400 ml-1">pts</span>
              </p>
            </div>
            <div className="text-center">
              <span className="text-green-500 material-icons-round text-lg">
                check_circle
              </span>
            </div>
          </div>

          {/* Before & After */}
          <div className="space-y-3 mb-6">
            <p className="font-bold text-gray-900 text-sm">Before & After</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={project.originalImage}
                  alt="Original"
                  className="w-full h-32 object-cover"
                />
                <p className="text-xs text-gray-500 p-2 bg-gray-50 text-center">
                  Original
                </p>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={project.proofImage}
                  alt="Finished"
                  className="w-full h-32 object-cover"
                />
                <p className="text-xs text-gray-500 p-2 bg-gray-50 text-center">
                  Finished
                </p>
              </div>
            </div>
          </div>

          {/* Promo CTA */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 mb-4 border border-emerald-200">
            <h3 className="font-bold text-emerald-900 mb-2">
              🌍 Ready to Make an Impact?
            </h3>
            <p className="text-sm text-emerald-800 mb-3">
              Join thousands of EcoWarriors creating amazing DIY projects and making a difference for our planet.
            </p>
            <button
              onClick={() => navigate("/#/home")}
              className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 transition text-sm"
            >
              Start Your Upcycling Journey
            </button>
          </div>

          <button
            onClick={() => navigate("/#/home")}
            className="w-full text-emerald-600 hover:text-emerald-700 font-semibold text-sm py-2"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;