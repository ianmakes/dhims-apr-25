
/**
 * Utility functions for generating and handling slugs
 */

/**
 * Generates a URL-friendly slug from a name
 * @param name The name to convert to a slug
 * @param existingSlugs Array of existing slugs to check for uniqueness
 * @returns A URL-friendly slug
 */
export const generateSlug = (name: string, existingSlugs: string[] = []): string => {
  if (!name) return '';
  
  // Convert to lowercase and replace spaces and special chars with hyphens
  let slug = name.toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
  
  // Check if slug already exists
  if (!existingSlugs.includes(slug)) {
    return slug;
  }
  
  // If slug exists, add a number to make it unique
  let counter = 1;
  let newSlug = `${slug}-${counter}`;
  
  while (existingSlugs.includes(newSlug)) {
    counter++;
    newSlug = `${slug}-${counter}`;
  }
  
  return newSlug;
};

/**
 * Extracts the ID from a URL parameter that could be either an ID or a slug
 * @param idOrSlug The ID or slug from the URL
 * @returns True if the parameter is likely a UUID
 */
export const isUuid = (idOrSlug: string): boolean => {
  // UUID format: 8-4-4-4-12 hexadecimal characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(idOrSlug);
};
