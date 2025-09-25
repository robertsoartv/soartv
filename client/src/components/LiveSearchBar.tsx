import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Link, useLocation } from "wouter";
import { debounce } from "lodash";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Film, User, Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  bio?: string;
  role: string;
  profilePhotoUrl?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  genre: string;
  posterURL?: string;
  visibility: string;
  tags: string[];
}

const LiveSearchBar = () => {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<{ users: UserProfile[]; projects: Project[] }>({
    users: [],
    projects: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async (term: string) => {
    if (!term.trim()) {
      setSuggestions({ users: [], projects: [] });
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const userQuery = query(
        collection(db, "users"),
        where("name", ">=", term),
        where("name", "<=", term + "\uf8ff"),
        limit(5)
      );

      const projectQuery = query(
        collection(db, "projects"),
        where("title", ">=", term),
        where("title", "<=", term + "\uf8ff"),
        where("visibility", "==", "public"),
        limit(5)
      );

      const [userSnap, projectSnap] = await Promise.all([
        getDocs(userQuery),
        getDocs(projectQuery),
      ]);

      setSuggestions({
        users: userSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as UserProfile[],
        projects: projectSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Project[],
      });
    } catch (err) {
      console.error("Search error:", err);
      setSuggestions({ users: [], projects: [] });
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = debounce(fetchSuggestions, 300);

  useEffect(() => {
    debouncedFetch(searchTerm);
    return () => debouncedFetch.cancel();
  }, [searchTerm]);

  return (
    <div className="relative max-w-lg mx-auto">
      <div className="relative">
        <input
          type="text"
          placeholder="🔍 Search projects or filmmakers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchTerm.trim()) {
              setLocation(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
            }
          }}
          className="w-full p-3 pl-4 pr-10 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {searchTerm && (suggestions.users.length > 0 || suggestions.projects.length > 0 || loading) && (
        <div className="absolute mt-2 w-full bg-black/95 border border-gray-700 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto backdrop-blur-sm">
          {!loading && suggestions.users.length > 0 && (
            <>
              <div className="px-4 py-2 font-semibold text-yellow-400 text-sm border-b border-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Filmmakers
              </div>
              {suggestions.users.map((user) => (
                <Link href={`/user/${user.id}`} key={user.id}>
                  <div 
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => setSearchTerm('')}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.profilePhotoUrl} />
                      <AvatarFallback className="bg-yellow-400 text-black text-sm font-bold">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-white text-sm font-medium">{user.name}</div>
                      <div className="text-gray-400 text-xs">{user.role}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}

          {!loading && suggestions.projects.length > 0 && (
            <>
              <div className="px-4 py-2 font-semibold text-yellow-400 text-sm border-b border-gray-700 flex items-center gap-2">
                <Film className="w-4 h-4" />
                Projects
              </div>
              {suggestions.projects.map((project) => (
                <Link href={`/watch/${project.id}`} key={project.id}>
                  <div 
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => setSearchTerm('')}
                  >
                    {project.posterURL ? (
                      <img
                        src={project.posterURL}
                        className="w-8 h-8 rounded object-cover"
                        alt={project.title}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                        <Film className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="text-white text-sm font-medium">{project.title}</div>
                      <div className="text-gray-400 text-xs">{project.genre}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}

          {!loading && suggestions.users.length === 0 && suggestions.projects.length === 0 && searchTerm && (
            <div className="px-4 py-6 text-gray-400 italic text-center text-sm">
              No matches found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveSearchBar;