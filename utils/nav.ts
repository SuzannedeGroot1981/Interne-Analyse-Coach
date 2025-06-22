export function nextLink(id: string, page: string): string {
  return `/${page}?id=${id}`;
}

// Helper functie voor terug navigatie
export function prevLink(page: string, id?: string): string {
  if (id) {
    return `/${page}?id=${id}`;
  }
  return `/${page}`;
}

// Helper functie voor home navigatie
export function homeLink(): string {
  return '/';
}