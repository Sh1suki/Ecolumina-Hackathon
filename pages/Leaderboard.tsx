import React, { useEffect, useState } from "react";
import { subscribeToLeaderboard, auth } from "../services/firebase";
import { UserProfile } from "../types";

const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((data) => {
      setUsers(data);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-full bg-white">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-500 text-sm">Top Eco-Warriors this week</p>
      </div>

      <div className="px-4">
        {users.length === 0 ? (
           <div className="p-8 text-center text-gray-400">Loading rankings...</div>
        ) : (
          users.map((user, index) => {
            const isMe = user.id === currentUid;
            const rank = index + 1;
            
            return (
              <div 
                key={user.id} 
                className={`flex items-center p-4 mb-3 rounded-2xl transition-all ${
                  isMe ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 transform scale-105 z-10" : "bg-gray-50 text-gray-800"
                }`}
              >
                <div className={`font-bold text-lg w-8 text-center ${
                  rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-orange-400" : isMe ? "text-emerald-200" : "text-gray-400"
                }`}>
                  {rank}
                </div>
                
                <div className={`w-10 h-10 rounded-full mx-3 flex items-center justify-center font-bold ${
                  isMe ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {user.name.charAt(0)}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold">{user.name} {isMe && "(You)"}</h3>
                  <p className={`text-xs ${isMe ? "text-emerald-100" : "text-gray-500"}`}>{user.scans} Scans Completed</p>
                </div>
                
                <div className="text-right">
                  <span className="font-bold text-lg">{user.points}</span>
                  <p className={`text-[10px] ${isMe ? "text-emerald-100" : "text-gray-400"}`}>PTS</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Leaderboard;