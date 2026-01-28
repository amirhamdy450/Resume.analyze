import { usePuterStore } from "~/lib/puter";

// Service: Handles business logic and data fetching P)
export const ResumeService = {
  // Static method to get all resumes
  async getAll(): Promise<Resume[]> {
    // accessing a database connection
    const { kv, fs } = usePuterStore.getState();

    try {
      // 1. Fetch raw data from Key-Value store (Database)
      const items = (await kv.list('resume:*', true)) as KVItem[];
      
      if (!items) return [];

      // 2. Process each item (Data hydration)
      const parsedResumes = await Promise.all(
        items.map(async (item) => {
          const data = JSON.parse(item.value) as Resume;

          // 3. Load associated images (File System interaction)
          try {
            const imageBlob = await fs.read(data.imagePath);
            if (imageBlob) {
              const imageUrl = URL.createObjectURL(new Blob([imageBlob], { type: 'image/png' }));
              return { ...data, imageUrl };
            }
          } catch (error) {
            console.error('Failed to load image for resume:', data.id, error);
          }

          return data;
        })
      );

      return parsedResumes;
    } catch (error) {
      console.error("ResumeService Error:", error);
      return [];
    }
  }
};
