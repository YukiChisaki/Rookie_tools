import { onMounted } from 'vue';
import { useArtistStore } from '../stores/artist';
import { useTagStore } from '../stores/tag';

export function useArtistLoader() {
  const artistStore = useArtistStore();
  const tagStore = useTagStore();

  onMounted(async () => {
    // Only load if no artists exist
    if (artistStore.artists.length === 0) {
      // Get artist tags from tag store
      await tagStore.loadTags();
      const artistTags = tagStore.tagsByCategory.artist;
      
      if (artistTags.length > 0) {
        const artistNames = artistTags.map(tag => tag.name);
        await artistStore.importArtists(artistNames);
      }
    }
  });
}
