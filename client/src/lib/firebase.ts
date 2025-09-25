// Firebase core
import { initializeApp } from "firebase/app";

// Firebase Auth
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

// Firebase Firestore
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, getDocs, deleteDoc, serverTimestamp, limit, onSnapshot, updateDoc, increment } from "firebase/firestore";

// Firebase Storage
import { getStorage } from "firebase/storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("🔧 Firebase configuration loaded:", {
  hasApiKey: !!firebaseConfig.apiKey,
  apiKeyLength: firebaseConfig.apiKey?.length,
  apiKeyPreview: firebaseConfig.apiKey?.substring(0, 20) + "...",
  hasProjectId: !!firebaseConfig.projectId,
  projectId: firebaseConfig.projectId,
  hasAppId: !!firebaseConfig.appId,
  appIdPreview: firebaseConfig.appId?.substring(0, 20) + "...",
  authDomain: firebaseConfig.authDomain
});

// Validate API key format
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.length < 30) {
  console.error("❌ Invalid Firebase API key - should be 39+ characters");
}
if (!firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error("❌ Missing Firebase project ID or app ID");
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  // If app already initialized, get the existing app
  if (error.code === 'app/duplicate-app') {
    app = initializeApp(firebaseConfig, 'secondary');
  } else {
    throw error;
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Debug storage configuration
console.log('🔥 Firebase Storage initialized:', {
  bucket: storage.app.options.storageBucket,
  appName: storage.app.name,
  projectId: storage.app.options.projectId
});

// Auth functions
export const signUpUser = async (fullName: string, email: string, password: string) => {
  try {
    console.log("🔄 Starting signup process...");
    console.log("Firebase config check:", {
      hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
      hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      hasAppId: !!import.meta.env.VITE_FIREBASE_APP_ID,
      apiKeyPreview: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + "...",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID?.substring(0, 15) + "..."
    });

    // Create user with email and password
    console.log("📝 Creating user account...");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("🎉 User account created:", user.uid);

    // Send custom SoarTV verification email
    console.log("📧 Sending custom SoarTV verification email...");
    try {
      // Generate custom verification link
      const actionCodeSettings = {
        url: `${window.location.origin}/login?verified=true`,
        handleCodeInApp: false,
      };
      
      // Get Firebase verification link
      const verificationLink = await sendEmailVerification(user, actionCodeSettings);
      
      // Send custom branded email via API
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userName: fullName,
          userId: user.uid
        })
      });
      
      if (response.ok) {
        console.log("✅ Custom SoarTV verification email sent to:", email);
      } else {
        // Fallback to Firebase default if custom email fails
        console.log("⚠️ Custom email failed, using Firebase default");
        await sendEmailVerification(user, actionCodeSettings);
      }
    } catch (error) {
      console.error("⚠️ Custom email error, using Firebase fallback:", error);
      await sendEmailVerification(user);
    }

    // Save extra info to Firestore
    console.log("💾 Saving user data to Firestore...");
    await setDoc(doc(db, "users", user.uid), {
      fullName: fullName,
      email: email,
      createdAt: new Date().toISOString(),
      emailVerified: false
    });

    console.log("✅ User registered and data saved:", user.uid);
    
    // Return the user object - this ensures the promise resolves correctly
    return user;

  } catch (error: any) {
    console.error("❌ Signup error details:", {
      code: error.code,
      message: error.message,
      customData: error.customData,
      fullError: error
    });
    throw error;
  }
};

// Legacy function name for compatibility
export const createUser = signUpUser;

export const signInUser = async (email: string, password: string) => {
  try {
    console.log("🔄 Starting sign-in process...");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ User signed in successfully:", userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error("❌ Sign-in error details:", {
      code: error.code,
      message: error.message,
      customData: error.customData
    });
    throw error;
  }
};

// Alternative function name for convenience
export const signIn = async (email: string, password: string) => {
  return signInUser(email, password);
};

// Google Sign-In
export const signInWithGoogle = async () => {
  try {
    console.log("🔄 Starting Google sign-in...");
    const provider = new GoogleAuthProvider();
    
    // Optional: Add scopes for additional user info
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    console.log("✅ Google sign-in successful:", user.uid);
    
    // Save user info to Firestore if it's their first time
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // First time user - save their info
        await setDoc(userDocRef, {
          fullName: user.displayName || "Google User",
          email: user.email,
          createdAt: new Date().toISOString(),
          emailVerified: user.emailVerified,
          provider: "google",
          photoURL: user.photoURL
        });
        console.log("👤 New Google user profile created");
      } else {
        console.log("👤 Returning Google user");
      }
    } catch (firestoreError) {
      console.error("⚠️ Error saving Google user data:", firestoreError);
      // Don't throw error - authentication was successful
    }
    
    return user;
    
  } catch (error: any) {
    console.error("❌ Google sign-in error:", {
      code: error.code,
      message: error.message,
      customData: error.customData
    });
    
    // Handle specific Google sign-in errors
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by your browser');
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with this email address');
    }
    
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Firestore functions
export const saveUserPreferences = async (userId: string, preferences: any) => {
  try {
    // Minimal data structure for faster save
    const userData = {
      uid: userId,
      name: preferences.name,
      role: preferences.role || [],
      genres: preferences.genres || [],
      bio: preferences.bio || '',
      portfolioLinks: preferences.portfolioLinks || [],
      updatedAt: preferences.updatedAt || new Date().toISOString()
    };
    
    // Fast save with merge option
    await setDoc(doc(db, "users", userId), userData, { merge: true });
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

export const getUserPreferences = async (userId: string) => {
  try {
    // Check cache first for faster loading
    const cacheKey = `user_profile_${userId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Use cache if less than 5 minutes old
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        console.log('📱 Using cached user profile');
        return data;
      }
    }

    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      return data;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error("Error getting user profile:", error);
    // Try to return cached data as fallback
    const cacheKey = `user_profile_${userId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data } = JSON.parse(cached);
      console.log('📱 Using cached profile due to offline mode');
      return data;
    }
    
    if (error.code === 'unavailable' || error.code === 'failed-precondition') {
      console.log("🔄 Firebase temporarily unavailable, returning null");
      return null;
    }
    return null;
  }
};

// Project management functions
export const saveProjectData = async (projectData: any) => {
  try {
    const projectRef = await addDoc(collection(db, "projects"), {
      ...projectData,
      public: true, // Default to public for user content visibility
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log("✅ Project saved to Firestore with ID:", projectRef.id);
    return projectRef.id;
  } catch (error) {
    console.error("Error saving project:", error);
    throw error;
  }
};

export const getUserProjects = async (userId: string) => {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 8000)
    );
    
    const q = query(
      collection(db, "projects"), 
      where("uploadedBy", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await Promise.race([getDocs(q), timeoutPromise]);
    return (querySnapshot as any).docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting user projects:", error);
    return []; // Return empty array instead of throwing
  }
};

export const getAllProjects = async () => {
  try {
    // Check cache first
    const cacheKey = 'all_projects';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Use cache if less than 2 minutes old
      if (Date.now() - timestamp < 2 * 60 * 1000) {
        console.log('📱 Using cached projects');
        return data;
      }
    }

    const q = query(
      collection(db, "projects"), 
      orderBy("createdAt", "desc"),
      limit(50) // Limit to prevent slow queries
    );
    const querySnapshot = await getDocs(q);
    const projects = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify({
      data: projects,
      timestamp: Date.now()
    }));

    return projects;
  } catch (error: any) {
    console.error("Error getting all projects:", error);
    
    // Try to return cached data as fallback
    const cacheKey = 'all_projects';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data } = JSON.parse(cached);
      console.log('📱 Using cached projects due to offline mode');
      return data;
    }
    
    if (error.code === 'unavailable' || error.code === 'failed-precondition') {
      console.log("🔄 Firebase temporarily unavailable, returning empty array");
      return [];
    }
    return [];
  }
};

// Social feed functions
export const createPost = async (postData: any) => {
  try {
    const postRef = await addDoc(collection(db, "posts"), {
      ...postData,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log("✅ Post created with ID:", postRef.id);
    return postRef.id;
  } catch (error: any) {
    console.error("Error creating post:", error);
    // Don't throw error if it's a connectivity issue
    if (error.code === 'unavailable' || error.code === 'failed-precondition') {
      console.log('🔄 Post will retry when connection is restored');
      throw new Error('Connection temporarily unavailable');
    }
    throw error;
  }
};

export const getAllPosts = async () => {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 8000)
    );
    
    const q = query(
      collection(db, "posts"), 
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await Promise.race([getDocs(q), timeoutPromise]);
    return (querySnapshot as any).docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting all posts:", error);
    return []; // Return empty array instead of throwing
  }
};

export const createProjectPost = async (projectId: string, projectData: any, userId: string) => {
  try {
    // Only create social posts for public projects
    if (projectData.visibility === 'private') {
      console.log('🔒 Private project - skipping social post creation');
      return null;
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Post creation timeout')), 10000)
    );

    const postCreationPromise = async () => {
      const postData = {
        type: "project",
        userId: userId,
        content: `Just uploaded a new ${projectData.genre} film: "${projectData.title}"`,
        projectId: projectId,
        projectData: projectData,
        createdAt: new Date().toISOString()
      };
      
      return await createPost(postData);
    };

    const result = await Promise.race([postCreationPromise(), timeoutPromise]);
    console.log('✅ Project post created successfully');
    return result;
  } catch (error: any) {
    console.error("Error creating project post:", error);
    
    // Handle specific error types gracefully
    if (error.message === 'Post creation timeout') {
      console.log('⏳ Post creation timed out, but project upload succeeded');
    } else if (error.code === 'unavailable') {
      console.log('🔄 Firebase temporarily unavailable for post creation');
    }
    
    // Don't throw - let upload succeed even if post creation fails
    return null;
  }
};

// Recommendation engine functions
// Tag-based recommendation function
export const fetchRecommendedProjects = async (currentTags: string[]) => {
  try {
    const projectsRef = collection(db, "projects");
    const q = query(
      projectsRef, 
      where("tags", "array-contains-any", currentTags), 
      where("public", "==", true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error: any) {
    console.error("Error fetching recommended projects:", error);
    // Gracefully handle offline errors
    if (error.code === 'unavailable' || error.code === 'failed-precondition') {
      console.log("🔄 Firebase temporarily unavailable for recommendations");
    }
    return [];
  }
};

export const getUserRecommendations = async (userId: string) => {
  try {
    // Get current user's profile
    const userProfile = await getUserPreferences(userId);
    if (!userProfile) {
      console.log("🔄 No user profile available for recommendations");
      return { users: [], projects: [] };
    }

    // Get all users and projects for matching
    const [allUsers, allProjects] = await Promise.all([
      getAllUsers(),
      getAllProjects()
    ]);

    // Filter out current user's own data
    const otherUsers = allUsers.filter((user: any) => user.uid !== userId);
    const otherProjects = allProjects.filter((project: any) => project.uploadedBy !== userId);

    // Calculate user recommendations (potential collaborators)
    const userRecommendations = otherUsers.map((otherUser: any) => {
      const matchScore = calculateUserCompatibility(userProfile, otherUser);
      const matchReasons = getUserMatchReasons(userProfile, otherUser);
      
      return {
        ...otherUser,
        matchScore,
        matchReasons,
        projects: allProjects.filter((p: any) => p.uploadedBy === otherUser.uid)
      };
    }).filter((user: any) => user.matchScore > 30) // Only show meaningful matches
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 12); // Limit to top 12

    // Enhanced project recommendations using tag-based matching
    const userGenres = userProfile.favoriteGenres || userProfile.genres || [];
    const tagBasedProjects = userGenres.length > 0 ? 
      await fetchRecommendedProjects(userGenres) : [];
    
    // Combine tag-based and compatibility-based recommendations
    const allCandidateProjects = [
      ...otherProjects,
      ...tagBasedProjects.filter((tagProject: any) => 
        !otherProjects.some((existing: any) => existing.id === tagProject.id)
      )
    ];

    const projectRecommendations = await Promise.all(
      allCandidateProjects.map(async (project: any) => {
        const matchScore = calculateProjectCompatibility(userProfile, project);
        const matchReasons = getProjectMatchReasons(userProfile, project);
        
        // Get uploader data
        const uploaderData = await getUserPreferences(project.uploadedBy);
        
        return {
          ...project,
          matchScore,
          matchReasons,
          uploaderData: uploaderData || { name: 'Unknown User', role: 'Filmmaker' }
        };
      })
    );

    const filteredProjectRecommendations = projectRecommendations
      .filter((project: any) => project.matchScore > 30)
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 12);

    return {
      users: userRecommendations,
      projects: filteredProjectRecommendations
    };
  } catch (error: any) {
    console.error("Error loading recommendations:", error);
    // Gracefully handle offline errors without throwing
    if (error.code === 'unavailable' || error.code === 'failed-precondition') {
      console.log("🔄 Firebase temporarily unavailable for recommendations");
    }
    return { users: [], projects: [] };
  }
};

const calculateUserCompatibility = (userProfile: any, otherUser: any): number => {
  let score = 0;
  const factors = [];

  // Genre overlap (30 points max)
  const userGenres = userProfile.genres || [];
  const otherGenres = otherUser.genres || [];
  const genreOverlap = userGenres.filter((genre: string) => otherGenres.includes(genre));
  const genreScore = Math.min((genreOverlap.length / Math.max(userGenres.length, 1)) * 30, 30);
  score += genreScore;

  // Role compatibility (40 points max)
  const roleCompatibility = getRoleCompatibilityScore(userProfile.role, otherUser.role);
  score += roleCompatibility;

  // Activity level (15 points max)
  const otherUserProjects = otherUser.projects || [];
  const activityScore = Math.min(otherUserProjects.length * 3, 15);
  score += activityScore;

  // Profile completeness (15 points max)
  let completenessScore = 0;
  if (otherUser.bio && otherUser.bio.length > 50) completenessScore += 5;
  if (otherUser.profileImageURL) completenessScore += 5;
  if (otherUser.portfolioLinks && otherUser.portfolioLinks.length > 0) completenessScore += 5;
  score += completenessScore;

  return Math.round(Math.min(score, 100));
};

const calculateProjectCompatibility = (userProfile: any, project: any): number => {
  let score = 0;

  // Genre match (40 points max)
  const userGenres = userProfile.genres || [];
  if (userGenres.includes(project.genre)) score += 40;

  // Tag overlap (30 points max)
  const projectTags = project.tags || [];
  const tagOverlap = userGenres.filter((genre: string) => projectTags.includes(genre));
  score += Math.min(tagOverlap.length * 10, 30);

  // Recent activity bonus (20 points max)
  const projectAge = Date.now() - new Date(project.createdAt).getTime();
  const daysSinceUpload = projectAge / (1000 * 60 * 60 * 24);
  if (daysSinceUpload < 7) score += 20;
  else if (daysSinceUpload < 30) score += 10;

  // Quality indicators (10 points max)
  if (project.description && project.description.length > 100) score += 5;
  if (project.posterURL) score += 5;

  return Math.round(Math.min(score, 100));
};

const getRoleCompatibilityScore = (userRole: string, otherRole: string): number => {
  const collaborationMatrix: { [key: string]: { [key: string]: number } } = {
    'Director': { 'Actor': 35, 'Cinematographer': 30, 'Editor': 25, 'Producer': 30, 'Writer': 25 },
    'Actor': { 'Director': 35, 'Cinematographer': 20, 'Editor': 15, 'Producer': 20, 'Writer': 15 },
    'Cinematographer': { 'Director': 30, 'Actor': 20, 'Editor': 25, 'Producer': 20, 'Writer': 15 },
    'Editor': { 'Director': 25, 'Actor': 15, 'Cinematographer': 25, 'Producer': 20, 'Writer': 20 },
    'Producer': { 'Director': 30, 'Actor': 20, 'Cinematographer': 20, 'Editor': 20, 'Writer': 25 },
    'Writer': { 'Director': 25, 'Actor': 15, 'Cinematographer': 15, 'Editor': 20, 'Producer': 25 }
  };

  return collaborationMatrix[userRole]?.[otherRole] || 10;
};

const getUserMatchReasons = (userProfile: any, otherUser: any): string[] => {
  const reasons = [];
  
  const userGenres = userProfile.genres || [];
  const otherGenres = otherUser.genres || [];
  const genreOverlap = userGenres.filter((genre: string) => otherGenres.includes(genre));
  
  if (genreOverlap.length > 0) {
    reasons.push(`Both interested in ${genreOverlap[0]}`);
  }
  
  const compatibility = getRoleCompatibilityScore(userProfile.role, otherUser.role);
  if (compatibility > 25) {
    reasons.push(`${userProfile.role} + ${otherUser.role} collaboration`);
  }
  
  const otherUserProjects = otherUser.projects || [];
  if (otherUserProjects.length > 2) {
    reasons.push('Active filmmaker with multiple projects');
  }
  
  if (otherUser.bio && otherUser.bio.length > 50) {
    reasons.push('Detailed profile and experience');
  }

  return reasons;
};

const getProjectMatchReasons = (userProfile: any, project: any): string[] => {
  const reasons = [];
  
  const userGenres = userProfile.genres || [];
  if (userGenres.includes(project.genre)) {
    reasons.push(`Matches your ${project.genre} interest`);
  }
  
  const projectTags = project.tags || [];
  const tagOverlap = userGenres.filter((genre: string) => projectTags.includes(genre));
  if (tagOverlap.length > 0) {
    reasons.push(`Tagged with ${tagOverlap[0]}`);
  }
  
  const projectAge = Date.now() - new Date(project.createdAt).getTime();
  const daysSinceUpload = projectAge / (1000 * 60 * 60 * 24);
  if (daysSinceUpload < 7) {
    reasons.push('Recently uploaded');
  }
  
  if (project.description && project.description.length > 100) {
    reasons.push('Detailed project description');
  }

  return reasons;
};

const getAllUsers = async () => {
  try {
    const q = query(collection(db, "users"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
};

// Browse page functions
export const getBrowseVideos = async (filters: any) => {
  try {
    let q = collection(db, "projects");
    const constraints = [];

    // CRITICAL: Only show public projects to general public
    constraints.push(where("public", "==", true));

    // Apply genre filter
    if (filters.genre) {
      constraints.push(where("genre", "==", filters.genre));
    }

    // Apply sorting
    if (filters.sortBy) {
      const orderDirection = filters.order === 'asc' ? 'asc' : 'desc';
      constraints.push(orderBy(filters.sortBy, orderDirection));
    } else {
      constraints.push(orderBy("createdAt", "desc"));
    }

    const queryRef = query(q, ...constraints);
    const querySnapshot = await getDocs(queryRef);
    
    let videos = querySnapshot.docs.map(doc => {
      const rawData = doc.data();
      return {
        id: doc.id,
        ...rawData,
        // Normalize video URL when retrieving
        videoURL: normalizeVideoURL(rawData.videoURL || ''),
        views: rawData.views || Math.floor(Math.random() * 10000), // Temporary random views
        public: rawData.public !== false // default to true if undefined
      };
    }).filter((project: any) => project.public);

    // Apply search filter (client-side for now)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      videos = videos.filter((video: any) => 
        video.title?.toLowerCase().includes(searchTerm) ||
        video.description?.toLowerCase().includes(searchTerm) ||
        video.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply pagination
    const page = filters.page || 1;
    const pageLimit = filters.limit || 12;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    const paginatedVideos = videos.slice(startIndex, endIndex);

    // Enrich with uploader data
    const enrichedVideos = await Promise.all(
      paginatedVideos.map(async (video: any) => {
        try {
          const uploaderData = await getUserPreferences(video.uploadedBy);
          return {
            ...video,
            uploaderData: uploaderData || { name: 'Unknown User', role: 'Filmmaker' }
          };
        } catch (error) {
          return {
            ...video,
            uploaderData: { name: 'Unknown User', role: 'Filmmaker' }
          };
        }
      })
    );

    return {
      videos: enrichedVideos,
      hasMore: endIndex < videos.length,
      total: videos.length
    };
  } catch (error) {
    console.error("Error getting browse videos:", error);
    return { videos: [], hasMore: false, total: 0 };
  }
};

// Watch page functions
export const getVideoById = async (videoId: string) => {
  try {
    const docRef = doc(db, "projects", videoId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const rawData = docSnap.data();
      const videoData = {
        id: docSnap.id,
        ...rawData,
        // Normalize video URL when retrieving
        videoURL: normalizeVideoURL(rawData.videoURL || ''),
        views: rawData.views || Math.floor(Math.random() * 10000), // Temporary random views
        likes: rawData.likes || Math.floor(Math.random() * 500), // Temporary random likes
      };

      // Get uploader data
      const uploaderData = await getUserPreferences((videoData as any).uploadedBy);
      (videoData as any).uploaderData = uploaderData || { name: 'Unknown User', role: 'Filmmaker' };

      return videoData as any;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting video by ID:", error);
    return null;
  }
};

export const getRelatedVideos = async (currentVideoId: string, genre: string, tags: string[]) => {
  try {
    // Enhanced related videos using tag-based matching
    let relatedVideos: any[] = [];
    
    // First, try to get videos with matching tags using array-contains-any
    if (tags && tags.length > 0) {
      const tagQuery = query(
        collection(db, "projects"),
        where("public", "==", true),
        where("tags", "array-contains-any", tags),
        orderBy("createdAt", "desc")
      );
      
      const tagSnapshot = await getDocs(tagQuery);
      relatedVideos = tagSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        public: doc.data().public !== false
      })).filter((project: any) => project.public && project.id !== currentVideoId);
    }
    
    // If we don't have enough results, fall back to genre matching
    if (relatedVideos.length < 4) {
      const genreQuery = query(
        collection(db, "projects"),
        where("public", "==", true),
        where("genre", "==", genre),
        orderBy("createdAt", "desc")
      );
      
      const genreSnapshot = await getDocs(genreQuery);
      const genreVideos = genreSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        public: doc.data().public !== false
      })).filter((project: any) => project.public && project.id !== currentVideoId);
      
      // Combine and deduplicate
      const combinedVideos = [...relatedVideos];
      genreVideos.forEach(video => {
        if (!combinedVideos.find(existing => existing.id === video.id)) {
          combinedVideos.push(video);
        }
      });
      
      relatedVideos = combinedVideos;
    }
    
    // Normalize video URLs and add random views
    relatedVideos = relatedVideos
      .map(video => ({
        ...video,
        videoURL: normalizeVideoURL(video.videoURL || ''),
        views: video.views || Math.floor(Math.random() * 10000)
      }))
      .slice(0, 8); // Limit to 8 related videos

    // Enrich with uploader data
    const enrichedVideos = await Promise.all(
      relatedVideos.map(async (video: any) => {
        try {
          const uploaderData = await getUserPreferences(video.uploadedBy);
          return {
            ...video,
            uploaderData: uploaderData || { name: 'Unknown User', role: 'Filmmaker' }
          };
        } catch (error) {
          return {
            ...video,
            uploaderData: { name: 'Unknown User', role: 'Filmmaker' }
          };
        }
      })
    );

    return enrichedVideos;
  } catch (error) {
    console.error("Error getting related videos:", error);
    return [];
  }
};

// Video URL normalization function
export const normalizeVideoURL = (videoURL: string): string => {
  if (!videoURL) return '';
  
  // If it's already a proper HTTPS URL (Firebase Storage), return as-is
  if (videoURL.startsWith('https://')) {
    console.log('Video loading:', videoURL);
    return videoURL;
  }
  
  // Handle filesystem paths that start with /@fs/
  if (videoURL.startsWith('/@fs/')) {
    // Extract the filename and convert to web path
    const filename = videoURL.split('/').pop();
    const normalizedURL = `/attached_assets/${filename}`;
    console.log('Video loading:', normalizedURL);
    return normalizedURL;
  }
  
  // Handle paths that don't start with /
  if (!videoURL.startsWith('/')) {
    const normalizedURL = `/attached_assets/${videoURL}`;
    console.log('Video loading:', normalizedURL);
    return normalizedURL;
  }
  
  // For paths that already start with /, ensure they're proper web paths
  if (videoURL.includes('attached_assets') && !videoURL.startsWith('/attached_assets/')) {
    const filename = videoURL.split('/').pop();
    const normalizedURL = `/attached_assets/${filename}`;
    console.log('Video loading:', normalizedURL);
    return normalizedURL;
  }
  
  console.log('Video loading:', videoURL);
  return videoURL;
};

export const incrementVideoViews = async (videoId: string) => {
  try {
    const docRef = doc(db, "projects", videoId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const currentViews = docSnap.data().views || 0;
      await setDoc(docRef, { 
        views: currentViews + 1,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    console.error("Error incrementing video views:", error);
  }
};

// Admin functions
export const getPendingVideos = async () => {
  try {
    const q = query(
      collection(db, "projects"),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      status: doc.data().status || 'pending' // Default to pending if no status
    }));

    // Enrich with uploader data
    const enrichedVideos = await Promise.all(
      videos.map(async (video: any) => {
        try {
          const uploaderData = await getUserPreferences(video.uploadedBy);
          return {
            ...video,
            uploaderData: uploaderData || { name: 'Unknown User', role: 'Filmmaker' }
          };
        } catch (error) {
          return {
            ...video,
            uploaderData: { name: 'Unknown User', role: 'Filmmaker' }
          };
        }
      })
    );

    return enrichedVideos;
  } catch (error) {
    console.error("Error getting pending videos:", error);
    return [];
  }
};

export const approveVideo = async (videoId: string) => {
  try {
    const docRef = doc(db, "projects", videoId);
    await setDoc(docRef, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log("✅ Video approved successfully");
  } catch (error) {
    console.error("Error approving video:", error);
    throw error;
  }
};

export const rejectVideo = async (videoId: string) => {
  try {
    const docRef = doc(db, "projects", videoId);
    await setDoc(docRef, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log("✅ Video rejected successfully");
  } catch (error) {
    console.error("Error rejecting video:", error);
    throw error;
  }
};

export const getFeaturedCreators = async () => {
  try {
    const q = query(collection(db, "featuredCreators"), orderBy("featuredSince", "desc"));
    const querySnapshot = await getDocs(q);
    
    const featuredCreators = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const featuredData = docSnap.data();
        
        // Get creator profile data
        const creatorData = await getUserPreferences(featuredData.userId);
        
        // Get creator's project count and total views
        const projectsQuery = query(
          collection(db, "projects"),
          where("uploadedBy", "==", featuredData.userId),
          where("status", "==", "approved")
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projects = projectsSnapshot.docs.map(doc => doc.data());
        
        const totalViews = projects.reduce((sum: number, project: any) => 
          sum + (project.views || 0), 0);
        
        return {
          uid: featuredData.userId,
          ...creatorData,
          projectCount: projects.length,
          totalViews,
          featuredSince: featuredData.featuredSince
        };
      })
    );

    return featuredCreators;
  } catch (error) {
    console.error("Error getting featured creators:", error);
    return [];
  }
};

export const setFeaturedCreator = async (userId: string) => {
  try {
    const docRef = doc(db, "featuredCreators", userId);
    await setDoc(docRef, {
      userId: userId,
      featuredSince: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    
    console.log("✅ Creator featured successfully");
  } catch (error) {
    console.error("Error featuring creator:", error);
    throw error;
  }
};

export const removeFeaturedCreator = async (userId: string) => {
  try {
    const docRef = doc(db, "featuredCreators", userId);
    await deleteDoc(docRef);
    
    console.log("✅ Creator unfeatured successfully");
  } catch (error) {
    console.error("Error unfeaturing creator:", error);
    throw error;
  }
};

export const getAdminStats = async () => {
  try {
    // Get total videos
    const videosQuery = query(collection(db, "projects"));
    const videosSnapshot = await getDocs(videosQuery);
    const totalVideos = videosSnapshot.size;
    
    // Get pending videos
    const pendingQuery = query(
      collection(db, "projects"),
      where("status", "==", "pending")
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    const pendingVideos = pendingSnapshot.size;
    
    // Get total users
    const usersQuery = query(collection(db, "users"));
    const usersSnapshot = await getDocs(usersQuery);
    const totalUsers = usersSnapshot.size;
    
    // Calculate total views
    const videos = videosSnapshot.docs.map(doc => doc.data());
    const totalViews = videos.reduce((sum: number, video: any) => 
      sum + (video.views || 0), 0);
    
    // Get new users this week (simplified)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsersQuery = query(
      collection(db, "users"),
      where("createdAt", ">=", oneWeekAgo.toISOString())
    );
    const newUsersSnapshot = await getDocs(newUsersQuery);
    const newUsersThisWeek = newUsersSnapshot.size;
    
    // Get new videos this week
    const newVideosQuery = query(
      collection(db, "projects"),
      where("createdAt", ">=", oneWeekAgo.toISOString())
    );
    const newVideosSnapshot = await getDocs(newVideosQuery);
    const newVideosThisWeek = newVideosSnapshot.size;

    return {
      totalVideos,
      pendingVideos,
      totalUsers,
      totalViews,
      newUsersThisWeek,
      newVideosThisWeek
    };
  } catch (error) {
    console.error("Error getting admin stats:", error);
    return {
      totalVideos: 0,
      pendingVideos: 0,
      totalUsers: 0,
      totalViews: 0,
      newUsersThisWeek: 0,
      newVideosThisWeek: 0
    };
  }
};

// Email verification functions
export const sendVerificationEmail = async (user: any) => {
  try {
    await sendEmailVerification(user);
    console.log("📧 Verification email sent!");
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

export const checkEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await user.reload();
      return user.emailVerified;
    }
    return false;
  } catch (error) {
    console.error("Error checking email verification:", error);
    return false;
  }
};

// Fetch projects that match user's favorite genres
export const fetchRecommended = async (userGenres: string[]) => {
  try {
    if (!userGenres || userGenres.length === 0) {
      // If no user genres, return general popular projects
      const q = query(
        collection(db, "projects"),
        where("public", "==", true),
        orderBy("createdAt", "desc"),
        limit(6)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    const q = query(
      collection(db, "projects"),
      where("tags", "array-contains-any", userGenres),
      where("public", "==", true),
      limit(6)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error: any) {
    console.error("Error fetching recommended projects:", error);
    // Gracefully handle offline errors
    if (error.code === 'unavailable' || error.code === 'failed-precondition') {
      console.log('🔄 Firebase temporarily unavailable for recommendations');
    }
    return [];
  }
};

// Project Likes Subcollection Functions
export const likeProject = async (projectId: string, userId: string) => {
  try {
    const likeRef = doc(db, "projects", projectId, "likes", userId);
    await setDoc(likeRef, {
      userId,
      likedAt: serverTimestamp(),
    });
    console.log("✅ Project liked successfully");
    return true;
  } catch (error) {
    console.error("❌ Error liking project:", error);
    throw error;
  }
};

export const unlikeProject = async (projectId: string, userId: string) => {
  try {
    const likeRef = doc(db, "projects", projectId, "likes", userId);
    await deleteDoc(likeRef);
    console.log("✅ Project unliked successfully");
    return true;
  } catch (error) {
    console.error("❌ Error unliking project:", error);
    throw error;
  }
};

export const checkUserLikedProject = async (projectId: string, userId: string) => {
  try {
    const likeRef = doc(db, "projects", projectId, "likes", userId);
    const likeSnap = await getDoc(likeRef);
    return likeSnap.exists();
  } catch (error) {
    console.error("❌ Error checking if user liked project:", error);
    return false;
  }
};

export const getProjectLikesCount = async (projectId: string) => {
  try {
    const likesRef = collection(db, "projects", projectId, "likes");
    const likesSnap = await getDocs(likesRef);
    return likesSnap.size;
  } catch (error) {
    console.error("❌ Error getting project likes count:", error);
    return 0;
  }
};

// Project Comments Subcollection Functions
export const addComment = async (projectId: string, userId: string, text: string) => {
  try {
    const commentsRef = collection(db, "projects", projectId, "comments");
    const commentData = {
      userId,
      text,
      createdAt: new Date(),
    };
    const docRef = await addDoc(commentsRef, commentData);
    console.log("✅ Comment added successfully");
    return { id: docRef.id, ...commentData };
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    throw error;
  }
};

export const getProjectComments = async (projectId: string) => {
  try {
    const commentsRef = collection(db, "projects", projectId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));
    const commentsSnap = await getDocs(q);
    return commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting project comments:", error);
    return [];
  }
};

export const deleteComment = async (projectId: string, commentId: string) => {
  try {
    const commentRef = doc(db, "projects", projectId, "comments", commentId);
    await deleteDoc(commentRef);
    console.log("✅ Comment deleted successfully");
    return true;
  } catch (error) {
    console.error("❌ Error deleting comment:", error);
    throw error;
  }
};

// User Saved Projects Subcollection Functions
export const saveProject = async (userId: string, projectId: string) => {
  try {
    const savedRef = doc(db, "users", userId, "savedProjects", projectId);
    await setDoc(savedRef, {
      projectId,
      savedAt: serverTimestamp(),
    });
    console.log("✅ Project saved successfully");
    return true;
  } catch (error) {
    console.error("❌ Error saving project:", error);
    throw error;
  }
};

export const unsaveProject = async (userId: string, projectId: string) => {
  try {
    const savedRef = doc(db, "users", userId, "savedProjects", projectId);
    await deleteDoc(savedRef);
    console.log("✅ Project unsaved successfully");
    return true;
  } catch (error) {
    console.error("❌ Error unsaving project:", error);
    throw error;
  }
};

export const checkUserSavedProject = async (userId: string, projectId: string) => {
  try {
    const savedRef = doc(db, "users", userId, "savedProjects", projectId);
    const savedSnap = await getDoc(savedRef);
    return savedSnap.exists();
  } catch (error) {
    console.error("❌ Error checking if user saved project:", error);
    return false;
  }
};

export const getUserSavedProjects = async (userId: string) => {
  try {
    const savedRef = collection(db, "users", userId, "savedProjects");
    const q = query(savedRef, orderBy("savedAt", "desc"));
    const savedSnap = await getDocs(q);
    
    // Get the actual project documents
    const projectIds = savedSnap.docs.map(doc => doc.data().projectId);
    const projects = [];
    
    for (const projectId of projectIds) {
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        projects.push({ id: projectSnap.id, ...projectSnap.data() });
      }
    }
    
    return projects;
  } catch (error) {
    console.error("❌ Error getting user saved projects:", error);
    return [];
  }
};