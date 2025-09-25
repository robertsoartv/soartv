import { Button } from "@/components/ui/button";

interface CategorySectionProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  "All",
  "Action", 
  "Comedy",
  "Drama",
  "Thriller",
  "Sci-Fi",
  "Horror",
  "Romance",
  "Adventure",
  "Documentary"
];

export default function CategorySection({ selectedCategory, onCategoryChange }: CategorySectionProps) {
  return (
    <section className="bg-prime-dark py-6">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex gap-4 overflow-x-scroll pb-4 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-200 flex-shrink-0 whitespace-nowrap min-w-fit text-sm ${
                selectedCategory === category
                  ? "bg-white text-black"
                  : "bg-prime-gray text-white hover:bg-prime-light-gray"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
