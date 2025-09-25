import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload } from "lucide-react";
import imageCompression from 'browser-image-compression';

interface Project {
  id: string;
  title: string;
  description: string;
  genre?: string;
  posterURL?: string;
  videoURL?: string;
  tags?: string[];
  cast?: string[];
  crew?: string[];
  uploadedBy: string;
  visibility?: 'public' | 'private';
}

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: Project) => void;
}

export default function EditProjectModal({ project, isOpen, onClose, onSave }: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    title: project.title || "",
    description: project.description || "",
    genre: project.genre || "",
    tags: project.tags?.join(", ") || "",
    cast: project.cast?.join(", ") || "",
    crew: project.crew?.join(", ") || "",
    visibility: project.visibility || "private"
  });
  
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const genres = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
    "Mystery", "Romance", "Sci-Fi", "Thriller", "Documentary", "Animation"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, path: string): Promise<string> => {
    let fileToUpload = file;
    
    // Compress images before upload
    if (file.type.startsWith('image/')) {
      const options = {
        maxSizeMB: 0.5, // 500KB max for posters
        maxWidthOrHeight: 800, // 800px max dimension for posters
        useWebWorker: true,
      };
      
      console.log('🔧 Compressing poster image...', 'Original size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      fileToUpload = await imageCompression(file, options);
      console.log('✅ Poster compressed:', 'New size:', (fileToUpload.size / 1024 / 1024).toFixed(2), 'MB');
    }
    
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, fileToUpload);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a project title');
      return;
    }

    setLoading(true);
    try {
      let posterURL = project.posterURL;
      let videoURL = project.videoURL;

      // Upload new poster if provided
      if (posterFile) {
        const posterPath = `projects/${project.uploadedBy}/posters/${Date.now()}_${posterFile.name}`;
        posterURL = await handleFileUpload(posterFile, posterPath);
      }

      // Upload new video if provided
      if (videoFile) {
        const videoPath = `projects/${project.uploadedBy}/videos/${Date.now()}_${videoFile.name}`;
        videoURL = await handleFileUpload(videoFile, videoPath);
      }

      // Prepare updated project data
      const updatedProject: Project = {
        ...project,
        title: formData.title,
        description: formData.description,
        genre: formData.genre,
        posterURL,
        videoURL,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        cast: formData.cast.split(',').map(member => member.trim()).filter(member => member),
        crew: formData.crew.split(',').map(member => member.trim()).filter(member => member),
        visibility: formData.visibility as 'public' | 'private',
        public: formData.visibility === 'public' // Sync public boolean with visibility
      };

      // Prepare data for Firestore update (excluding id)
      const { id, ...updateData } = updatedProject;
      const firestoreData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Update in Firestore
      await updateDoc(doc(db, "projects", project.id), firestoreData);

      console.log('✅ Project updated successfully');
      onSave(updatedProject);
      onClose();
    } catch (error) {
      console.error('❌ Error updating project:', error);
      alert('Failed to update project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-yellow-400">
            Edit Project: {project.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Title */}
          <div>
            <Label className="text-gray-300">Project Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="Enter project title"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-gray-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
              placeholder="Describe your project"
            />
          </div>

          {/* Genre */}
          <div>
            <Label className="text-gray-300">Genre</Label>
            <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre} className="text-white hover:bg-gray-700">
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-gray-300">Tags (comma-separated)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="indie, drama, award-winning"
            />
          </div>

          {/* Cast */}
          <div>
            <Label className="text-gray-300">Cast (comma-separated)</Label>
            <Input
              value={formData.cast}
              onChange={(e) => handleInputChange('cast', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="Actor 1, Actor 2, Actor 3"
            />
          </div>

          {/* Crew */}
          <div>
            <Label className="text-gray-300">Crew (comma-separated)</Label>
            <Input
              value={formData.crew}
              onChange={(e) => handleInputChange('crew', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="Director, Producer, Cinematographer"
            />
          </div>

          {/* Visibility */}
          <div>
            <Label className="text-gray-300">Project Visibility</Label>
            <Select value={formData.visibility} onValueChange={(value) => handleInputChange('visibility', value)}>
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
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Poster Upload */}
            <div>
              <Label className="text-gray-300">Update Poster</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="poster-upload"
                />
                <label
                  htmlFor="poster-upload"
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-yellow-400 transition-colors"
                >
                  <Camera className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">
                    {posterFile ? posterFile.name : 'Choose new poster'}
                  </span>
                </label>
              </div>
            </div>

            {/* Video Upload */}
            <div>
              <Label className="text-gray-300">Update Video</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-yellow-400 transition-colors"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">
                    {videoFile ? videoFile.name : 'Choose new video'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Current Files Info */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-yellow-400 font-medium mb-2">Current Files:</h4>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Poster: {project.posterURL ? '✅ Uploaded' : '❌ No poster'}</p>
              <p>Video: {project.videoURL ? '✅ Uploaded' : '❌ No video'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-yellow-500 text-black hover:bg-yellow-600"
            >
              {loading ? 'Updating...' : 'Save Changes'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}