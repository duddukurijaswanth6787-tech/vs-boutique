import { useQuery } from '@tanstack/react-query';
import { getActiveCategories } from '../../../services/api';
import { Link } from 'react-router-dom';
import Skeleton from '../ui/Skeleton';

export const CategoryList = () => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['activeCategories'],
    queryFn: getActiveCategories,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!categories.length) {
    return <p className="text-center text-gray-500 py-8">No categories found.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          to={`/customer/shop?category=${cat.slug}`}
          className="group"
        >
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            {cat.image ? (
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-gray-900 text-center">{cat.name}</p>
        </Link>
      ))}
    </div>
  );
};

export default CategoryList;