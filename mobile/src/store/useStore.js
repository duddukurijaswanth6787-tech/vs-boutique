import { create } from 'zustand';

const useStore = create((set) => ({
    // Auth state
    user: null,
    token: null,
    isAuthenticated: false,

    setAuth: (user, token) => set({
        user,
        token,
        isAuthenticated: true
    }),

    clearAuth: () => set({
        user: null,
        token: null,
        isAuthenticated: false
    }),

    // Wishlist state
    favorites: [],
    toggleFavorite: (boutiqueId) =>
        set((state) => {
            const isFavorite = state.favorites.includes(boutiqueId);
            return {
                favorites: isFavorite
                    ? state.favorites.filter(id => id !== boutiqueId)
                    : [...state.favorites, boutiqueId]
            };
        }),

    // Location state
    location: {
        city: 'Hyderabad',
        region: 'Telangana',
    },
    setLocation: (city, region) => set({ location: { city, region } }),

    // Caches for expensive resources
    designsCache: {},
    reviewsCache: {},
    galleryCache: {},

    setDesignsInCache: (id, designs) =>
        set((state) => ({
            designsCache: { ...state.designsCache, [id]: designs }
        })),

    setReviewsInCache: (id, reviews) =>
        set((state) => ({
            reviewsCache: { ...state.reviewsCache, [id]: reviews }
        })),

    setGalleryInCache: (id, gallery) =>
        set((state) => ({
            galleryCache: { ...state.galleryCache, [id]: gallery }
        })),

    setBoutiqueResourcesInCache: (id, designs, gallery) =>
        set((state) => ({
            designsCache: { ...state.designsCache, [id]: designs },
            galleryCache: { ...state.galleryCache, [id]: gallery }
        })),
}));

export default useStore;
