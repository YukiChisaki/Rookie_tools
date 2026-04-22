import { onMounted } from 'vue';
import { useTagStore } from '../stores/tag';
import { loadTagsFromFiles, getDefaultTags } from '../services/tagLoader';

export function useTagLoader() {
  const tagStore = useTagStore();

  onMounted(async () => {
    // Only load if no tags exist
    if (tagStore.tags.length === 0) {
      try {
        // Try to load from files
        const fileTags = await loadTagsFromFiles();
        
        if (fileTags.length > 0) {
          await tagStore.importTags(fileTags);
        } else {
          // Use default tags as fallback
          const defaultTags = getDefaultTags();
          await tagStore.importTags(defaultTags);
        }
      } catch (error) {
        console.error('Failed to load tags:', error);
        // Use default tags on error
        const defaultTags = getDefaultTags();
        await tagStore.importTags(defaultTags);
      }
    }
  });
}
