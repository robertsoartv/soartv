import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Sample video data for production
const sampleVideos = [
  {
    id: 1,
    title: "My Name Is Lola",
    description: "A heartwarming story about self-discovery, love, and finding your true voice. Follow Lola's journey as she navigates life, love, and the pursuit of her dreams.",
    thumbnailUrl: "/attached_assets/95EEC8AE-407A-46F9-B80E-EEE859F4465F_1753202512174.JPEG",
    thumbnail: "/attached_assets/95EEC8AE-407A-46F9-B80E-EEE859F4465F_1753202512174.JPEG",
    videoUrl: "https://www.youtube.com/watch?v=r38DH6uHdpE&t=2s",
    duration: "1:58:45",
    views: "2.3M views",
    category: "Drama",
    rating: 8.7,
    year: 2024,
    type: "movie"
  },
  {
    id: 2,
    title: "Wicked",
    description: "Everyone deserves a chance to fly. The untold story of the witches of Oz - a stunning musical about friendship, destiny, and defying gravity.",
    thumbnailUrl: "/wicked-poster.avif",
    thumbnail: "/wicked-poster.avif",
    videoUrl: "/wicked-trailer.mp4",
    duration: "2:40:15",
    views: "3.8M views",
    category: "Musical",
    rating: 9.2,
    year: 2024,
    type: "movie"
  },
  {
    id: 3,
    title: "Soul Damage",
    description: "A gripping psychological thriller that explores the depths of human consciousness and the price of ambition.",
    thumbnailUrl: "/attached_assets/613kJUhqglL._SY522_-2_1753207112697.jpg",
    thumbnail: "/attached_assets/613kJUhqglL._SY522_-2_1753207112697.jpg",
    videoUrl: "https://www.youtube.com/watch?v=5pL8M7g6KfU",
    duration: "2:15:30",
    views: "1.2M views",
    category: "Thriller",
    rating: 8.4,
    year: 2024,
    type: "movie"
  },
  {
    id: 4,
    title: "From Darkness to Light!",
    description: "An inspiring true story of resilience and redemption. Follow one person's extraordinary journey from the depths of despair to finding purpose, hope, and the strength to transform not only their own life but the lives of others.",
    thumbnailUrl: "/attached_assets/Untitled design-3_1753210965852.jpg",
    thumbnail: "/attached_assets/Untitled design-3_1753210965852.jpg",
    videoUrl: "/attached_assets/FDTL_60secTRAILER_1_stab_nyx3_hyp1_1_1753211212285.mp4",
    duration: "2:03:15",
    views: "3.7M views",
    category: "Drama",
    rating: 9.1,
    year: 2024,
    type: "movie"
  },
  {
    id: 5,
    title: "If Love Could Heal",
    description: "A powerful story about the transformative power of love and compassion.",
    thumbnailUrl: "/attached_assets/BAA2EC7F-04C0-486F-89AF-57A8EE100449_1753225563576.JPEG",
    thumbnail: "/attached_assets/BAA2EC7F-04C0-486F-89AF-57A8EE100449_1753225563576.JPEG",
    videoUrl: "/attached_assets/My Name is Lola Concept trailer  (We do not own the rights to the music)_1753204039587.mp4",
    duration: "1:45:30",
    views: "2.8M views",
    category: "Romance",
    rating: 8.9,
    year: 2024,
    type: "movie"
  },
  {
    id: 6,
    title: "!FREAKS!",
    description: "A dark and twisted horror anthology that explores the disturbing side of human nature.",
    thumbnailUrl: "/attached_assets/unnamed-4_1753457581972.png",
    thumbnail: "/attached_assets/unnamed-4_1753457581972.png",
    videoUrl: "/attached_assets/!FREAKS! OFFICIAL TRAILER_1753457916551.mp4",
    duration: "1:55:22",
    views: "1.8M views",
    category: "Horror",
    rating: 7.6,
    year: 2024,
    type: "movie"
  },
  {
    id: 7,
    title: "Alphaville",
    description: "A futuristic dystopian thriller set in a technologically advanced society where logic rules supreme and emotions are forbidden.",
    thumbnailUrl: "/attached_assets/Alphaville POSTER_FINAL_1753467623607.PNG",
    thumbnail: "/attached_assets/Alphaville POSTER_FINAL_1753467623607.PNG",
    videoUrl: "/attached_assets/Alphaville Trailer_1753467678844.mp4",
    duration: "1:39:45",
    views: "2.1M views",
    category: "Sci-Fi",
    rating: 8.3,
    year: 2024,
    type: "movie"
  }
];

// API Routes
app.get("/api/videos", (req, res) => {
  res.json(sampleVideos);
});

app.get("/api/videos/category/:category", (req, res) => {
  const { category } = req.params;
  const filtered = sampleVideos.filter(v => v.category === category);
  res.json(filtered);
});

app.get("/api/videos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const video = sampleVideos.find(v => v.id === id);
  if (!video) {
    return res.status(404).json({ message: "Video not found" });
  }
  res.json(video);
});

// Serve Vite build files
const distPath = path.join(__dirname, "dist", "public");
app.use(express.static(distPath));

// Serve attached assets (for production)
app.use('/attached_assets', express.static(path.join(__dirname, 'attached_assets')));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

// Fallback for SPA routes (must be last)
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ SoarTV server running on port ${PORT}`);
});
