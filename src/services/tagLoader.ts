import type { Tag, TagCategory } from '../types';

interface TagFileMapping {
  file: string;
  category: TagCategory;
}

const TAG_FILE_MAPPINGS: TagFileMapping[] = [
  { file: 'artists.txt', category: 'artist' },
  { file: 'style.txt', category: 'style' },
  { file: 'quality.txt', category: 'quality' },
  { file: 'composition.txt', category: 'composition' },
  { file: 'lighting.txt', category: 'lighting' },
  { file: 'character.txt', category: 'character' },
  { file: 'environment.txt', category: 'environment' },
];

export async function loadTagsFromFiles(): Promise<Omit<Tag, 'id' | 'useCount'>[]> {
  const tags: Omit<Tag, 'id' | 'useCount'>[] = [];
  
  for (const mapping of TAG_FILE_MAPPINGS) {
    try {
      const response = await fetch(`/data/lists/${mapping.file}`);
      if (!response.ok) continue;
      
      const text = await response.text();
      const lines = text.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        // Parse line: tag name and optional aliases separated by commas
        const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length === 0) continue;
        
        const name = parts[0];
        const aliases = parts.slice(1);
        
        tags.push({
          name,
          aliases,
          category: mapping.category,
        });
      }
    } catch (error) {
      console.warn(`Failed to load ${mapping.file}:`, error);
    }
  }
  
  return tags;
}

// Fallback tags for demo/development
export function getDefaultTags(): Omit<Tag, 'id' | 'useCount'>[] {
  return [
    // Quality
    { name: 'masterpiece', aliases: ['best quality'], category: 'quality' },
    { name: 'best quality', aliases: [], category: 'quality' },
    { name: 'highres', aliases: ['high resolution'], category: 'quality' },
    { name: 'ultra-detailed', aliases: ['ultra detailed'], category: 'quality' },
    { name: '8k', aliases: [], category: 'quality' },
    
    // Style
    { name: 'anime', aliases: ['anime style'], category: 'style' },
    { name: 'realistic', aliases: ['photorealistic'], category: 'style' },
    { name: 'watercolor', aliases: ['water color'], category: 'style' },
    { name: 'oil painting', aliases: [], category: 'style' },
    { name: 'sketch', aliases: [], category: 'style' },
    
    // Composition
    { name: 'portrait', aliases: [], category: 'composition' },
    { name: 'landscape', aliases: [], category: 'composition' },
    { name: 'close-up', aliases: ['close up'], category: 'composition' },
    { name: 'full body', aliases: [], category: 'composition' },
    { name: 'upper body', aliases: [], category: 'composition' },
    
    // Lighting
    { name: 'soft lighting', aliases: [], category: 'lighting' },
    { name: 'dramatic lighting', aliases: [], category: 'lighting' },
    { name: 'cinematic lighting', aliases: [], category: 'lighting' },
    { name: 'sunlight', aliases: [], category: 'lighting' },
    { name: 'moonlight', aliases: [], category: 'lighting' },
    
    // Environment
    { name: 'indoor', aliases: [], category: 'environment' },
    { name: 'outdoor', aliases: [], category: 'environment' },
    { name: 'forest', aliases: [], category: 'environment' },
    { name: 'city', aliases: [], category: 'environment' },
    { name: 'beach', aliases: [], category: 'environment' },
  ];
}
