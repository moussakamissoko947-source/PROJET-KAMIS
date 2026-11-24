export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 o';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

export function formatRelativeDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;

  return formatDate(dateString);
}

export type FileCategory = 'documents' | 'images' | 'videos' | 'audio' | 'archives' | 'others';

export function getFileCategory(mimeType: string, filename: string): FileCategory {
  const mime = (mimeType || '').toLowerCase();
  const ext = (filename || '').split('.').pop()?.toLowerCase() || '';

  if (
    mime.includes('pdf') ||
    mime.includes('document') ||
    mime.includes('word') ||
    mime.includes('text') ||
    ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'csv', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext)
  ) {
    return 'documents';
  }

  if (
    mime.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)
  ) {
    return 'images';
  }

  if (
    mime.startsWith('video/') ||
    ['mp4', 'webm', 'mov', 'mkv', 'avi', 'wmv'].includes(ext)
  ) {
    return 'videos';
  }

  if (
    mime.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)
  ) {
    return 'audio';
  }

  if (
    mime.includes('zip') ||
    mime.includes('tar') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)
  ) {
    return 'archives';
  }

  return 'others';
}

export function getCategoryBadgeLabel(category: FileCategory): string {
  switch (category) {
    case 'documents':
      return 'Document';
    case 'images':
      return 'Image';
    case 'videos':
      return 'Vidéo';
    case 'audio':
      return 'Audio';
    case 'archives':
      return 'Archive';
    default:
      return 'Autre';
  }
}
