/**
 * Normalize filename by replacing non-alphabetic characters with underscores
 * Preserves file extension
 */
export function normalizeFilename(filename: string, defaultName: string = 'file'): string {
  // Remove path components
  const name = filename.split('/').pop()?.split('\\').pop() || filename

  // Extract extension
  const lastDot = name.lastIndexOf('.')
  if (lastDot === -1) {
    // No extension, normalize entire name
    const normalized = name.replace(/[^A-Za-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
    return normalized || defaultName
  }

  const base = name.substring(0, lastDot)
  const ext = name.substring(lastDot).toLowerCase()

  // Replace non-alphabetic/non-numeric with underscore
  const normalizedBase = base.replace(/[^A-Za-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')

  return (normalizedBase || defaultName) + ext
}

/**
 * Create a new File object with normalized filename
 */
export function createNormalizedFile(originalFile: File): File {
  const normalizedName = normalizeFilename(originalFile.name)
  return new File([originalFile], normalizedName, {
    type: originalFile.type,
    lastModified: originalFile.lastModified
  })
}
