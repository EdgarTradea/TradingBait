import { signOut } from "firebase/auth";
import { firebaseAuth } from "utils/firebase";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Logout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    signOut(firebaseAuth)
      .then(() => {
        // Sign-out successful.
        navigate("/login");
      })
      .catch((error) => {
        // An error happened.
        console.error("Logout Error:", error);
      });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white">
      <div className="text-center space-y-4">
        <div className="animate-pulse">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
          Signing Out
        </h2>
        <p className="text-gray-400">See you next time, trader!</p>
      </div>
    </div>
  );
};

export default Logout;
