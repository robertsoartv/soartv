// featuredSlides.ts
export interface Slide {
  id: number;
  bgImage: string;
  posterImage: string;
  trailer: string;
  title: string;
  logoImage?: string;
  subtitle: string;
  primeBadge?: boolean;
  trendingBadge?: string;
  actionLabel: string;
  rating?: string;
}

// Use direct paths for all assets to ensure production compatibility
// Using existing verified files only to prevent video loading errors
const ffPoster = "/attached_assets/Image 10-18-22 at 12.15 PM_1750689805162.jpg";
const lolaVideo = "/attached_assets/My Name is Lola -a Maximus Wright film_1753201892406.mp4";
const lolaTrailer = "/attached_assets/My Name is Lola Concept trailer  (We do not own the rights to the music)_1753204039587.mp4";
const lolaPoster = "/attached_assets/95EEC8AE-407A-46F9-B80E-EEE859F4465F_1753202512174.JPEG";
const freaksPoster = "/attached_assets/unnamed-4_1753457581972.png";

// Enhanced movie data for Netflix-style pages
export interface MovieData extends Slide {
  description: string;
  year: number;
  duration: string;
  cast: string[];
  crew: { name: string; role: string }[];
  imdbRating: number;
  maturityRating: string;
  tags: string[];
  quality: string;
}

export const featuredSlides: Slide[] = [
  {
    id: 1,
    bgImage: "/attached_assets/Untitled design-3_1753210965852.jpg",
    posterImage: "/attached_assets/Untitled design-3_1753210965852.jpg",
    trailer: "/attached_assets/FDTL_60secTRAILER_1_stab_nyx3_hyp1_1_1753211212285.mp4",
    title: 'From Darkness to Light!',
    subtitle: '2024 • 2:03:15 • Drama, Inspirational, Biography',
    actionLabel: 'Watch Trailer',
    rating: 'PG-13',
    primeBadge: true,
  },
  {
    id: 2,
    bgImage: freaksPoster,
    posterImage: freaksPoster,
    trailer: "/attached_assets/!FREAKS! OFFICIAL TRAILER_1753457916551.mp4",
    title: '!FREAKS!',
    subtitle: '2024 • 1:55:22 • Horror, Thriller, Web Series',
    primeBadge: false,
    trendingBadge: '#2 IN THE US',
    actionLabel: 'Watch Trailer',
    rating: 'R',
  },
  {
    id: 3,
    bgImage: lolaPoster,
    posterImage: lolaPoster,
    trailer: "https://www.youtube.com/watch?v=r38DH6uHdpE&t=2s",
    title: 'My Name Is Lola',
    subtitle: '2024 • 1:58:45 • Drama, Romance, Comedy',
    actionLabel: 'Watch Now FREE',
    rating: 'PG-13',
    primeBadge: true,
  },
  {
    id: 4,
    bgImage: "/attached_assets/613kJUhqglL._SY522_-2_1753207112697.jpg",
    posterImage: "/attached_assets/613kJUhqglL._SY522_-2_1753207112697.jpg",
    trailer: "https://www.youtube.com/watch?v=5pL8M7g6KfU",
    title: 'Soul Damage',
    subtitle: '2024 • 2:15:30 • Drama, Thriller, Mystery',
    actionLabel: 'Watch Now FREE',
    rating: 'R',
    primeBadge: true,
  },
  {
    id: 6,
    bgImage: "/attached_assets/Alphaville POSTER_FINAL_1753467623607.PNG",
    posterImage: "/attached_assets/Alphaville POSTER_FINAL_1753467623607.PNG",
    trailer: "/attached_assets/Alphaville Trailer_1753467678844.mp4",
    title: 'Alphaville',
    subtitle: '2024 • 1:39:45 • Sci-Fi, Thriller, Drama',
    actionLabel: 'Watch Trailer',
    rating: 'PG-13',
    primeBadge: true,
  },
];

// Enhanced movie details for Netflix-style pages
export const movieDetails: { [key: number]: MovieData } = {
  1: {
    ...featuredSlides[0],
    description: "A powerful biographical drama that follows one person's extraordinary journey from the depths of despair to finding hope, purpose, and redemption. This inspiring story showcases the resilience of the human spirit in overcoming life's greatest challenges.",
    year: 2024,
    duration: "2h 3m",
    cast: ["Marcus Williams", "Sarah Chen", "David Rodriguez", "Emily Watson"],
    crew: [
      { name: "Michael Johnson", role: "Director" },
      { name: "Lisa Thompson", role: "Producer" },
      { name: "Robert Kim", role: "Cinematographer" }
    ],
    imdbRating: 8.4,
    maturityRating: "PG-13",
    tags: ["Inspiring", "Emotional", "Based on True Events"],
    quality: "4K Ultra HD"
  },
  2: {
    ...featuredSlides[1],
    description: "The untold story of the witches of Oz. This musical phenomenon tells the incredible story of an unlikely friendship between two sorcery students at Shiz University who become the Wicked Witch of the West and Glinda the Good.",
    year: 2024,
    duration: "2h 40m",
    cast: ["Cynthia Erivo", "Ariana Grande", "Jonathan Bailey", "Michelle Yeoh"],
    crew: [
      { name: "Jon M. Chu", role: "Director" },
      { name: "Marc Platt", role: "Producer" },
      { name: "Alice Brooks", role: "Cinematographer" }
    ],
    imdbRating: 9.1,
    maturityRating: "PG",
    tags: ["Musical", "Fantasy", "Friendship", "Broadway Adaptation"],
    quality: "4K Ultra HD"
  },
  3: {
    ...featuredSlides[2],
    description: "A heartwarming romantic comedy-drama that follows Lola, a spirited young woman navigating love, career, and self-discovery in the modern world. Filled with humor, heart, and relatable moments that will make you laugh and cry.",
    year: 2024,
    duration: "1h 59m",
    cast: ["Sofia Martinez", "Jake Thompson", "Maya Patel", "Carlos Mendez"],
    crew: [
      { name: "Maximus Wright", role: "Director" },
      { name: "Jennifer Lee", role: "Producer" },
      { name: "Amanda Foster", role: "Cinematographer" }
    ],
    imdbRating: 7.8,
    maturityRating: "PG-13",
    tags: ["Romantic", "Feel-Good", "Coming of Age", "Comedy"],
    quality: "4K Ultra HD"
  },
  4: {
    ...featuredSlides[3],
    description: "A gripping psychological thriller that delves into the darkest corners of the human psyche. When a troubled detective investigates a series of mysterious incidents, they uncover secrets that challenge everything they believe about justice and morality.",
    year: 2024,
    duration: "2h 15m",
    cast: ["Vincent Clarke", "Samantha Reed", "Michael Torres", "Rachel Kim"],
    crew: [
      { name: "Alexander Stone", role: "Director" },
      { name: "Patricia Hayes", role: "Producer" },
      { name: "Thomas Anderson", role: "Cinematographer" }
    ],
    imdbRating: 8.2,
    maturityRating: "R",
    tags: ["Psychological", "Dark", "Suspenseful", "Crime"],
    quality: "4K Ultra HD"
  },
  5: {
    ...featuredSlides[4],
    description: "A terrifying horror anthology series that explores the darkest side of human nature. Each episode presents a new nightmare, blending supernatural elements with psychological horror in ways that will keep you on the edge of your seat.",
    year: 2024,
    duration: "1h 55m",
    cast: ["Luna Blackwood", "Tyler Cross", "Zoe Williams", "Alex Hunter"],
    crew: [
      { name: "Derek Nightmare", role: "Director" },
      { name: "Horror Productions", role: "Producer" },
      { name: "Gothic Studios", role: "Cinematographer" }
    ],
    imdbRating: 7.5,
    maturityRating: "R",
    tags: ["Horror", "Anthology", "Supernatural", "Psychological"],
    quality: "4K Ultra HD"
  },
  6: {
    ...featuredSlides[5],
    description: "A mind-bending sci-fi thriller set in a dystopian future where technology controls every aspect of human life. Follow the journey of rebels fighting against an oppressive system in this visually stunning and thought-provoking film.",
    year: 2024,
    duration: "1h 40m",
    cast: ["Neo Santiago", "Aria Chen", "Marcus Steel", "Eva Rodriguez"],
    crew: [
      { name: "Future Vision", role: "Director" },
      { name: "Sci-Fi Studios", role: "Producer" },
      { name: "Digital Dreams", role: "Cinematographer" }
    ],
    imdbRating: 8.7,
    maturityRating: "PG-13",
    tags: ["Sci-Fi", "Dystopian", "Action", "Thought-Provoking"],
    quality: "4K Ultra HD"
  }
};