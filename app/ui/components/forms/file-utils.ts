export function readFileAsText(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () =>
      resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = reject;
  });
}
