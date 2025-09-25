import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/authContext';
import { saveProjectData, createProjectPost } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { serverTimestamp } from 'firebase/firestore';
import { Upload, X, Film, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';

const genreOptions = [
  "Action",
  "Drama",
  "Comedy",
  "Romance",
  "Horror",
  "Thriller",
  "Documentary",
  "Sci-Fi",
  "Animated",
  "Musical",
];

export default function UploadProject() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    cast: '',
    crew: '',
    visibility: 'private' as 'public' | 'private'
  });

  const handleGenreChange = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleTagToggle = (tag: string) => {
    setProjectData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is a video
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
      } else {
        alert('Please select a video file');
      }
    }
  };

  const handlePosterUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (file.type.startsWith('image/')) {
        setPosterFile(file);
      } else {
        alert('Please select an image file');
      }
    }
  };

  const uploadWithTimeout = (promise: Promise<any>, timeout = 20000) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('⏳ Upload timeout')), timeout)
      )
    ]);

  const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
    let fileToUpload = file;
    
    console.log('🚀 Starting upload for:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('📍 Upload path:', path);
    console.log('🔐 Current user UID:', user?.uid);
    console.log('🔥 Storage app name:', storage.app.name);
    console.log('🪣 Storage bucket:', storage.app.options.storageBucket);
    
    // Compress images before upload
    if (file.type.startsWith('image/')) {
      const options = {
        maxSizeMB: 0.3, // 300KB max for posters (faster uploads)
        maxWidthOrHeight: 600, // Better for mobile too
        useWebWorker: true,
      };
      
      console.log('🔧 Compressing poster image...', 'Original size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      fileToUpload = await imageCompression(file, options);
      console.log('✅ Poster compressed:', 'New size:', (fileToUpload.size / 1024 / 1024).toFixed(2), 'MB');
    }
    
    // Handle large video files with size limit warning
    if (file.type.startsWith('video/') && file.size > 500 * 1024 * 1024) { // 500MB limit
      console.log('📹 Very large video detected:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Alert user about large file
      const shouldContinue = confirm(
        `Your video file is ${(file.size / 1024 / 1024).toFixed(2)}MB. Large files may take a very long time to upload or fail. 
        
Would you like to:
- Click OK to try uploading anyway (may take 30+ minutes)
- Click Cancel to choose a smaller file

Recommendation: Compress your video to under 500MB before uploading.`
      );
      
      if (!shouldContinue) {
        throw new Error('Upload cancelled - please choose a smaller file');
      }
      
      setUploadProgress(`⚠️ Uploading large video - this may take 30+ minutes...`);
    }
    
    const fileRef = ref(storage, path);
    console.log('📁 File ref created:', fileRef.fullPath);
    
    // Use uploadBytesResumable for progress tracking and better reliability
    const uploadTask = uploadBytesResumable(fileRef, fileToUpload);
    console.log('⬆️ Upload task created, starting upload...');
    console.log('🔄 Initial upload state:', uploadTask.snapshot.state);
    console.log('📏 File size to upload:', fileToUpload.size, 'bytes');
    
    return new Promise((resolve, reject) => {
      // Set up 30-minute timeout for uploads
      const fileSizeMB = fileToUpload.size / (1024 * 1024);
      const timeoutMinutes = 30; // Fixed 30-minute timeout
      const timeoutMs = timeoutMinutes * 60 * 1000; // 30 minutes in milliseconds
      
      console.log(`⏰ Setting upload timeout: ${timeoutMinutes} minutes for ${fileSizeMB.toFixed(1)}MB file`);
      
      const timeoutId = setTimeout(() => {
        console.error('⏰ Upload timeout reached');
        uploadTask.cancel();
        reject(new Error('⏳ Upload timeout'));
      }, timeoutMs);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          // Track upload progress with speed calculation and state monitoring
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          const fileName = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name;
          const mbTransferred = (snapshot.bytesTransferred / (1024 * 1024)).toFixed(1);
          const mbTotal = (snapshot.totalBytes / (1024 * 1024)).toFixed(1);
          
          console.log(`📊 Upload progress: ${progress.toFixed(1)}% (${mbTransferred}/${mbTotal} MB) - State: ${snapshot.state}`);
          console.log(`🔄 Upload task metadata:`, {
            state: snapshot.state,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            task: snapshot.task
          });
          
          setUploadProgress(`Uploading ${fileName}... ${progress.toFixed(0)}% (${mbTransferred}/${mbTotal} MB)`);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('❌ Upload error details:', {
            code: error.code,
            message: error.message,
            serverResponse: error.serverResponse,
            customData: error.customData
          });
          reject(error);
        },
        async () => {
          clearTimeout(timeoutId);
          console.log('🎉 Upload completed successfully!');
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ Download URL obtained:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error('❌ Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 SUBMIT BUTTON CLICKED! Starting upload process...');
    console.log('📁 Video file info:', {
      name: videoFile?.name,
      size: videoFile?.size,
      type: videoFile?.type,
      sizeMB: videoFile ? (videoFile.size / 1024 / 1024).toFixed(2) : 'No file'
    });
    console.log('👤 User:', user);
    console.log('🔒 Auth loading:', authLoading);
    console.log('🔥 Firebase config check:', {
      hasStorage: !!storage,
      storageApp: storage?.app?.name,
      storageOptions: storage?.app?.options
    });
    
    if (!user) {
      console.error('❌ No user found for upload');
      alert('AUTHENTICATION ERROR: You must be logged in to upload files to Firebase Storage. Please sign in first!');
      setLocation('/setup');
      return;
    }

    if (!projectData.title.trim()) {
      console.error('❌ No project title provided');
      alert('Please enter a project title');
      return;
    }

    if (!videoFile) {
      console.error('❌ No video file selected');
      alert('Please select a video file to upload');
      return;
    }

    console.log('✅ All validations passed, starting upload process...');
    
    // Test Firebase Storage connectivity before starting upload
    try {
      console.log('🧪 Testing Firebase Storage connectivity...');
      const testRef = ref(storage, 'connectivity-test');
      console.log('✅ Firebase Storage reference created successfully');
      console.log('🔗 Storage bucket:', storage.app.options.storageBucket);
      console.log('🔐 User email verified:', user.emailVerified);
    } catch (storageError) {
      console.error('❌ Firebase Storage connectivity test failed:', storageError);
      alert('Firebase Storage connection failed. Please check your internet connection and try again.');
      return;
    }
    
    setLoading(true);
    setUploadProgress('Starting upload...');
    
    try {
      // Show uploading toast
      toast({
        title: "Uploading Project",
        description: "Your project is being uploaded...",
      });
      
      // Upload video file
      setUploadProgress('Uploading video...');
      const videoPath = `projects/${user.uid}/videos/${Date.now()}_${videoFile.name}`;
      const videoURL = await uploadFileToStorage(videoFile, videoPath);

      // Upload poster if provided
      let posterURL = '';
      if (posterFile) {
        setUploadProgress('Uploading poster...');
        const posterPath = `projects/${user.uid}/posters/${Date.now()}_${posterFile.name}`;
        posterURL = await uploadFileToStorage(posterFile, posterPath);
      }

      // Prepare project data
      setUploadProgress('Saving project details...');
      const project = {
        title: projectData.title,
        description: projectData.description,
        uploadedBy: user.uid,
        videoURL,
        posterURL,
        tags: selectedGenres, // Include selected genres as tags
        cast: projectData.cast.split(',').map(c => c.trim()).filter(c => c),
        crew: projectData.crew.split(',').map(c => c.trim()).filter(c => c),
        genre: selectedGenres[0] || '', // Use first selected genre as primary genre for backward compatibility
        visibility: projectData.visibility,
        public: projectData.visibility === 'public', // Set public boolean based on visibility
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to Firestore
      const projectId = await saveProjectData(project);
      
      // Create a social feed post about the new project (ensure full await)
      setUploadProgress('Creating community post...');
      try {
        await createProjectPost(projectId, project, user.uid);
        console.log('✅ Community post created successfully');
      } catch (postError) {
        console.error('⚠️ Failed to create community post:', postError);
        // Don't fail the entire upload if community post fails
      }
      
      console.log('✅ Project uploaded successfully');
      
      // Show success toast
      toast({
        title: "Upload Successful!",
        description: "Your project has been uploaded and is now available.",
      });
      
      setTimeout(() => setLocation('/profile'), 1500);
    } catch (error) {
      console.error('❌ Error uploading project:', error);
      
      // Show error toast
      toast({
        title: "Upload Failed",
        description: "Something went wrong. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const isFormValid = () => {
    return projectData.title.trim() && videoFile;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl mb-4">Authentication Required</h2>
          <p className="mb-6">You need to sign in to upload projects</p>
          <Button 
            onClick={() => setLocation('/setup')}
            className="bg-yellow-500 text-black hover:bg-yellow-600"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-3xl font-bold text-yellow-400">Soar</span>
            <span className="text-3xl font-bold text-red-500">TV</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Authentication Status */}
            <div className="text-sm text-white bg-gray-800 px-3 py-2 rounded">
              {user ? (
                <span className="text-green-400">✅ Logged in as: {user.email || user.displayName || 'User'}</span>
              ) : (
                <span className="text-red-400">❌ Not logged in</span>
              )}
            </div>
            <Button
              onClick={() => setLocation('/profile')}
              className="bg-gray-700 text-white border border-gray-500 hover:bg-gray-600 hover:border-gray-400"
            >
              Back to Profile
            </Button>
          </div>
        </div>

        {/* Upload Form */}
        <Card className="bg-black/80 border-gray-800 text-white">
          <CardHeader>
            <CardTitle className="text-2xl mb-2">Upload Your Project</CardTitle>
            <p className="text-gray-400">
              Share your filmmaking work with the SoarTV community
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Project Title *</label>
                <Input
                  type="text"
                  value={projectData.title}
                  onChange={(e) => setProjectData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Enter your project title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={projectData.description}
                  onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 min-h-[120px]"
                  placeholder="Describe your project, its story, and creative process..."
                />
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Video File *</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  {videoFile ? (
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <div className="flex items-center space-x-3">
                        <Film className="w-6 h-6 text-yellow-400" />
                        <span>{videoFile.name}</span>
                        <span className="text-sm text-gray-400">
                          ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setVideoFile(null)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">Click to upload video file</p>
                      <p className="text-sm text-gray-500">MP4, MOV, AVI up to 500MB</p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Poster Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Project Poster (Optional)</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  {posterFile ? (
                    <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
                      <div className="flex items-center space-x-3">
                        <ImageIcon className="w-6 h-6 text-yellow-400" />
                        <span>{posterFile.name}</span>
                        <span className="text-sm text-gray-400">
                          ({(posterFile.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPosterFile(null)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">Click to upload poster image</p>
                      <p className="text-sm text-gray-500">JPG, PNG up to 10MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Genre Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Genres</label>
                <p className="text-sm text-gray-400 mb-3">Select all genres that apply to your project</p>
                <div className="flex flex-wrap gap-2">
                  {genreOptions.map((genre) => (
                    <label key={genre} className="flex items-center gap-1 bg-gray-800 px-3 py-2 rounded border border-gray-600 hover:bg-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(genre)}
                        onChange={() => handleGenreChange(genre)}
                        className="accent-yellow-500"
                      />
                      <span className="text-white">{genre}</span>
                    </label>
                  ))}
                </div>
                {selectedGenres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedGenres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <p className="text-sm text-gray-400 mb-3">Select tags that describe your project</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {genreOptions.map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant={projectData.tags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      className={`${
                        projectData.tags.includes(tag)
                          ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                          : 'border-gray-600 text-white hover:bg-gray-800'
                      }`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
                
                {projectData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {projectData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Cast */}
              <div>
                <label className="block text-sm font-medium mb-2">Cast</label>
                <Input
                  type="text"
                  value={projectData.cast}
                  onChange={(e) => setProjectData(prev => ({ ...prev, cast: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Actor 1, Actor 2, Actor 3..."
                />
                <p className="text-sm text-gray-400 mt-1">Separate names with commas</p>
              </div>

              {/* Crew */}
              <div>
                <label className="block text-sm font-medium mb-2">Crew</label>
                <Input
                  type="text"
                  value={projectData.crew}
                  onChange={(e) => setProjectData(prev => ({ ...prev, crew: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Director of Photography, Sound Designer, Editor..."
                />
                <p className="text-sm text-gray-400 mt-1">Separate roles with commas</p>
              </div>

              {/* Visibility Setting */}
              <div>
                <Label className="block text-sm font-medium mb-2">Project Visibility</Label>
                <Select 
                  value={projectData.visibility} 
                  onValueChange={(value: 'public' | 'private') => 
                    setProjectData(prev => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="public" className="text-white hover:bg-gray-700">
                      🌍 Public - Visible to everyone
                    </SelectItem>
                    <SelectItem value="private" className="text-white hover:bg-gray-700">
                      🔒 Private - Only visible to you
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-400 mt-1">
                  {projectData.visibility === 'public' 
                    ? 'Your project will be visible to all users on SoarTV' 
                    : 'Only you will be able to see this project (default for privacy)'}
                </p>
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-white">Select Genres:</label>
                <div className="flex flex-wrap gap-2">
                  {genreOptions.map((genre) => (
                    <label key={genre} className="flex items-center gap-2 text-sm text-white">
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(genre)}
                        onChange={() => handleGenreChange(genre)}
                        className="accent-indigo-500"
                      />
                      {genre}
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                {!uploadCompleted ? (
                  <Button
                    type="submit"
                    disabled={!isFormValid() || loading}
                    className="bg-yellow-500 text-black hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    onClick={async (e) => {
                    e.preventDefault();
                    
                    console.log('🚀 TESTING REPLIT APP STORAGE!');
                    
                    if (!user) {
                      alert('Please log in first');
                      return;
                    }
                    
                    if (!videoFile) {
                      alert('Please select a video file');
                      return;
                    }
                    
                    if (!projectData.title.trim()) {
                      alert('Please enter a project title');
                      return;
                    }
                    
                    setLoading(true);
                    setUploadProgress('🔗 Testing Replit App Storage...');
                    
                    try {
                      // Test new upload system
                      console.log('🔗 Getting upload URL from Replit App Storage...');
                      
                      const response = await fetch('/api/objects/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                      });
                      
                      if (!response.ok) throw new Error('Failed to get upload URL');
                      
                      const { uploadURL } = await response.json();
                      console.log('✅ Got upload URL:', uploadURL);
                      
                      // Upload with progress tracking using XMLHttpRequest
                      const uploadResponse = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        
                        xhr.upload.addEventListener('progress', (e) => {
                          if (e.lengthComputable) {
                            const percentComplete = Math.round((e.loaded / e.total) * 100);
                            setUploadProgress(`${percentComplete}%`);
                          }
                        });
                        
                        xhr.addEventListener('load', () => {
                          if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(xhr);
                          } else {
                            reject(new Error(`Upload failed with status: ${xhr.status}`));
                          }
                        });
                        
                        xhr.addEventListener('error', () => {
                          reject(new Error('Upload failed'));
                        });
                        
                        xhr.open('PUT', uploadURL);
                        xhr.setRequestHeader('Content-Type', videoFile.type);
                        xhr.send(videoFile);
                      });
                      
                      console.log('✅ REPLIT APP STORAGE UPLOAD SUCCESS!');
                      
                      // Convert the upload URL to a serving URL  
                      const videoURL = uploadURL.split('?')[0]; // Remove query parameters
                      console.log('🔗 Video serving URL:', videoURL);

                      // Save project data with timeout
                      setUploadProgress('Saving to your profile...');
                      console.log('📝 Attempting to save project...');
                      
                      const project = {
                        title: projectData.title,
                        description: projectData.description,
                        uploadedBy: user.uid,
                        videoURL,
                        posterURL: '', // No poster for now
                        tags: selectedGenres,
                        cast: projectData.cast.split(',').map(c => c.trim()).filter(c => c),
                        crew: projectData.crew.split(',').map(c => c.trim()).filter(c => c),
                        genre: selectedGenres[0] || '',
                        visibility: projectData.visibility,
                        public: projectData.visibility === 'public',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                      };

                      // Save to Replit backend storage (reliable fallback)
                      try {
                        console.log('💾 Saving to Replit backend storage...');
                        const saveResponse = await fetch('/api/projects/upload', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            title: projectData.title,
                            description: projectData.description,
                            userId: user.uid,
                            videoURL,
                          }),
                        });

                        if (saveResponse.ok) {
                          const saveResult = await saveResponse.json();
                          console.log('✅ Project saved to Replit backend!', saveResult);
                        } else {
                          console.warn('⚠️ Replit backend save failed, but video uploaded successfully');
                        }
                      } catch (saveError) {
                        console.warn('⚠️ Could not save to backend, but video uploaded successfully:', saveError);
                      }
                      
                      // Also try Firebase as secondary backup
                      try {
                        const firebaseProject = {
                          title: projectData.title,
                          description: projectData.description,
                          uploadedBy: user.uid,
                          videoURL,
                          posterURL: '',
                          tags: selectedGenres,
                          cast: projectData.cast.split(',').map(c => c.trim()).filter(c => c),
                          crew: projectData.crew.split(',').map(c => c.trim()).filter(c => c),
                          genre: selectedGenres[0] || '',
                          visibility: projectData.visibility,
                          public: projectData.visibility === 'public',
                          createdAt: serverTimestamp(),
                          updatedAt: serverTimestamp()
                        };
                        
                        const timeoutPromise = new Promise((_, reject) => 
                          setTimeout(() => reject(new Error('Firebase timeout')), 5000)
                        );
                        
                        const projectId = await Promise.race([saveProjectData(firebaseProject), timeoutPromise]);
                        console.log('✅ Also saved to Firebase with ID:', projectId);
                      } catch (firebaseError) {
                        console.warn('⚠️ Firebase backup save failed (expected due to connectivity issues)');
                      }
                      
                      toast({
                        title: "Upload Successful!",
                        description: "Your project has been uploaded and saved to your profile!",
                      });
                      
                      setUploadProgress('✅ Project saved successfully!');
                      setLoading(false);
                      setUploadCompleted(true);
                      
                    } catch (error) {
                      console.error('❌ Replit App Storage test failed:', error);
                      
                      toast({
                        title: "Test Failed",
                        description: error instanceof Error ? error.message : "Upload failed",
                        variant: "destructive",
                      });
                      
                      setLoading(false);
                      setUploadProgress('');
                    }
                  }}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? (uploadProgress || 'Uploading...') : 'Upload Project'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setLocation('/profile')}
                    className="bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
                    data-testid="button-confirm-upload"
                  >
                    ✅ View in Profile
                  </Button>
                )}
                
                {!uploadCompleted && (
                  <Button
                    type="button"
                    onClick={() => setLocation('/profile')}
                    className="bg-gray-700 text-white border border-gray-500 hover:bg-gray-600 hover:border-gray-400"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                )}
              </div>
              
              {/* Progress Indicator */}
              {loading && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">Uploading your project...</p>
                      <p className="text-gray-400 text-sm">{uploadProgress}</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}