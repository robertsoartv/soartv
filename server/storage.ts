import { videos, type Video, type InsertVideo, users, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllVideos(): Promise<Video[]>;
  getVideosByCategory(category: string): Promise<Video[]>;
  getVideo(id: number): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private videos: Map<number, Video>;
  private currentUserId: number;
  private currentVideoId: number;

  constructor() {
    this.users = new Map();
    this.videos = new Map();
    this.currentUserId = 1;
    this.currentVideoId = 1;
    
    // Initialize with sample data
    this.initializeVideos();
  }

  private initializeVideos() {
    const sampleVideos: Omit<Video, 'id'>[] = [
      {
        title: "My Name Is Lola",
        description: "A heartwarming story about self-discovery, love, and finding your true voice. Follow Lola's journey as she navigates life, love, and the pursuit of her dreams.",
        thumbnailUrl: "/attached_assets/95EEC8AE-407A-46F9-B80E-EEE859F4465F_1753202512174.JPEG",
        videoUrl: "https://www.youtube.com/watch?v=r38DH6uHdpE&t=2s",
        duration: "1:58:45",
        views: "2.3M views",
        category: "Drama",
        rating: 8.7,
        year: 2024,
        type: "movie"
      },
      {
        title: "Wicked",
        description: "Everyone deserves a chance to fly. The untold story of the witches of Oz - a stunning musical about friendship, destiny, and defying gravity.",
        thumbnailUrl: "/wicked-poster.avif",
        videoUrl: "/wicked-trailer.mp4",
        duration: "2:40:15",
        views: "3.8M views",
        category: "Musical",
        rating: 9.2,
        year: 2024,
        type: "movie"
      },
      {
        title: "Soul Damage",
        description: "A gripping psychological thriller that explores the depths of human consciousness and the price of ambition. When a neuroscientist's groundbreaking research goes wrong, reality and nightmare collide.",
        thumbnailUrl: "/attached_assets/613kJUhqglL._SY522_-2_1753207112697.jpg",
        videoUrl: "https://www.youtube.com/watch?v=5pL8M7g6KfU",
        duration: "2:15:30",
        views: "1.2M views",
        category: "Thriller",
        rating: 8.4,
        year: 2024,
        type: "movie"
      },
      {
        title: "From Darkness to Light!",
        description: "An inspiring true story of resilience and redemption. Follow one person's extraordinary journey from the depths of despair to finding purpose, hope, and the strength to transform not only their own life but the lives of others.",
        thumbnailUrl: "/attached_assets/Untitled design-3_1753210965852.jpg",
        videoUrl: "/attached_assets/FDTL_60secTRAILER_1_stab_nyx3_hyp1_1_1753211212285.mp4",
        duration: "2:03:15",
        views: "3.7M views",
        category: "Drama",
        rating: 9.1,
        year: 2024,
        type: "movie"
      },
      {
        title: "If Love Could Heal",
        description: "A powerful story about the transformative power of love and compassion. When a heart surgeon meets a patient who challenges everything she believes about healing, their journey together proves that sometimes the greatest medicine is human connection.",
        thumbnailUrl: "/attached_assets/BAA2EC7F-04C0-486F-89AF-57A8EE100449_1753225563576.JPEG",
        videoUrl: "/attached_assets/My Name is Lola Concept trailer  (We do not own the rights to the music)_1753204039587.mp4",
        duration: "1:45:30",
        views: "2.8M views",
        category: "Romance",
        rating: 8.9,
        year: 2024,
        type: "movie"
      },
      {
        title: "!FREAKS!",
        description: "A dark and twisted horror anthology that explores the disturbing side of human nature. When society's outcasts band together, they unleash something far more terrifying than anyone could imagine. Not for the faint of heart.",
        thumbnailUrl: "/attached_assets/unnamed-4_1753457581972.png",
        videoUrl: "/attached_assets/!FREAKS! OFFICIAL TRAILER_1753457916551.mp4",
        duration: "1:55:22",
        views: "1.8M views",
        category: "Horror",
        rating: 7.6,
        year: 2024,
        type: "movie"
      },
      {
        title: "Alphaville",
        description: "A futuristic dystopian thriller set in a technologically advanced society where logic rules supreme and emotions are forbidden. When a secret agent infiltrates this sterile world, he discovers the power of love and poetry to overcome oppression.",
        thumbnailUrl: "/attached_assets/Alphaville POSTER_FINAL_1753467623607.PNG",
        videoUrl: "/attached_assets/Alphaville Trailer_1753467678844.mp4",
        duration: "1:39:45",
        views: "2.1M views",
        category: "Sci-Fi",
        rating: 8.3,
        year: 2024,
        type: "movie"
      }
    ];

    sampleVideos.forEach(video => {
      const id = this.currentVideoId++;
      this.videos.set(id, { ...video, id });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllVideos(): Promise<Video[]> {
    return Array.from(this.videos.values());
  }

  async getVideosByCategory(category: string): Promise<Video[]> {
    return Array.from(this.videos.values()).filter(
      (video) => video.category.toLowerCase() === category.toLowerCase()
    );
  }

  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = this.currentVideoId++;
    const video: Video = { ...insertVideo, id };
    this.videos.set(id, video);
    return video;
  }
}

export const storage = new MemStorage();
