import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { db } from '../services/db';
import type { Artist, ArtistChain } from '../types';
import { STORES } from '../types';

export const useArtistStore = defineStore('artist', () => {
  // State
  const artists = ref<Artist[]>([]);
  const artistChains = ref<ArtistChain[]>([]);
  const isLoading = ref(false);
  const searchQuery = ref('');

  // Getters
  const filteredArtists = computed(() => {
    let result = artists.value;

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(artist => 
        artist.name.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => {
      // Favorites first
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      // Then by use count
      return b.useCount - a.useCount;
    });
  });

  const favoriteArtists = computed(() => {
    return artists.value.filter(a => a.isFavorite);
  });

  const getArtistById = computed(() => (id: string) => {
    return artists.value.find(a => a.id === id);
  });

  const getChainById = computed(() => (id: string) => {
    return artistChains.value.find(c => c.id === id);
  });

  const getArtistsInChain = computed(() => (chainId: string) => {
    const chain = artistChains.value.find(c => c.id === chainId);
    if (!chain) return [];
    return chain.artistIds
      .map(id => artists.value.find(a => a.id === id))
      .filter(Boolean) as Artist[];
  });

  // Actions
  async function loadArtists() {
    isLoading.value = true;
    try {
      artists.value = await db.getAll<Artist>(STORES.ARTISTS);
      artistChains.value = await db.getAll<ArtistChain>(STORES.ARTIST_CHAINS);
    } finally {
      isLoading.value = false;
    }
  }

  async function addArtist(data: Omit<Artist, 'id' | 'useCount'>): Promise<Artist> {
    const artist: Artist = {
      ...data,
      id: crypto.randomUUID(),
      useCount: 0,
    };
    await db.put(STORES.ARTISTS, artist);
    artists.value.push(artist);
    return artist;
  }

  async function updateArtist(id: string, updates: Partial<Artist>) {
    const artist = artists.value.find(a => a.id === id);
    if (!artist) return;

    const updated = { ...artist, ...updates };
    await db.put(STORES.ARTISTS, updated);
    const index = artists.value.findIndex(a => a.id === id);
    if (index !== -1) {
      artists.value[index] = updated;
    }
  }

  async function toggleFavorite(id: string) {
    const artist = artists.value.find(a => a.id === id);
    if (artist) {
      await updateArtist(id, { isFavorite: !artist.isFavorite });
    }
  }

  async function incrementUseCount(id: string) {
    const artist = artists.value.find(a => a.id === id);
    if (artist) {
      artist.useCount++;
      await db.put(STORES.ARTISTS, artist);
    }
  }

  async function deleteArtist(id: string) {
    await db.delete(STORES.ARTISTS, id);
    artists.value = artists.value.filter(a => a.id !== id);
  }

  // Artist Chain actions
  async function createChain(name: string, artistIds: string[]): Promise<ArtistChain> {
    const chain: ArtistChain = {
      id: crypto.randomUUID(),
      name,
      artistIds,
      createdAt: Date.now(),
    };
    await db.put(STORES.ARTIST_CHAINS, chain);
    artistChains.value.push(chain);
    return chain;
  }

  async function updateChain(id: string, updates: Partial<ArtistChain>) {
    const chain = artistChains.value.find(c => c.id === id);
    if (!chain) return;

    const updated = { ...chain, ...updates };
    await db.put(STORES.ARTIST_CHAINS, updated);
    const index = artistChains.value.findIndex(c => c.id === id);
    if (index !== -1) {
      artistChains.value[index] = updated;
    }
  }

  async function deleteChain(id: string) {
    await db.delete(STORES.ARTIST_CHAINS, id);
    artistChains.value = artistChains.value.filter(c => c.id !== id);
  }

  // Import artists from text file
  async function importArtists(names: string[]) {
    const existingNames = new Set(artists.value.map(a => a.name.toLowerCase()));
    const newArtists: Artist[] = [];

    for (const name of names) {
      const trimmedName = name.trim();
      if (trimmedName && !existingNames.has(trimmedName.toLowerCase())) {
        newArtists.push({
          id: crypto.randomUUID(),
          name: trimmedName,
          isFavorite: false,
          useCount: 0,
        });
        existingNames.add(trimmedName.toLowerCase());
      }
    }

    if (newArtists.length > 0) {
      await db.bulkPut(STORES.ARTISTS, newArtists);
      artists.value.push(...newArtists);
    }

    return newArtists.length;
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  return {
    artists,
    artistChains,
    isLoading,
    searchQuery,
    filteredArtists,
    favoriteArtists,
    getArtistById,
    getChainById,
    getArtistsInChain,
    loadArtists,
    addArtist,
    updateArtist,
    toggleFavorite,
    incrementUseCount,
    deleteArtist,
    createChain,
    updateChain,
    deleteChain,
    importArtists,
    setSearchQuery,
  };
});
